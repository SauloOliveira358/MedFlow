# Backend — especificação para integração futura

**Nenhum backend foi desenvolvido ou alterado nesta entrega.** Esta pasta documenta o contrato esperado pelo frontend e uma proposta de arquitetura. Não representa endpoints existentes, autenticação pronta ou banco implantado.

O diretório `backend/` já presente no repositório contém o scaffold Java. Sua evolução deve ser feita em uma etapa própria.

- [API proposta](API.md): recursos, payloads e erros.
- [Arquitetura e modelagem propostas](ARQUITETURA.md): responsabilidade das camadas, UML, DER e três fluxos completos planejados.

## Responsabilidades futuras

Implementar autenticação e autorização reais; validar entradas e vínculos; persistir em banco; garantir unicidade de agenda em transação; tratar conflitos concorrentes; manter auditoria; definir disponibilidade semanal e exceções; integrar frontend por HTTP. As regras locais servem à experiência de uso, não constituem barreira de segurança.

## Critérios para considerar a integração pronta

1. Criar consulta persiste no servidor e reaparece em outra sessão autorizada.
2. Duas requisições concorrentes para a mesma vaga resultam em uma criação e um conflito.
3. Cancelamento e remarcação atualizam a disponibilidade de forma atômica.
4. Usuário sem autorização recebe 403 e sessão inválida recebe 401.
5. Senhas não são retornadas pela API nem armazenadas em texto puro.
6. Frontend exibe carregamento, erros por campo, conflito e indisponibilidade de serviço.

A implementação atual não satisfaz a exigência do PDF de produto com persistência real. Essa limitação é intencional para cumprir o escopo solicitado de somente frontend.
