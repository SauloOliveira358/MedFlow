package com.medFlow.MedFlow;

import com.medFlow.MedFlow.dto.*;
import com.medFlow.MedFlow.exception.RegraNegocioException;
import com.medFlow.MedFlow.model.*;
import com.medFlow.MedFlow.repository.*;
import com.medFlow.MedFlow.service.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AgendaAgendamentoTest {
    final ConsultaRepository consultas = mock(ConsultaRepository.class);
    final PacienteRepository pacientes = mock(PacienteRepository.class);
    final AgendaService agenda = mock(AgendaService.class);
    final ConsultaService service = new ConsultaService(consultas, pacientes, agenda);
    final LocalDate data = LocalDate.now().plusDays(5);

    AgendamentoRequestDTO request() {
        return AgendamentoRequestDTO.builder().medicoId(1L).pacienteId(2L)
            .dataConsulta(data).horarioConsulta("09:00").build();
    }
    HorarioAgenda preparar() {
        when(agenda.bloquearMedico(1L)).thenReturn(Medico.builder().id(1L).nome("Medico").build());
        when(pacientes.findById(2L)).thenReturn(Optional.of(Paciente.builder().id(2L).nome("Paciente").build()));
        var slot = HorarioAgenda.builder().horario("09:00").build();
        when(agenda.buscarHorario(1L, data, "09:00")).thenReturn(slot);
        when(consultas.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        return slot;
    }
    @Test void reservaHorarioEConfirmaConsulta() {
        var slot = preparar();
        var result = service.agendar(request());
        assertFalse(slot.getDisponivel());
        assertEquals("Confirmado", result.getStatus());
        assertEquals(2L, result.getPacienteId());
        verify(consultas).saveAndFlush(any());
    }
    @Test void rejeitaHorarioOcupado() {
        preparar().setDisponivel(false);
        assertThrows(RegraNegocioException.class, () -> service.agendar(request()));
        verify(consultas, never()).saveAndFlush(any());
    }
    @Test void rejeitaConflitoMesmoComDisponibilidadeDesatualizada() {
        preparar();
        when(consultas.existsByMedicoIdAndDataConsultaAndHorarioConsultaAndStatusNot(1L, data, "09:00", "Cancelado")).thenReturn(true);
        assertThrows(RegraNegocioException.class, () -> service.agendar(request()));
    }
    @Test void rejeitaAgendamentoNoPassado() {
        var request = request(); request.setDataConsulta(LocalDate.now().minusDays(1));
        assertThrows(RegraNegocioException.class, () -> service.agendar(request));
        verifyNoInteractions(consultas, agenda, pacientes);
    }
    @Test void cancelaELiberaHorario() {
        var c = Consulta.builder().id(3L).medico(Medico.builder().id(1L).build())
            .paciente(Paciente.builder().id(2L).build()).dataConsulta(data).horarioConsulta("09:00").status("Confirmado").build();
        when(consultas.buscarMedicoId(3L)).thenReturn(Optional.of(1L));
        when(consultas.buscarParaAtualizar(3L)).thenReturn(Optional.of(c));
        when(consultas.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        assertEquals("Cancelado", service.cancelar(3L, "Motivo").getStatus());
        assertNotNull(c.getCanceladoEm());
        verify(agenda).liberarHorario(1L, data, "09:00");
        assertThrows(RegraNegocioException.class, () -> service.cancelar(3L, "Novamente"));
    }
    @Test void impedeRemoverHorarioComConsultaAtiva() {
        var medicos = mock(MedicoRepository.class);
        var agendas = mock(AgendaMedicoRepository.class);
        var horarios = mock(HorarioAgendaRepository.class);
        var svc = new AgendaService(medicos, agendas, horarios, consultas);
        var medico = Medico.builder().id(1L).build();
        when(medicos.buscarParaAtualizar(1L)).thenReturn(Optional.of(medico));
        when(agendas.findByMedicoIdAndDataAgenda(1L, data)).thenReturn(Optional.of(AgendaMedico.builder().id(4L).medico(medico).build()));
        when(horarios.findByAgendaIdOrderByHorarioAsc(4L)).thenReturn(List.of());
        when(consultas.findByMedicoIdAndDataConsultaOrderByHorarioConsultaAsc(1L, data))
            .thenReturn(List.of(Consulta.builder().horarioConsulta("09:00").status("Confirmado").build()));
        assertThrows(RegraNegocioException.class, () -> svc.salvar(1L, data, new AgendaRequestDTO(List.of())));
        verify(horarios, never()).deleteAll(any());
    }
    @Test void rejeitaAlterarPacienteNoReagendamento() {
        var c = Consulta.builder().id(3L).paciente(Paciente.builder().id(99L).build()).build();
        when(consultas.buscarMedicoId(3L)).thenReturn(Optional.of(1L));
        when(consultas.buscarParaAtualizar(3L)).thenReturn(Optional.of(c));
        assertThrows(RegraNegocioException.class, () -> service.reagendar(3L, request()));
        verify(consultas, never()).saveAndFlush(any());
    }
    @Test void persisteTransicaoDeAtendimentoERejeitaRetrocesso() {
        var c = Consulta.builder().id(3L).medico(Medico.builder().id(1L).build())
            .paciente(Paciente.builder().id(2L).build()).status("Confirmado").build();
        when(consultas.buscarMedicoId(3L)).thenReturn(Optional.of(1L));
        when(consultas.buscarParaAtualizar(3L)).thenReturn(Optional.of(c));
        when(consultas.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        assertEquals("Em atendimento", service.atualizarStatus(3L, "Em atendimento").getStatus());
        assertThrows(RegraNegocioException.class, () -> service.atualizarStatus(3L, "Confirmado"));
    }
}
