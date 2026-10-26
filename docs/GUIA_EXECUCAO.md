# Como preparar e rodar o MedFlow localmente

Siga este roteiro na primeira vez que for programar no projeto. Os comandos abaixo são para Windows e PowerShell.

## 1. Instale os programas necessários

- **Git**, para obter o código-fonte, caso ainda não tenha a pasta do projeto.
- **JDK 21**, necessário para o backend Java.
- **Node.js 22.12 ou superior na linha 22, ou Node.js 24**. O npm é instalado junto com o Node.js e é necessário para o frontend.
- **Visual Studio Code**, recomendado para abrir o projeto e usar os terminais integrados.
- **Microsoft Edge**, somente se também for executar os testes end-to-end.

Python e SQLAlchemy não são usados neste projeto. O backend é Java com Spring Boot; o frontend é React com Vite. Não é necessário instalar Maven separadamente: o projeto inclui o Maven Wrapper.

Depois de instalar os programas, feche e abra novamente o VS Code. No terminal PowerShell, confira se estão disponíveis:

```powershell
java -version
node --version
npm --version
git --version
```

O Java deve informar a versão 21. O Node.js deve atender a uma das versões indicadas acima. Se algum comando não for reconhecido, instale ou corrija o programa correspondente e abra um terminal novo.

## 2. Abra o projeto e coloque o `.env`

Abra no VS Code a pasta raiz do projeto, chamada `MedFlow`.

Coloque o arquivo `.env` fornecido diretamente nessa pasta raiz, ao lado de `README.md`. Não coloque o arquivo dentro de `backend` nem de `frontend/medflow-frontend`. Não é necessário alterar ou preencher variáveis neste guia. Não envie o `.env` para o Git.

O backend precisa conseguir acessar o banco configurado para o projeto. Se o arquivo `.env` não foi fornecido ou o banco não estiver acessível, peça à pessoa responsável pelo ambiente de desenvolvimento o arquivo e o acesso necessários. Não use dados reais de pacientes para desenvolvimento.

## 3. Instale as dependências do frontend

No VS Code, abra um terminal PowerShell na raiz do projeto e execute:

```powershell
Set-Location frontend\medflow-frontend
npm ci
```

Este passo é necessário na primeira execução e novamente quando as dependências do frontend forem atualizadas. Aguarde o comando terminar antes de iniciar o sistema.

## 4. Inicie o backend

Abra um terminal PowerShell na raiz `MedFlow` e execute:

```powershell
.\backend\mvnw.cmd -f backend\pom.xml spring-boot:run
```

Na primeira execução, o Maven Wrapper pode baixar o Maven e as bibliotecas Java; mantenha a conexão com a internet. Aguarde o backend iniciar sem erros e deixe este terminal aberto.

- Backend: `http://localhost:8085`
- Documentação da API: `http://localhost:8085/swagger-ui.html`

## 5. Inicie o frontend em outro terminal

No VS Code, abra uma **nova aba de terminal**. Execute:

```powershell
Set-Location frontend\medflow-frontend
npm start
```

Deixe também esse terminal aberto e acesse no navegador:

```text
http://localhost:4200
```

O Vite encaminha as chamadas da API local para o backend na porta `8085`. Por isso, para usar o sistema integrado, mantenha os dois terminais em execução: um para o backend e outro para o frontend.

Para encerrar, pressione `Ctrl+C` em cada terminal.

## 6. Execute os testes (opcional)

Frontend, no terminal PowerShell:

```powershell
Set-Location frontend\medflow-frontend
npm run build
npm test
```

O teste de navegador é opcional e requer Microsoft Edge:

```powershell
npm run test:e2e
```

Backend, em um terminal aberto na raiz `MedFlow`:

```powershell
.\backend\mvnw.cmd -f backend\pom.xml test-compile
```

Para rodar o teste unitário da agenda:

```powershell
.\backend\mvnw.cmd -f backend\pom.xml -Dtest=AgendaAgendamentoTest test
```

## Problemas comuns

- **`java` não é reconhecido:** instale o JDK 21, reabra o VS Code e tente novamente.
- **`npm` não é reconhecido:** instale uma versão compatível do Node.js, reabra o VS Code e tente novamente.
- **Backend não inicia ou não conecta ao banco:** confirme que o `.env` fornecido está na raiz do projeto e solicite acesso ao banco de desenvolvimento.
- **Página não abre:** confirme que os dois terminais continuam em execução e acesse `http://localhost:4200`.
- **Erro de dependências do frontend:** execute novamente `npm ci` em `frontend/medflow-frontend`.
- **Porta já está em uso:** encerre a outra instância do MedFlow ou o programa que estiver usando a porta e inicie novamente.

## Documentação relacionada

- [README principal](../README.md)
- [Guia técnico do frontend](front/README.md)
- [Guia do backend e API](back/README.md)
- [Acessos de demonstração](front/ACESSO.md)