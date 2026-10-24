package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.concorrencia.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller de Concorrência e Observabilidade (Itens 12 e 13 do Módulo 3 - POO II).
 * Exponibiliza métricas de thread pool, logs estruturados e simulação de concorrência.
 */
@RestController
@RequestMapping("/api/concorrencia")
@RequiredArgsConstructor
public class ConcorrenciaController {

    private final ConcorrenciaMonitorService monitorService;
    private final SimuladorConcorrenciaService simuladorService;

    @GetMapping("/metricas")
    public ResponseEntity<ConcorrenciaMetricasDTO> obterMetricas() {
        return ResponseEntity.ok(monitorService.obterMetricas());
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ConcorrenciaLogDTO>> listarLogs() {
        return ResponseEntity.ok(monitorService.listarLogsRecentes());
    }

    @PostMapping("/simular")
    public ResponseEntity<SimulacaoResultadoDTO> executarSimulacao(@Valid @RequestBody SimulacaoRequestDTO request) {
        return ResponseEntity.ok(simuladorService.executarSimulacao(request));
    }

    @PostMapping("/resetar-metricas")
    public ResponseEntity<Map<String, String>> resetarMetricas() {
        monitorService.resetar();
        return ResponseEntity.ok(Map.of("message", "Métricas e histórico de logs resetados com sucesso."));
    }
}
