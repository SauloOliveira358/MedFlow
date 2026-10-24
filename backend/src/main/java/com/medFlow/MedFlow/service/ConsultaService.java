package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.concorrencia.AgendamentoLockManager;
import com.medFlow.MedFlow.concorrencia.ConcorrenciaMonitorService;
import com.medFlow.MedFlow.concorrencia.ProcessamentoAssincronoService;
import com.medFlow.MedFlow.dto.*;
import com.medFlow.MedFlow.exception.*;
import com.medFlow.MedFlow.model.*;
import com.medFlow.MedFlow.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Serviço de Gestão e Agendamento de Consultas com Controle de Concorrência
 * e Execução Assíncrona Integrada (Módulo 3 - POO II).
 */
@Slf4j
@Service
public class ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final PacienteRepository pacientes;
    private final AgendaService agenda;
    private final AgendamentoLockManager lockManager;
    private final ConcorrenciaMonitorService monitorService;
    private final ProcessamentoAssincronoService processamentoAssincronoService;

    @Autowired
    public ConsultaService(
            ConsultaRepository consultaRepository,
            PacienteRepository pacientes,
            AgendaService agenda,
            AgendamentoLockManager lockManager,
            ConcorrenciaMonitorService monitorService,
            ProcessamentoAssincronoService processamentoAssincronoService) {
        this.consultaRepository = consultaRepository;
        this.pacientes = pacientes;
        this.agenda = agenda;
        this.lockManager = lockManager != null ? lockManager : new AgendamentoLockManager();
        this.monitorService = monitorService;
        this.processamentoAssincronoService = processamentoAssincronoService;
    }

    /**
     * Construtor de compatibilidade para testes unitários isolados.
     */
    public ConsultaService(ConsultaRepository consultaRepository, PacienteRepository pacientes, AgendaService agenda) {
        this(consultaRepository, pacientes, agenda, new AgendamentoLockManager(), null, null);
    }

    @Transactional(readOnly = true)
    public List<ConsultaResponseDTO> listarPorPaciente(Long id) {
        return consultaRepository.findByPacienteIdOrderByDataConsultaDescHorarioConsultaDesc(id).stream().map(this::resposta).toList();
    }

    @Transactional(readOnly = true)
    public List<ConsultaResponseDTO> listarPorMedico(Long id) {
        return consultaRepository.findByMedicoIdOrderByDataConsultaDescHorarioConsultaDesc(id).stream().map(this::resposta).toList();
    }

    private Consulta buscar(Long id) {
        return consultaRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Consulta não encontrada."));
    }

    @Transactional(readOnly = true)
    public ConsultaResponseDTO buscarPorId(Long id) {
        return resposta(buscar(id));
    }

    /**
     * Região Crítica de Agendamento Protegida contra Race Conditions:
     * 1. Trava Reentrante na JVM por chave composta (medico:data:horario)
     * 2. Pessimistic Write Lock no médico e no slot da agenda
     * 3. Verificação atômica de disponibilidade (Check-Then-Act seguro)
     * 4. Registro observável de telemetria e logs (Item 12 do Módulo 3)
     * 5. Disparo da Segunda Aplicação Assíncrona para comprovante e notificações (Item 9)
     */
    @Transactional
    public ConsultaResponseDTO agendar(AgendamentoRequestDTO request) {
        long inicio = System.currentTimeMillis();
        String chaveLock = lockManager != null
                ? lockManager.gerarChave(request.getMedicoId(), request.getDataConsulta(), request.getHorarioConsulta())
                : null;

        if (lockManager != null && chaveLock != null) {
            lockManager.adquirir(chaveLock);
        }

        try {
            AgendaService.validarFuturo(request.getDataConsulta(), request.getHorarioConsulta());

            var medico = agenda.bloquearMedico(request.getMedicoId());
            if (!Boolean.TRUE.equals(medico.getAtivo())) {
                throw new RegraNegocioException("Médico inativo.");
            }

            var paciente = pacientes.findById(request.getPacienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Paciente não encontrado."));
            if (!Boolean.TRUE.equals(paciente.getAtivo())) {
                throw new RegraNegocioException("Paciente inativo.");
            }

            var clinica = medico.getClinica();
            if (request.getClinicaId() != null && (clinica == null || !Objects.equals(clinica.getId(), request.getClinicaId()))) {
                throw new RegraNegocioException("A clínica informada não corresponde à clínica do médico.");
            }

            var horario = agenda.buscarHorario(medico.getId(), request.getDataConsulta(), request.getHorarioConsulta());

            // Região crítica: checagem de disponibilidade
            boolean ocupadoNaAgenda = !Boolean.TRUE.equals(horario.getDisponivel());
            boolean ocupadoEmConsultas = consultaRepository.existsByMedicoIdAndDataConsultaAndHorarioConsultaAndStatusNot(
                    medico.getId(), request.getDataConsulta(), request.getHorarioConsulta(), "Cancelado");

            if (ocupadoNaAgenda || ocupadoEmConsultas) {
                long duracao = System.currentTimeMillis() - inicio;
                if (monitorService != null) {
                    monitorService.registrar(
                            "AGENDAMENTO",
                            medico.getId(),
                            medico.getNome(),
                            request.getDataConsulta().toString(),
                            request.getHorarioConsulta(),
                            paciente.getNome(),
                            "REJEITADO_CONFLITO",
                            duracao,
                            "Horário indisponível: já reservado por outro paciente."
                    );
                }

                throw new ConcorrenciaAgendamentoException(
                        medico.getId(),
                        request.getDataConsulta().toString(),
                        request.getHorarioConsulta(),
                        "Horário indisponível."
                );
            }

            horario.setDisponivel(false);

            var consulta = Consulta.builder()
                .medico(medico)
                .paciente(paciente)
                .clinica(clinica)
                .dataConsulta(request.getDataConsulta())
                .horarioConsulta(request.getHorarioConsulta())
                .tipo(request.getTipo() == null || request.getTipo().isBlank() ? "Primeira consulta" : request.getTipo())
                .motivo(request.getMotivo())
                .status("Confirmado")
                .build();

            var salva = consultaRepository.saveAndFlush(consulta);
            long duracao = System.currentTimeMillis() - inicio;

            if (monitorService != null) {
                monitorService.registrar(
                        "AGENDAMENTO",
                        medico.getId(),
                        medico.getNome(),
                        request.getDataConsulta().toString(),
                        request.getHorarioConsulta(),
                        paciente.getNome(),
                        "SUCESSO_AGENDADO",
                        duracao,
                        "Consulta #" + salva.getId() + " autorizada com integridade."
                );
            }

            // SEGUNDA APLICAÇÃO ASSÍNCRONA
            if (processamentoAssincronoService != null) {
                processamentoAssincronoService.processarPosAgendamentoAssincrono(salva);
            }

            return resposta(salva);

        } catch (Exception ex) {
            if (!(ex instanceof RegraNegocioException) && monitorService != null) {
                long duracao = System.currentTimeMillis() - inicio;
                monitorService.registrar(
                        "AGENDAMENTO",
                        request.getMedicoId(),
                        null,
                        String.valueOf(request.getDataConsulta()),
                        request.getHorarioConsulta(),
                        null,
                        "FALHA_TECNICA",
                        duracao,
                        ex.getMessage()
                );
            }
            throw ex;
        } finally {
            if (lockManager != null && chaveLock != null) {
                lockManager.liberar(chaveLock);
            }
        }
    }

    @Transactional
    public ConsultaResponseDTO cancelar(Long id, String motivo) {
        Long medicoId = consultaRepository.buscarMedicoId(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Consulta não encontrada."));
        agenda.bloquearMedico(medicoId);
        var consulta = consultaRepository.buscarParaAtualizar(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Consulta não encontrada."));
        if (!List.of("Pendente", "Confirmado").contains(consulta.getStatus()))
            throw new RegraNegocioException("Somente consultas pendentes ou confirmadas podem ser canceladas.");
        consulta.setStatus("Cancelado");
        consulta.setMotivoCancelamento(motivo);
        consulta.setCanceladoEm(OffsetDateTime.now());
        agenda.liberarHorario(medicoId, consulta.getDataConsulta(), consulta.getHorarioConsulta());
        
        var salva = consultaRepository.saveAndFlush(consulta);

        if (monitorService != null) {
            monitorService.registrar(
                    "CANCELAMENTO",
                    medicoId,
                    consulta.getMedico() != null ? consulta.getMedico().getNome() : null,
                    consulta.getDataConsulta().toString(),
                    consulta.getHorarioConsulta(),
                    consulta.getPaciente() != null ? consulta.getPaciente().getNome() : null,
                    "SUCESSO_LIBERADO",
                    0,
                    "Horário cancelado e devolvido à disponibilidade."
            );
        }

        return resposta(salva);
    }

    @Transactional
    public ConsultaResponseDTO reagendar(Long id, AgendamentoRequestDTO request) {
        Long antigoMedico = consultaRepository.buscarMedicoId(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Consulta não encontrada."));
        java.util.stream.Stream.of(antigoMedico, request.getMedicoId()).distinct().sorted().forEach(agenda::bloquearMedico);
        var antiga = consultaRepository.buscarParaAtualizar(id).orElseThrow();
        if (!antiga.getPaciente().getId().equals(request.getPacienteId()))
            throw new RegraNegocioException("O paciente não pode ser alterado.");
        cancelar(id, "Reagendamento");
        return agendar(request);
    }

    @Transactional
    public ConsultaResponseDTO atualizarStatus(Long id, String status) {
        Long medicoId = consultaRepository.buscarMedicoId(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Consulta não encontrada."));
        agenda.bloquearMedico(medicoId);
        var consulta = consultaRepository.buscarParaAtualizar(id).orElseThrow();
        var permitidos = java.util.Map.of(
            "Pendente", List.of("Confirmado", "Compareceu", "Nao compareceu"),
            "Confirmado", List.of("Compareceu", "Nao compareceu", "Em atendimento"),
            "Compareceu", List.of("Em atendimento"),
            "Em atendimento", List.of("Concluído"));
        if (!permitidos.getOrDefault(consulta.getStatus(), List.of()).contains(status))
            throw new RegraNegocioException("Transição de status inválida.");
        consulta.setStatus(status);
        return resposta(consultaRepository.saveAndFlush(consulta));
    }

    private ConsultaResponseDTO resposta(Consulta c) {
        var m = c.getMedico();
        return ConsultaResponseDTO.builder().id(c.getId()).pacienteId(c.getPaciente().getId())
            .pacienteNome(c.getPaciente().getNome()).medicoId(m.getId()).medicoNome(m.getNome())
            .especialidadeNome(m.getEspecialidade() == null ? null : m.getEspecialidade().getNome())
            .clinicaId(c.getClinica() == null ? null : c.getClinica().getId())
            .clinicaNome(c.getClinica() == null ? null : c.getClinica().getNome())
            .dataConsulta(c.getDataConsulta()).horarioConsulta(c.getHorarioConsulta()).status(c.getStatus())
            .tipo(c.getTipo()).motivo(c.getMotivo()).criadoEm(c.getCriadoEm()).build();
    }
}
