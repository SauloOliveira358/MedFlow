# MedFlow

<img src="frontend/medflow-frontend/public/logo.svg" width="56" alt="Símbolo MedFlow">

**Gestão que cuida.** Frontend para organizar a rotina de pequenas clínicas: agenda, pacientes, profissionais, especialidades, usuários demonstrativos, histórico e dashboard.

## Executar o frontend

Pré-requisitos: Node `^22.22.3`, `^24.15.0` ou `>=26.0.0`, conforme Angular 22 instalado; npm. Ambiente validado: Node 24.16.0.

```powershell
cd frontend/medflow-frontend
npm ci
npm start
```

Acesse `http://localhost:4200` e clique em **Explorar demonstração**. Alternativamente, use `admin@medflow.demo` / `MedFlow123!`.

```powershell
npm run build
npm test -- --watch=false
```

## Escopo desta versão

Interface Angular responsiva com cadastro/edição, agenda por data, busca e filtros, horários livres, remarcação, cancelamento confirmado, conclusão e histórico. Dados fictícios persistem no navegador com `localStorage`; login e perfis são demonstrativos. Não use dados reais.

O backend e o banco **não foram implementados nesta entrega**. Não é necessário configurar banco para executar o frontend. O diretório `backend/` existente foi preservado. Esta entrega ainda não corresponde ao MVP integrado exigido pelo PDF.

## Organização

```text
frontend/medflow-frontend/   Aplicação Angular
backend/                    Scaffold existente, preservado
 docs/
   front/                   Produto, frontend, UX, requisitos e testes
   back/                    Contrato e arquitetura para integração futura
```

Arquitetura atual: componentes Angular → ClinicService → armazenamento local. Tecnologias: Angular 22, TypeScript, CSS, Forms, signals e Vitest. Sem bibliotecas de interface adicionais.

[Documentação completa](docs/README.md) · [Frontend](docs/front/README.md) · [Integração futura](docs/back/README.md) · [Changelog](CHANGELOG.md) · [Uso de IA](AI_USAGE.md)

## Evidências e limitações

Build de produção e 9 testes automatizados passaram em 26/09/2026. A verificação visual por navegador e as capturas ficaram pendentes por falha da ferramenta da sessão. Wireframes e decisões de layout estão em [UX/UI](docs/front/UX_UI.md), e o roteiro manual está em [Testes](docs/front/TESTES.md). Não foram criados commits, tags, releases ou deploy.
