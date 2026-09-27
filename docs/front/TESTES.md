# Testes — React e três áreas

## Verificação em 27/09/2026

Ambiente: Windows, Node 24.16.0, React 19, Vite 7, Vitest 3 e Microsoft Edge headless via Playwright.

- `npm run build`: aprovado; compilação estática de produção.
- `npm test`: **14 aprovados** (8 regras de estado, 5 regras de contas e 1 integração completa da interface React).
- `npm run test:e2e`: **8 cenários validados**, incluindo 150 combinações das rotas originais e 12 de login/cadastro por viewport. Na revisão final, 7 passaram na execução completa e o cenário de cadastro médico passou na reexecução isolada após corrigir o seletor e a espera do login no teste.

A ferramenta de navegador integrada não iniciou por erro de configuração da sessão. A verificação foi realizada com o Edge local em modo headless. O teste de varredura permite até 240 segundos, pois percorre 150 combinações de rota e viewport, com logins entre as áreas.

## Cobertura dos testes

**Estado e React (14 testes):** quantidades e referências dos mocks; consulta única nos seletores de paciente/médico/clínica; conflito do médico e do paciente; remarcação preservando ID; cancelamento liberando vaga e notificações; início e conclusão de atendimento; validação de dados/horários; navegação e confirmação pelas cinco etapas com login nas três áreas. Contas: perfil de paciente obrigatório no cadastro público, criação de médico exclusiva do administrador, duplicidade de e-mail/registro, senha mínima e conferência dos hashes de demonstração.

**Navegador:** paciente agenda, médico correto visualiza, outro médico não visualiza, clínica cancela e paciente vê histórico após reload; 25 rotas em 375, 390, 430, 768, 1024 e 1440 px; anotações e documentos do prontuário; agenda dia/semana/mês; menu mobile; capturas; clínica cadastra novo paciente, agenda e especialista inicia atendimento com criação do prontuário.

**Acessos no navegador:** login incorreto, acesso direto sem sessão, cadastro público e agendamento com identidade própria, sessão preservada ao recarregar, redirecionamento de perfil indevido, administrador cria médico, novo médico entra e aparece na busca do paciente. Login e cadastro foram verificados nas seis larguras; capturas desktop/mobile foram inspecionadas.

A varredura verifica ausência de overflow horizontal global e erros JavaScript. Não equivale a auditoria formal de acessibilidade ou teste com usuários reais.

## Executar

```powershell
cd frontend/medflow-frontend
npm test
npm run test:e2e
```

`playwright.config.js` utiliza `channel: msedge`. Se Edge não estiver instalado, escolha um navegador Playwright disponível e adapte a configuração. O Vite é iniciado automaticamente. As fixtures de cada teste começam com armazenamento independente.

## Roteiro de apresentação

1. Entrar com `maria@medflow.demo`, senha `MedFlow123!`, e selecionar Agendar consulta.
2. Escolher Dermatologia, Dra. Ana, uma data futura e horário livre. Ver horários ocupados/intervalo bloqueados.
3. Revisar os dados fictícios, informar uma observação e confirmar.
4. Abrir Meus agendamentos e conferir a consulta.
5. Sair e entrar com `ana@medflow.demo`; abrir Minha agenda na mesma data.
6. Sair e entrar com `medico2@medflow.demo`: a consulta não deve aparecer na agenda dele.
7. Sair e entrar com `admin@medflow.demo`, abrir Agenda geral e filtrar a data: mesma consulta/paciente/profissional. Todas essas contas iniciais usam a senha `MedFlow123!`.
8. Abrir detalhes, cancelar, confirmar. No paciente, conferir status Cancelado no Histórico.
9. Agendar pela clínica com novo paciente; no médico iniciar atendimento; abrir o novo prontuário e salvar uma anotação fictícia.
10. Conferir os perfis, notificações lidas, paginação de pacientes, filtros e exportação do relatório.
11. Sair, usar Criar minha conta, preencher um paciente fictício e agendar. Conferir que ele não vê as consultas de Maria.
12. Entrar como administrador, cadastrar um médico em Profissionais e testar seu novo login. Confirmar que paciente e médico não abrem rotas da clínica.

## Capturas

- [Paciente desktop](screenshots/paciente-desktop.png)
- [Paciente mobile](screenshots/paciente-mobile.png)
- [Agenda médica](screenshots/medico-agenda.png)
- [Dashboard da clínica](screenshots/clinica-desktop.png)
- [Login desktop](screenshots/login-1440.png)
- [Login mobile](screenshots/login-390.png)
- [Cadastro mobile](screenshots/cadastro-390.png)

Não há teste de backend ou banco: esses componentes não fazem parte desta implementação. Os filtros de identidade são simulação de interface, não controles de segurança.
