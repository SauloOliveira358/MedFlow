# Frontend MedFlow

## Executar

Na pasta `frontend/medflow-frontend`:

```powershell
npm ci
npm start
```

Abra `http://localhost:4200`. Use uma versão de Node aceita pelo Angular instalado (consulte o campo `engines` de `node_modules/@angular/core/package.json`). O lockfile fixa as dependências. Não é preciso iniciar o backend.

```powershell
npm run build
npm test -- --watch=false
```

Build em `dist/medflow-frontend/browser`. Sirva os arquivos por HTTP; abrir `index.html` diretamente não é o fluxo suportado.

## Acesso demonstrativo

Clique em **Explorar demonstração**, ou use `admin@medflow.demo` e `MedFlow123!`. A credencial é pública e serve apenas à apresentação. Nenhuma senha de usuário é cadastrada ou persistida. A sessão fica em memória e retorna ao login ao recarregar; os cadastros permanecem no navegador.

## Funcionalidades

| Tela | Comportamento |
|---|---|
| Login | Formulário, erro e acesso direto à demonstração |
| Dashboard | Indicadores derivados dos dados, agenda por data e atalhos |
| Agenda | Busca, filtros de profissional/status, criação, remarcação, cancelamento confirmado e conclusão |
| Pacientes | Listagem, busca, cadastro e edição, contato e nascimento |
| Profissionais | Nome, CRM, especialidade e expediente diário editáveis |
| Especialidades | Cadastro, edição, busca e prevenção de nome duplicado |
| Usuários | Cadastro/edição de perfis demonstrativos, e-mail único |
| Histórico | Registro das operações locais e busca |

Cada consulta dura 30 minutos. O expediente é diário, sem regras de dias da semana, feriados ou pausas. Datas passadas não podem receber novos agendamentos. O mesmo profissional não pode ocupar duas vezes o mesmo horário; cancelar libera o horário. Consultas concluídas preservam a ocupação histórica. O modelo não implementa prontuário.

## Organização técnica

- `src/app/app.ts`: coordenação de telas, formulários, filtros e ações.
- `src/app/app.html`: interface com controle de fluxo Angular e elementos semânticos.
- `src/app/models.ts`: interfaces TypeScript do domínio.
- `src/app/clinic.service.ts`: estado reativo, dados iniciais, validação de agenda e persistência demonstrativa.
- `src/styles.css`: tokens e estilos responsivos compartilhados.
- `public/logo.svg`: símbolo vetorial da marca.
- `*.spec.ts`: testes de regras e renderização.

Componentes standalone, signals/computed e formulários template-driven. A navegação é interna à aplicação, sem URLs específicas para cada tela; o roteador do scaffold está sem rotas. Não há dependências visuais externas nem chamadas de rede. A tipografia utiliza fontes do sistema.

## Dados locais e recuperação

Chave: `medflow-demo-v1` em `localStorage`. Os dados iniciais são gerados com a data do primeiro uso. Depois disso a agenda preserva suas datas, inclusive ao abrir em outro dia. O histórico inicia vazio. Falhas de armazenamento geram um aviso e mantêm o estado em memória. Estruturas incompatíveis recebem dados iniciais. Para reiniciar deliberadamente a demonstração, remova apenas essa chave nas ferramentas do navegador e recarregue. Não use dados reais.

## Integração futura

Substituir as operações locais do serviço por chamadas HTTP e estados de carregamento/erro. Preservar os componentes de apresentação e adaptar DTOs ao contrato aprovado. Não assumir que validações do cliente substituem validação transacional no servidor. O contrato sugerido está em [API](../back/API.md).
