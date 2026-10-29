import { useState, useEffect, useCallback } from 'react';
import { useDemo } from '../../context/DemoContext';
import Icone from '../../components/common/Icone';
import {
  apiGetConcorrenciaMetricas,
  apiGetConcorrenciaLogs,
  apiSimularConcorrencia,
  apiResetarConcorrencia,
} from '../../services/api';

export default function PainelConcorrencia() {
  const { data } = useDemo();
  const [metricas, setMetricas] = useState(null);
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [simulando, setSimulando] = useState(false);
  const [resultadoSimulacao, setResultadoSimulacao] = useState(null);

  // Parâmetros da simulação
  const [totalThreads, setTotalThreads] = useState(25);
  const [medicoSelecionado, setMedicoSelecionado] = useState('');
  const [dataSimulacao, setDataSimulacao] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [horarioSimulacao, setHorarioSimulacao] = useState('14:30');
  const [filtroLog, setFiltroLog] = useState('TODOS');

  const carregarDados = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        apiGetConcorrenciaMetricas().catch(() => null),
        apiGetConcorrenciaLogs().catch(() => []),
      ]);
      if (m) setMetricas(m);
      if (l) setLogs(l);
    } catch {
      // Ignora erro se backend estiver offline
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  const dispararSimulacao = async (modoProtegido) => {
    setSimulando(true);
    setResultadoSimulacao(null);
    try {
      const payload = {
        totalRequisicoes: Number(totalThreads),
        modoProtegido,
        dataConsulta: dataSimulacao,
        horarioConsulta: horarioSimulacao,
        medicoId: medicoSelecionado ? Number(medicoSelecionado.replace(/^api-d-/, '')) : undefined,
      };
      const res = await apiSimularConcorrencia(payload);
      setResultadoSimulacao(res);
      await carregarDados();
    } catch (err) {
      alert(`Erro na simulação: ${err.message}`);
    } finally {
      setSimulando(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Deseja realmente zerar todos os contadores e logs de concorrência?')) {
      try {
        await apiResetarConcorrencia();
        setResultadoSimulacao(null);
        await carregarDados();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const logsFiltrados = logs.filter((l) => {
    if (filtroLog === 'TODOS') return true;
    if (filtroLog === 'SUCESSO') return l.resultado?.includes('SUCESSO');
    if (filtroLog === 'CONFLITO') return l.resultado?.includes('REJEITADO') || l.resultado?.includes('CONFLITO');
    if (filtroLog === 'RACE_CONDITION') return l.resultado?.includes('RACE_CONDITION');
    return true;
  });

  return (
    <div className="concurrency-dashboard" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#0d9488' }}>
            MÓDULO 3 · POO II
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0', color: '#134e4a' }}>
            Painel Técnico de Concorrência & Threads
          </h1>
          <p style={{ color: '#4b5563', margin: 0 }}>
            Monitoramento de concorrência, integridade transacional, Thread Pool e observabilidade da agenda.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={carregarDados}
            className="button ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icone name="clock" size={16} />
            Atualizar
          </button>
          <button
            onClick={handleReset}
            className="button ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}
          >
            <Icone name="x" size={16} />
            Resetar Métricas
          </button>
        </div>
      </div>

      {/* Cards de Indicadores do Módulo 3 (Item 13) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-card, #e5e7eb)' }}>
          <small style={{ color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Solicitações Totais</small>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: '6px 0' }}>
            {metricas ? metricas.totalSolicitacoes : 0}
          </div>
          <span style={{ fontSize: '12px', color: '#059669' }}>Requisições concorrentes</span>
        </div>

        <div className="panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-card, #e5e7eb)' }}>
          <small style={{ color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Agendados com Sucesso</small>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669', margin: '6px 0' }}>
            {metricas ? metricas.agendamentosConcluidos : 0}
          </div>
          <span style={{ fontSize: '12px', color: '#059669' }}>100% íntegros no banco</span>
        </div>

        <div className="panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-card, #e5e7eb)' }}>
          <small style={{ color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Conflitos Bloqueados</small>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#d97706', margin: '6px 0' }}>
            {metricas ? metricas.rejeicoesConflito : 0}
          </div>
          <span style={{ fontSize: '12px', color: '#d97706' }}>Duplos agendamentos evitados</span>
        </div>

        <div className="panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-card, #e5e7eb)' }}>
          <small style={{ color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Tempo Médio</small>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#2563eb', margin: '6px 0' }}>
            {metricas ? `${metricas.tempoMedioMs}ms` : '0ms'}
          </div>
          <span style={{ fontSize: '12px', color: '#2563eb' }}>Latência média por requisição</span>
        </div>

        <div className="panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-card, #e5e7eb)' }}>
          <small style={{ color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Thread Pool Ativo</small>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#4f46e5', margin: '6px 0' }}>
            {metricas ? `${metricas.threadsAtivas} / ${metricas.tamanhoPool}` : '0 / 8'}
          </div>
          <span style={{ fontSize: '12px', color: '#4f46e5' }}>Fila: {metricas?.tarefasNaFila || 0} tarefas</span>
        </div>
      </div>

      {/* Simulador Interativo de Concorrência (Itens 3, 4 e 16 do PDF) */}
      <div
        className="panel"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--hero-gradient, linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%))',
          border: '1px solid #99f6e4',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Icone name="sparkles" size={24} />
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#115e59', margin: 0 }}>
            Simulador de Disputa Simultânea de Vagas (Banca Avaliadora)
          </h2>
        </div>
        <p style={{ color: '#134e4a', fontSize: '14px', marginBottom: '20px' }}>
          Dispara dezenas ou centenas de Threads concorrentes no mesmo milissegundo disputando a mesma vaga de agenda.
          Compare a execução com a trava de segurança implementada (Módulo 3) versus a demonstração da falha sem lock (Race Condition).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#115e59', marginBottom: '6px' }}>
              Threads Concorrentes
            </label>
            <select
              value={totalThreads}
              onChange={(e) => setTotalThreads(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card, #cbd5e1)', background: 'var(--surface-card, #fff)' }}
              disabled={simulando}
            >
              <option value={10}>10 Threads simultâneas</option>
              <option value={25}>25 Threads simultâneas</option>
              <option value={50}>50 Threads simultâneas</option>
              <option value={100}>100 Threads simultâneas (Carga Alta)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#115e59', marginBottom: '6px' }}>
              Data da Consulta
            </label>
            <input
              type="date"
              value={dataSimulacao}
              onChange={(e) => setDataSimulacao(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card, #cbd5e1)', background: 'var(--surface-card, #fff)' }}
              disabled={simulando}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#115e59', marginBottom: '6px' }}>
              Horário Disputado
            </label>
            <select
              value={horarioSimulacao}
              onChange={(e) => setHorarioSimulacao(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card, #cbd5e1)', background: 'var(--surface-card, #fff)' }}
              disabled={simulando}
            >
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:30">11:30</option>
              <option value="14:30">14:30</option>
              <option value="16:00">16:00</option>
            </select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => dispararSimulacao(true)}
            disabled={simulando}
            style={{
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: simulando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
            }}
          >
            <Icone name="shield" size={18} />
            {simulando ? 'Disparando Threads...' : 'Simular COM Proteção (Módulo 3)'}
          </button>

          <button
            onClick={() => dispararSimulacao(false)}
            disabled={simulando}
            style={{
              background: 'var(--surface-card, #fff)',
              color: '#dc2626',
              border: '2px solid #ef4444',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: simulando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Icone name="alert" size={18} />
            {simulando ? 'Processando...' : 'Demonstrar Race Condition (Sem Lock)'}
          </button>
        </div>

        {/* Card de Resultado da Simulação */}
        {resultadoSimulacao && (
          <div
            style={{
              marginTop: '24px',
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--surface-card, #fff)',
              border: `2px solid ${resultadoSimulacao.inconsistenciasDetectadas > 0 ? '#ef4444' : '#059669'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontWeight: '800',
                  color: resultadoSimulacao.inconsistenciasDetectadas > 0 ? '#dc2626' : '#059669',
                  textTransform: 'uppercase',
                  fontSize: '13px',
                }}
              >
                {resultadoSimulacao.modo === 'PROTEGIDO_COM_LOCK'
                  ? '✅ Execução com Proteção de Concorrência Ativa'
                  : '⚠️ Demonstração de Falha de Concorrência (Race Condition)'}
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Tempo total: <b>{resultadoSimulacao.tempoTotalMs}ms</b> (Média: {resultadoSimulacao.tempoMedioMs}ms/req)
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ background: 'var(--surface-subtle, #f9fafb)', padding: '12px', borderRadius: '8px' }}>
                <small style={{ color: '#6b7280' }}>Solicitadas</small>
                <div style={{ fontSize: '22px', fontWeight: '700' }}>{resultadoSimulacao.operacoesSolicitadas}</div>
              </div>
              <div style={{ background: 'var(--badge-bg, #ecfdf5)', padding: '12px', borderRadius: '8px' }}>
                <small style={{ color: '#047857' }}>Autorizadas</small>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#047857' }}>
                  {resultadoSimulacao.operacoesConcluidas}
                </div>
              </div>
              <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px' }}>
                <small style={{ color: '#b45309' }}>Rejeitadas por Conflito</small>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#b45309' }}>
                  {resultadoSimulacao.operacoesRejeitadas}
                </div>
              </div>
              <div
                style={{
                  background: resultadoSimulacao.inconsistenciasDetectadas > 0 ? '#fef2f2' : '#f0fdf4',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <small style={{ color: resultadoSimulacao.inconsistenciasDetectadas > 0 ? '#b91c1c' : '#15803d' }}>
                  Duplicidades / Falhas
                </small>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: resultadoSimulacao.inconsistenciasDetectadas > 0 ? '#dc2626' : '#15803d',
                  }}
                >
                  {resultadoSimulacao.inconsistenciasDetectadas}
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
              <b>Diagnóstico:</b> {resultadoSimulacao.explicacaoTecnica}
            </p>
          </div>
        )}
      </div>

      {/* Terminal de Logs de Observabilidade ao Vivo (Item 12 do PDF) */}
      <div className="panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-card, #e5e7eb)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
              Console de Logs e Observabilidade (Item 12 do Módulo 3)
            </h3>
            <small style={{ color: '#6b7280' }}>
              Identificação: [Horário] [Thread] [Operação] [Médico] [Slot] [Paciente] [Resultado]
            </small>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['TODOS', 'SUCESSO', 'CONFLITO', 'RACE_CONDITION'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroLog(tipo)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  border: filtroLog === tipo ? '2px solid #0d9488' : '1px solid #d1d5db',
                  background: filtroLog === tipo ? '#f0fdfa' : '#fff',
                  color: filtroLog === tipo ? '#0f766e' : '#4b5563',
                  cursor: 'pointer',
                }}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#111827',
            color: '#e5e7eb',
            padding: '16px',
            borderRadius: '10px',
            fontFamily: 'Consolas, monospace',
            fontSize: '12px',
            maxHeight: '340px',
            overflowY: 'auto',
          }}
        >
          {logsFiltrados.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
              Nenhum log registrado ainda. Execute uma simulação acima ou realize um agendamento na plataforma.
            </div>
          ) : (
            logsFiltrados.map((item) => {
              const isSucesso = item.resultado?.includes('SUCESSO');
              const isRace = item.resultado?.includes('RACE_CONDITION');
              const cor = isRace ? '#f87171' : isSucesso ? '#4ade80' : '#fbbf24';

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '6px 0',
                    borderBottom: '1px solid #1f2937',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: '#9ca3af' }}>[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ color: '#38bdf8' }}>[{item.threadNome}]</span>
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>[{item.operacao}]</span>
                  <span style={{ color: '#cbd5e1' }}>Dr(a). {item.medicoNome}</span>
                  <span style={{ color: '#a78bfa' }}>{item.dataConsulta} {item.horarioConsulta}</span>
                  <span style={{ color: '#cbd5e1' }}>Pac: {item.pacienteNome}</span>
                  <span style={{ color: cor, fontWeight: '700' }}>[{item.resultado}]</span>
                  <span style={{ color: '#9ca3af' }}>({item.duracaoMs}ms)</span>
                  {item.detalhes && <span style={{ color: '#94a3b8' }}>- {item.detalhes}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
