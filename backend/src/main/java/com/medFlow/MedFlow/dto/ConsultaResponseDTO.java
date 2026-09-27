package com.medFlow.MedFlow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultaResponseDTO {
    private Long id;
    private Long pacienteId;
    private String pacienteNome;
    private Long medicoId;
    private String medicoNome;
    private String especialidadeNome;
    private Long clinicaId;
    private String clinicaNome;
    private LocalDate dataConsulta;
    private String horarioConsulta;
    private String status;
    private String tipo;
    private String motivo;
    private OffsetDateTime criadoEm;
}
