package com.medFlow.MedFlow.repository;

import com.medFlow.MedFlow.model.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Medico m where m.id = :id")
    Optional<Medico> buscarParaAtualizar(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<Medico> findByCrm(String crm);
    Optional<Medico> findByEmailIgnoreCase(String email);
    Optional<Medico> findByUsuarioId(Long usuarioId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"especialidade", "clinica"})
    List<Medico> findByClinicaIdAndAtivoTrue(Long clinicaId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"especialidade", "clinica"})
    List<Medico> findByEspecialidadeIdAndAtivoTrue(Long especialidadeId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"especialidade", "clinica"})
    List<Medico> findByAtivoTrueOrderByNomeAsc();
}
