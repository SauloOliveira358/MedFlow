# Documentação de Aprendizados: Modo Escuro, Acessibilidade e Usabilidade Mobile

## 1. Visão Geral
Atendendo à solicitação de evolução da plataforma sem descaracterizar a identidade visual clara e mantendo a ótima usabilidade já existente nos celulares, foram implementados e aprimorados três pilares essenciais:
1. **Modo Escuro (Dark Mode)**: Inicia **automaticamente** de acordo com a preferência do Windows/dispositivo (`prefers-color-scheme`), com opção de alternância manual a qualquer momento.
2. **Eliminação de Fundos Brancos Residuais**: Mapeamento e substituição profunda de todos os fundos brancos/claros dentro de cartões, colunas de dias, modais de adicionar/replicar horários, seletor de horários, caixas de resumo de agendamento, prontuários e painéis de controle do médico e do paciente.
3. **Central de Acessibilidade (A11y)**: Configurações de tamanho do texto, alto contraste, fonte com legibilidade reforçada e redução de movimentos/animações.
4. **Refinamentos de Usabilidade Mobile**: Ajustes cirúrgicos em touch targets e compensação de padding para evitar sobreposição da barra de navegação inferior flutuante (`.bottom-navigation`).

---

## 2. Modo Escuro e Detecção Automática (Windows / Sistema)
- **Comportamento Padrão Inicial**:
  - Quando o usuário acessa o MedFlow sem ter definido uma preferência manual anterior, o tema inicial é `'system'` (Automático).
  - Caso o Windows ou o dispositivo esteja no modo escuro, a plataforma ativa o tema escuro imediatamente sem requerer nenhuma ação do usuário.
- **Harmonia Visual**:
  - Paleta em tons de ardósia e verde floresta profundo (`#0d1512` no fundo da aplicação, `#14201b` nos painéis/cartões principais, `#1a2923` nas caixas internas e `#263830` nas bordas).
  - O texto utiliza `--ink: #e5eee9` e `--muted: #95a89e`, garantindo taxa de contraste superior a 7:1 (WCAG AAA).
- **Varredura Completa de Elementos Internos**:
  - **Área do Especialista (Médico)**:
    - Colunas diárias do `GerenciadorAgendaMedico` (dias normais, dia de hoje e dias passados).
    - Modal de Adicionar Horários (caixa de horário específico, faixa de horários e botões de grade rápida).
    - Modal de Replicar Horários (caixas de seleção de data de origem e destino, setas de fluxo).
    - Lista de consultas em `ConsultasMedico` (cartões de consulta com data, hora, paciente e botões de presença).
    - Editor e visualizador de documentos em `Prontuarios` (caixa de upload/dropzone, lista de exames e laudos, pré-visualizador de PDF e textos).
  - **Área do Paciente**:
    - Tela de boas-vindas e dashboard `PainelPaciente` (`patient-hero`, tags flutuantes `floating-label`, `hero-arch`, `specialty-card`, `appointment-card`).
    - Fluxo de agendamento `AgendamentoConsulta` (barra de progresso `booking-progress`, caixa com dados do paciente selecionado, novo paciente, resumo de agendamento e faixa de datas `date-strip` e horários `time-slots`).
    - Seletor de data e horário `SeletorData` (grade de botões e aviso de horários indisponíveis).
- **Atalhos**:
  - `Alt + T` / `Option + T` alterna instantaneamente entre claro e escuro.

---

## 3. Acessibilidade (A11y)
- **Controle de Escala de Fonte**:
  - Três níveis selecionáveis: Padrão (100%), Grande (115%) e Muito Grande (130%).
  - Aplicado via `data-font-size="normal|large|xlarge"`.
- **Alto Contraste**:
  - Ativado via `data-high-contrast="true"`.
  - Reforça espessura de bordas para 2px em todos os cartões, inputs e modais, intensifica peso de títulos e fornece anel de foco amarelo de alto contraste (`outline: 3px solid #ffbf00`).
- **Tipografia Mais Legível**:
  - Ativado via `data-readable-font="true"`.
  - Aplica maior espaçamento entre caracteres (`letter-spacing: 0.03em`) e palavras, com entrelinha de 1.7, especialmente útil para usuários com dislexia e baixa acuidade visual.
- **Redução de Animações**:
  - Ativado via `data-reduce-motion="true"`.
  - Força a duração de todas as transições e keyframes CSS para quase zero (`0.001ms`), respeitando usuários com transtorno vestibular e sensibilidade a movimentos.
- **Atalhos Globais**:
  - `Alt + A`: Abre ou fecha o modal de acessibilidade.
  - `Esc`: Fecha o modal em foco.

---

## 4. Usabilidade Mobile (Refinamentos Pontuais)
- **Prevenção de Sobreposição por Barra Inferior**:
  - Adicionado `padding-bottom: calc(85px + env(safe-area-inset-bottom, 0px)) !important` na classe `.page-content` para telas com largura até 767px.
  - Garante que botões de ação e rodapés de formulários nunca fiquem ocultos atrás da `.bottom-navigation`.
- **Áreas de Toque (Touch Targets)**:
  - Garantida altura mínima acessível (`min-height: 40px` a `44px`) para todos os botões e links navegáveis.
- **Cabeçalho Otimizado**:
  - Botões rápidos de acessibilidade e alternância de tema no cabeçalho mobile possuem tamanho proporcional (`36px x 36px`) para fácil acesso sem comprometer o espaço do título da tela.

---

## 5. Estrutura de Arquivos Criados / Modificados
1. `frontend/medflow-frontend/src/context/AcessibilidadeContext.jsx`:
   - Provider global e hook `useAcessibilidade()`, com inicialização automática baseada em `prefers-color-scheme`.
2. `frontend/medflow-frontend/src/components/common/ModalAcessibilidade.jsx`:
   - Modal acessível com controles para tema (Claro, Escuro e Automático), fontes, contraste e redução de movimentos.
3. `frontend/medflow-frontend/src/components/doutor/GerenciadorAgendaMedico.jsx`:
   - Migração para variáveis semânticas de superfície eliminando qualquer fundo branco residual nos dias e modais.
4. `frontend/medflow-frontend/src/pages/doutor/ConsultasMedico.jsx`:
   - Cartões de agendamento e botões de presença adaptados para temas claro e escuro.
5. `frontend/medflow-frontend/src/pages/paciente/AgendamentoConsulta.jsx`:
   - Elementos de passo a passo, resumo de agendamento e dados do paciente integrados ao tema escuro.
6. `frontend/medflow-frontend/src/components/common/Prontuarios.jsx`:
   - Dropzone de upload, documentos e caixas de texto com cores de superfície semânticas.
7. `frontend/medflow-frontend/src/components/common/SeletorData.jsx`:
   - Caixas de estado vazio e seletores de horário sincronizados com o tema.
8. `frontend/medflow-frontend/src/styles/global.css`:
   - Variáveis semânticas em `:root` e `[data-theme="dark"]`, com regras completas eliminando fundos brancos em todos os componentes.
9. `frontend/medflow-frontend/src/test/a11y_theme.test.jsx`:
   - Suíte com 7 testes automatizados validando detecção automática de sistema, persistência e modais.

---

## 6. Cobertura de Testes
- **Frontend Vitest**: **52 testes passando (100%)** em 9 suítes completas.
- **Frontend Build**: `vite build` executado e gerado com sucesso.
