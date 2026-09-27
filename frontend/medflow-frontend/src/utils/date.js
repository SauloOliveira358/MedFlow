export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(value, amount) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return dateKey(d);
}
export const today = () => dateKey();
export function formatDate(value, options = { day: '2-digit', month: 'long' }) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', options);
}
export function age(birth) {
  const now = new Date();
  const b = new Date(`${birth}T12:00:00`);
  let n = now.getFullYear() - b.getFullYear();
  if (
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  )
    n--;
  return n;
}
export const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const sortAppointments = (rows) =>
  [...rows].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
export const active = (a) => ['Confirmado', 'Pendente', 'Em atendimento'].includes(a.status);
export const future = (a) =>
  active(a) && `${a.date}T${a.time}` >= `${today()}T${new Date().toTimeString().slice(0, 5)}`;
export function weekDays(date) {
  const d = new Date(`${date}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => addDays(date, i - ((d.getDay() + 6) % 7)));
}
export function monthDays(date) {
  const first = date.slice(0, 7) + '-01';
  const start = weekDays(first)[0];
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') && dateKey(new Date(`${value}T12:00:00`)) === value
  );
}
