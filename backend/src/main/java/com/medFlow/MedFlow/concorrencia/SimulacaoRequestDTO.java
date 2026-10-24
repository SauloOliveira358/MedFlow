package com.medFlow.MedFlow.concorrencia;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulacaoRequestDTO {
    private Long medicoId;
    private LocalDate dataConsulta;
    private String horarioConsulta;

    @Min(value = 2, message = "O teste deve ter pelo menos 2 requisições simultâneas.")
    @Max(value = 500, message = "Limite máximo de 500 requisições simultâneas por rodada.")
    @Builder.Default
    private int totalRequisicoes = 50;

    @Builder.Default
    private boolean modoProtegido = true;
}
