package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.HorarioAgenda;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioAgendaRepository extends JpaRepository<HorarioAgenda, Long> {
    List<HorarioAgenda> findByAgendaIdOrderByHorarioAsc(Long agendaId);
    List<HorarioAgenda> findByAgendaIdInOrderByHorarioAsc(java.util.Collection<Long> agendaIds);
    List<HorarioAgenda> findByAgendaIdAndDisponivelTrueOrderByHorarioAsc(Long agendaId);
    Optional<HorarioAgenda> findByAgendaIdAndHorario(Long agendaId, String horario);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from HorarioAgenda h where h.agenda.id = :agendaId and h.horario = :horario")
    Optional<HorarioAgenda> buscarParaAtualizar(@Param("agendaId") Long agendaId, @Param("horario") String horario);
}
