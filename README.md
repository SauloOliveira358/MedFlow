# MedFlow · Cuidado que conecta

Frontend React conectado ao backend Spring Boot para autenticação e dados da aplicação. **Não há contas demonstrativas no frontend.**

## Executar

Requisitos: Node 22.12+ ou 24 e npm.

```powershell
cd frontend/medflow-frontend
npm ci
npm start
```

Abra http://localhost:4200 para entrar. Pacientes e médicos devem usar contas cadastradas no backend. O acesso do médico pode ser criado pelo administrador em **Profissionais → Cadastrar médico**.

| Área | Rota | Experiência |
|---|---|---|
| Paciente | `/paciente` | Agendamento em cinco passos, consultas próprias, histórico, notificações e perfil |
| Médico / especialista | `/medico` | Agenda em dia/semana/mês, pacientes, prontuários, atendimentos, notificações e perfil |
| Clínica | `/clinica` | Agenda geral, agendamentos, cadastros, equipe, prontuários, especialidades, relatórios e configurações |

Cada login abre a área correspondente. Para acompanhar uma consulta entre as experiências, use **Sair** e entre na outra conta no mesmo navegador. Não existe cadastro público de médico ou administrador. Veja o [guia de acessos](docs/front/ACESSO.md).

## Dados compartilhados

Context API mantém o estado da sessão e dos dados recebidos durante o uso. A autenticação e o cadastro são feitos pelo backend; o frontend não cria nem exibe perfis demonstrativos.

## Verificar

```powershell
npm run build
npm test
npm run test:e2e
```

Os testes de navegador usam Microsoft Edge em modo headless. Em outro ambiente, instale um navegador compatível com Playwright e ajuste `channel` em `playwright.config.js`. O teste inicia o Vite local automaticamente.

## Estrutura

```text
frontend/medflow-frontend/
  src/
    components/common/   Componentes de interface e fluxos compartilhados
    components/patient/  Cards de especialidades e profissionais
    context/             Context API e operações de estado
    data/                Dados fictícios
    layouts/             Menus, cabeçalhos e navegação inferior
    pages/               Páginas de paciente, médico e clínica
    styles/              CSS responsivo
    utils/               Datas e validações de agenda
    test/                Testes de estado e integração React
  public/portraits/      Retratos vetoriais locais
  e2e/                   Fluxos de navegador e responsividade
```

O backend Spring Boot usa PostgreSQL/Supabase e precisa estar disponível em `http://localhost:8085`. Ainda não há envio de mensagens ou arquivos nem integrações clínicas externas.

[Documentação](docs/README.md) · [Frontend](docs/front/README.md) · [Testes](docs/front/TESTES.md) · [Changelog](CHANGELOG.md) · [Uso de IA](AI_USAGE.md)
