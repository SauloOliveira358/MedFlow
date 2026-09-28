# MedFlow — frontend React

Consulte [o guia técnico](../../docs/front/README.md).

```powershell
npm ci
npm start
```

Abra http://localhost:4200 para entrar. Pacientes e médicos usam contas cadastradas no backend; a clínica cadastra médicos em **Profissionais → Cadastrar médico**. Consulte o [guia de acessos](../../docs/front/ACESSO.md).

```powershell
npm run build
npm test
npm run test:e2e
```

Somente React, JavaScript/JSX e CSS. Context API organiza a sessão e o estado da interface; autenticação e persistência dependem do backend.
