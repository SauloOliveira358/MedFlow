package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    List<Notificacao> findByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);
    List<Notificacao> findByPacienteIdOrderByCriadoEmDesc(Long pacienteId);
    List<Notificacao> findByMedicoIdOrderByCriadoEmDesc(Long medicoId);
    List<Notificacao> findByUsuarioIdAndLidaFalseOrderByCriadoEmDesc(Long usuarioId);
}
