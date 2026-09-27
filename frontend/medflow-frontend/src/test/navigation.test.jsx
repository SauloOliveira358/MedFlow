import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DemoProvider } from '../context/DemoContext';
import App from '../App';
import { today, addDays } from '../utils/date';
it('agenda pela interface e encontra o mesmo registro no paciente, médico e clínica', async () => {
  const user = userEvent.setup();
  render(
    <DemoProvider>
      <MemoryRouter initialEntries={['/paciente/agendar']}>
        <App />
      </MemoryRouter>
    </DemoProvider>,
  );
  await user.type(await screen.findByLabelText('E-mail'), 'maria@medflow.demo');
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'MedFlow123!');
  await user.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  await user.click(await screen.findByRole('button', { name: /Dermatologia Cuidado/ }));
  await user.click(await screen.findByRole('button', { name: /Selecionar profissional/ }));
  fireEvent.change(screen.getByLabelText('Abrir calendário completo'), {
    target: { value: addDays(today(), 3) },
  });
  await user.click(screen.getByRole('button', { name: '16:00', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Continuar', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Continuar', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Confirmar agendamento', exact: true }));
  expect(
    await screen.findByRole('heading', { name: 'Consulta agendada com sucesso!' }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Ver meus agendamentos', exact: true }));
  expect(await screen.findByText('· 16:00')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Sair', exact: true }));
  await user.type(await screen.findByLabelText('E-mail'), 'ana@medflow.demo');
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'MedFlow123!');
  await user.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  await user.click(await screen.findByRole('link', { name: 'Minha agenda', exact: true }));
  fireEvent.change(await screen.findByLabelText('Data'), {
    target: { value: addDays(today(), 3) },
  });
  expect(await screen.findByRole('button', { name: /16:00.*Maria Oliveira/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Sair', exact: true }));
  await user.type(await screen.findByLabelText('E-mail'), 'admin@medflow.demo');
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'MedFlow123!');
  await user.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  await user.click(await screen.findByRole('link', { name: 'Agenda geral', exact: true }));
  fireEvent.change(await screen.findByLabelText('Data'), {
    target: { value: addDays(today(), 3) },
  });
  expect(
    await screen.findByRole('button', { name: /16:00.*Maria Oliveira.*Dra. Ana Silva/ }),
  ).toBeInTheDocument();
});
