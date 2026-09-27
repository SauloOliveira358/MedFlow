package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
    List<Consulta> findByPacienteIdOrderByDataConsultaDescHorarioConsultaDesc(Long pacienteId);
    List<Consulta> findByMedicoIdAndDataConsultaOrderByHorarioConsultaAsc(Long medicoId, LocalDate dataConsulta);
    List<Consulta> findByMedicoIdOrderByDataConsultaDescHorarioConsultaDesc(Long medicoId);
    List<Consulta> findByStatus(String status);
    boolean existsByMedicoIdAndDataConsultaAndHorarioConsultaAndStatusNot(Long medicoId, LocalDate dataConsulta, String horarioConsulta, String status);
}
