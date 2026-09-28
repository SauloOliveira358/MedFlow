package com.medFlow.MedFlow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroMedicoDTO {

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O CRM / Registro Profissional é obrigatório")
    private String crm;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    private String senha;

    private String telefone;
    private Long especialidadeId;
    private String especialidadeNome;
    private String nomeConsultorio;
    private String endereco;
    private Double latitude;
    private Double longitude;
    private String biografia;
    private String fotoBase64;
}
