# MedFlow · Cuidado que conecta

Frontend React com três experiências independentes e dados fictícios compartilhados. **Sem backend, banco de dados, API real ou TypeScript.**

## Executar

Requisitos: Node 22.12+ ou 24 e npm.

```powershell
cd frontend/medflow-frontend
npm ci
npm start
```

Abra http://localhost:4200 para entrar. Pacientes podem clicar em **Criar minha conta**, cadastrar seus dados fictícios e agendar sem comparecer à clínica. O acesso do médico é criado exclusivamente pelo administrador em **Profissionais → Cadastrar médico**.

| Conta demonstrativa | E-mail | Senha |
|---|---|---|
| Administrador da clínica | `admin@medflow.demo` | `MedFlow123!` |
| Paciente Maria | `maria@medflow.demo` | `MedFlow123!` |
| Médica Ana | `ana@medflow.demo` | `MedFlow123!` |

| Área | Rota | Experiência |
|---|---|---|
| Paciente | `/paciente` | Maria Oliveira: agendamento em cinco passos, consultas próprias, histórico, notificações e perfil |
| Médico / especialista | `/medico` | Agenda em dia/semana/mês, pacientes, prontuários, atendimentos, notificações e perfil |
| Clínica | `/clinica` | Agenda geral, agendamentos, cadastros, equipe, prontuários, especialidades, relatórios e configurações |

Cada login abre a área correspondente. Para acompanhar uma consulta entre as experiências, use **Sair** e entre na outra conta no mesmo navegador. Não existe cadastro público de médico ou administrador. Veja o [guia de acessos](docs/front/ACESSO.md).

## Dados compartilhados

Context API mantém uma única lista de consultas. Criar, reagendar, iniciar, concluir ou cancelar atualiza todas as telas. A persistência opcional em `localStorage` mantém a demonstração ao recarregar; não é um banco de dados. A chave é `medflow-react-demo-v2`; a sessão usa `medflow-session-v1` no `sessionStorage`. Para reiniciar o exemplo, remova essas duas chaves nas ferramentas do navegador.

Mocks iniciais: 10 pacientes, 8 especialistas, 8 especialidades, 20 consultas e 10 prontuários. Datas são relativas ao primeiro uso. Nomes, contatos, avaliações e retratos ilustrados são fictícios. Use somente dados de teste.

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

O scaffold `backend/` preexistente foi preservado; ele não participa desta aplicação. A versão Angular anterior foi substituída, incluindo configurações do editor. Não há autenticação real, envio de mensagens ou arquivos, integrações clínicas nem concorrência entre navegadores.

[Documentação](docs/README.md) · [Frontend](docs/front/README.md) · [Testes](docs/front/TESTES.md) · [Changelog](CHANGELOG.md) · [Uso de IA](AI_USAGE.md)
