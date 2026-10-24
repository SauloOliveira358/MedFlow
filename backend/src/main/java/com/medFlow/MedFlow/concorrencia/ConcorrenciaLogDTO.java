package com.medFlow.MedFlow.concorrencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Log estruturado de concorrência atendendo rigorosamente ao Item 12 do Módulo 3:
 * Identifica: horário, Thread, operação, médico, horário/slot, paciente e resultado.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcorrenciaLogDTO {
    private String id;
    private OffsetDateTime timestamp;
    private String threadNome;
    private String operacao;
    private String medicoNome;
    private Long medicoId;
    private String dataConsulta;
    private String horarioConsulta;
    private String pacienteNome;
    private String resultado; // SUCESSO_AGENDADO, REJEITADO_CONFLITO, FALHA_TECNICA, RACE_CONDITION_SIMULADA
    private long duracaoMs;
    private String detalhes;
}
