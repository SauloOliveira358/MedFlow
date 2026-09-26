import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicService } from './clinic.service';
import { Appointment, localDate } from './models';
type Page =
  | 'Dashboard'
  | 'Agenda'
  | 'Pacientes'
  | 'Profissionais'
  | 'Especialidades'
  | 'Histórico'
  | 'Usuários';
@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly clinic = inject(ClinicService);
  readonly data = this.clinic.data;
  readonly pages: Page[] = [
    'Dashboard',
    'Agenda',
    'Pacientes',
    'Profissionais',
    'Especialidades',
    'Histórico',
    'Usuários',
  ];
  readonly icons = ['◫', '▦', '♧', '♡', '⊞', '↺', '♙'];
  readonly page = signal<Page>('Dashboard');
  readonly loggedIn = signal(false);
  readonly today = localDate();
  readonly date = signal(this.today);
  readonly search = signal('');
  readonly professionalFilter = signal('');
  readonly statusFilter = signal('');
  readonly notice = signal('');
  readonly error = signal('');
  readonly modal = signal('');
  email = 'admin@medflow.demo';
  password = '';
  loginError = '';
  form: Record<string, string> = {};
  editingId = '';
  cancelTarget: Appointment | null = null;
  private returnFocus: HTMLElement | null = null;
  readonly appointments = computed(() =>
    this.data()
      .appointments.filter(
        (a) =>
          a.date === this.date() &&
          (!this.professionalFilter() || a.professionalId === this.professionalFilter()) &&
          (!this.statusFilter() || a.status === this.statusFilter()) &&
          this.matches(this.patient(a.patientId) + ' ' + this.professional(a.professionalId)),
      )
      .sort((a, b) => a.time.localeCompare(b.time)),
  );
  readonly todayAppointments = computed(() =>
    this.data().appointments.filter((a) => a.date === this.today),
  );
  readonly confirmed = computed(
    () => this.todayAppointments().filter((a) => a.status === 'Confirmado').length,
  );
  readonly completed = computed(
    () => this.todayAppointments().filter((a) => a.status === 'Concluído').length,
  );
  readonly filteredHistory = computed(() =>
    this.data().history.filter((h) => this.matches(h.text)),
  );
  readonly recordCount = computed(() => {
    const rows =
      this.page() === 'Pacientes'
        ? this.data().patients
        : this.page() === 'Profissionais'
          ? this.data().professionals
          : this.page() === 'Especialidades'
            ? this.data().specialties
            : this.data().users;
    return rows.filter((r) => this.matches(r.name)).length;
  });
  readonly slots = Array.from(
    { length: 48 },
    (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  );
  login() {
    if (this.email.toLowerCase() === 'admin@medflow.demo' && this.password === 'MedFlow123!') {
      this.loggedIn.set(true);
      this.password = '';
      this.loginError = '';
    } else this.loginError = 'Use as credenciais de demonstração exibidas abaixo.';
  }
  demo() {
    this.loggedIn.set(true);
    this.loginError = '';
  }
  logout() {
    this.loggedIn.set(false);
    this.go('Dashboard');
    this.close();
  }
  go(page: Page) {
    this.page.set(page);
    this.search.set('');
    this.notice.set('');
  }
  matches(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(
        this.search()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase(),
      );
  }
  patient(id: string) {
    return this.data().patients.find((p) => p.id === id)?.name ?? 'Paciente não encontrado';
  }
  professional(id: string) {
    return (
      this.data().professionals.find((p) => p.id === id)?.name ?? 'Profissional não encontrado'
    );
  }
  specialty(id: string) {
    return this.data().specialties.find((s) => s.id === id)?.name ?? 'Sem especialidade';
  }
  initials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  }
  moveDate(days: number) {
    const d = new Date(this.date() + 'T12:00:00');
    d.setDate(d.getDate() + days);
    this.date.set(localDate(d));
  }
  open(kind: string, record?: object) {
    this.returnFocus = document.activeElement as HTMLElement;
    this.error.set('');
    this.editingId = record ? (record as { id: string }).id : '';
    this.form = record
      ? ({ ...record } as Record<string, string>)
      : {
          name: '',
          email: '',
          phone: '',
          birth: '',
          crm: '',
          specialtyId: this.data().specialties[0]?.id ?? '',
          start: '08:00',
          end: '18:00',
          role: 'Recepção',
          patientId: '',
          professionalId: '',
          date: this.date() < this.today ? this.today : this.date(),
          time: '',
          notes: '',
        };
    this.modal.set(kind);
    setTimeout(() => document.querySelector<HTMLDialogElement>('dialog')?.showModal());
  }
  close() {
    document.querySelector<HTMLDialogElement>('dialog')?.close();
    this.modal.set('');
    this.cancelTarget = null;
    this.returnFocus?.focus();
  }
  unavailable(time: string) {
    const p = this.data().professionals.find((p) => p.id === this.form['professionalId']);
    return (
      !p ||
      time < p.start ||
      time >= p.end ||
      this.data().appointments.some(
        (a) =>
          a.id !== this.editingId &&
          a.professionalId === p.id &&
          a.date === this.form['date'] &&
          a.time === time &&
          a.status !== 'Cancelado',
      )
    );
  }
  save() {
    this.error.set('');
    const f = this.form;
    const id = this.editingId || crypto.randomUUID();
    const d = this.data();
    if (this.modal() === 'Agendamento') {
      const result = this.clinic.saveAppointment({
        id,
        patientId: f['patientId'],
        professionalId: f['professionalId'],
        date: f['date'],
        time: f['time'],
        notes: f['notes']?.trim() ?? '',
        status: 'Confirmado',
      });
      if (result) {
        this.error.set(result);
        return;
      }
    } else {
      if (!f['name']?.trim() || f['name'].trim().length < 2) {
        this.error.set('Informe um nome com pelo menos 2 caracteres.');
        return;
      }
      const name = f['name'].trim();
      if (
        ['Paciente', 'Usuário'].includes(this.modal()) &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f['email'])
      ) {
        this.error.set('Informe um e-mail válido.');
        return;
      }
      if (this.modal() === 'Paciente') {
        if (
          !/^\d{10,11}$/.test(f['phone'].replace(/\D/g, '')) ||
          !f['birth'] ||
          f['birth'] > this.today
        ) {
          this.error.set('Informe um telefone com DDD e uma data de nascimento válida.');
          return;
        }
        const row = { id, name, email: f['email'].trim(), phone: f['phone'], birth: f['birth'] };
        this.clinic.save(
          {
            ...d,
            patients: this.editingId
              ? d.patients.map((p) => (p.id === id ? row : p))
              : [...d.patients, row],
          },
          `Paciente ${name} ${this.editingId ? 'atualizado' : 'cadastrado'}.`,
        );
      }
      if (this.modal() === 'Profissional') {
        if (
          !f['crm']?.trim() ||
          !d.specialties.some((s) => s.id === f['specialtyId']) ||
          !/^\d{2}:(00|30)$/.test(f['start']) ||
          !/^\d{2}:(00|30)$/.test(f['end']) ||
          f['start'] >= f['end']
        ) {
          this.error.set('Confira CRM, especialidade e expediente em intervalos de 30 minutos.');
          return;
        }
        if (
          d.professionals.some(
            (p) => p.id !== id && p.crm.toLowerCase() === f['crm'].trim().toLowerCase(),
          )
        ) {
          this.error.set('Este CRM já está cadastrado.');
          return;
        }
        if (
          d.appointments.some(
            (a) =>
              a.professionalId === id &&
              a.status === 'Confirmado' &&
              a.date >= this.today &&
              (a.time < f['start'] || a.time >= f['end']),
          )
        ) {
          this.error.set(
            'O novo expediente exclui consultas confirmadas. Remarque ou cancele essas consultas primeiro.',
          );
          return;
        }
        const row = {
          id,
          name,
          crm: f['crm'].trim(),
          specialtyId: f['specialtyId'],
          start: f['start'],
          end: f['end'],
        };
        this.clinic.save(
          {
            ...d,
            professionals: this.editingId
              ? d.professionals.map((p) => (p.id === id ? row : p))
              : [...d.professionals, row],
          },
          `Profissional ${name} atualizado.`,
        );
      }
      if (this.modal() === 'Especialidade') {
        if (d.specialties.some((s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) {
          this.error.set('Esta especialidade já está cadastrada.');
          return;
        }
        this.clinic.save(
          {
            ...d,
            specialties: this.editingId
              ? d.specialties.map((s) => (s.id === id ? { id, name } : s))
              : [...d.specialties, { id, name }],
          },
          `Especialidade ${name} atualizada.`,
        );
      }
      if (this.modal() === 'Usuário') {
        if (
          d.users.some(
            (u) => u.id !== id && u.email.toLowerCase() === f['email'].trim().toLowerCase(),
          )
        ) {
          this.error.set('Este e-mail já está cadastrado.');
          return;
        }
        const row = {
          id,
          name,
          email: f['email'].trim(),
          role: f['role'] as 'Administrador' | 'Recepção',
        };
        this.clinic.save(
          {
            ...d,
            users: this.editingId ? d.users.map((u) => (u.id === id ? row : u)) : [...d.users, row],
          },
          `Usuário ${name} atualizado.`,
        );
      }
    }
    this.notice.set('Alterações salvas com sucesso.');
    this.close();
  }
  requestCancel(a: Appointment) {
    this.open('Cancelar consulta');
    this.cancelTarget = a;
  }
  cancel() {
    if (this.cancelTarget) this.changeStatus(this.cancelTarget, 'Cancelado');
    this.close();
  }
  changeStatus(a: Appointment, status: 'Cancelado' | 'Concluído') {
    this.clinic.save(
      {
        ...this.data(),
        appointments: this.data().appointments.map((x) => (x.id === a.id ? { ...x, status } : x)),
      },
      `Consulta de ${this.patient(a.patientId)} em ${a.date} às ${a.time}: ${status.toLowerCase()}.`,
    );
    this.notice.set(
      status === 'Cancelado'
        ? 'Consulta cancelada. O horário está disponível novamente.'
        : 'Atendimento concluído.',
    );
  }
}
