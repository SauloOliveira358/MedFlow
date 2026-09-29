package com.medFlow.MedFlow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import jakarta.validation.constraints.*;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgendamentoRequestDTO {
    @NotNull @Positive
    private Long pacienteId;
    @NotNull @Positive
    private Long medicoId;
    @Positive
    private Long clinicaId;
    @NotNull
    private LocalDate dataConsulta;
    @NotBlank @Pattern(regexp = "(?:[01][0-9]|2[0-3]):[0-5][0-9]")
    private String horarioConsulta;
    @Size(max = 40)
    private String tipo;
    private String motivo;
}
