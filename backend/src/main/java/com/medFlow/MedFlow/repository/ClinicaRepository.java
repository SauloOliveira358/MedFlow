package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Clinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicaRepository extends JpaRepository<Clinica, Long> {
    Optional<Clinica> findByCnpj(String cnpj);
    Optional<Clinica> findByEmail(String email);
    List<Clinica> findByAtivoTrue();
}
