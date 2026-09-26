# MedFlow · Documentação

**Gestão que cuida.** Projeto Integrador de POO II · Sistemas de Informação · Faculdade Anhanguera.

Esta entrega implementa **somente o frontend**, conforme solicitação. O PDF oficial é referência de requisitos, não autorização para desenvolver o backend. O MVP integrado exigido pelo documento ainda depende de API Java e persistência real.

## Sumário

- [Frontend: execução, arquitetura e funcionalidades](front/README.md)
- [Produto, discovery e benchmarking](front/PRODUTO.md)
- [Requisitos e casos de uso](front/REQUISITOS.md)
- [Identidade visual e UX/UI](front/UX_UI.md)
- [Validação e roteiro de demonstração](front/TESTES.md)
- [Backend: escopo futuro](back/README.md)
- [Contrato proposto da API](back/API.md)
- [Modelagem e arquitetura propostas](back/ARQUITETURA.md)

## Resumo

MedFlow organiza a operação de pequenas clínicas por meio de agenda, cadastros e acompanhamento do atendimento. A versão atual é um protótipo funcional Angular, com dados fictícios persistidos no navegador e navegação responsiva. A interface permite demonstrar agendamento, remarcação, cancelamento e validações sem executar Java ou banco de dados.

## Identificação acadêmica

Integrantes, docente, turma e período: preencher pela equipe. Documento-base: `Projeto_Integrador_POO2_MedFlow_Oficial.pdf`, fornecido pelo usuário. Data desta implementação: 26/09/2026.

## Limites da entrega

A autenticação é uma simulação explícita; usuários cadastrados não recebem acesso. O armazenamento local não substitui banco, autorização ou controle de concorrência. Não há envio de mensagens, prontuário, cobrança, API ou integração clínica. O backend existente foi preservado. UML, DER e endpoints em `back` são propostas para orientar outra etapa.

## Próximas etapas

Validar hipóteses com recepcionistas e gestores; revisar identidade com a equipe; executar avaliação visual em desktop/mobile; implementar API, autenticação, transações e banco; conectar o frontend; coletar evidências reais de uso e testes integrados. A apresentação deve distinguir claramente protótipo e produto integrado.
