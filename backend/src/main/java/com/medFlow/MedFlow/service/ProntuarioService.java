package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.dto.ProntuarioDTO;
import com.medFlow.MedFlow.dto.ProntuarioDTO.*;
import com.medFlow.MedFlow.model.*;
import com.medFlow.MedFlow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProntuarioService {

    private final ProntuarioRepository prontuarioRepository;
    private final AnotacaoProntuarioRepository anotacaoRepository;
    private final ProcedimentoProntuarioRepository procedimentoRepository;
    private final DocumentoProntuarioRepository documentoRepository;
    private final PacienteRepository pacienteRepository;
    private final MedicoRepository medicoRepository;

    @Transactional(readOnly = true)
    public List<ProntuarioDTO> listarPorMedico(Long medicoId) {
        List<Prontuario> prontuarios = prontuarioRepository.findByMedicoIdOrderByAtualizadoEmDesc(medicoId);
        return prontuarios.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public ProntuarioDTO buscarPorId(Long id) {
        Prontuario p = prontuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prontuário não encontrado com ID: " + id));
        return toDTO(p);
    }

    @Transactional
    public ProntuarioDTO obterOuCriar(Long pacienteId, Long medicoId, String resumo) {
        return prontuarioRepository.findByPacienteIdAndMedicoId(pacienteId, medicoId)
                .map(this::toDTO)
                .orElseGet(() -> {
                    Paciente paciente = pacienteRepository.findById(pacienteId)
                            .orElseThrow(() -> new RuntimeException("Paciente não encontrado com ID: " + pacienteId));
                    Medico medico = medicoRepository.findById(medicoId)
                            .orElseThrow(() -> new RuntimeException("Médico não encontrado com ID: " + medicoId));

                    Prontuario novo = Prontuario.builder()
                            .paciente(paciente)
                            .medico(medico)
                            .resumo(resumo != null && !resumo.isBlank() ? resumo : "Prontuário clínico iniciado.")
                            .build();

                    Prontuario salvo = prontuarioRepository.save(novo);

                    // Adiciona anotação de abertura
                    AnotacaoProntuario abertura = AnotacaoProntuario.builder()
                            .prontuario(salvo)
                            .nomeAutor(medico.getNome())
                            .dataAnotacao(LocalDate.now())
                            .conteudo("Prontuário clínico iniciado pelo especialista " + medico.getNome() + ".")
                            .build();
                    anotacaoRepository.save(abertura);

                    return toDTO(salvo);
                });
    }

    @Transactional
    public AnotacaoDTO adicionarAnotacao(Long prontuarioId, String autor, String conteudo) {
        Prontuario prontuario = prontuarioRepository.findById(prontuarioId)
                .orElseThrow(() -> new RuntimeException("Prontuário não encontrado."));

        AnotacaoProntuario anotacao = AnotacaoProntuario.builder()
                .prontuario(prontuario)
                .nomeAutor(autor != null && !autor.isBlank() ? autor : (prontuario.getMedico() != null ? prontuario.getMedico().getNome() : "Médico Responsável"))
                .dataAnotacao(LocalDate.now())
                .conteudo(conteudo)
                .build();

        AnotacaoProntuario salva = anotacaoRepository.save(anotacao);
        return new AnotacaoDTO(
                salva.getId(),
                salva.getNomeAutor(),
                salva.getDataAnotacao(),
                salva.getConteudo(),
                salva.getCriadoEm() != null ? salva.getCriadoEm().toString() : ""
        );
    }

    @Transactional
    public ProcedimentoDTO adicionarProcedimento(Long prontuarioId, String nome, LocalDate data, String observacoes) {
        Prontuario prontuario = prontuarioRepository.findById(prontuarioId)
                .orElseThrow(() -> new RuntimeException("Prontuário não encontrado."));

        ProcedimentoProntuario procedimento = ProcedimentoProntuario.builder()
                .prontuario(prontuario)
                .nomeProcedimento(nome)
                .dataProcedimento(data != null ? data : LocalDate.now())
                .observacoes(observacoes)
                .build();

        ProcedimentoProntuario salvo = procedimentoRepository.save(procedimento);
        return new ProcedimentoDTO(
                salvo.getId(),
                salvo.getNomeProcedimento(),
                salvo.getDataProcedimento(),
                salvo.getObservacoes(),
                salvo.getCriadoEm() != null ? salvo.getCriadoEm().toString() : ""
        );
    }

    private ProntuarioDTO toDTO(Prontuario p) {
        List<AnotacaoDTO> anotacoes = anotacaoRepository.findByProntuarioIdOrderByDataAnotacaoDesc(p.getId())
                .stream()
                .map(a -> new AnotacaoDTO(
                        a.getId(),
                        a.getNomeAutor(),
                        a.getDataAnotacao(),
                        a.getConteudo(),
                        a.getCriadoEm() != null ? a.getCriadoEm().toString() : ""
                ))
                .toList();

        List<ProcedimentoDTO> procedimentos = procedimentoRepository.findByProntuarioIdOrderByDataProcedimentoDesc(p.getId())
                .stream()
                .map(pr -> new ProcedimentoDTO(
                        pr.getId(),
                        pr.getNomeProcedimento(),
                        pr.getDataProcedimento(),
                        pr.getObservacoes(),
                        pr.getCriadoEm() != null ? pr.getCriadoEm().toString() : ""
                ))
                .toList();

        List<DocumentoDTO> documentos = documentoRepository.findByProntuarioIdOrderByCriadoEmDesc(p.getId())
                .stream()
                .map(d -> new DocumentoDTO(
                        d.getId(),
                        d.getTitulo(),
                        d.getNomeArquivo(),
                        d.getTipoArquivo(),
                        d.getTamanhoBytes(),
                        d.getConteudoTexto(),
                        d.getArquivoUrl(),
                        d.getCriadoEm() != null ? d.getCriadoEm().toString() : ""
                ))
                .toList();

        return new ProntuarioDTO(
                p.getId(),
                p.getPaciente() != null ? p.getPaciente().getId() : null,
                p.getPaciente() != null ? p.getPaciente().getNome() : "Paciente",
                p.getPaciente() != null ? p.getPaciente().getTelefone() : "",
                p.getMedico() != null ? p.getMedico().getId() : null,
                p.getMedico() != null ? p.getMedico().getNome() : "Médico Responsável",
                p.getResumo() != null ? p.getResumo() : "Sem resumo clínico.",
                p.getCriadoEm() != null ? p.getCriadoEm().toString() : "",
                p.getAtualizadoEm() != null ? p.getAtualizadoEm().toString() : "",
                anotacoes,
                procedimentos,
                documentos
        );
    }
}
