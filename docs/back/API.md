> Referência histórica da versão de 26/09/2026. Não descreve o frontend React atual nem serviços implementados. Consulte [o guia atual](../front/README.md). Nenhuma API ou banco foi criado.

# Contrato proposto da API

Base sugerida: `/api/v1`. JSON UTF-8; IDs string/UUID; data `YYYY-MM-DD`; horário local `HH:mm`; instantes de auditoria ISO 8601 UTC. O fuso da clínica deve ser explícito na implementação final. Estes endpoints **não existem nesta entrega**. Nomes de campos acompanham os modelos TypeScript para facilitar integração.

| Método e caminho | Entrada | Saída de sucesso | Erros previstos |
|---|---|---|---|
| POST /auth/login | email, password | 200, sessão segura + usuário | 400, 401, 429 |
| POST /auth/logout | sessão | 204 | 401 |
| GET /auth/me | sessão | 200, usuário e perfil | 401 |
| GET /patients?search=&page= | filtro e paginação | 200, lista paginada | 401, 403 |
| POST /patients | name, email, phone, birth | 201, paciente | 400, 401, 403 |
| PATCH /patients/{id} | campos editados | 200, paciente | 400, 404 |
| GET /professionals | filtros | 200, lista | 401, 403 |
| POST /professionals | name, crm, specialtyId, start, end | 201, profissional | 400, 404, 409 |
| PATCH /professionals/{id} | campos editados | 200, profissional | 400, 404, 409 |
| GET /specialties | — | 200, lista | 401 |
| POST /specialties | name | 201, especialidade | 400, 409 |
| PATCH /specialties/{id} | name | 200, especialidade | 400, 404, 409 |
| GET /professionals/{id}/availability?date= | dia | 200, horários livres | 400, 404 |
| GET /appointments?date=&professionalId=&status= | filtros | 200, lista | 400, 401 |
| POST /appointments | patientId, professionalId, date, time, notes | 201, consulta | 400, 404, 409, 422 |
| PATCH /appointments/{id} | nova data/hora/profissional e versão | 200, consulta | 400, 404, 409, 422 |
| POST /appointments/{id}/cancel | versão, motivo opcional | 200, cancelada | 404, 409 |
| POST /appointments/{id}/complete | versão | 200, concluída | 404, 409, 422 |
| GET /history?search=&page= | filtros | 200, atividades paginadas | 401, 403 |
| GET /dashboard?date= | dia | 200, contadores | 400, 401, 403 |
| GET /users | — | 200, usuários sem senha | 401, 403 |
| POST /users | name, email, role | 201, usuário (fluxo de convite a definir) | 400, 403, 409 |
| PATCH /users/{id} | name, email, role | 200, usuário | 400, 403, 404, 409 |

Todas as rotas protegidas também podem retornar 401/403; falha interna deve retornar 500 com mensagem pública e identificador de correlação, sem stack trace. Paginação sugerida: `{items: [], page: 0, size: 20, total: 0}`.

## Exemplo de criação

```json
{
  "patientId": "uuid-paciente",
  "professionalId": "uuid-profissional",
  "date": "2026-10-15",
  "time": "09:30",
  "notes": "Primeira visita"
}
```

Resposta 201: mesmos campos mais `id`, `status: "Confirmado"` e `version: 1`. Duração inicial fixa: 30 minutos. Status aceitos para leitura: Confirmado, Concluído, Cancelado. Mudanças de estado devem ocorrer somente pelas operações permitidas.

## Erro de conflito

```json
{
  "code": "SLOT_UNAVAILABLE",
  "message": "Este horário já foi reservado. Escolha outro horário.",
  "fieldErrors": { "time": "Horário indisponível" },
  "traceId": "identificador-da-requisicao"
}
```

`409` significa estado concorrente ou duplicidade; `422` significa violação de regra, como fora do expediente; `400` significa formato inválido; `404` significa vínculo/recurso inexistente. O frontend deverá preservar o preenchimento, atualizar vagas e permitir nova escolha após conflito. A lista de vagas é informativa: a criação precisa validar novamente na transação.

## Segurança e credenciais

A credencial pública do protótipo não deve migrar para produção. Definir sessão segura e proteção CSRF conforme arquitetura; restringir CORS à origem configurada; guardar hash de senha no servidor; autorizar cada ação por perfil. Cadastros administrativos e ações de recepção precisam de matriz de permissões aprovada. Não usar o campo de perfil no navegador como autorização.
