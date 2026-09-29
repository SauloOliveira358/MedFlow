package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.dto.*;
import com.medFlow.MedFlow.exception.*;
import com.medFlow.MedFlow.model.*;
import com.medFlow.MedFlow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ConsultaService {
    private final ConsultaRepository consultaRepository;
    private final PacienteRepository pacientes;
    private final AgendaService agenda;

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
    public ConsultaResponseDTO buscarPorId(Long id) { return resposta(buscar(id)); }

    @Transactional
    public ConsultaResponseDTO agendar(AgendamentoRequestDTO request) {
        AgendaService.validarFuturo(request.getDataConsulta(), request.getHorarioConsulta());
        var medico = agenda.bloquearMedico(request.getMedicoId());
        if (!Boolean.TRUE.equals(medico.getAtivo())) throw new RegraNegocioException("Médico inativo.");
        var paciente = pacientes.findById(request.getPacienteId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Paciente não encontrado."));
        if (!Boolean.TRUE.equals(paciente.getAtivo())) throw new RegraNegocioException("Paciente inativo.");
        var clinica = medico.getClinica();
        if (request.getClinicaId() != null && (clinica == null || !Objects.equals(clinica.getId(), request.getClinicaId())))
            throw new RegraNegocioException("A clínica informada não corresponde à clínica do médico.");
        var horario = agenda.buscarHorario(medico.getId(), request.getDataConsulta(), request.getHorarioConsulta());
        if (!Boolean.TRUE.equals(horario.getDisponivel()) || consultaRepository.existsByMedicoIdAndDataConsultaAndHorarioConsultaAndStatusNot(
                medico.getId(), request.getDataConsulta(), request.getHorarioConsulta(), "Cancelado"))
            throw new RegraNegocioException("Horário indisponível.");
        horario.setDisponivel(false);
        var consulta = Consulta.builder().medico(medico).paciente(paciente).clinica(clinica)
            .dataConsulta(request.getDataConsulta()).horarioConsulta(request.getHorarioConsulta())
            .tipo(request.getTipo() == null || request.getTipo().isBlank() ? "Primeira consulta" : request.getTipo())
            .motivo(request.getMotivo()).status("Confirmado").build();
        return resposta(consultaRepository.saveAndFlush(consulta));
    }

    @Transactional
    public ConsultaResponseDTO cancelar(Long id, String motivo) {
        // All agenda mutations lock the doctor first; the consultation lock refreshes concurrent cancellations.
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
        // Legacy consultations may predate the availability calendar.
        agenda.liberarHorario(medicoId, consulta.getDataConsulta(), consulta.getHorarioConsulta());
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
