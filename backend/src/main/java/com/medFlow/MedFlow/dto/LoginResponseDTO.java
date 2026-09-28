package com.medFlow.MedFlow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

    private String token;
    private Long usuarioId;
    private String email;
    private String perfil; // "paciente", "medico", "clinica", "admin"
    private String nome;
    private String fotoUrl;
    private Long medicoId;
    private Long pacienteId;
    private Long clinicaId;
    private String crm;
    private String especialidade;
    private String telefone;
}
