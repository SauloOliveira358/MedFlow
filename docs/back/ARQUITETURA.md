# Arquitetura e modelagem propostas

Diagramas conceituais para o desenvolvimento futuro do servidor. O único fluxo implementado agora é Angular → ClinicService → localStorage.

```mermaid
flowchart LR
 U[Usuário] --> F[Frontend Angular]
 F -->|Atual: chamada local| M[ClinicService demonstrativo]
 M --> L[(localStorage)]
 F -.->|Futuro: HTTPS JSON| C[Controllers Java]
 C -.-> S[Serviços de aplicação e domínio]
 S -.-> R[Repositórios]
 R -.-> B[(Banco relacional)]
 S -.-> A[Autenticação / autorização / auditoria]
```

Pacotes sugeridos: `controller`, `dto`, `service`, `domain`, `repository`, `security`, `exception`. Controllers traduzem HTTP; DTOs delimitam dados; serviços coordenam transações; entidades encapsulam estados; repositórios persistem; tratamento global de exceções converte erros sem expor detalhes internos. Escolher o banco e configurar migrações na etapa de backend.

## Classes UML conceituais

```mermaid
classDiagram
class Patient {
  -UUID id
  -String name
  -String email
  -String phone
  -LocalDate birth
  +updateContact(email, phone)
}
class Professional {
  -UUID id
  -String name
  -String crm
  +changeAvailability(start, end)
}
class Specialty {
  -UUID id
  -String name
  +rename(name)
}
class Availability {
  -UUID id
  -LocalTime start
  -LocalTime end
  +contains(time) boolean
}
class Appointment {
  -UUID id
  -LocalDate date
  -LocalTime time
  -Status status
  -long version
  +reschedule(date, time)
  +cancel()
  +complete()
}
class User {
  -UUID id
  -String email
  -String passwordHash
  -Role role
  +canPerform(action) boolean
}
class AuditEvent {
  -UUID id
  -Instant at
  -String action
}
class AppointmentRepository {
  <<interface>>
  +save(appointment)
  +findOccupied(professional, date, time)
}
class SchedulingService {
  -AppointmentRepository repository
  +schedule(command)
  +reschedule(command)
  +cancel(id)
}
Specialty "1" <-- "0..*" Professional
Professional "1" *-- "1..*" Availability
Patient "1" <-- "0..*" Appointment
Professional "1" <-- "0..*" Appointment
User "1" <-- "0..*" AuditEvent
SchedulingService --> AppointmentRepository
SchedulingService --> Appointment
```

Encapsulamento: transições por métodos, não setters livres de status. Composição: disponibilidade pertence ao profissional. Interface de repositório separa persistência e domínio. Não há necessidade demonstrada de herança entre paciente e profissional; evitar hierarquia artificial. Essas decisões são propostas, não classes Java já implementadas.

## DER proposto

```mermaid
erDiagram
 PATIENT ||--o{ APPOINTMENT : agenda
 PROFESSIONAL ||--o{ APPOINTMENT : atende
 SPECIALTY ||--o{ PROFESSIONAL : classifica
 PROFESSIONAL ||--|{ AVAILABILITY : possui
 USER ||--o{ AUDIT_EVENT : executa
 PATIENT {
  uuid id PK
  varchar name
  varchar email
  varchar phone
  date birth
 }
 SPECIALTY {
  uuid id PK
  varchar name UK
 }
 PROFESSIONAL {
  uuid id PK
  uuid specialty_id FK
  varchar name
  varchar crm UK
 }
 AVAILABILITY {
  uuid id PK
  uuid professional_id FK
  time start
  time end
 }
 APPOINTMENT {
  uuid id PK
  uuid patient_id FK
  uuid professional_id FK
  date date
  time time
  varchar status
  varchar notes
  bigint version
 }
 USER {
  uuid id PK
  varchar name
  varchar email UK
  varchar password_hash
  varchar role
 }
 AUDIT_EVENT {
  uuid id PK
  uuid user_id FK
  timestamp at
  varchar action
  uuid resource_id
 }
```

Definir restrição de exclusividade para profissional/data/hora enquanto status diferente de Cancelado. O mecanismo exato depende do banco: índice único condicional ou tabela de slots com reserva transacional. Não confiar somente em verificar e depois inserir, pois existe condição de corrida. Remarcação deve liberar/reservar de forma atômica e comparar versão. Exclusões físicas de pessoas com consultas não estão no escopo; planejar inativação.

## Três fluxos ponta a ponta planejados

1. **Criar consulta:** formulário solicita disponibilidade → GET availability → usuário escolhe → POST appointments → autenticar/autorizar → validar IDs, data, expediente e exclusividade → persistir consulta/auditoria na mesma transação → 201 → atualizar agenda e indicadores. Se outra requisição ganhar a vaga: 409, sem gravação parcial.
2. **Remarcar:** abrir consulta existente → editar e PATCH com versão → servidor valida estado e versão → confere nova vaga → atualiza reserva e auditoria em transação → 200 → frontend atualiza lista. Conflito: manter reserva antiga e responder 409.
3. **Cancelar:** usuário confirma → POST cancel → servidor valida permissão/estado → marca Cancelado e registra auditoria → commit → 200 → frontend libera visualmente o horário. Falha de banco: rollback e erro público, sem mostrar confirmação de sucesso.

Na demonstração atual essas etapas usam apenas o serviço local e o armazenamento do navegador. Não há tráfego HTTP ou transação real.
