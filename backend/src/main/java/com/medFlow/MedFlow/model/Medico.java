package com.medFlow.MedFlow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "medicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_id")
    private Clinica clinica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especialidade_id")
    private Especialidade especialidade;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "primeiro_nome", length = 60)
    private String primeiroNome;

    @Column(nullable = false, unique = true, length = 40)
    private String crm;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 30)
    private String telefone;

    @Column(columnDefinition = "TEXT")
    private String biografia;

    @Column(length = 10)
    @Builder.Default
    private String avaliacao = "5,0";

    @Column(name = "foto_url", columnDefinition = "TEXT")
    private String fotoUrl;

    @Column(name = "nome_consultorio", length = 150)
    private String nomeConsultorio;

    @Column(length = 255)
    private String endereco;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "horario_inicio", nullable = false)
    @Builder.Default
    private LocalTime horarioInicio = LocalTime.of(8, 0);

    @Column(name = "horario_fim", nullable = false)
    @Builder.Default
    private LocalTime horarioFim = LocalTime.of(18, 0);

    @Column(name = "duracao_consulta_minutos", nullable = false)
    @Builder.Default
    private Integer duracaoConsultaMinutos = 30;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;
}
