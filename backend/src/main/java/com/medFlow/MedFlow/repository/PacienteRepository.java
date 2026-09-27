package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByCpf(String cpf);
    Optional<Paciente> findByEmailIgnoreCase(String email);
    Optional<Paciente> findByUsuarioId(Long usuarioId);
    List<Paciente> findByAtivoTrueOrderByNomeAsc();
}
