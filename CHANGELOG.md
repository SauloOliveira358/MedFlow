# Changelog

## 2026-10-24 — Módulo 3: Concorrência e Processamento Simultâneo

- **Proteção contra Race Condition no Agendamento**:
  - Implementação de `AgendamentoLockManager` com travas reentrantes (`ReentrantLock`) na JVM indexadas por slot médico (`medicoId:data:horario`).
  - Bloqueio pessimista `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`) em `HorarioAgendaRepository` e `MedicoRepository`.
  - Índice único parcial físico no PostgreSQL (`idx_unico_medico_consulta_ativa`) garantindo integridade ACID como barreira final intransponível.
  - Exceção customizada `ConcorrenciaAgendamentoException` e tratamento em `GlobalExceptionHandler` retornando HTTP 409 Conflict estruturado.
- **Thread Pool e ExecutorService Gerenciado**:
  - `ThreadPoolConfig` com `medflowConcurrencyExecutor` (Core 8, Max 32, Fila 100, KeepAlive 60s, Shutdown gracioso de 30s) e política de rejeição com alertas de sobrecarga.
  - Demonstração prática do par `Thread` e `Runnable` através de `AgendamentoSimuladoTask`.
- **Segunda Aplicação Assíncrona**:
  - `ProcessamentoAssincronoService` com pool dedicado `asyncTaskExecutor` (`@Async`):
  - Emissão desacoplada de comprovante de agendamento digital com protocolo criptográfico único.
  - Notificações assíncronas persistidas no banco para médico e paciente.
  - Trilha de telemetria e auditoria em background em `eventos_auditoria`.
- **Observabilidade e Logs Estruturados**:
  - `ConcorrenciaMonitorService` com contadores atômicos e histórico circular em memória (últimos 150 registros).
  - Logs padronizados: `[Horário] [Thread] [Operação] [Médico] [Slot] [Paciente] [Duração] -> [Resultado]`.
- **Dashboard e Painel Técnico Integrado**:
  - Criação da página `PainelConcorrencia.jsx` acessível em `/concorrencia` e no menu da clínica `/clinica/concorrencia`.
  - Métricas em tempo real (solicitações, autorizados, conflitos evitados, latência média, status do pool).
  - Simulador interativo permitindo demonstrar a falha de Race Condition (Sem Lock) vs a solução íntegra (Com Proteção) para bancas avaliadoras.
- **Documentação do Módulo 3**:
  - Criação do documento `docs/MODULO_3.md` com análise de TOCTOU, Diagrama de Sequência UML, Diagrama de Arquitetura e tabela comparativa antes x depois.

## 2026-09-27 — Login e cadastro por perfil

- Tela inicial de login e cadastro público de paciente com entrada no agendamento.
- Conta administrativa da clínica para criar acessos de médicos; sem cadastro público de profissionais.
- Rotas e operações vinculadas à conta atual, saída de sessão e remoção da troca livre de perfil.
- Contas locais persistidas, senhas de teste em hash e migração dos dados demonstrativos existentes.
- Documentação de acessos e testes de cadastro, login e permissões do frontend.

## 2026-09-27 — React e três experiências

- Substituição do Angular por React/JavaScript/JSX com Vite; remoção do TypeScript da aplicação.
- Áreas /paciente, /medico e /clinica com menus, navegação e identidades de uso próprias.
- Agendamento em etapas, confirmação, reagendamento, cancelamento e status compartilhados por Context API.
- Agenda em dia/semana/mês, filtros, perfis, notificações, pacientes, equipe e prontuários fictícios.
- Prontuário com abas, anotações, procedimentos e visualização de documentos locais.
- Relatórios com filtros e exportação; configurações da clínica refletidas nas três áreas.
- Mobile com menu inferior, drawer acessível e tabelas convertidas em cards.
- Mocks: 10 pacientes, 8 especialistas, 8 especialidades, 20 consultas e 10 prontuários.
- Testes React e navegador, varredura de 25 rotas em 6 larguras e capturas de tela.
- Documentação atualizada em docs/front; docs/back sinalizada como referência histórica sem implementação.
- Nenhuma implementação de backend, banco ou API real.

## 2026-09-26 — Frontend demonstrativo (módulos 1 e 2, escopo parcial)

- Identidade MedFlow, símbolo SVG, login, navegação e layout responsivo.
- Dashboard com indicadores calculados e atalhos.
- Cadastro e edição de pacientes, profissionais, especialidades e perfis demonstrativos.
- Agenda com filtros, disponibilidade diária e consultas de 30 minutos.
- Criação, remarcação, cancelamento confirmado e conclusão de consultas.
- Validações de vínculos, conflito de horário, expediente e dados de cadastro.
- Persistência local, histórico e mensagens de erro/sucesso.
- Testes automatizados de regras e renderização.
- Documentação separada em docs/front e docs/back; backend documentado apenas como proposta.
