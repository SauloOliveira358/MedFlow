package com.medFlow.MedFlow.concorrencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Resultado completo da Execução Concorrente (Itens 4 e 16 do Módulo 3).
 * Apresenta a comparação antes x depois com evidências matemáticas e logs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulacaoResultadoDTO {
    private String modo; // "PROTEGIDO_COM_LOCK" vs "VULNERAVEL_RACE_CONDITION"
    private int operacoesSolicitadas;
    private int operacoesConcluidas;
    private int operacoesRejeitadas;
    private int inconsistenciasDetectadas;
    private long tempoTotalMs;
    private double tempoMedioMs;
    private String estadoInicial;
    private String estadoFinal;
    private String explicacaoTecnica;
    private List<ConcorrenciaLogDTO> registrosExecucao;
}
