# Uso de inteligência artificial

| Data | Ferramenta | Utilização | Componente | Validação |
|---|---|---|---|---|
| 24/10/2026 | Antigravity (Gemini 3.8 Flash) | Implementação completa do Módulo 3: Concorrência, Threads, ExecutorService, segunda aplicação assíncrona, observabilidade e dashboard | Backend (`concorrencia`), Frontend (`PainelConcorrencia.jsx`) e `docs/MODULO_3.md` | Compilação Maven (`.\mvnw.cmd test-compile`), Build Vite (`npm run build`), testes existentes |
| 27/09/2026 | Codex | Login, cadastro público de paciente e criação de médico exclusiva da clínica | Context API, rotas e formulários | Testes de credenciais, permissões, fluxo de cadastro e navegação |
| 27/09/2026 | Codex | Fluxos compartilhados, calendário, prontuários, responsive CSS e retratos vetoriais | Interface | Testes Playwright com Edge, seis larguras e capturas inspecionadas |
| 27/09/2026 | Codex | Migração solicitada para React/JavaScript, três experiências, mocks e Context API | Frontend | Build, testes de regras e integração React |
| 26/09/2026 | Codex | Versão inicial e análise do PDF | Angular e documentação | Build e 9 testes da versão anterior |

O Módulo 3 foi implementado seguindo rigorosamente os 22 critérios do documento orientador de Programação Orientada a Objetos II, abordando proteção contra condição de corrida no agendamento médico, Thread Pool gerenciado, segunda aplicação assíncrona desacoplada, logs padronizados de observabilidade e painel técnico com simulador de concorrência.
