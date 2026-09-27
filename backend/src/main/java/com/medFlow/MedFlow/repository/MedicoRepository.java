package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {
    Optional<Medico> findByCrm(String crm);
    Optional<Medico> findByEmailIgnoreCase(String email);
    Optional<Medico> findByUsuarioId(Long usuarioId);
    List<Medico> findByClinicaIdAndAtivoTrue(Long clinicaId);
    List<Medico> findByEspecialidadeIdAndAtivoTrue(Long especialidadeId);
    List<Medico> findByAtivoTrueOrderByNomeAsc();
}
