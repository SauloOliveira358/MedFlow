package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.model.Clinica;
import com.medFlow.MedFlow.service.ClinicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clinicas")
@RequiredArgsConstructor
public class ClinicaController {

    private final ClinicaService clinicaService;

    @GetMapping
    public ResponseEntity<List<Clinica>> listarTodas() {
        return ResponseEntity.ok(clinicaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Clinica> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(clinicaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Clinica> criar(@RequestBody Clinica clinica) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clinicaService.salvar(clinica));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        clinicaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
