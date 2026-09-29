package com.medFlow.MedFlow.controller;
import com.medFlow.MedFlow.dto.*;
import com.medFlow.MedFlow.service.AgendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/medicos/{medicoId}/agenda")
@RequiredArgsConstructor
public class AgendaController {
    private final AgendaService service;
    @GetMapping
    public AgendaResponseDTO buscar(@PathVariable Long medicoId, @RequestParam LocalDate data) {
        return service.buscar(medicoId, data);
    }
    @PutMapping("/{data}")
    public AgendaResponseDTO salvar(@PathVariable Long medicoId, @PathVariable LocalDate data,
                                   @Valid @RequestBody AgendaRequestDTO request) {
        return service.salvar(medicoId, data, request);
    }
}
