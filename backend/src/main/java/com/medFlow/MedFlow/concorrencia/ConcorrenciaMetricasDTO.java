package com.medFlow.MedFlow.concorrencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Indicadores do Dashboard Técnico de Concorrência (Item 13 do Módulo 3).
 * Indicadores: solicitações, agendamentos concluídos, rejeições, horários livres, falhas e tempo médio.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcorrenciaMetricasDTO {
    private long totalSolicitacoes;
    private long agendamentosConcluidos;
    private long rejeicoesConflito;
    private long falhas;
    private double tempoMedioMs;
    private int threadsAtivas;
    private int tamanhoPool;
    private int tarefasNaFila;
    private long totalTarefasFinalizadas;
    private OffsetDateTime ultimaAtualizacao;
    private String statusGeral;
}
