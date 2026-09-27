package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.AgendaMedico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AgendaMedicoRepository extends JpaRepository<AgendaMedico, Long> {
    Optional<AgendaMedico> findByMedicoIdAndDataAgenda(Long medicoId, LocalDate dataAgenda);
    List<AgendaMedico> findByMedicoIdAndDataAgendaGreaterThanEqualOrderByDataAgendaAsc(Long medicoId, LocalDate dataAgenda);
}
