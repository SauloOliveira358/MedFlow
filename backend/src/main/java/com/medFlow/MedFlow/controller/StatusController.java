package com.medFlow.MedFlow.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/status")
public class StatusController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("sistema", "MedFlow API");
        status.put("versao", "1.0.0");
        status.put("timestamp", OffsetDateTime.now());
        status.put("status", "ONLINE");

        boolean dbOk = false;
        String dbInfo = "Não verificado";
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                dbOk = conn.isValid(2);
                dbInfo = conn.getMetaData().getDatabaseProductName() + " " + conn.getMetaData().getDatabaseProductVersion();
            } catch (Exception e) {
                dbInfo = "Erro: " + e.getMessage();
            }
        }
        status.put("bancoConectado", dbOk);
        status.put("bancoInfo", dbInfo);

        return ResponseEntity.ok(status);
    }
}
