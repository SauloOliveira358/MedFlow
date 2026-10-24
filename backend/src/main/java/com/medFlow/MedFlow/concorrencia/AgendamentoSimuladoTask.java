package com.medFlow.MedFlow.concorrencia;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;

/**
 * Tarefa de Agendamento Concorrente implementando Runnable (Item 7 do Módulo 3 - POO II).
 *
 * Demonstração prática do uso de Runnable e Thread:
 * - Runnable: Define a tarefa / algoritmo de trabalho a ser executado concorrentemente.
 * - Thread: Representa a linha de execução da JVM/SO que recebe o Runnable e executa seu run().
 * - start(): Solicita ao sistema operacional a alocação de recursos e inicia a nova Thread,
 *   enquanto run() simplesmente executa o código na thread atual de quem o chamou.
 */
@Slf4j
@Getter
public class AgendamentoSimuladoTask implements Runnable {

    private final int idTarefa;
    private final Long medicoId;
    private final String medicoNome;
    private final LocalDate dataConsulta;
    private final String horarioConsulta;
    private final String pacienteNome;
    private final boolean modoProtegido;
    private final CountDownLatch disparoSimultaneoLatch;
    private final CountDownLatch conclusaoLatch;
    private final ExecutavelAgendamento executavel;

    private String threadExecutora;
    private long inicioMs;
    private long fimMs;
    private long duracaoMs;
    private boolean sucesso;
    private boolean conflitoDetectado;
    private String mensagemResultado;

    @FunctionalInterface
    public interface ExecutavelAgendamento {
        ResultadoAgendamento executar(int idTarefa, Long medicoId, LocalDate data, String horario, String pacienteNome, boolean protegido) throws Exception;
    }

    public record ResultadoAgendamento(boolean sucesso, boolean conflito, String mensagem) {}

    public AgendamentoSimuladoTask(
            int idTarefa,
            Long medicoId,
            String medicoNome,
            LocalDate dataConsulta,
            String horarioConsulta,
            String pacienteNome,
            boolean modoProtegido,
            CountDownLatch disparoSimultaneoLatch,
            CountDownLatch conclusaoLatch,
            ExecutavelAgendamento executavel) {
        this.idTarefa = idTarefa;
        this.medicoId = medicoId;
        this.medicoNome = medicoNome;
        this.dataConsulta = dataConsulta;
        this.horarioConsulta = horarioConsulta;
        this.pacienteNome = pacienteNome;
        this.modoProtegido = modoProtegido;
        this.disparoSimultaneoLatch = disparoSimultaneoLatch;
        this.conclusaoLatch = conclusaoLatch;
        this.executavel = executavel;
    }

    @Override
    public void run() {
        this.threadExecutora = Thread.currentThread().getName();
        try {
            // Aguarda o latch de sincronização para que TODAS as threads disparem juntas no mesmo milissegundo exato
            if (disparoSimultaneoLatch != null) {
                disparoSimultaneoLatch.await();
            }

            this.inicioMs = System.currentTimeMillis();
            ResultadoAgendamento res = executavel.executar(idTarefa, medicoId, dataConsulta, horarioConsulta, pacienteNome, modoProtegido);
            this.fimMs = System.currentTimeMillis();
            this.duracaoMs = fimMs - inicioMs;
            this.sucesso = res.sucesso();
            this.conflitoDetectado = res.conflito();
            this.mensagemResultado = res.mensagem();

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            this.sucesso = false;
            this.mensagemResultado = "Tarefa interrompida";
        } catch (Exception e) {
            this.fimMs = System.currentTimeMillis();
            this.duracaoMs = fimMs - inicioMs;
            this.sucesso = false;
            this.conflitoDetectado = true;
            this.mensagemResultado = e.getMessage();
        } finally {
            if (conclusaoLatch != null) {
                conclusaoLatch.countDown();
            }
        }
    }
}
