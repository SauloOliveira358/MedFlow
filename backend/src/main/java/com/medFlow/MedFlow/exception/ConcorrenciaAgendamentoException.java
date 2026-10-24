package com.medFlow.MedFlow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exceção lançada quando ocorre conflito de concorrência ou tentativa simultânea
 * de agendamento em horário já reservado/disputado por outra operação (Módulo 3 - POO II).
 * Estende RegraNegocioException para manter compatibilidade total de contratos.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ConcorrenciaAgendamentoException extends RegraNegocioException {

    private final Long medicoId;
    private final String data;
    private final String horario;

    public ConcorrenciaAgendamentoException(String message) {
        super(message);
        this.medicoId = null;
        this.data = null;
        this.horario = null;
    }

    public ConcorrenciaAgendamentoException(Long medicoId, String data, String horario, String message) {
        super(message);
        this.medicoId = medicoId;
        this.data = data;
        this.horario = horario;
    }

    public Long getMedicoId() {
        return medicoId;
    }

    public String getData() {
        return data;
    }

    public String getHorario() {
        return horario;
    }
}
