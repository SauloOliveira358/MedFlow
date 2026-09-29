# Backend: agenda médica e agendamentos

Spring Boot/JPA com persistência no PostgreSQL do Supabase. O frontend permanece com os mocks existentes.

Configure `backend/.env` com `DB_URL` (JDBC PostgreSQL com `sslmode=require`), `DB_USERNAME` e `DB_PASSWORD`, conforme `backend/.env.example`. Execute na raiz:

```powershell
mvn -f backend/pom.xml spring-boot:run
```

O Flyway aplica as migrações existentes na inicialização. Tabelas utilizadas: `agendas_medicos`, `horarios_agenda` e `consultas`. Médicos e pacientes devem estar cadastrados. Porta padrão: 8085, salvo `SERVER_PORT`. Swagger: `/swagger-ui.html`.

| Método | Rota | Função |
|---|---|---|
| PUT | `/api/medicos/{medicoId}/agenda/{data}` | Define horários de uma data |
| GET | `/api/medicos/{medicoId}/agenda?data=2026-12-10` | Consulta horários e disponibilidade |
| POST | `/api/consultas` | Agenda uma consulta |
| GET | `/api/consultas/medico/{medicoId}` | Lista consultas do médico |
| GET | `/api/consultas/paciente/{pacienteId}` | Lista consultas do paciente |
| GET | `/api/consultas/{id}` | Busca uma consulta |
| PATCH | `/api/consultas/{id}/cancelar` | Cancela e libera o horário |

Corpo do PUT (data na URL, formato `YYYY-MM-DD`):

```json
{"horarios":["09:00","09:30","10:00"]}
```

O PUT substitui os horários daquele dia. Lista vazia fecha o dia, desde que não existam consultas ativas. Horários ocupados não podem ser removidos. Horários são pontos de início explícitos, no formato `HH:mm`; a API não gera intervalos automaticamente.

Corpo do POST (IDs reais do banco):

```json
{
  "pacienteId": 1,
  "medicoId": 1,
  "dataConsulta": "2026-12-10",
  "horarioConsulta": "09:00",
  "tipo": "Primeira consulta",
  "motivo": "Avaliação inicial"
}
```

`clinicaId` é opcional; quando informado, deve corresponder à clínica do médico. A clínica é obtida do cadastro do médico. O POST recebe IDs e retorna um DTO, sem expor entidades JPA nem credenciais. Retorna HTTP 201 em caso de sucesso.

Cancelamento: corpo opcional `{"motivo":"Imprevisto"}`. Apenas consultas pendentes ou confirmadas podem ser canceladas. Consultas antigas sem agenda também podem ser canceladas.

Datas passadas, horários duplicados, médico/paciente inativo e horários indisponíveis são rejeitados. O fuso é `America/Sao_Paulo`. Alterações usam transações e bloqueio do médico para serializar reservas simultâneas; o índice único existente impede duas consultas não canceladas no mesmo horário. Erros de entrada retornam 400, recursos inexistentes 404 e conflitos de persistência 409.

A configuração de segurança existente permite acesso público a `/api/**`; autenticação e autorização por proprietário ainda precisam ser implementadas antes do uso com pacientes reais.

Testes de regras, sem banco:

```powershell
mvn -f backend/pom.xml -Dtest=AgendaAgendamentoTest test
```

Teste de persistência no Supabase já provisionado (usa cadastros ativos existentes, desabilita migrações/DDL e desfaz os dados do teste com rollback):

```powershell
$env:MEDFLOW_TEST_SUPABASE = 'true'
mvn -f backend/pom.xml -Dtest=AgendaSupabaseIntegrationTest test
```

`API.md` e `ARQUITETURA.md` são documentos históricos; o contrato deste módulo está descrito acima.
