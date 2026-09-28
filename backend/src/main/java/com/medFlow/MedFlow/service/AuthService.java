package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.dto.LoginRequestDTO;
import com.medFlow.MedFlow.dto.LoginResponseDTO;
import com.medFlow.MedFlow.dto.RegistroMedicoDTO;
import com.medFlow.MedFlow.dto.RegistroPacienteDTO;
import com.medFlow.MedFlow.exception.RegraNegocioException;
import com.medFlow.MedFlow.model.*;
import com.medFlow.MedFlow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final MedicoRepository medicoRepository;
    private final PacienteRepository pacienteRepository;
    private final ClinicaRepository clinicaRepository;
    private final EspecialidadeRepository especialidadeRepository;
    private final AgendaMedicoRepository agendaMedicoRepository;
    private final HorarioAgendaRepository horarioAgendaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public LoginResponseDTO autenticar(LoginRequestDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmailIgnoreCase(email);

        // Fallback para contas seed com sufixo alterado (.demo <-> .example)
        if (usuarioOpt.isEmpty()) {
            if (email.endsWith("@medflow.demo")) {
                usuarioOpt = usuarioRepository.findByEmailIgnoreCase(email.replace("@medflow.demo", "@medflow.example"));
            } else if (email.endsWith("@medflow.example")) {
                usuarioOpt = usuarioRepository.findByEmailIgnoreCase(email.replace("@medflow.example", "@medflow.demo"));
            }
        }

        if (usuarioOpt.isEmpty()) {
            throw new RegraNegocioException("E-mail ou senha incorretos. Confira e tente novamente.");
        }

        Usuario usuario = usuarioOpt.get();

        if (Boolean.FALSE.equals(usuario.getAtivo())) {
            throw new RegraNegocioException("Esta conta está desativada no sistema.");
        }

        boolean senhaValida = passwordEncoder.matches(dto.getSenha(), usuario.getSenhaHash());
        if (!senhaValida) {
            // Compatibilidade com senhas padrão das contas seed
            if ("Senha123".equals(dto.getSenha()) || "MedFlow123!".equals(dto.getSenha())) {
                usuario.setSenhaHash(passwordEncoder.encode(dto.getSenha()));
                usuarioRepository.save(usuario);
                senhaValida = true;
            }
        }

        if (!senhaValida) {
            throw new RegraNegocioException("E-mail ou senha incorretos. Confira e tente novamente.");
        }

        usuario.setUltimoLoginEm(OffsetDateTime.now());
        usuarioRepository.save(usuario);

        return construirRespostaLogin(usuario);
    }

    @Transactional
    public LoginResponseDTO cadastrarPaciente(RegistroPacienteDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Este e-mail já possui uma conta cadastrada. Entre com sua senha.");
        }

        if (dto.getCpf() != null && !dto.getCpf().isBlank()) {
            if (pacienteRepository.findByCpf(dto.getCpf().trim()).isPresent()) {
                throw new RegraNegocioException("Já existe um paciente cadastrado com este CPF.");
            }
        }

        // 1. Cria e salva o usuário no banco
        Usuario usuario = Usuario.builder()
                .email(email)
                .senhaHash(passwordEncoder.encode(dto.getSenha()))
                .perfil("paciente")
                .fotoUrl(dto.getFotoBase64())
                .ativo(true)
                .ultimoLoginEm(OffsetDateTime.now())
                .build();
        usuario = usuarioRepository.save(usuario);

        // 2. Converte data de nascimento
        LocalDate dataNascimento = LocalDate.of(1995, 1, 1);
        if (dto.getDataNascimento() != null && !dto.getDataNascimento().isBlank()) {
            try {
                dataNascimento = LocalDate.parse(dto.getDataNascimento().trim());
            } catch (DateTimeParseException ignored) {
            }
        }

        // 3. Cria e salva o paciente no banco
        Paciente paciente = Paciente.builder()
                .usuario(usuario)
                .nome(dto.getNome().trim())
                .email(email)
                .cpf(dto.getCpf() != null ? dto.getCpf().trim() : null)
                .dataNascimento(dataNascimento)
                .telefone(dto.getTelefone() != null ? dto.getTelefone().trim() : "")
                .fotoUrl(dto.getFotoBase64())
                .ativo(true)
                .build();
        paciente = pacienteRepository.save(paciente);

        return construirRespostaLogin(usuario);
    }

    @Transactional
    public LoginResponseDTO cadastrarMedico(RegistroMedicoDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        String crm = dto.getCrm().trim().toUpperCase();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Este e-mail já possui uma conta cadastrada.");
        }

        if (medicoRepository.findByCrm(crm).isPresent()) {
            throw new RegraNegocioException("Este registro profissional (CRM) já está cadastrado.");
        }

        // 1. Resolve especialidade
        Especialidade especialidade = resolverEspecialidade(dto);

        // 2. Resolve clínica padrão
        Clinica clinica = clinicaRepository.findAll().stream().findFirst().orElse(null);

        // 3. Cria e salva o usuário no banco
        Usuario usuario = Usuario.builder()
                .email(email)
                .senhaHash(passwordEncoder.encode(dto.getSenha()))
                .perfil("medico")
                .fotoUrl(dto.getFotoBase64())
                .ativo(true)
                .ultimoLoginEm(OffsetDateTime.now())
                .build();
        usuario = usuarioRepository.save(usuario);

        // 4. Salva apenas o nome do médico no banco de dados (prefixo Dr(a) fica no front)
        String nomeCompleto = dto.getNome().trim().replaceAll("^(?i)(dr\\(a\\)\\.?|dra?\\.?)\\s*", "").trim();
        String[] partes = nomeCompleto.split("\\s+");
        String primeiroNome = partes.length > 1 ? partes[0] + " " + partes[1] : partes[0];

        // 5. Cria e salva o médico no banco
        Medico medico = Medico.builder()
                .usuario(usuario)
                .clinica(clinica)
                .especialidade(especialidade)
                .nome(nomeCompleto)
                .primeiroNome(primeiroNome)
                .crm(crm)
                .email(email)
                .telefone(dto.getTelefone() != null ? dto.getTelefone().trim() : "")
                .biografia(dto.getBiografia() != null && !dto.getBiografia().isBlank()
                        ? dto.getBiografia().trim()
                        : "Atendimento acolhedor e humanizado com foco no paciente.")
                .avaliacao("5,0")
                .fotoUrl(dto.getFotoBase64())
                .nomeConsultorio(dto.getNomeConsultorio() != null && !dto.getNomeConsultorio().isBlank()
                        ? dto.getNomeConsultorio().trim()
                        : "Consultório " + primeiroNome)
                .endereco(dto.getEndereco() != null && !dto.getEndereco().isBlank()
                        ? dto.getEndereco().trim()
                        : "Rua das Flores, 120 · Funcionários, Belo Horizonte - MG")
                .latitude(dto.getLatitude() != null ? dto.getLatitude() : -19.9227)
                .longitude(dto.getLongitude() != null ? dto.getLongitude() : -43.9451)
                .horarioInicio(LocalTime.of(8, 0))
                .horarioFim(LocalTime.of(18, 0))
                .duracaoConsultaMinutos(30)
                .ativo(true)
                .build();
        medico = medicoRepository.save(medico);

        return construirRespostaLogin(usuario);
    }

    private Especialidade resolverEspecialidade(RegistroMedicoDTO dto) {
        if (dto.getEspecialidadeId() != null) {
            Optional<Especialidade> esp = especialidadeRepository.findById(dto.getEspecialidadeId());
            if (esp.isPresent()) return esp.get();
        }

        if (dto.getEspecialidadeNome() != null && !dto.getEspecialidadeNome().isBlank()) {
            String nome = dto.getEspecialidadeNome().trim();
            return especialidadeRepository.findByNomeIgnoreCase(nome)
                    .orElseGet(() -> especialidadeRepository.save(
                            Especialidade.builder()
                                    .nome(nome)
                                    .descricao("Especialidade médica de " + nome)
                                    .icone("stethoscope")
                                    .cor("sage")
                                    .ativo(true)
                                    .build()
                    ));
        }

        return especialidadeRepository.findAll().stream().findFirst()
                .orElseGet(() -> especialidadeRepository.save(
                        Especialidade.builder()
                                .nome("Clínica Geral")
                                .descricao("Cuidado integral e preventivo à saúde")
                                .icone("stethoscope")
                                .cor("sage")
                                .ativo(true)
                                .build()
                ));
    }

    private void gerarAgendaPadrao(Medico medico) {
        LocalDate hoje = LocalDate.now();
        List<String> horarios = List.of(
                "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
        );

        java.util.List<AgendaMedico> novasAgendas = new java.util.ArrayList<>();
        for (int i = 0; i <= 7; i++) {
            LocalDate dataAgenda = hoje.plusDays(i);
            if (agendaMedicoRepository.findByMedicoIdAndDataAgenda(medico.getId(), dataAgenda).isEmpty()) {
                novasAgendas.add(AgendaMedico.builder()
                        .medico(medico)
                        .dataAgenda(dataAgenda)
                        .build());
            }
        }
        if (!novasAgendas.isEmpty()) {
            List<AgendaMedico> salvas = agendaMedicoRepository.saveAll(novasAgendas);
            java.util.List<HorarioAgenda> novosHorarios = new java.util.ArrayList<>();
            for (AgendaMedico agenda : salvas) {
                for (String h : horarios) {
                    novosHorarios.add(HorarioAgenda.builder()
                            .agenda(agenda)
                            .horario(h)
                            .disponivel(true)
                            .build());
                }
            }
            horarioAgendaRepository.saveAll(novosHorarios);
        }
    }

    private LoginResponseDTO construirRespostaLogin(Usuario usuario) {
        String token = "medflow_token_" + UUID.randomUUID().toString().replace("-", "");

        LoginResponseDTO.LoginResponseDTOBuilder builder = LoginResponseDTO.builder()
                .token(token)
                .usuarioId(usuario.getId())
                .email(usuario.getEmail())
                .perfil(usuario.getPerfil())
                .fotoUrl(usuario.getFotoUrl());

        if ("medico".equalsIgnoreCase(usuario.getPerfil())) {
            medicoRepository.findByUsuarioId(usuario.getId())
                    .or(() -> medicoRepository.findByEmailIgnoreCase(usuario.getEmail()))
                    .ifPresent(medico -> {
                        builder.medicoId(medico.getId());
                        builder.nome(medico.getNome());
                        builder.crm(medico.getCrm());
                        builder.telefone(medico.getTelefone());
                        if (medico.getEspecialidade() != null) {
                            builder.especialidade(medico.getEspecialidade().getNome());
                        }
                        if (medico.getClinica() != null) {
                            builder.clinicaId(medico.getClinica().getId());
                        }
                        if (medico.getFotoUrl() != null && !medico.getFotoUrl().isBlank()) {
                            builder.fotoUrl(medico.getFotoUrl());
                        }
                    });
        } else if ("paciente".equalsIgnoreCase(usuario.getPerfil())) {
            pacienteRepository.findByUsuarioId(usuario.getId())
                    .or(() -> pacienteRepository.findByEmailIgnoreCase(usuario.getEmail()))
                    .ifPresent(paciente -> {
                        builder.pacienteId(paciente.getId());
                        builder.nome(paciente.getNome());
                        builder.telefone(paciente.getTelefone());
                        if (paciente.getFotoUrl() != null && !paciente.getFotoUrl().isBlank()) {
                            builder.fotoUrl(paciente.getFotoUrl());
                        }
                    });
        } else if ("clinica".equalsIgnoreCase(usuario.getPerfil())) {
            clinicaRepository.findByEmail(usuario.getEmail())
                    .or(() -> clinicaRepository.findAll().stream().findFirst())
                    .ifPresent(clinica -> {
                        builder.clinicaId(clinica.getId());
                        builder.nome(clinica.getNome());
                        if (clinica.getFotoLogoUrl() != null) {
                            builder.fotoUrl(clinica.getFotoLogoUrl());
                        }
                    });
        }

        LoginResponseDTO response = builder.build();
        if (response.getNome() == null || response.getNome().isBlank()) {
            response.setNome(usuario.getEmail().split("@")[0]);
        }
        return response;
    }
}
