package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.ProcedimentoProntuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcedimentoProntuarioRepository extends JpaRepository<ProcedimentoProntuario, Long> {
    List<ProcedimentoProntuario> findByProntuarioIdOrderByDataProcedimentoDesc(Long prontuarioId);
}
