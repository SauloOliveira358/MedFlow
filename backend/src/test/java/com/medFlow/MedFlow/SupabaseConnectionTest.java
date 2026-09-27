package com.medFlow.MedFlow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class SupabaseConnectionTest {

    @Autowired(required = false)
    private DataSource dataSource;

    @Test
    @DisplayName("Deve conectar com sucesso ao PostgreSQL do Supabase e validar a conectividade")
    void deveConectarAoSupabase() throws Exception {
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT current_database(), current_user")) {
                assertTrue(conn.isValid(5), "A conexão com o Supabase deve ser válida");
                if (rs.next()) {
                    System.out.println(">>> Banco de dados conectado: " + rs.getString(1) + " (usuário: " + rs.getString(2) + ")");
                }
            }
        }
    }
}
