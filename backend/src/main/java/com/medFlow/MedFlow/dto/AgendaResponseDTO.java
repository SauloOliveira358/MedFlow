package com.medFlow.MedFlow.dto;
import java.time.LocalDate;
import java.util.List;
public record AgendaResponseDTO(Long medicoId, LocalDate data, List<HorarioDTO> horarios) {
    public record HorarioDTO(String horario, boolean disponivel) {}
}
