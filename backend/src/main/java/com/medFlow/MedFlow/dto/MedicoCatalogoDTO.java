package com.medFlow.MedFlow.dto;
import com.medFlow.MedFlow.model.Medico;
public record MedicoCatalogoDTO(String id, String name, String firstName, String specialtyId,
    String registration, String email, String phone, String photo, String clinic, String address,
    Double lat, Double lng, String start, String end, String rating, String bio) {
    public static MedicoCatalogoDTO from(Medico m) {
        return new MedicoCatalogoDTO("api-d-" + m.getId(), m.getNome(), m.getPrimeiroNome(),
            m.getEspecialidade() == null ? "" : m.getEspecialidade().getId().toString(),
            m.getCrm(), m.getEmail(), m.getTelefone(), m.getFotoUrl(),
            m.getClinica() == null ? m.getNomeConsultorio() : m.getClinica().getNome(),
            m.getEndereco(), m.getLatitude(), m.getLongitude(), m.getHorarioInicio().toString(),
            m.getHorarioFim().toString(), m.getAvaliacao(), m.getBiografia());
    }
}
