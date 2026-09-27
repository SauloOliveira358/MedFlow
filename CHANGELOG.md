# Changelog

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

Backend integrado, autenticação real e persistência em banco permanecem pendentes. Não foi criada release dos módulos completos.
