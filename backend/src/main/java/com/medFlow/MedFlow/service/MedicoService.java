package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.exception.RecursoNaoEncontradoException;
import com.medFlow.MedFlow.model.Medico;
import com.medFlow.MedFlow.repository.MedicoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicoService {

    private final MedicoRepository medicoRepository;

    @Transactional(readOnly = true)
    public List<Medico> listarTodos() {
        return medicoRepository.findByAtivoTrueOrderByNomeAsc();
    }

    @Transactional(readOnly = true)
    public Medico buscarPorId(Long id) {
        return medicoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Médico não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Medico> listarPorEspecialidade(Long especialidadeId) {
        return medicoRepository.findByEspecialidadeIdAndAtivoTrue(especialidadeId);
    }

    @Transactional
    public Medico salvar(Medico medico) {
        return medicoRepository.save(medico);
    }
}
