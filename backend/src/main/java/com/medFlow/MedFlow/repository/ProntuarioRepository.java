package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Prontuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProntuarioRepository extends JpaRepository<Prontuario, Long> {
    List<Prontuario> findByPacienteIdOrderByCriadoEmDesc(Long pacienteId);
    Optional<Prontuario> findByPacienteIdAndMedicoId(Long pacienteId, Long medicoId);
}
