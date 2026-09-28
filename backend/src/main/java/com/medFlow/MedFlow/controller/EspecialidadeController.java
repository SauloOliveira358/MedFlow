package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.model.Especialidade;
import com.medFlow.MedFlow.service.EspecialidadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/especialidades")
@RequiredArgsConstructor
public class EspecialidadeController {

    private final EspecialidadeService especialidadeService;

    @GetMapping
    public ResponseEntity<List<Especialidade>> listar() {
        return ResponseEntity.ok(especialidadeService.listarTodas());
    }
}
