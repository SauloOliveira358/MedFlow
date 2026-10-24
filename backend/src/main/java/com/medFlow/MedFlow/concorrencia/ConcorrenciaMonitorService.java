package com.medFlow.MedFlow.concorrencia;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Serviço de Observabilidade, Métricas e Logs de Concorrência (Itens 12 e 13 do Módulo 3).
 *
 * Registra cada operação concorrente de forma legível e rastreável, mantendo
 * contadores atômicos de solicitações, sucessos, rejeições seguras e tempo médio.
 */
@Slf4j
@Service
public class ConcorrenciaMonitorService {

    private final ThreadPoolTaskExecutor concurrencyExecutor;

    private final AtomicLong totalSolicitacoes = new AtomicLong(0);
    private final AtomicLong agendamentosConcluidos = new AtomicLong(0);
    private final AtomicLong rejeicoesConflito = new AtomicLong(0);
    private final AtomicLong falhas = new AtomicLong(0);
    private final AtomicLong tempoTotalExecucaoMs = new AtomicLong(0);

    private static final int MAX_LOGS_HISTORICO = 150;
    private final ConcurrentLinkedDeque<ConcorrenciaLogDTO> historicoLogs = new ConcurrentLinkedDeque<>();

    public ConcorrenciaMonitorService(
            @Qualifier(ThreadPoolConfig.CONCORRENCIA_EXECUTOR) ThreadPoolTaskExecutor concurrencyExecutor) {
        this.concurrencyExecutor = concurrencyExecutor;
    }

    /**
     * Registra um evento de concorrência com o formato estrito do PDF:
     * [TIMESTAMP] [THREAD] [OPERAÇÃO] [MÉDICO] [SLOT/HORÁRIO] [PACIENTE] -> [RESULTADO]
     */
    public void registrar(String operacao, Long medicoId, String medicoNome, String dataConsulta,
                          String horarioConsulta, String pacienteNome, String resultado,
                          long duracaoMs, String detalhes) {

        String threadNome = Thread.currentThread().getName();
        OffsetDateTime agora = OffsetDateTime.now();

        // 1. Atualizar métricas atômicas
        totalSolicitacoes.incrementAndGet();
        tempoTotalExecucaoMs.addAndGet(duracaoMs);

        if ("SUCESSO_AGENDADO".equalsIgnoreCase(resultado) || "SUCESSO".equalsIgnoreCase(resultado)) {
            agendamentosConcluidos.incrementAndGet();
        } else if ("REJEITADO_CONFLITO".equalsIgnoreCase(resultado) || "CONFLITO".equalsIgnoreCase(resultado)) {
            rejeicoesConflito.incrementAndGet();
        } else {
            falhas.incrementAndGet();
        }

        // 2. Criar DTO
        ConcorrenciaLogDTO logEntry = ConcorrenciaLogDTO.builder()
                .id(UUID.randomUUID().toString())
                .timestamp(agora)
                .threadNome(threadNome)
                .operacao(operacao)
                .medicoId(medicoId)
                .medicoNome(medicoNome != null ? medicoNome : "Médico #" + medicoId)
                .dataConsulta(dataConsulta)
                .horarioConsulta(horarioConsulta)
                .pacienteNome(pacienteNome != null ? pacienteNome : "Anônimo")
                .resultado(resultado)
                .duracaoMs(duracaoMs)
                .detalhes(detalhes)
                .build();

        // 3. Adicionar no histórico circular
        historicoLogs.addFirst(logEntry);
        while (historicoLogs.size() > MAX_LOGS_HISTORICO) {
            historicoLogs.removeLast();
        }

        // 4. Log padronizado no console/arquivo (Item 12 do Módulo 3)
        log.info("[CONCORRÊNCIA] [{}] [{}] [{}] [Médico: {}] [Data/Hora: {} {}] [Paciente: {}] [Dur: {}ms] -> [{}] {}",
                agora, threadNome, operacao, medicoNome, dataConsulta, horarioConsulta, pacienteNome, duracaoMs, resultado, detalhes != null ? detalhes : "");
    }

    /**
     * Retorna a lista dos logs mais recentes.
     */
    public List<ConcorrenciaLogDTO> listarLogsRecentes() {
        return new ArrayList<>(historicoLogs);
    }

    /**
     * Retorna os indicadores para o Dashboard Técnico.
     */
    public ConcorrenciaMetricasDTO obterMetricas() {
        long total = totalSolicitacoes.get();
        double tempoMedio = total > 0 ? (double) tempoTotalExecucaoMs.get() / total : 0.0;

        int threadsAtivas = concurrencyExecutor.getActiveCount();
        int poolSize = concurrencyExecutor.getPoolSize();
        int fila = concurrencyExecutor.getThreadPoolExecutor().getQueue().size();
        long concluidas = concurrencyExecutor.getThreadPoolExecutor().getCompletedTaskCount();

        return ConcorrenciaMetricasDTO.builder()
                .totalSolicitacoes(total)
                .agendamentosConcluidos(agendamentosConcluidos.get())
                .rejeicoesConflito(rejeicoesConflito.get())
                .falhas(falhas.get())
                .tempoMedioMs(Math.round(tempoMedio * 100.0) / 100.0)
                .threadsAtivas(threadsAtivas)
                .tamanhoPool(poolSize)
                .tarefasNaFila(fila)
                .totalTarefasFinalizadas(concluidas)
                .ultimaAtualizacao(OffsetDateTime.now())
                .statusGeral(threadsAtivas > 20 ? "ALTA_CARGA" : "NORMAL")
                .build();
    }

    /**
     * Reseta as métricas e o histórico (útil antes de iniciar uma demonstração ao vivo para a banca).
     */
    public void resetar() {
        totalSolicitacoes.set(0);
        agendamentosConcluidos.set(0);
        rejeicoesConflito.set(0);
        falhas.set(0);
        tempoTotalExecucaoMs.set(0);
        historicoLogs.clear();
        log.info("[CONCORRÊNCIA] Contadores e histórico de logs foram resetados para nova demonstração.");
    }
}
