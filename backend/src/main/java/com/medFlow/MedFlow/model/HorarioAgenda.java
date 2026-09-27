package com.medFlow.MedFlow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "horarios_agenda", uniqueConstraints = {
    @UniqueConstraint(name = "uq_agenda_horario", columnNames = {"agenda_id", "horario"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HorarioAgenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agenda_id", nullable = false)
    private AgendaMedico agenda;

    @Column(nullable = false, length = 5)
    private String horario;

    @Column(nullable = false)
    @Builder.Default
    private Boolean disponivel = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;
}
