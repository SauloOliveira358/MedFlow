package com.medFlow.MedFlow.concorrencia;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Configuração de Concorrência e Thread Pool Gerenciado (Módulo 3 - POO II).
 *
 * Justificativa técnica do dimensionamento:
 * - Core Pool Size (8): Baseado na quantidade típica de núcleos de CPU disponíveis multiplicada por 2,
 *   já que as tarefas de agendamento são majoritariamente I/O Bound (banco de dados e rede).
 * - Max Pool Size (32): Teto estrito para evitar o esgotamento de conexões do pool HikariCP (10 conexões)
 *   e proteger a memória da JVM sob rajadas intensas de concorrência.
 * - Queue Capacity (100): Fila delimitada (Bounded LinkedBlockingQueue) para amortecer picos sem degradar.
 * - RejectedExecutionHandler: Política customizada com registro observável e tratamento de sobrecarga gracioso.
 * - Graceful Shutdown: Espera tarefas pendentes finalizarem com limite de até 30 segundos.
 */
@Slf4j
@Configuration
@EnableAsync
public class ThreadPoolConfig {

    public static final String CONCORRENCIA_EXECUTOR = "medflowConcurrencyExecutor";
    public static final String ASYNC_TASK_EXECUTOR = "asyncTaskExecutor";

    @Bean(name = CONCORRENCIA_EXECUTOR)
    @Primary
    public ThreadPoolTaskExecutor medflowConcurrencyExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int cpus = Math.max(2, Runtime.getRuntime().availableProcessors());
        executor.setCorePoolSize(Math.max(4, cpus * 2));
        executor.setMaxPoolSize(32);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("medflow-worker-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
                log.warn("[CONCORRÊNCIA-ALERTA] Tarefa rejeitada por sobrecarga no Thread Pool! PoolSize: {}, ActiveCount: {}, QueueSize: {}",
                        e.getPoolSize(), e.getActiveCount(), e.getQueue().size());
                throw new IllegalStateException("Servidor com alta carga no momento. Por favor, tente novamente em alguns segundos.");
            }
        });

        executor.initialize();
        return executor;
    }

    /**
     * Thread Pool dedicado para a Segunda Aplicação Assíncrona (Item 9 do Módulo 3):
     * Notificações, comprovantes de agendamento e trilha de auditoria assíncrona.
     */
    @Bean(name = ASYNC_TASK_EXECUTOR)
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(45);
        executor.setThreadNamePrefix("medflow-async-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }
}
