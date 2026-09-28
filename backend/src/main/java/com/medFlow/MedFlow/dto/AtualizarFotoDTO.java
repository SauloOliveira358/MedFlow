package com.medFlow.MedFlow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtualizarFotoDTO {

    @NotBlank(message = "A foto em base64 é obrigatória")
    private String fotoBase64;
}
