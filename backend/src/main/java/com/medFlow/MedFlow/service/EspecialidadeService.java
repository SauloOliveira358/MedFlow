package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.model.Especialidade;
import com.medFlow.MedFlow.repository.EspecialidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EspecialidadeService {

    private final EspecialidadeRepository especialidadeRepository;

    @Transactional(readOnly = true)
    public List<Especialidade> listarTodas() {
        return especialidadeRepository.findByAtivoTrueOrderByNomeAsc();
    }

    @Transactional(readOnly = true)
    public Optional<Especialidade> buscarPorId(Long id) {
        return especialidadeRepository.findById(id);
    }

    @Transactional
    public Especialidade buscarOuCriar(String nome) {
        String trimmed = nome.trim();
        return especialidadeRepository.findByNomeIgnoreCase(trimmed)
                .orElseGet(() -> especialidadeRepository.save(
                        Especialidade.builder()
                                .nome(trimmed)
                                .descricao("Cuidado especializado em " + trimmed)
                                .icone("stethoscope")
                                .cor("sage")
                                .ativo(true)
                                .build()
                ));
    }
}
