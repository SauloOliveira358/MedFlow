package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.dto.ConsultaResponseDTO;
import com.medFlow.MedFlow.dto.AgendamentoRequestDTO;
import jakarta.validation.Valid;
import com.medFlow.MedFlow.service.ConsultaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
@RequiredArgsConstructor
public class ConsultaController {

    private final ConsultaService consultaService;

    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<List<ConsultaResponseDTO>> listarPorPaciente(@PathVariable Long pacienteId) {
        return ResponseEntity.ok(consultaService.listarPorPaciente(pacienteId));
    }

    @GetMapping("/medico/{medicoId}")
    public ResponseEntity<List<ConsultaResponseDTO>> listarPorMedico(@PathVariable Long medicoId) {
        return ResponseEntity.ok(consultaService.listarPorMedico(medicoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsultaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(consultaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ConsultaResponseDTO> agendar(@Valid @RequestBody AgendamentoRequestDTO consulta) {
        return ResponseEntity.status(HttpStatus.CREATED).body(consultaService.agendar(consulta));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ConsultaResponseDTO> cancelar(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload
    ) {
        String motivo = (payload != null && payload.containsKey("motivo")) ? payload.get("motivo") : "Cancelado pelo usuário";
        return ResponseEntity.ok(consultaService.cancelar(id, motivo));
    }
}
