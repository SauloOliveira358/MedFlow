package com.medFlow.MedFlow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "clinicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "razao_social", length = 150)
    private String razaoSocial;

    @Column(unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false, length = 30)
    private String telefone;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 255)
    private String endereco;

    @Column(nullable = false)
    @Builder.Default
    private Double latitude = -19.922700;

    @Column(nullable = false)
    @Builder.Default
    private Double longitude = -43.945100;

    @Column(name = "foto_logo_url", columnDefinition = "TEXT")
    private String fotoLogoUrl;

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
