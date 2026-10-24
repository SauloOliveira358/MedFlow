package com.medFlow.MedFlow.concorrencia;

import com.medFlow.MedFlow.model.Consulta;
import com.medFlow.MedFlow.model.EventoAuditoria;
import com.medFlow.MedFlow.model.Notificacao;
import com.medFlow.MedFlow.repository.EventoAuditoriaRepository;
import com.medFlow.MedFlow.repository.NotificacaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Segunda Aplicação Assíncrona (Item 9 do Módulo 3 - POO II).
 *
 * Desacopla o processamento crítico síncrono (validação atômica e reserva da vaga)
 * de tarefas secundárias que não devem travar a requisição do usuário:
 * 1. Emissão de Comprovante de Agendamento digital com protocolo seguro.
 * 2. Envio e persistência de Notificações para Paciente e Médico.
 * 3. Gravação de Eventos de Auditoria e Telemetria em segundo plano.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessamentoAssincronoService {

    private final NotificacaoRepository notificacaoRepository;
    private final EventoAuditoriaRepository eventoAuditoriaRepository;

    @Async(ThreadPoolConfig.ASYNC_TASK_EXECUTOR)
    public CompletableFuture<String> processarPosAgendamentoAssincrono(Consulta consulta) {
        long inicio = System.currentTimeMillis();
        String threadNome = Thread.currentThread().getName();

        log.info("[ASSÍNCRONO] [{}] Iniciando processamento secundário da consulta #{} (Paciente: {}, Médico: {})...",
                threadNome, consulta.getId(),
                consulta.getPaciente() != null ? consulta.getPaciente().getNome() : "N/A",
                consulta.getMedico() != null ? consulta.getMedico().getNome() : "N/A");

        try {
            // 1. Gerar Protocolo do Comprovante Digital
            String protocoloComprovante = "COMP-" + consulta.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            // 2. Notificação para o Paciente
            if (consulta.getPaciente() != null) {
                Notificacao notifPaciente = Notificacao.builder()
                        .paciente(consulta.getPaciente())
                        .usuario(consulta.getPaciente().getUsuario())
                        .titulo("Agendamento Confirmado")
                        .mensagem(String.format("Olá, %s! Sua consulta com Dr(a). %s foi confirmada para o dia %s às %s. Protocolo: %s",
                                consulta.getPaciente().getNome(),
                                consulta.getMedico() != null ? consulta.getMedico().getNome() : "",
                                consulta.getDataConsulta(),
                                consulta.getHorarioConsulta(),
                                protocoloComprovante))
                        .lida(false)
                        .build();
                notificacaoRepository.save(notifPaciente);
            }

            // 3. Notificação para o Médico
            if (consulta.getMedico() != null) {
                Notificacao notifMedico = Notificacao.builder()
                        .medico(consulta.getMedico())
                        .usuario(consulta.getMedico().getUsuario())
                        .titulo("Novo Paciente Agendado")
                        .mensagem(String.format("Dr(a). %s, um novo agendamento foi confirmado com %s em %s às %s.",
                                consulta.getMedico().getNome(),
                                consulta.getPaciente() != null ? consulta.getPaciente().getNome() : "Paciente",
                                consulta.getDataConsulta(),
                                consulta.getHorarioConsulta()))
                        .lida(false)
                        .build();
                notificacaoRepository.save(notifMedico);
            }

            // 4. Registro de Auditoria Assíncrono
            try {
                EventoAuditoria auditoria = EventoAuditoria.builder()
                        .usuario(consulta.getPaciente() != null ? consulta.getPaciente().getUsuario() : null)
                        .acao("AGENDAMENTO_CONCLUIDO_ASSINCRONO")
                        .tipoRecurso("Consulta")
                        .recursoId(consulta.getId())
                        .ipOrigem("127.0.0.1")
                        .userAgent("MedFlow-Worker-Async")
                        .detalhes(String.format("{\"protocolo\": \"%s\", \"duracaoMs\": %d}",
                                protocoloComprovante, (System.currentTimeMillis() - inicio)))
                        .build();
                eventoAuditoriaRepository.save(auditoria);
            } catch (Exception ex) {
                log.warn("[ASSÍNCRONO] Detalhe de auditoria ignorado (não crítico): {}", ex.getMessage());
            }

            long duracao = System.currentTimeMillis() - inicio;
            log.info("[ASSÍNCRONO] [{}] Sucesso: Comprovante ({}) e Notificações gerados em {}ms para consulta #{}.",
                    threadNome, protocoloComprovante, duracao, consulta.getId());

            return CompletableFuture.completedFuture(protocoloComprovante);

        } catch (Exception e) {
            log.error("[ASSÍNCRONO] [{}] Falha na execução assíncrona da consulta #{}: {}",
                    threadNome, consulta.getId(), e.getMessage(), e);
            return CompletableFuture.completedFuture("ERRO_ASSINCRONO");
        }
    }
}
