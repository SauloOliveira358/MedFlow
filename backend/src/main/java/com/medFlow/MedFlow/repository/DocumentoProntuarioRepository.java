package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.DocumentoProntuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoProntuarioRepository extends JpaRepository<DocumentoProntuario, Long> {
    List<DocumentoProntuario> findByProntuarioIdOrderByCriadoEmDesc(Long prontuarioId);
}
