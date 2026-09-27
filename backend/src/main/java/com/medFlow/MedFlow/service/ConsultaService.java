package com.medFlow.MedFlow.service;

import com.medFlow.MedFlow.exception.RecursoNaoEncontradoException;
import com.medFlow.MedFlow.exception.RegraNegocioException;
import com.medFlow.MedFlow.model.Consulta;
import com.medFlow.MedFlow.repository.ConsultaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultaService {

    private final ConsultaRepository consultaRepository;

    @Transactional(readOnly = true)
    public List<Consulta> listarPorPaciente(Long pacienteId) {
        return consultaRepository.findByPacienteIdOrderByDataConsultaDescHorarioConsultaDesc(pacienteId);
    }

    @Transactional(readOnly = true)
    public List<Consulta> listarPorMedico(Long medicoId) {
        return consultaRepository.findByMedicoIdOrderByDataConsultaDescHorarioConsultaDesc(medicoId);
    }

    @Transactional(readOnly = true)
    public Consulta buscarPorId(Long id) {
        return consultaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Consulta não encontrada com ID: " + id));
    }

    @Transactional
    public Consulta agendar(Consulta consulta) {
        boolean conflito = consultaRepository.existsByMedicoIdAndDataConsultaAndHorarioConsultaAndStatusNot(
                consulta.getMedico().getId(),
                consulta.getDataConsulta(),
                consulta.getHorarioConsulta(),
                "Cancelado"
        );

        if (conflito) {
            throw new RegraNegocioException("O médico já possui uma consulta ativa agendada neste mesmo dia e horário.");
        }

        consulta.setStatus("Confirmado");
        return consultaRepository.save(consulta);
    }

    @Transactional
    public Consulta cancelar(Long id, String motivoCancelamento) {
        Consulta consulta = buscarPorId(id);
        if ("Cancelado".equalsIgnoreCase(consulta.getStatus())) {
            throw new RegraNegocioException("Esta consulta já se encontra cancelada.");
        }
        consulta.setStatus("Cancelado");
        consulta.setMotivoCancelamento(motivoCancelamento);
        consulta.setCanceladoEm(OffsetDateTime.now());
        return consultaRepository.save(consulta);
    }
}
