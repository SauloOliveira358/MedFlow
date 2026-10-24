# MedFlow — Integração e Funcionamento dos Prontuários Médicos (`/medico/prontuarios`)

> **Documento gerado após a implementação e testes automatizados das funcionalidades de prontuário clínico para o médico especialista**  
> **Ambiente**: Local (`http://127.0.0.1:4200` integrado com backend Spring Boot e PostgreSQL/Supabase)

---

## 1. Visão Geral

O módulo de prontuários médicos foi totalmente conectado ao fluxo de trabalho do médico especialista (`/medico`), permitindo o acompanhamento clínico contínuo e histórico de cada paciente atendido.

### O que foi integrado:
1. **Sincronização Automática**: Pacientes com consultas agendadas ou atendidas pelo médico têm seu prontuário clínico (`Prontuario`) criado ou sincronizado automaticamente.
2. **Criação Manual de Prontuários (`+ Novo prontuário`)**: O médico pode abrir o prontuário de qualquer paciente do sistema diretamente pelo catálogo em `/medico/prontuarios`.
3. **Registro de Procedimentos Clínicos**: Na aba *Procedimentos* do prontuário (`/medico/prontuarios/:id`), o médico dispõe de um formulário completo para registrar intervenções realizadas (nome do procedimento, data e laudo/observações clínicas).
4. **Anotações de Evolução**: Registro de anotações com autoria, data e atualização imediata do prontuário.
5. **Documentos e Exames**: Upload de laudos, exames laboratoriais, fotos e PDFs (até 15MB).
6. **Integração com Agendados & Presença**: Em `/medico/agendados`, cada paciente possui o botão rápido **Prontuário** para acesso imediato à ficha durante a consulta.
7. **Integração com o Modal de Consulta**: O botão **Ver prontuário** direciona com precisão para o prontuário correspondente do paciente.

---

## 2. Estrutura de Abas do Prontuário (`/medico/prontuarios/:id`)

| Aba | Descrição | Ações do Médico |
|---|---|---|
| **Resumo** | Visão geral do cuidado, resumo clínico e últimas anotações registradas. | Visualização rápida do histórico e perfil do paciente. |
| **Consultas** | Linha do tempo com todas as consultas do paciente com o profissional, crachás de status e motivo. | Acompanhamento da frequência e comparecimento. |
| **Anotações** | Histórico cronológico de anotações médicas. | Formulário para adicionar nova nota clínica com salvamento e feedback imediato. |
| **Procedimentos** | Lista de procedimentos e intervenções executadas. | Botão **+ Novo procedimento** com formulário dedicado (nome, data, observações técnicas). |
| **Documentos** | Galeria de exames, laudos, fotos e documentos digitais anexados. | Upload de arquivos (PDF, imagens, documentos de texto) e visualização integrada. |

---

## 3. Endpoints REST no Backend Spring Boot (`ProntuarioController`)

* `GET /api/prontuarios/medico/{medicoId}` — Lista os prontuários dos pacientes vinculados ao médico.
* `GET /api/prontuarios/{id}` — Retorna os dados completos do prontuário com anotações, procedimentos e documentos.
* `POST /api/prontuarios` — Cria ou obtém o prontuário de um paciente com determinado médico.
* `POST /api/prontuarios/{id}/anotacoes` — Adiciona uma nova anotação de evolução médica.
* `POST /api/prontuarios/{id}/procedimentos` — Registra um procedimento realizado.
