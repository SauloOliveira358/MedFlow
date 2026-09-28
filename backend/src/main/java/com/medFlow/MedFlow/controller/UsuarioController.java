package com.medFlow.MedFlow.controller;

import com.medFlow.MedFlow.dto.AtualizarFotoDTO;
import com.medFlow.MedFlow.model.Usuario;
import com.medFlow.MedFlow.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PutMapping("/{id}/foto")
    public ResponseEntity<Map<String, String>> atualizarFotoBase64(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarFotoDTO dto
    ) {
        String saved = usuarioService.atualizarFotoBase64(id, dto.getFotoBase64());
        return ResponseEntity.ok(Map.of("fotoUrl", saved, "mensagem", "Foto salva no banco de dados com sucesso"));
    }

    @PostMapping(value = "/{id}/foto/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadFotoArquivo(
            @PathVariable Long id,
            @RequestParam("arquivo") MultipartFile arquivo
    ) throws IOException {
        String saved = usuarioService.atualizarFotoArquivo(id, arquivo);
        return ResponseEntity.ok(Map.of("fotoUrl", saved, "mensagem", "Imagem armazenada diretamente no banco com sucesso"));
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> baixarFoto(@PathVariable Long id) {
        Usuario usuario = usuarioService.buscarPorId(id);
        byte[] bytes = usuarioService.obterBytesFoto(id);
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = MediaType.IMAGE_JPEG_VALUE;
        if (usuario.getFotoUrl() != null && usuario.getFotoUrl().startsWith("data:")) {
            int end = usuario.getFotoUrl().indexOf(";");
            if (end > 5) {
                contentType = usuario.getFotoUrl().substring(5, end);
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(bytes);
    }
}
