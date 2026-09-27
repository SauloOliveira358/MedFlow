package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.AnotacaoProntuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnotacaoProntuarioRepository extends JpaRepository<AnotacaoProntuario, Long> {
    List<AnotacaoProntuario> findByProntuarioIdOrderByDataAnotacaoDesc(Long prontuarioId);
}
