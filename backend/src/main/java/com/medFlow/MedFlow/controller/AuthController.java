package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.dto.LoginRequestDTO;
import com.medFlow.MedFlow.dto.LoginResponseDTO;
import com.medFlow.MedFlow.dto.RegistroMedicoDTO;
import com.medFlow.MedFlow.dto.RegistroPacienteDTO;
import com.medFlow.MedFlow.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.autenticar(dto));
    }

    @PostMapping("/registro/paciente")
    public ResponseEntity<LoginResponseDTO> registrarPaciente(@Valid @RequestBody RegistroPacienteDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrarPaciente(dto));
    }

    @PostMapping("/registro/medico")
    public ResponseEntity<LoginResponseDTO> registrarMedico(@Valid @RequestBody RegistroMedicoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrarMedico(dto));
    }
}
