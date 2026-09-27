package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Especialidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EspecialidadeRepository extends JpaRepository<Especialidade, Long> {
    Optional<Especialidade> findByNomeIgnoreCase(String nome);
    List<Especialidade> findByAtivoTrueOrderByNomeAsc();
}
