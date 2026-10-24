package com.medFlow.MedFlow.dto;

import java.time.LocalDate;
import java.util.List;

public record ProntuarioDTO(
        Long id,
        Long pacienteId,
        String pacienteNome,
        String pacienteTelefone,
        Long medicoId,
        String medicoNome,
        String resumo,
        String criadoEm,
        String atualizadoEm,
        List<AnotacaoDTO> anotacoes,
        List<ProcedimentoDTO> procedimentos,
        List<DocumentoDTO> documentos
) {
    public record AnotacaoDTO(
            Long id,
            String nomeAutor,
            LocalDate dataAnotacao,
            String conteudo,
            String criadoEm
    ) {}

    public record ProcedimentoDTO(
            Long id,
            String nomeProcedimento,
            LocalDate dataProcedimento,
            String observacoes,
            String criadoEm
    ) {}

    public record DocumentoDTO(
            Long id,
            String titulo,
            String nomeArquivo,
            String tipoArquivo,
            Long tamanhoBytes,
            String conteudoTexto,
            String arquivoUrl,
            String criadoEm
    ) {}

    public record CriarProntuarioRequest(
            Long pacienteId,
            Long medicoId,
            String resumo
    ) {}

    public record CriarAnotacaoRequest(
            String autor,
            String conteudo
    ) {}

    public record CriarProcedimentoRequest(
            String nome,
            LocalDate data,
            String observacoes
    ) {}
}
