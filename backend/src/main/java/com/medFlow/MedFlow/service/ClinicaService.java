package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.exception.RecursoNaoEncontradoException;
import com.medFlow.MedFlow.model.Clinica;
import com.medFlow.MedFlow.repository.ClinicaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClinicaService {

    private final ClinicaRepository clinicaRepository;

    @Transactional(readOnly = true)
    public List<Clinica> listarTodas() {
        return clinicaRepository.findByAtivoTrue();
    }

    @Transactional(readOnly = true)
    public Clinica buscarPorId(Long id) {
        return clinicaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Clínica não encontrada com ID: " + id));
    }

    @Transactional
    public Clinica salvar(Clinica clinica) {
        return clinicaRepository.save(clinica);
    }

    @Transactional
    public void excluir(Long id) {
        Clinica clinica = buscarPorId(id);
        clinica.setAtivo(false);
        clinicaRepository.save(clinica);
    }
}
