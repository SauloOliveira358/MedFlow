# Acesso e cadastro

A primeira tela é o login. O cadastro público cria exclusivamente pacientes; nenhuma opção permite escolher médico ou administrador. Após cadastrar-se, o paciente entra automaticamente no fluxo de agendamento, com os próprios dados preenchidos.

## Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@medflow.demo` | `MedFlow123!` |
| Paciente Maria Oliveira | `maria@medflow.demo` | `MedFlow123!` |
| Médica Ana Silva | `ana@medflow.demo` | `MedFlow123!` |
| Demais especialistas iniciais | `medico2@medflow.demo` até `medico8@medflow.demo` | `MedFlow123!` |

Para cadastrar um médico: entre como administrador, abra **Profissionais → Cadastrar médico**, informe nome, especialidade, registro, telefone, e-mail e senha de teste. Após salvar, o profissional aparece na equipe e na busca de agendamento. Use **Sair** e entre com o novo acesso para abrir a agenda dele.

Pacientes usam **Criar minha conta** na tela inicial. O formulário valida os dados, exige senha de pelo menos oito caracteres e confirmação. E-mails de acesso não podem se repetir. Um cadastro de paciente já existente na clínica não é assumido automaticamente por um visitante com o mesmo e-mail; a vinculação futura requer confirmação de identidade e não está implementada nesta simulação.

## Comportamento da demonstração

- Rotas exigem uma conta do perfil correspondente. Após login, um link interno solicitado anteriormente é retomado quando pertence ao mesmo perfil.
- Consultas e perfis do paciente usam seu `patientId`; agenda e prontuários do médico usam seu `doctorId`.
- Somente o administrador cria contas médicas. Não existe cadastro público de administrador.
- A clínica acompanha todos os agendamentos; para conferir a sincronização, saia e entre nas outras contas no mesmo navegador e endereço.
- Sair remove a sessão, preservando os cadastros e consultas locais. Recarregar mantém a sessão da aba.
- E-mail editado no perfil é um contato; o e-mail de login permanece o cadastrado na criação da conta.

## Implementação e limites

`DemoContext` mantém a conta atual e verifica o perfil nas operações. `utils/auth.js` valida cadastros e credenciais; `demoAccounts.js` contém as contas fictícias iniciais; `RequireAccount` controla a navegação. Dados antigos da demonstração recebem as contas iniciais sem apagar consultas.

`localStorage` usa `medflow-react-demo-v2` para dados e contas; `sessionStorage` usa `medflow-session-v1` para a identidade da sessão. Senhas criadas são convertidas em hash PBKDF2 com salt; não são gravadas em texto puro. Isso não torna o frontend uma autenticação segura: o armazenamento e o código podem ser alterados pelo usuário. Utilize somente informações e senhas fictícias.

O fluxo simula o paciente agendando de casa. Contas e consultas ainda não são compartilhadas entre dispositivos, navegadores ou endereços distintos (`localhost` e `127.0.0.1`, por exemplo). Nenhum backend, banco ou API foi criado. Acesso real remoto com dados compartilhados e autorização confiável depende de uma integração futura. Web Crypto requer localhost ou HTTPS.
