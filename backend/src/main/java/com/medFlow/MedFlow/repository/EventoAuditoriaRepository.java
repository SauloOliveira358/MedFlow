package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.EventoAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, Long> {
    List<EventoAuditoria> findByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);
    List<EventoAuditoria> findByTipoRecursoAndRecursoIdOrderByCriadoEmDesc(String tipoRecurso, Long recursoId);
}
