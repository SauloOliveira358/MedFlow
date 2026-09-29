package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
    @org.springframework.data.jpa.repository.Query("select c.medico.id from Consulta c where c.id = :id")
    java.util.Optional<Long> buscarMedicoId(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Consulta c where c.id = :id")
    java.util.Optional<Consulta> buscarParaAtualizar(@org.springframework.data.repository.query.Param("id") Long id);

    List<Consulta> findByPacienteIdOrderByDataConsultaDescHorarioConsultaDesc(Long pacienteId);
    List<Consulta> findByMedicoIdAndDataConsultaOrderByHorarioConsultaAsc(Long medicoId, LocalDate dataConsulta);
    List<Consulta> findByMedicoIdOrderByDataConsultaDescHorarioConsultaDesc(Long medicoId);
    List<Consulta> findByStatus(String status);
    boolean existsByMedicoIdAndDataConsultaAndHorarioConsultaAndStatusNot(Long medicoId, LocalDate dataConsulta, String horarioConsulta, String status);
}
