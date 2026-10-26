# MedFlow · Cuidado que conecta

Frontend React conectado ao backend Spring Boot para autenticação, regras transacionais e processamento concorrente com banco PostgreSQL / Supabase.

---

## 🚀 Módulo 3 — Concorrência e Processamento Simultâneo

O Módulo 3 implementa controle estrito de concorrência na disputa simultânea de vagas da agenda médica:
* **Proteção contra Race Condition (Double Booking)**: Preserva a integridade do recurso disputado (horário do médico) via `ReentrantLock` com chave granular na JVM e `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`) no banco de dados, com índice único parcial no PostgreSQL.
* **Thread Pool Gerenciado**: `ThreadPoolTaskExecutor` com Core 8, Max 32, fila delimitada de 100 tarefas, graceful shutdown e `RejectedExecutionHandler`.
* **Segunda Aplicação Assíncrona**: Emissão desacoplada de comprovante digital com protocolo único, envio de notificações ao paciente e ao médico e trilha de auditoria via `@Async`.
* **Logs e Observabilidade Estruturada**: Rastreamento completo no padrão `[Horário] [Thread] [Operação] [Médico] [Slot] [Paciente] [Duração] -> [Resultado]`.
* **Dashboard / Painel Técnico**: Interface visual em `/concorrencia` ou `/clinica/concorrencia` com métricas em tempo real, console de logs e simulador interativo de disputa de vagas para demonstração ao vivo para a banca avaliadora.
* **Documentação Oficial do Módulo 3**: Veja os diagramas UML (Sequência e Arquitetura), justificativas técnicas e evidências antes x depois em [docs/MODULO_3.md](docs/MODULO_3.md).

---

## Executar

### Backend (Spring Boot + Java 21)
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Disponível em: `http://localhost:8085` | Swagger UI: `http://localhost:8085/swagger-ui.html`

### Frontend (React 19 + Vite)
Requisitos: Node 22.12+ ou 24 e npm.

```powershell
cd frontend/medflow-frontend
npm ci
npm start
```
Abra `http://localhost:4200` para entrar.

| Área | Rota | Experiência |
|---|---|---|
| Paciente | `/paciente` | Agendamento em cinco passos, consultas próprias, histórico, notificações e perfil |
| Médico / especialista | `/medico` | Agenda em dia/semana/mês, pacientes, prontuários, atendimentos, notificações e perfil |
| Clínica | `/clinica` | Agenda geral, agendamentos, cadastros, equipe, prontuários, especialidades, relatórios e configurações |
| Painel de Concorrência | `/concorrencia` | Dashboard técnico do Módulo 3, métricas do pool, logs em tempo real e simulador de carga |

Veja o [guia de acessos](docs/front/ACESSO.md).

## Verificar

```powershell
# Frontend
cd frontend/medflow-frontend
npm run build
npm test

# Backend
cd backend
.\mvnw.cmd test-compile
```

## Estrutura

```text
backend/
  src/main/java/com/medFlow/MedFlow/
    concorrencia/      Thread pool gerenciado, locks, monitor, simulador e tarefas assíncronas
    controller/        Endpoints REST de consultas, agenda, autenticação e concorrência
    dto/               Data Transfer Objects de requisição e resposta
    exception/         Tratamento de conflito de concorrência (409) e regras de negócio
    model/             Entidades JPA (Consulta, Medico, HorarioAgenda, Notificacao, etc.)
    repository/        Repositórios Spring Data com locks pessimistas
    service/           Regras transacionais e orquestração de agenda
frontend/medflow-frontend/
  src/
    components/common/ Componentes de interface e fluxos compartilhados
    components/patient/ Cards de especialidades e profissionais
    context/           Context API e operações de estado com sincronização remota
    layouts/           Menus com acesso ao Painel de Concorrência
    pages/clinica/     Painel de Concorrência (Módulo 3), relatórios e gestão
    services/api.js    Integração HTTP REST com o backend
    utils/             Datas e validações de conflito de agenda
docs/
  MODULO_3.md          Documentação técnica detalhada, diagramas UML Mermaid e evidências
```

[Guia de execução completa](docs/GUIA_EXECUCAO.md) · [Documentação Módulo 3](docs/MODULO_3.md) · [Documentação Geral](docs/README.md) · [Frontend](docs/front/README.md) · [Changelog](CHANGELOG.md) · [Uso de IA](AI_USAGE.md)
