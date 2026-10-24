package com.medFlow.MedFlow.concorrencia;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Gerenciador de Locks de Concorrência na Camada de Aplicação (Módulo 3 - POO II).
 *
 * Implementa granularidade a nível de vaga/horário de cada médico (medicoId:data:horario),
 * assegurando que duas threads concorrentes na mesma instância de JVM não executem
 * o bloco de validação e escrita simultaneamente.
 */
@Component
public class AgendamentoLockManager {

    private final ConcurrentHashMap<String, LockHolder> locks = new ConcurrentHashMap<>();

    private static class LockHolder {
        final ReentrantLock lock = new ReentrantLock(true); // fairness = true para garantir ordem de chegada
        int refCount = 0;
    }

    public String gerarChave(Long medicoId, LocalDate data, String horario) {
        return "medico:" + medicoId + ":data:" + data + ":hora:" + horario;
    }

    /**
     * Adquire a trava reentrante para o recurso específico.
     */
    public void adquirir(String chave) {
        LockHolder holder;
        synchronized (locks) {
            holder = locks.computeIfAbsent(chave, k -> new LockHolder());
            holder.refCount++;
        }
        holder.lock.lock();
    }

    /**
     * Libera a trava e remove do mapa se não houver mais threads aguardando.
     */
    public void liberar(String chave) {
        LockHolder holder;
        synchronized (locks) {
            holder = locks.get(chave);
            if (holder == null) return;
            holder.refCount--;
            if (holder.refCount <= 0) {
                locks.remove(chave);
            }
        }
        if (holder.lock.isHeldByCurrentThread()) {
            holder.lock.unlock();
        }
    }
}
