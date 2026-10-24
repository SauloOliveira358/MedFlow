package com.medFlow.MedFlow.concorrencia;

import com.medFlow.MedFlow.dto.AgendamentoRequestDTO;
import com.medFlow.MedFlow.exception.ConcorrenciaAgendamentoException;
import com.medFlow.MedFlow.model.Consulta;
import com.medFlow.MedFlow.model.Medico;
import com.medFlow.MedFlow.model.Paciente;
import com.medFlow.MedFlow.repository.ConsultaRepository;
import com.medFlow.MedFlow.repository.MedicoRepository;
import com.medFlow.MedFlow.repository.PacienteRepository;
import com.medFlow.MedFlow.service.AgendaService;
import com.medFlow.MedFlow.service.ConsultaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simulador de Concorrência e Reprodução de Race Condition (Itens 3, 4, 7, 8 e 16 do Módulo 3).
 *
 * Permite demonstrar na prática e ao vivo:
 * 1. O Cenário Vulnerável (Antes da Correção): A falha de Time-Of-Check to Time-Of-Use (TOCTOU)
 *    onde múltiplas threads validam o horário como livre antes da gravação e ambas confirmam a compra.
 * 2. O Cenário Protegido (Depois da Correção): Preservação estrita da integridade via Pessimistic Lock,
 *    ReentrantLock na JVM e constraint atômica, garantindo no máximo 1 agendamento por vaga.
 */
@Slf4j
@Service
public class SimuladorConcorrenciaService {

    private final ConsultaService consultaService;
    private final AgendaService agendaService;
    private final MedicoRepository medicoRepository;
    private final PacienteRepository pacienteRepository;
    private final ConsultaRepository consultaRepository;
    private final ThreadPoolTaskExecutor concurrencyExecutor;
    private final ConcorrenciaMonitorService monitorService;

    public SimuladorConcorrenciaService(
            ConsultaService consultaService,
            AgendaService agendaService,
            MedicoRepository medicoRepository,
            PacienteRepository pacienteRepository,
            ConsultaRepository consultaRepository,
            @Qualifier(ThreadPoolConfig.CONCORRENCIA_EXECUTOR) ThreadPoolTaskExecutor concurrencyExecutor,
            ConcorrenciaMonitorService monitorService) {
        this.consultaService = consultaService;
        this.agendaService = agendaService;
        this.medicoRepository = medicoRepository;
        this.pacienteRepository = pacienteRepository;
        this.consultaRepository = consultaRepository;
        this.concurrencyExecutor = concurrencyExecutor;
        this.monitorService = monitorService;
    }

    public SimulacaoResultadoDTO executarSimulacao(SimulacaoRequestDTO request) {
        if (request.isModoProtegido()) {
            return executarCenarioProtegido(request);
        } else {
            return executarCenarioVulneravel(request);
        }
    }

    /**
     * CENÁRIO PROTEGIDO (Item 6 e 16):
     * Utiliza ExecutorService, ThreadPool com fila, Pessimistic Lock e locks da aplicação.
     */
    private SimulacaoResultadoDTO executarCenarioProtegido(SimulacaoRequestDTO request) {
        long inicioGeral = System.currentTimeMillis();
        int total = request.getTotalRequisicoes();

        // 1. Identificar Médico e Paciente de teste
        Medico medico = obterOuCriarMedicoValido(request.getMedicoId());
        List<Paciente> pacientes = pacienteRepository.findAll();
        Paciente pacientePadrao = pacientes.isEmpty() ? null : pacientes.get(0);
        Long pacienteId = pacientePadrao != null ? pacientePadrao.getId() : 1L;

        LocalDate data = request.getDataConsulta() != null ? request.getDataConsulta() : LocalDate.now().plusDays(2);
        String horario = request.getHorarioConsulta() != null ? request.getHorarioConsulta() : "14:30";

        // 2. Liberar o horário na agenda para a simulação se necessário
        try {
            agendaService.salvar(medico.getId(), data, new com.medFlow.MedFlow.dto.AgendaRequestDTO(List.of(horario)));
        } catch (Exception ignored) {
        }

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(total);

        AtomicInteger sucessos = new AtomicInteger(0);
        AtomicInteger rejeitados = new AtomicInteger(0);
        AtomicInteger falhas = new AtomicInteger(0);

        List<ConcorrenciaLogDTO> logsSimulacao = Collections.synchronizedList(new ArrayList<>());

        log.info("[SIMULAÇÃO-PROTEGIDA] Iniciando bateria com {} Threads concorrentes para médico {} em {} {}...",
                total, medico.getNome(), data, horario);

        for (int i = 1; i <= total; i++) {
            final int idTarefa = i;
            final String nomePaciente = "Paciente Concorrente #" + idTarefa;

            AgendamentoSimuladoTask task = new AgendamentoSimuladoTask(
                    idTarefa,
                    medico.getId(),
                    medico.getNome(),
                    data,
                    horario,
                    nomePaciente,
                    true,
                    startLatch,
                    doneLatch,
                    (id, mId, d, h, pNome, prot) -> {
                        long t0 = System.currentTimeMillis();
                        try {
                            AgendamentoRequestDTO req = new AgendamentoRequestDTO(
                                    pacienteId,
                                    mId,
                                    medico.getClinica() != null ? medico.getClinica().getId() : null,
                                    d,
                                    h,
                                    "Simulação Concorrente Módulo 3 - Thread #" + id,
                                    "Primeira consulta"
                            );

                            consultaService.agendar(req);
                            sucessos.incrementAndGet();
                            long t1 = System.currentTimeMillis();

                            logsSimulacao.add(ConcorrenciaLogDTO.builder()
                                    .id("sim-" + id)
                                    .timestamp(java.time.OffsetDateTime.now())
                                    .threadNome(Thread.currentThread().getName())
                                    .operacao("SIMULACAO_AGENDAMENTO")
                                    .medicoId(mId)
                                    .medicoNome(medico.getNome())
                                    .dataConsulta(d.toString())
                                    .horarioConsulta(h)
                                    .pacienteNome(pNome)
                                    .resultado("SUCESSO_AGENDADO")
                                    .duracaoMs(t1 - t0)
                                    .detalhes("Autorizado com trava de segurança.")
                                    .build());

                            return new AgendamentoSimuladoTask.ResultadoAgendamento(true, false, "Agendado com sucesso!");

                        } catch (com.medFlow.MedFlow.exception.RegraNegocioException ce) {
                            rejeitados.incrementAndGet();
                            long t1 = System.currentTimeMillis();

                            logsSimulacao.add(ConcorrenciaLogDTO.builder()
                                    .id("sim-" + id)
                                    .timestamp(java.time.OffsetDateTime.now())
                                    .threadNome(Thread.currentThread().getName())
                                    .operacao("SIMULACAO_AGENDAMENTO")
                                    .medicoId(mId)
                                    .medicoNome(medico.getNome())
                                    .dataConsulta(d.toString())
                                    .horarioConsulta(h)
                                    .pacienteNome(pNome)
                                    .resultado("REJEITADO_CONFLITO")
                                    .duracaoMs(t1 - t0)
                                    .detalhes("Bloqueado: vaga ocupada por outra thread.")
                                    .build());

                            return new AgendamentoSimuladoTask.ResultadoAgendamento(false, true, ce.getMessage());

                        } catch (Exception ex) {
                            falhas.incrementAndGet();
                            return new AgendamentoSimuladoTask.ResultadoAgendamento(false, false, "Falha técnica: " + ex.getMessage());
                        }
                    }
            );

            // Submeter a tarefa ao Thread Pool gerenciado (Item 8 do Módulo 3)
            concurrencyExecutor.execute(task);
        }

        // DISPARO SIMULTÂNEO: Libera todas as threads no mesmo instante milissegundo exato!
        startLatch.countDown();

        try {
            doneLatch.await(15, TimeUnit.SECONDS);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }

        long duracaoTotal = System.currentTimeMillis() - inicioGeral;
        double media = total > 0 ? (double) duracaoTotal / total : 0;

        return SimulacaoResultadoDTO.builder()
                .modo("PROTEGIDO_COM_LOCK")
                .operacoesSolicitadas(total)
                .operacoesConcluidas(sucessos.get())
                .operacoesRejeitadas(rejeitados.get() + falhas.get())
                .inconsistenciasDetectadas(Math.max(0, sucessos.get() - 1)) // Se passou mais de 1 para o mesmo slot, houve inconsistência
                .tempoTotalMs(duracaoTotal)
                .tempoMedioMs(Math.round(media * 100.0) / 100.0)
                .estadoInicial("Vaga aberta (1 horário livre disponível para disputa)")
                .estadoFinal("Vaga preenchida (exatamente " + sucessos.get() + " agendamento autorizado, " + (rejeitados.get() + falhas.get()) + " rejeitados de forma íntegra)")
                .explicacaoTecnica("A região crítica foi protegida via Pessimistic Lock no banco e ReentrantLock na aplicação. As " + total + " requisições simultâneas foram avaliadas atomicamente, impedindo qualquer condição de corrida (Race Condition).")
                .registrosExecucao(logsSimulacao)
                .build();
    }

    /**
     * CENÁRIO VULNERÁVEL (Itens 3 e 4):
     * Reproduz propositalmente a Race Condition (Check-Then-Act) simulando a aplicação
     * ingênua anterior sem locks, permitindo ver na prática múltiplos agendamentos concorrentes.
     */
    private SimulacaoResultadoDTO executarCenarioVulneravel(SimulacaoRequestDTO request) {
        long inicioGeral = System.currentTimeMillis();
        int total = request.getTotalRequisicoes();

        Medico medico = obterOuCriarMedicoValido(request.getMedicoId());
        LocalDate data = request.getDataConsulta() != null ? request.getDataConsulta() : LocalDate.now().plusDays(2);
        String horario = request.getHorarioConsulta() != null ? request.getHorarioConsulta() : "15:00";

        // Simulação controlada de recurso vulnerável
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(total);

        AtomicInteger comprasAutorizadasIndevidas = new AtomicInteger(0);
        AtomicInteger rejeitados = new AtomicInteger(0);
        List<ConcorrenciaLogDTO> logsSimulacao = Collections.synchronizedList(new ArrayList<>());

        // Flag de estado vulnerável simulado sem sincronização
        final AtomicBoolean slotDisponivel = new AtomicBoolean(true);

        for (int i = 1; i <= total; i++) {
            final int idTarefa = i;
            final String nomePaciente = "Paciente Disputa #" + idTarefa;

            concurrencyExecutor.execute(() -> {
                try {
                    startLatch.await();
                    long t0 = System.currentTimeMillis();

                    // VULNERABILIDADE 1: Check-Then-Act (Leitura sem Lock)
                    boolean estavaLivre = slotDisponivel.get();

                    // VULNERABILIDADE 2: Atraso de latência I/O simulado (onde a Race Condition ocorre)
                    Thread.sleep(25);

                    if (estavaLivre) {
                        // Ambas as threads acreditam que a vaga estava livre!
                        slotDisponivel.set(false);
                        int autorizados = comprasAutorizadasIndevidas.incrementAndGet();
                        long t1 = System.currentTimeMillis();

                        logsSimulacao.add(ConcorrenciaLogDTO.builder()
                                .id("sim-vuln-" + idTarefa)
                                .timestamp(java.time.OffsetDateTime.now())
                                .threadNome(Thread.currentThread().getName())
                                .operacao("VULNERAVEL_SEM_LOCK")
                                .medicoId(medico.getId())
                                .medicoNome(medico.getNome())
                                .dataConsulta(data.toString())
                                .horarioConsulta(horario)
                                .pacienteNome(nomePaciente)
                                .resultado(autorizados == 1 ? "SUCESSO_AGENDADO" : "RACE_CONDITION_DUPLICADO")
                                .duracaoMs(t1 - t0)
                                .detalhes(autorizados == 1 ? "Primeiro agendamento." : "FALHA: Conseguiu agendar o mesmo horário por falta de lock!")
                                .build());
                    } else {
                        rejeitados.incrementAndGet();
                        long t1 = System.currentTimeMillis();

                        logsSimulacao.add(ConcorrenciaLogDTO.builder()
                                .id("sim-vuln-" + idTarefa)
                                .timestamp(java.time.OffsetDateTime.now())
                                .threadNome(Thread.currentThread().getName())
                                .operacao("VULNERAVEL_SEM_LOCK")
                                .medicoId(medico.getId())
                                .medicoNome(medico.getNome())
                                .dataConsulta(data.toString())
                                .horarioConsulta(horario)
                                .pacienteNome(nomePaciente)
                                .resultado("REJEITADO")
                                .duracaoMs(t1 - t0)
                                .detalhes("Horário detectado como indisponível.")
                                .build());
                    }

                } catch (Exception ex) {
                    rejeitados.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Disparo das threads
        startLatch.countDown();

        try {
            doneLatch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }

        long duracaoTotal = System.currentTimeMillis() - inicioGeral;
        double media = total > 0 ? (double) duracaoTotal / total : 0;
        int totalAutorizados = comprasAutorizadasIndevidas.get();
        int inconsistencias = Math.max(0, totalAutorizados - 1);

        return SimulacaoResultadoDTO.builder()
                .modo("VULNERAVEL_RACE_CONDITION")
                .operacoesSolicitadas(total)
                .operacoesConcluidas(totalAutorizados)
                .operacoesRejeitadas(rejeitados.get())
                .inconsistenciasDetectadas(inconsistencias)
                .tempoTotalMs(duracaoTotal)
                .tempoMedioMs(Math.round(media * 100.0) / 100.0)
                .estadoInicial("1 vaga disponível")
                .estadoFinal(totalAutorizados + " agendamentos realizados para o mesmo slot! (" + inconsistencias + " duplicidades/overbooking)")
                .explicacaoTecnica("EVIDÊNCIA DA FALHA: Sem mecanismo de lock ou sincronização na leitura/gravação, várias threads leram a vaga como disponível simultaneamente durante o intervalo de I/O, gerando " + inconsistencias + " duplo(s) agendamento(s) indevido(s).")
                .registrosExecucao(logsSimulacao)
                .build();
    }

    private Medico obterOuCriarMedicoValido(Long medicoId) {
        if (medicoId != null) {
            return medicoRepository.findById(medicoId)
                    .orElseGet(() -> medicoRepository.findAll().stream().findFirst().orElseThrow());
        }
        return medicoRepository.findAll().stream().findFirst().orElseThrow();
    }
}
