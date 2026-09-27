# Requisitos e casos de uso — três áreas

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF01 | Áreas independentes | Rotas /paciente, /medico, /clinica com menus específicos |
| RF02 | Agendamento do paciente | Cinco etapas funcionais, progresso, validação e confirmação |
| RF03 | Busca de especialidades | Oito especialidades; filtro textual sem distinguir acentos |
| RF04 | Seleção de profissional | Retrato, nome, área, nota fictícia, local e próxima vaga |
| RF05 | Disponibilidade | Calendário nativo + próximos dias; slots livres e bloqueados |
| RF06 | Minhas consultas | Somente paciente conectado, abas Próximos/Histórico, detalhes, reagendamento e cancelamento |
| RF07 | Agenda médica | Somente profissional conectado, Dia/Semana/Mês e detalhes |
| RF08 | Pacientes e prontuários médicos | Recorte pelo profissional e abas Resumo/Consultas/Anotações/Procedimentos/Documentos |
| RF09 | Atendimento | Iniciar e concluir atualiza status e cria registro quando necessário |
| RF10 | Agenda geral | Filtros de data, profissional, especialidade, status e paciente |
| RF11 | Agendamento administrativo | Paciente existente ou novo; mesmos slots e validações |
| RF12 | Cadastros e equipe | Busca, paginação de pacientes, edição de paciente e consulta de profissionais |
| RF13 | Prontuários da clínica | Busca/filtros e acesso aos registros fictícios |
| RF14 | Relatórios | Totais derivados por período, barras e exportação CSV |
| RF15 | Notificações e perfis | Operações geram avisos; marcar lidos e editar dados localmente |
| RF16 | Sincronização | Um agendamento aparece nas três áreas, sem cópias independentes |
| RF17 | Login local | Abertura no login; conta direcionada à própria área; Sair encerra a sessão |
| RF18 | Cadastro público de paciente | Criar conta e agendar sem cadastro prévio na clínica |
| RF19 | Cadastro restrito de médico | Somente administrador da clínica cria contas de profissionais |

## Regras locais

Um profissional e um paciente não podem ocupar duas consultas simultâneas. Slots de 30 minutos, expediente diário 08:00–18:00 com intervalo 12:00–13:00. Só Confirmado/Pendente podem ser reagendados pela interface. Cancelamento requer confirmação e libera a vaga. Atendimento transita para Em atendimento e depois Concluído. Registros concluídos preservam histórico. Consultas canceladas não ocupam vaga.

## Casos críticos

**Agendar:** paciente p1 escolhe especialidade, profissional, data e vaga; confere seus dados; revisa; confirma. Validação falha mantém o formulário. Sucesso cria uma consulta e notificação no Context. Pós-condição: paciente, médico e clínica consultam o mesmo ID.

**Reagendar:** abrir detalhes de consulta Confirmada/Pendente; selecionar Reagendar; revisar novo horário; confirmar. A reserva anterior é substituída sem duplicação. Conflito preserva os dados antigos.

**Cancelar:** abrir detalhes; Cancelar; confirmação explícita; Context atualiza status; vaga é liberada; registro permanece no histórico. Manter consulta fecha o diálogo sem alteração.

**Atender:** médico abre sua consulta; Iniciar atendimento; caso necessário é criado um prontuário para o vínculo; consulta passa a Em atendimento. Concluir atendimento encerra o fluxo demonstrativo.

## Não funcionais

Mobile em 375, 390 e 430 px, tablet em 768/1024 e desktop em 1440. Tabelas viram cards abaixo de 768 px. Menu inferior mobile e menu completo em drawer. Rótulos de formulário, foco visível, diálogo nativo e Escape, feedback de erro/sucesso, estados vazios e redução de movimento. Validação de contraste formal e testes com usuários não equivalem aos testes automatizados desta entrega.

Sem backend, banco, API real ou TypeScript. CPF e informação clínica são estritamente fictícios. Não apresentar o protótipo como sistema de saúde em produção.
