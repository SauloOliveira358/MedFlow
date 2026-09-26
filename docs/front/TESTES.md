# Testes e demonstração

## Evidências automatizadas — 26/09/2026

Ambiente: Windows, Node 24.16.0, Angular 22 e Vitest 5. Comandos executados na pasta frontend/medflow-frontend:

- `npm run build`: aprovado; compilação de produção dentro do orçamento configurado.
- `npm test -- --watch=false`: **2 arquivos, 9 testes aprovados**.

O ambiente restrito bloqueou leitura de diretórios pelo compilador; os comandos foram repetidos com permissão de execução e concluídos. Não foram feitos testes integrados com backend.

Cobertura de cenários (não é percentual de cobertura): slot livre; conflito com mesmo profissional; profissional diferente no mesmo horário; paciente inexistente; data passada; horário fora do expediente e intervalo inválido; horário liberado por cancelamento; edição da própria reserva; remarcação persistida sem duplicação; histórico; dados intactos após conflito; recuperação de armazenamento inválido; criação/renderização e navegação até pacientes.

## Verificação visual pendente

A ferramenta de navegador falhou antes de conectar, com erro interno de configuração de sandbox. Não foi possível abrir a aplicação, capturar telas ou verificar layout e interações em navegador real. Os testes de componentes executaram em jsdom. A responsividade foi implementada em CSS, mas ainda deve ser inspecionada visualmente.

## Roteiro manual de aceite

1. Executar `npm start`, abrir localhost:4200 e tentar credencial incorreta: deve haver erro. Entrar com a credencial pública ou botão de demonstração.
2. Conferir dashboard com quatro consultas de exemplo na data do primeiro uso e quatro pacientes; mudar uma consulta para Concluído e conferir os indicadores.
3. Criar paciente com telefone inválido/nascimento futuro: não salvar. Corrigir, salvar, buscar por nome, editar e conferir atualização.
4. Criar especialidade e profissional; tentar CRM duplicado. Ajustar expediente em intervalos de 30 minutos.
5. Criar consulta: selecionar paciente, profissional, data e slot. Conferir presença na agenda e registro no histórico.
6. Tentar selecionar o mesmo horário para o mesmo profissional: não deve aparecer. A regra também deve bloquear tentativa direta pelo serviço (teste automatizado).
7. Remarcar consulta. Conferir novo slot ocupado e anterior disponível. Fechar formulário sem salvar deve preservar dados anteriores.
8. Cancelar e escolher Manter: nada muda. Confirmar cancelamento: status atualiza e horário é liberado.
9. Buscar termo inexistente e filtrar outra data: conferir estado vazio. Limpar busca/filtros para recuperar resultados.
10. Criar/editar usuário demonstrativo e tentar e-mail duplicado. O cadastro não deve ser apresentado como credencial real.
11. Recarregar a página, entrar novamente e conferir persistência dos cadastros e histórico.
12. Conferir 1440×900, 1024×768 e 390×844: sem rolagem horizontal global; tabelas podem rolar em seu contêiner; menus e botões acessíveis.
13. Usar somente teclado: link de pular conteúdo, menu, formulário, modal, Escape e restauração de foco. Verificar zoom em 200% e contraste antes de declarar conformidade de acessibilidade.

## Demonstração de cinco minutos

Entrar → dashboard → novo paciente → profissional e expediente → novo agendamento → horário ocupado não oferecido → remarcar → cancelar → histórico. Mostrar o teste de conflito para a regra local e explicar que a proteção concorrente real só poderá ser demonstrada após a integração Java/banco.

Resultados atuais: interface implementada, build e testes locais aprovados. Limitações: sem revisão visual no navegador, sem usuários reais, sem API, sem concorrência entre sessões, sem controle de acesso real. Coletar screenshots e resultados manuais depois de executar o roteiro; não preencher evidências como se já tivessem ocorrido.
