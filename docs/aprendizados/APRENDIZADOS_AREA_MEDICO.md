# MedFlow — Aprendizados e Guia Completo da Área do Médico (`/medico`)

> **Documento gerado a partir de testes exploratórios interativos no ambiente local (`http://127.0.0.1:4200`)**  
> **Público-Alvo**: Desenvolvedores, QA, Especialistas Médicos e Avaliadores Acadêmicos

---

## 1. Visão Geral da Área do Médico

A área do médico no MedFlow (`/medico`) é projetada para ser o centro operacional do profissional de saúde, combinando gestão de horários disponíveis, visualização de agenda, controle de presença e prontuário clínico.

### Rotas Disponíveis
* `/medico` — Dashboard com métricas rápidas (próximas consultas do dia, total de pacientes e atalhos).
* `/medico/horarios` — **Gerenciador de Horários Semanais**: liberação, exclusão e replicação de horários de atendimento.
* `/medico/agenda` — **Minha Agenda**: visualização em Dia / Semana / Mês com filtros e status de atendimento.
* `/medico/agendados` — **Agendados & Presença**: lista de pacientes do dia com botões de presença rápida.
* `/medico/pacientes` — Catálogo de pacientes vinculados aos atendimentos do médico.
* `/medico/prontuarios` — Prontuários eletrônicos com anotações, procedimentos e documentos.
* `/medico/notificacoes` — Central de notificações (novas consultas agendadas concorrentemente pelo Módulo 3).
* `/medico/perfil` — Perfil profissional (CRM, biografia, foto e especialidade).

---

## 2. Funcionamento do Gerenciador de Horários (`/medico/horarios`)

### 2.1 Estrutura Visual (7 Colunas Verticais)
* A tela organiza a semana de **Segunda-feira a Domingo**.
* Cabeçalho de navegação:
  * Botão `<` (Semana anterior)
  * Rótulo de intervalo: `Semana: DD de Mês a DD de Mês de AAAA`
  * Botão `>` (Próxima semana)
  * Botão `Semana Atual` (reseta a visualização para a semana de hoje)
  * Botão de topo: `Replicar horários na semana`
* O dia correspondente a **Hoje** recebe destaque visual com borda verde reforçada (`#54867b`) e badge "Hoje".

### 2.2 Adicionando Horários a um Dia
Ao clicar em qualquer coluna de dia, o modal **"Adicionar Horários em [Dia da Semana]"** é exibido com três modos de entrada:

1. **Modo 1: Horário Específico**:
   * O médico seleciona a hora e minuto no campo `time` (ex: `08:00`) e clica em **Adicionar Horário**.
   * Se o horário já existir na data, o sistema avisa: *"Este horário já está liberado nesta data."*.
2. **Modo 2: Faixa / Intervalo de Horários**:
   * Define um horário inicial (`De: 08:00`), um horário final (`Até: 12:00`) e o intervalo (`15, 20, 30, 45 ou 60 minutos`).
   * Clica no botão **+ Gerar Faixa de Horários**.
   * O algoritmo gera a sequência matemática (ex: `08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00`), junta com os horários existentes, remove duplicatas e salva no banco.
3. **Modo 3: Seleção Rápida por Botões Populares**:
   * Exibe botões com os horários comerciais mais comuns (`08:00` a `18:00`).
   * Clicar em um botão desativado adiciona o horário e o botão fica verde com checkmark (`15:00 ✓`).
   * Clicar em um botão ativado remove o horário imediatamente.

### 2.3 Exclusão de Horários
* Na coluna do dia, cada horário liberado possui um botão **✕**.
* **Proteção de Integridade**:
  * Se o horário estiver **Livre**: Clicar em `✕` remove o slot imediatamente e atualiza a agenda no backend (`PUT /api/medicos/{id}/agenda/{data}`).
  * Se o horário estiver **Agendado** por um paciente: O slot muda de cor para azul (`#eaf3fa`), exibe o primeiro nome do paciente e o botão `✕` é desabilitado. O sistema bloqueia a exclusão: *"Este horário já está agendado por um paciente e não pode ser excluído diretamente."*.

### 2.4 Replicação de Horários entre Dias
* Permite copiar a grade completa de horários de um dia para outro com 1 clique.
* O modal solicita:
  * **Data de Origem**: Selecionada via calendário ou digitada no formato YYYY-MM-DD. O modal exibe a contagem e a lista dos horários que serão copiados.
  * **Data de Destino**: Onde os horários serão aplicados.
* Ao confirmar, a API replica a lista de slots para o dia de destino.

---

## 3. Fluxo de Atendimento e Mudança de Status (`/medico/agenda`)

O ciclo de vida da consulta segue uma máquina de estados:
1. `Pendente` / `Confirmado` (Paciente agendou)
2. `Compareceu` (Paciente chegou ao consultório / recepcionado)
3. `Em atendimento` (Médico iniciou a consulta)
4. `Concluído` (Consulta finalizada com sucesso)
5. `Cancelado` (Consulta cancelada pelo médico ou paciente, liberando o horário de volta na agenda)

---

## 4. Integração com o Módulo 3 (Concorrência e Assincronismo)

1. Quando o médico libera novos horários em `/medico/horarios`, eles passam a ficar disponíveis imediatamente para o fluxo de agendamento do paciente (`/paciente/agendar`).
2. Se múltiplos pacientes tentarem agendar o mesmo horário liberado, o motor do Módulo 3 garante que apenas 1 consiga a confirmação.
3. Assim que um paciente agenda com sucesso, a segunda aplicação assíncrona cria uma notificação na tabela `notificacoes` para o médico, que aparece imediatamente no sino de notificações (`/medico/notificacoes`).
