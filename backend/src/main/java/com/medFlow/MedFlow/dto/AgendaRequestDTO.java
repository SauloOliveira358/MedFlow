package com.medFlow.MedFlow.dto;
import jakarta.validation.constraints.*;
import java.util.List;
public record AgendaRequestDTO(
    @NotNull @Size(max = 1440) List<@NotBlank @Pattern(regexp = "(?:[01][0-9]|2[0-3]):[0-5][0-9]") String> horarios
) {}
