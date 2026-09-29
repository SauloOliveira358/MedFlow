package com.medFlow.MedFlow;

import com.medFlow.MedFlow.dto.*;
import com.medFlow.MedFlow.repository.*;
import com.medFlow.MedFlow.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/** Explicit opt-in: uses the configured database and rolls back test data. */
@EnabledIfEnvironmentVariable(named = "MEDFLOW_TEST_SUPABASE", matches = "true")
@SpringBootTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=none"})
@Transactional
class AgendaSupabaseIntegrationTest {
    @Autowired AgendaService agenda;
    @Autowired ConsultaService consultas;
    @Autowired MedicoRepository medicos;
    @Autowired PacienteRepository pacientes;
    @Autowired ConsultaRepository repository;
    @Autowired jakarta.persistence.EntityManager entityManager;

    @Test void persisteAgendaReservaECancelamento() {
        var medico = medicos.findByAtivoTrueOrderByNomeAsc().stream().findFirst().orElseThrow();
        var paciente = pacientes.findAll().stream().filter(p -> Boolean.TRUE.equals(p.getAtivo())).findFirst().orElseThrow();
        var data = LocalDate.now().plusYears(10);
        while (!agenda.buscar(medico.getId(), data).horarios().isEmpty()) data = data.plusDays(1);
        agenda.salvar(medico.getId(), data, new AgendaRequestDTO(List.of("09:00", "10:00")));
        var consulta = consultas.agendar(AgendamentoRequestDTO.builder()
            .medicoId(medico.getId()).pacienteId(paciente.getId()).dataConsulta(data).horarioConsulta("09:00").build());
        entityManager.flush();
        entityManager.clear();
        assertEquals("Confirmado", repository.findById(consulta.getId()).orElseThrow().getStatus());
        assertFalse(agenda.buscar(medico.getId(), data).horarios().getFirst().disponivel());
        consultas.cancelar(consulta.getId(), "Teste transacional");
        entityManager.flush();
        entityManager.clear();
        assertEquals("Cancelado", repository.findById(consulta.getId()).orElseThrow().getStatus());
        assertTrue(agenda.buscar(medico.getId(), data).horarios().getFirst().disponivel());
    }
}
