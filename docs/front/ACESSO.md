# Acesso e cadastro

A primeira tela é o login. O cadastro público cria exclusivamente pacientes; nenhuma opção permite escolher médico ou administrador. Após cadastrar-se, o paciente entra automaticamente no fluxo de agendamento, com os próprios dados preenchidos.

Não existem contas de demonstração no frontend. Faça login com uma conta criada no backend.

Para cadastrar um médico: entre como administrador, abra **Profissionais → Cadastrar médico**, informe nome, especialidade, registro, telefone, e-mail e senha. Após salvar, o profissional aparece na equipe e na busca de agendamento. Use **Sair** e entre com o novo acesso para abrir a agenda dele.

Pacientes usam **Criar minha conta** na tela inicial. O formulário valida os dados, exige senha de pelo menos oito caracteres e confirmação. E-mails de acesso não podem se repetir. Um cadastro de paciente já existente na clínica não é assumido automaticamente por um visitante com o mesmo e-mail; a vinculação futura requer confirmação de identidade e não está implementada nesta simulação.

## Comportamento do acesso

- Rotas exigem uma conta do perfil correspondente. Após login, um link interno solicitado anteriormente é retomado quando pertence ao mesmo perfil.
- Consultas e perfis do paciente usam seu `patientId`; agenda e prontuários do médico usam seu `doctorId`.
- Somente o administrador cria contas médicas. Não existe cadastro público de administrador.
- A clínica acompanha todos os agendamentos; para conferir a sincronização, saia e entre nas outras contas no mesmo navegador e endereço.
- Sair remove a sessão, preservando os cadastros e consultas locais. Recarregar mantém a sessão da aba.
- E-mail editado no perfil é um contato; o e-mail de login permanece o cadastrado na criação da conta.

## Implementação e limites

`DemoContext` mantém a conta atual e verifica o perfil nas operações. `services/api.js` comunica-se com o backend; `RequireAccount` controla a navegação. O armazenamento local não popula contas ou perfis artificiais.

`sessionStorage` usa `medflow-session-v1` para a identidade da sessão. A autenticação real e as senhas são responsabilidade do backend. O armazenamento local não deve ser tratado como mecanismo de autorização.

O fluxo permite que o paciente agende de casa. O backend deve estar disponível em `http://localhost:8085`, com PostgreSQL configurado e CORS liberado para o frontend.
