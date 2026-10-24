package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.dto.ProntuarioDTO;
import com.medFlow.MedFlow.dto.ProntuarioDTO.*;
import com.medFlow.MedFlow.service.ProntuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prontuarios")
@RequiredArgsConstructor
public class ProntuarioController {

    private final ProntuarioService prontuarioService;

    @GetMapping("/medico/{medicoId}")
    public ResponseEntity<List<ProntuarioDTO>> listarPorMedico(@PathVariable Long medicoId) {
        return ResponseEntity.ok(prontuarioService.listarPorMedico(medicoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProntuarioDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(prontuarioService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ProntuarioDTO> obterOuCriar(@RequestBody CriarProntuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                prontuarioService.obterOuCriar(request.pacienteId(), request.medicoId(), request.resumo())
        );
    }

    @PostMapping("/{id}/anotacoes")
    public ResponseEntity<AnotacaoDTO> adicionarAnotacao(
            @PathVariable Long id,
            @RequestBody CriarAnotacaoRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                prontuarioService.adicionarAnotacao(id, request.autor(), request.conteudo())
        );
    }

    @PostMapping("/{id}/procedimentos")
    public ResponseEntity<ProcedimentoDTO> adicionarProcedimento(
            @PathVariable Long id,
            @RequestBody CriarProcedimentoRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                prontuarioService.adicionarProcedimento(id, request.nome(), request.data(), request.observacoes())
        );
    }
}
