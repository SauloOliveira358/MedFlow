package com.medFlow.MedFlow;

import com.medFlow.MedFlow.dto.LoginRequestDTO;
import com.medFlow.MedFlow.dto.LoginResponseDTO;
import com.medFlow.MedFlow.dto.RegistroMedicoDTO;
import com.medFlow.MedFlow.dto.RegistroPacienteDTO;
import com.medFlow.MedFlow.service.AuthService;
import com.medFlow.MedFlow.service.UsuarioService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioService usuarioService;

    @Test
    @DisplayName("Deve cadastrar um paciente no banco de dados e realizar login com sucesso")
    void deveCadastrarELogarPaciente() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        String email = "paciente_" + unique + "@medflow.teste";
        String senha = "SenhaForte123!";

        // Foto de teste em Base64 Data URL (simulando armazenamento direto no banco)
        String fotoTeste = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        RegistroPacienteDTO registro = RegistroPacienteDTO.builder()
                .nome("Paciente Teste " + unique)
                .email(email)
                .senha(senha)
                .telefone("(31) 98888-7777")
                .cpf("999." + unique.substring(0, 3) + ".888-00")
                .dataNascimento("1992-04-15")
                .fotoBase64(fotoTeste)
                .build();

        LoginResponseDTO respostaRegistro = authService.cadastrarPaciente(registro);
        assertNotNull(respostaRegistro);
        assertNotNull(respostaRegistro.getUsuarioId());
        assertNotNull(respostaRegistro.getPacienteId());
        assertEquals("paciente", respostaRegistro.getPerfil());
        assertEquals(email, respostaRegistro.getEmail());
        assertEquals(fotoTeste, respostaRegistro.getFotoUrl());

        // Agora realiza o login com as credenciais gravadas no banco
        LoginRequestDTO login = LoginRequestDTO.builder()
                .email(email)
                .senha(senha)
                .build();

        LoginResponseDTO respostaLogin = authService.autenticar(login);
        assertNotNull(respostaLogin);
        assertEquals(respostaRegistro.getUsuarioId(), respostaLogin.getUsuarioId());
        assertEquals(respostaRegistro.getPacienteId(), respostaLogin.getPacienteId());
        assertEquals("paciente", respostaLogin.getPerfil());
        assertEquals(fotoTeste, respostaLogin.getFotoUrl());
    }

    @Test
    @DisplayName("Deve cadastrar um médico no banco de dados e realizar login com sucesso")
    void deveCadastrarELogarMedico() {
        String unique = UUID.randomUUID().toString().substring(0, 6);
        String email = "medico_" + unique + "@medflow.teste";
        String crm = "CRM " + unique + "/MG";
        String senha = "MedicoSenha123!";
        String fotoTeste = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

        RegistroMedicoDTO registro = RegistroMedicoDTO.builder()
                .nome("Dr. Ricardo " + unique)
                .crm(crm)
                .email(email)
                .senha(senha)
                .telefone("(31) 97777-6666")
                .especialidadeNome("Cardiologia")
                .nomeConsultorio("CardioCentro")
                .endereco("Av. Brasil, 500")
                .latitude(-19.9300)
                .longitude(-43.9400)
                .biografia("Especialista em saúde cardiovascular.")
                .fotoBase64(fotoTeste)
                .build();

        LoginResponseDTO respostaRegistro = authService.cadastrarMedico(registro);
        assertNotNull(respostaRegistro);
        assertNotNull(respostaRegistro.getUsuarioId());
        assertNotNull(respostaRegistro.getMedicoId());
        assertEquals("medico", respostaRegistro.getPerfil());
        assertEquals(email, respostaRegistro.getEmail());
        assertEquals(fotoTeste, respostaRegistro.getFotoUrl());

        // Agora realiza o login com o médico gravado no banco
        LoginRequestDTO login = LoginRequestDTO.builder()
                .email(email)
                .senha(senha)
                .build();

        LoginResponseDTO respostaLogin = authService.autenticar(login);
        assertNotNull(respostaLogin);
        assertEquals(respostaRegistro.getUsuarioId(), respostaLogin.getUsuarioId());
        assertEquals(respostaRegistro.getMedicoId(), respostaLogin.getMedicoId());
        assertEquals("medico", respostaLogin.getPerfil());
        assertEquals("Cardiologia", respostaLogin.getEspecialidade());
        assertEquals(fotoTeste, respostaLogin.getFotoUrl());

        // Teste de atualização e recuperação de foto direto no banco
        String novaFoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        usuarioService.atualizarFotoBase64(respostaLogin.getUsuarioId(), novaFoto);

        byte[] bytesFoto = usuarioService.obterBytesFoto(respostaLogin.getUsuarioId());
        assertTrue(bytesFoto.length > 0, "A foto armazenada no banco deve retornar bytes válidos");
    }
}
