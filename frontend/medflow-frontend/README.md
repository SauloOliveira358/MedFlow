# MedFlow — frontend React

Consulte [o guia técnico](../../docs/front/README.md).

```powershell
npm ci
npm start
```

Abra http://localhost:4200 para entrar. Pacientes usam **Criar minha conta**; a clínica cadastra médicos em **Profissionais → Cadastrar médico**. Administrador de teste: `admin@medflow.demo`, senha `MedFlow123!`. Consulte o [guia de acessos](../../docs/front/ACESSO.md).

```powershell
npm run build
npm test
npm run test:e2e
```

Somente React, JavaScript/JSX e CSS. Context API compartilha mocks entre as áreas; nenhum backend, banco ou API real é utilizado.
