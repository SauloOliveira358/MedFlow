package com.medFlow.MedFlow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgendamentoRequestDTO {
    private Long pacienteId;
    private Long medicoId;
    private Long clinicaId;
    private LocalDate dataConsulta;
    private String horarioConsulta;
    private String tipo;
    private String motivo;
}
