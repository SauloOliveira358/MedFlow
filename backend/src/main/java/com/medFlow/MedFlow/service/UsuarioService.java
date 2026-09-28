package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.exception.RecursoNaoEncontradoException;
import com.medFlow.MedFlow.model.Medico;
import com.medFlow.MedFlow.model.Paciente;
import com.medFlow.MedFlow.model.Usuario;
import com.medFlow.MedFlow.repository.MedicoRepository;
import com.medFlow.MedFlow.repository.PacienteRepository;
import com.medFlow.MedFlow.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final MedicoRepository medicoRepository;
    private final PacienteRepository pacienteRepository;

    @Transactional(readOnly = true)
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmailIgnoreCase(email);
    }

    @Transactional
    public String atualizarFotoBase64(Long usuarioId, String fotoBase64) {
        Usuario usuario = buscarPorId(usuarioId);
        usuario.setFotoUrl(fotoBase64);
        usuarioRepository.save(usuario);

        // Atualiza também na tabela Medico se for perfil médico
        medicoRepository.findByUsuarioId(usuarioId).ifPresent(m -> {
            m.setFotoUrl(fotoBase64);
            medicoRepository.save(m);
        });

        // Atualiza também na tabela Paciente se for perfil paciente
        pacienteRepository.findByUsuarioId(usuarioId).ifPresent(p -> {
            p.setFotoUrl(fotoBase64);
            pacienteRepository.save(p);
        });

        return fotoBase64;
    }

    @Transactional
    public String atualizarFotoArquivo(Long usuarioId, MultipartFile arquivo) throws IOException {
        if (arquivo.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de imagem não pode ser vazio.");
        }
        String contentType = arquivo.getContentType() != null ? arquivo.getContentType() : "image/jpeg";
        String base64Data = Base64.getEncoder().encodeToString(arquivo.getBytes());
        String dataUrl = "data:" + contentType + ";base64," + base64Data;

        return atualizarFotoBase64(usuarioId, dataUrl);
    }

    @Transactional(readOnly = true)
    public byte[] obterBytesFoto(Long usuarioId) {
        Usuario usuario = buscarPorId(usuarioId);
        String fotoUrl = usuario.getFotoUrl();
        if (fotoUrl == null || fotoUrl.isBlank()) {
            return new byte[0];
        }
        if (fotoUrl.startsWith("data:") && fotoUrl.contains(",")) {
            String base64Part = fotoUrl.substring(fotoUrl.indexOf(",") + 1);
            return Base64.getDecoder().decode(base64Part);
        }
        return Base64.getDecoder().decode(fotoUrl);
    }
}
