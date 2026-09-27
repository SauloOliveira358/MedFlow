package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.HorarioAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioAgendaRepository extends JpaRepository<HorarioAgenda, Long> {
    List<HorarioAgenda> findByAgendaIdOrderByHorarioAsc(Long agendaId);
    List<HorarioAgenda> findByAgendaIdAndDisponivelTrueOrderByHorarioAsc(Long agendaId);
    Optional<HorarioAgenda> findByAgendaIdAndHorario(Long agendaId, String horario);
}
