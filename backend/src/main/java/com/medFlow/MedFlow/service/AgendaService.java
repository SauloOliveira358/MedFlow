package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.dto.*;
import com.medFlow.MedFlow.exception.*;
import com.medFlow.MedFlow.model.*;
import com.medFlow.MedFlow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AgendaService {
    private final MedicoRepository medicos;
    private final AgendaMedicoRepository agendas;
    private final HorarioAgendaRepository horarios;
    private final ConsultaRepository consultas;

    public static void validarFuturo(LocalDate data, String horario) {
        if (!LocalDateTime.of(data, LocalTime.parse(horario)).isAfter(LocalDateTime.now(ZoneId.of("America/Sao_Paulo"))))
            throw new RegraNegocioException("O horário deve estar no futuro (America/Sao_Paulo).");
    }

    public Medico bloquearMedico(Long id) {
        return medicos.buscarParaAtualizar(id).orElseThrow(() -> new RecursoNaoEncontradoException("Médico não encontrado."));
    }

    public HorarioAgenda buscarHorario(Long medicoId, LocalDate data, String horario) {
        var agenda = agendas.findByMedicoIdAndDataAgenda(medicoId, data)
            .orElseThrow(() -> new RegraNegocioException("O médico não disponibilizou agenda para esta data."));
        return horarios.findByAgendaIdAndHorario(agenda.getId(), horario)
            .orElseThrow(() -> new RegraNegocioException("Horário não disponibilizado na agenda."));
    }

    public void liberarHorario(Long medicoId, LocalDate data, String horario) {
        agendas.findByMedicoIdAndDataAgenda(medicoId, data)
            .flatMap(a -> horarios.findByAgendaIdAndHorario(a.getId(), horario))
            .ifPresent(h -> h.setDisponivel(true));
    }

    @Transactional(readOnly = true)
    public AgendaResponseDTO buscar(Long medicoId, LocalDate data) {
        if (!medicos.existsById(medicoId)) throw new RecursoNaoEncontradoException("Médico não encontrado.");
        var ocupados = consultas.findByMedicoIdAndDataConsultaOrderByHorarioConsultaAsc(medicoId, data).stream()
            .filter(c -> !"Cancelado".equals(c.getStatus())).map(Consulta::getHorarioConsulta).toList();
        var slots = agendas.findByMedicoIdAndDataAgenda(medicoId, data)
            .map(a -> horarios.findByAgendaIdOrderByHorarioAsc(a.getId())).orElse(List.of());
        var agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        return new AgendaResponseDTO(medicoId, data, slots.stream().map(h -> new AgendaResponseDTO.HorarioDTO(
            h.getHorario(), Boolean.TRUE.equals(h.getDisponivel()) && !ocupados.contains(h.getHorario())
            && LocalDateTime.of(data, LocalTime.parse(h.getHorario())).isAfter(agora))).toList());
    }

    @Transactional
    public AgendaResponseDTO salvar(Long medicoId, LocalDate data, AgendaRequestDTO request) {
        var medico = bloquearMedico(medicoId);
        if (!Boolean.TRUE.equals(medico.getAtivo())) throw new RegraNegocioException("Médico inativo.");
        if (data.isBefore(LocalDate.now(ZoneId.of("America/Sao_Paulo")))) throw new RegraNegocioException("Data no passado.");
        var desejados = new HashSet<>(request.horarios());
        if (desejados.size() != request.horarios().size()) throw new RegraNegocioException("Horários duplicados.");
        var agenda = agendas.findByMedicoIdAndDataAgenda(medicoId, data)
            .orElseGet(() -> agendas.save(AgendaMedico.builder().medico(medico).dataAgenda(data).build()));
        var existentes = horarios.findByAgendaIdOrderByHorarioAsc(agenda.getId());
        var ocupados = consultas.findByMedicoIdAndDataConsultaOrderByHorarioConsultaAsc(medicoId, data).stream()
            .filter(c -> !"Cancelado".equals(c.getStatus())).map(Consulta::getHorarioConsulta).toList();
        if (!desejados.containsAll(ocupados)) throw new RegraNegocioException("Não é possível remover horários com consultas ativas.");
        horarios.deleteAll(existentes.stream().filter(h -> !desejados.contains(h.getHorario())).toList());
        for (String horario : desejados) {
            if (existentes.stream().noneMatch(h -> h.getHorario().equals(horario))) {
                validarFuturo(data, horario);
                horarios.save(HorarioAgenda.builder().agenda(agenda).horario(horario).disponivel(!ocupados.contains(horario)).build());
            }
        }
        horarios.flush();
        return buscar(medicoId, data);
    }
}
