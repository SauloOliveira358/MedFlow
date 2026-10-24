package com.medFlow.MedFlow.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "servico", "MedFlow API Backend",
                "mensagem", "Backend funcionando com sucesso!",
                "frontend", "https://med-flow-4599a.web.app",
                "swagger", "/swagger-ui.html"
        ));
    }
}
