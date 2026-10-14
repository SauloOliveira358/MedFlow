# MedFlow — Documentação Técnica do Sistema, POO e Frontend

> **Versão do Sistema**: MedFlow Fullstack (Spring Boot + React 19)  
> **Linguagens & Tecnologias**: Java 21, Spring Boot 3, React 19, Vite, PostgreSQL / Supabase, Tailwind/Vanilla CSS.

---

## 1. Visão Geral da Arquitetura do Sistema

O **MedFlow** é um sistema completo de gestão clínica e agendamento de consultas médicas projetado em uma arquitetura desacoplada cliente-servidor (**Fullstack**).

```
 ┌───────────────────────────────────────────────┐
 │               FRONTEND (React)                │
 │  React 19 + Vite + React Router + Context API │
 │  Porta: 4200 (http://localhost:4200)          │
 └──────────────────────┬────────────────────────┘
                        │ Requisições REST JSON
                        │ (HTTP / CORS)
                        ▼
 ┌───────────────────────────────────────────────┐
 │             BACKEND (Spring Boot)             │
 │  Controllers → Services → JPA Repositories    │
 │  Porta: 8085 (http://localhost:8085)          │
 └──────────────────────┬────────────────────────┘
                        │ JDBC / Hibernate SQL
                        ▼
 ┌───────────────────────────────────────────────┐
 │         BANCO DE DADOS (PostgreSQL)           │
 │  Tabelas: usuarios, medicos, consultas, etc.  │
 └───────────────────────────────────────────────┘
```

### 1.1 Camadas do Backend (Java / Spring Boot)
1. **Model / Domain (`com.medFlow.MedFlow.model`)**: Entidades JPA representando tabelas do banco de dados com seus relacionamentos, restrições e ciclos de vida.
2. **Repository (`com.medFlow.MedFlow.repository`)**: Interfaces que estendem `JpaRepository`, responsáveis pelo acesso a dados, consultas derivadas e queries com locks pessimistas.
3. **Service (`com.medFlow.MedFlow.service`)**: Camada de regras de negócio, validações transacionais (`@Transactional`), orquestração e concorrência.
4. **DTO (`com.medFlow.MedFlow.dto`)**: Objetos de transferência de dados que desacoplam as entidades internas das requisições e respostas da API externa.
5. **Controller (`com.medFlow.MedFlow.controller`)**: Endpoints REST que recebem requisições HTTP, realizam validação sintática (`@Valid`) e retornam respostas estruturadas em `ResponseEntity`.
6. **Exception (`com.medFlow.MedFlow.exception`)**: Tratamento centralizado de erros com `@RestControllerAdvice`.
7. **Config (`com.medFlow.MedFlow.config`)**: Configuração de segurança (Spring Security sem estado) e CORS.

---

## 2. Programação Orientada a Objetos (POO) no MedFlow

O backend do MedFlow foi inteiramente desenvolvido em **Java**, aplicando os 4 pilares fundamentais da POO e padrões de design corporativos consagrados.

---

### 2.1 Pilar 1: Abstração

A **Abstração** consiste em isolar características essenciais de um objeto do mundo real para dentro do domínio do software, ocultando complexidades desnecessárias.

#### Exemplo no Código: Modelagem de Entidades do Mundo Real
No MedFlow, o conceito de uma clínica e de um atendimento médico foi abstraído em entidades como `Usuario`, `Medico`, `Paciente`, `Consulta` e `Clinica`.

```java
// Localização: backend/src/main/java/com/medFlow/MedFlow/model/Consulta.java
@Entity
@Table(name = "consultas")
public class Consulta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Abstração de relacionamentos entre entidades
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    @Column(name = "data_consulta", nullable = false)
    private LocalDate dataConsulta;

    @Column(name = "horario_consulta", nullable = false, length = 5)
    private String horarioConsulta;

    @Column(nullable = false, length = 30)
    private String status = "Pendente";
}
```
* **Onde está a abstração**: Em vez de manipular strings e tabelas cruas, o desenvolvedor interage com o objeto `Consulta`, que possui um `Paciente`, um `Medico` e um estado de agendamento bem definidos.

---

### 2.2 Pilar 2: Encapsulamento

O **Encapsulamento** protege os dados internos de uma classe contra manipulação externa arbitrária, expondo apenas os métodos necessários e garantindo a integridade dos estados.

#### Exemplo no Código: Atributos Privados e Controle de Acesso
Todas as classes do modelo (`Medico`, `Paciente`, `Usuario`) possuem campos declarados como `private`. O acesso e modificação ocorrem de forma controlada através de métodos acessores gerados pelas anotações do Lombok (`@Getter`, `@Setter`):

```java
// Localização: backend/src/main/java/com/medFlow/MedFlow/model/Usuario.java
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Column(nullable = false, length = 20)
    private String perfil;

    // Getters e Setters controlados:
    public String getEmail() { return this.email; }
    public void setEmail(String email) { this.email = email; }
}
```

#### Encapsulamento de Regras de Negócio na Camada Service
O encapsulamento também é aplicado na lógica: um controller nunca altera o banco de dados diretamente; a classe `ConsultaService` encapsula as regras de transição de status e validação de conflito de horários:

```java
// Localização: backend/src/main/java/com/medFlow/MedFlow/service/ConsultaService.java
@Transactional
public ConsultaResponseDTO atualizarStatus(Long id, String status) {
    // Encapsula a máquina de estados permitida para uma consulta:
    var permitidos = Map.of(
        "Pendente", List.of("Confirmado", "Compareceu", "Nao compareceu"),
        "Confirmado", List.of("Compareceu", "Nao compareceu", "Em atendimento"),
        "Compareceu", List.of("Em atendimento"),
        "Em atendimento", List.of("Concluído")
    );

    if (!permitidos.getOrDefault(consulta.getStatus(), List.of()).contains(status)) {
        throw new RegraNegocioException("Transição de status inválida.");
    }
    consulta.setStatus(status);
    return resposta(consultaRepository.saveAndFlush(consulta));
}
```

---

### 2.3 Pilar 3: Herança

A **Herança** permite que classes filhas herdem atributos e comportamentos de classes mães, promovendo reuso de código e especialização de conceitos.

#### Exemplo 1: Hierarquia de Exceções Customizadas
O sistema define exceções próprias de domínio herdando de `RuntimeException`:

```java
// Localização: backend/src/main/java/com/medFlow/MedFlow/exception/RegraNegocioException.java
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem); // Chama o construtor da superclasse RuntimeException -> Exception -> Throwable
    }
}
```
* `RegraNegocioException` herda todos os mecanismos de rastreamento de pilha (`stackTrace`), mensagem e tratamento de erro do Java.

#### Exemplo 2: Herança de Interfaces no Spring Data JPA
As interfaces de repositório especializam contratos completos de persistência:

```java
// Localização: backend/src/main/java/com/medFlow/MedFlow/repository/MedicoRepository.java
public interface MedicoRepository extends JpaRepository<Medico, Long> {
    // MedicoRepository HERDA de JpaRepository:
    // - save(), findById(), delete(), findAll(), count(), flush()
}
```
* Hierarquia: `MedicoRepository` ➔ `JpaRepository` ➔ `ListCrudRepository` ➔ `Repository`.

---

### 2.4 Pilar 4: Polimorfismo

O **Polimorfismo** permite que objetos de diferentes tipos respondam à mesma mensagem ou invocação de método de maneiras distintas, seja por **sobreposição (override)** ou por **interfaces**.

#### Exemplo 1: Polimorfismo de Exceções com Handler Centralizado
No `GlobalExceptionHandler`, o método intercepta tanto exceções filhas específicas quanto a classe mãe genérica `Exception`, tratando cada tipo com sua devida resposta HTTP:

```java
// Localização: backend/src/main/java/com/medFlow/MedFlow/exception/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(RecursoNaoEncontradoException ex) {
        // Trata polimorficamente como HTTP 404
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(...);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRule(RegraNegocioException ex) {
        // Trata polimorficamente como HTTP 400
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(...);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        // Qualquer outra exceção não mapeada cai aqui polimorficamente como HTTP 500
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(...);
    }
}
```

#### Exemplo 2: Polimorfismo de Interface via Injeção de Dependências
As classes de serviço dependem de **interfaces** (`ConsultaRepository`, `PacienteRepository`) e não de implementações concretas:

```java
@Service
@RequiredArgsConstructor
public class ConsultaService {
    private final ConsultaRepository consultaRepository; // Polimorfismo: qualquer implementação gerada pelo Spring pode ser injetada em tempo de execução
    private final PacienteRepository pacientes;
}
```

---

### 2.5 Padrões de Projeto (Design Patterns) Implementados

1. **Builder Pattern**:
   - Usado amplamente na criação de objetos imutáveis ou complexos sem explosão de construtores:
   ```java
   var consulta = Consulta.builder()
       .medico(medico)
       .paciente(paciente)
       .clinica(clinica)
       .dataConsulta(request.getDataConsulta())
       .horarioConsulta(request.getHorarioConsulta())
       .status("Confirmado")
       .build();
   ```

2. **Data Transfer Object (DTO) Pattern**:
   - Evita expor entidades de banco e senhas diretamente na API:
   - Entradas: `AgendamentoRequestDTO`, `LoginRequestDTO`, `RegistroMedicoDTO`.
   - Saídas: `ConsultaResponseDTO`, `LoginResponseDTO`, `AgendaResponseDTO`.

3. **Repository Pattern**:
   - Encapsula as operações de armazenamento, recuperação e busca de dados, desacoplando o código de negócio de consultas SQL diretas.

4. **Dependency Injection (Inversão de Controle - IoC)**:
   - O Spring gerencia o ciclo de vida dos componentes (`@Service`, `@RestController`, `@Repository`) e injeta as dependências via construtor com `@RequiredArgsConstructor`.

---

## 3. Arquitetura e Funcionamento do Frontend (React)

O frontend do MedFlow foi construído com foco em **experiência do usuário (UX)** moderna, fluidez, responsividade e separação clara de responsabilidades por perfil de acesso.

---

### 3.1 Estrutura de Pastas e Componentes

```text
frontend/medflow-frontend/src/
├── App.jsx                     # Configuração de rotas principais e lazy loading
├── main.jsx                    # Ponto de entrada (Renderização do React DOM)
├── context/
│   └── DemoContext.jsx         # Gerenciamento de estado global e operações
├── services/
│   └── api.js                  # Integração HTTP fetch com o backend Spring Boot
├── layouts/
│   └── LayoutArea.jsx          # Shell de layout (Sidebar, Header e BottomNav)
├── pages/
│   ├── BoasVindas.jsx          # Tela de Login e Cadastro
│   ├── PaginasCompartilhadas.jsx # Notificações, Perfil e Configurações
│   ├── paciente/               # Painel, Agendamento em 5 passos, Histórico
│   ├── doutor/                 # Painel do Médico, Agenda diária/semanal, Atendimentos
│   └── clinica/                # Gestão de Profissionais, Especialidades, Relatórios
├── components/
│   ├── common/                 # Agenda, Pacientes, Prontuários, Modais, UI
│   ├── paciente/               # Cards de especialistas, filtros de busca
│   └── doutor/                 # Gerenciamento de horários e slots médicos
├── hooks/
│   ├── useRemoteAgenda.js      # Hook para carregamento reativo de agenda
│   └── useDrawerFocus.js       # Acessibilidade e foco em gavetas/menus
└── utils/
    ├── appointments.js         # Validações de conflitos de horário e regras de agendamento
    ├── auth.js                 # Helpers de autenticação e perfis
    └── date.js                 # Manipulação de datas no fuso horário da aplicação
```

---

### 3.2 Perfis de Usuário e Controle de Acesso (`Role-Based Access`)

O sistema divide as rotas e experiências em 3 perfis distintos:

| Perfil | Prefixo da Rota | Recursos Principais |
|---|---|---|
| **Paciente** | `/paciente` | Agendamento guiado em 5 etapas, próximas consultas, histórico médico, notificações e perfil. |
| **Médico** | `/medico` | Visualização da agenda (Dia/Semana/Mês), gestão de horários de atendimento, prontuários de pacientes atendidos e consultas agendadas. |
| **Clínica (Admin)** | `/clinica` | Visão geral da clínica, cadastro de novos médicos, especialidades médicas, agenda compartilhada e relatórios com exportação CSV. |

O componente `RequerConta.jsx` protege as rotas:
- Se o usuário não estiver autenticado, redireciona para a tela de login (`/`).
- Se tentar acessar a área de outro perfil (ex: um paciente tentando acessar `/medico`), redireciona automaticamente para a sua respectiva área autorizada.

---

### 3.3 Gerenciamento de Estado Global: `DemoContext.jsx`

O `DemoContext` atua como a **Store Central** da aplicação React usando a Context API:

```javascript
// Localização: frontend/medflow-frontend/src/context/DemoContext.jsx
const Store = createContext(null);

export function DemoProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const [data, setData] = useState(loadInitialData);

  // Ações globais:
  // - login(), logout(), registerPatient(), registerDoctor()
  // - bookAppointment(), cancelAppointment(), rescheduleAppointment()
  // - updateDoctorSchedule(), updatePatientProfile()
  
  return (
    <Store.Provider value={{ session, data, actions: { ... } }}>
      {children}
    </Store.Provider>
  );
}
```

#### Responsabilidades do Contexto:
1. **Persistência de Sessão**: Armazena o usuário logado em `sessionStorage` para manter a autenticação mesmo ao atualizar a página (F5).
2. **Sincronização Híbrida**: Faz chamadas assíncronas para a API Spring Boot (`apiBook`, `apiCancel`, `apiReschedule`, `apiGetAgenda`) e atualiza o estado local reativamente.
3. **Resiliência e Fallback**: Mantém cache local de dados e listas para navegação offline ou testes sem backend iniciado.

---

### 3.4 Comunicação Frontend ⇄ Backend: `api.js`

A camada `services/api.js` encapsula todas as requisições HTTP utilizando a `Fetch API` nativa do JavaScript:

- **Base Dinâmica**: Resolve automaticamente a URL do backend via variável de ambiente `VITE_API_URL` ou `http://localhost:8085`.
- **Tratamento de Erros Unificado (`handleResponse`)**:
  ```javascript
  async function handleResponse(response) {
    if (!response.ok) {
      let errorMsg = 'Ocorreu um erro na requisição.';
      try {
        const data = await response.json();
        // Extrai a mensagem de erro formatada pelo Spring Boot GlobalExceptionHandler
        errorMsg = data.message || data.error || errorMsg;
      } catch {
        errorMsg = `Erro ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }
    return response.json();
  }
  ```
- **Endpoints Mapeados**:
  * Autenticação: `POST /api/auth/login`, `POST /api/auth/registro/paciente`, `POST /api/auth/registro/medico`
  * Consultas: `GET /api/consultas/paciente/{id}`, `GET /api/consultas/medico/{id}`, `POST /api/consultas`, `PATCH /api/consultas/{id}/cancelar`
  * Agenda: `GET /api/agenda/medico/{id}?data=YYYY-MM-DD`, `POST /api/agenda/medico/{id}`
  * Especialidades e Médicos: `GET /api/especialidades`, `GET /api/medicos/catalogo`

---

### 3.5 Fluxo Completo de Agendamento (Paciente)

O agendamento foi implementado como uma máquina de estados visual dividida em **5 passos intuitivos**:

```
[1. Especialidade] ➔ [2. Profissional] ➔ [3. Data & Horário] ➔ [4. Dados do Paciente] ➔ [5. Confirmação]
```

1. **Passo 1 (Especialidade)**: O paciente escolhe a área médica desejada (ex: Cardiologia, Dermatologia, Clínica Geral).
2. **Passo 2 (Profissional)**: Exibe a lista filtrada de médicos credenciados, avaliações, endereço e tempo de consulta.
3. **Passo 3 (Data & Horário)**:
   - O calendário exibe apenas datas futuras válidas.
   - O componente consulta a API `GET /api/agenda/medico/{id}?data=...` para obter apenas os horários livres reais do médico.
   - Horários ocupados ou passados são automaticamente desabilitados.
4. **Passo 4 (Identificação)**: Formulário com nome, contato de emergência e observações.
5. **Passo 5 (Confirmação)**: Resumo visual dos dados e envio para `POST /api/consultas`.
   - Se houver conflito de horário concorrente, o backend rejeita com HTTP 400/409 e o frontend exibe alerta amigável orientando a escolher outro horário.

---

## 4. Resumo das Boas Práticas Adotadas no Projeto

1. **Clean Architecture / Separação de Preocupações**:
   - Modelos e dados desconhecem detalhes HTTP.
   - Controllers não fazem consultas SQL diretas.
   - Frontend desacoplado de regras de infraestrutura do banco de dados.
2. **Segurança de Concorrência no Banco**:
   - No backend, métodos críticos usam `@Lock(LockModeType.PESSIMISTIC_WRITE)` para impedir que dois pacientes agendem o mesmo horário simultaneamente (Double Booking).
3. **Design Responsivo & Acessibilidade**:
   - Menus adaptáveis para dispositivos móveis (`MobileBottomNavigation`) e desktop (`Sidebar`).
   - Estados de carregamento com esqueleto (`EsqueletoCarregamento`) e telas de estado vazio (`EstadoVazio`).
