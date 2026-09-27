import { useCallback, useEffect, useState } from 'react';
import useDrawerFocus from '../hooks/useDrawerFocus';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { Brand, Avatar } from '../components/common/UI';
import Icon from '../components/common/Icon';
const menus = {
  paciente: [
    ['', 'Início', 'dashboard'],
    ['agendar', 'Agendar consulta', 'search'],
    ['agendamentos', 'Meus agendamentos', 'calendar'],
    ['historico', 'Histórico', 'clock'],
    ['notificacoes', 'Notificações', 'bell'],
    ['perfil', 'Meu perfil', 'user'],
  ],
  medico: [
    ['', 'Dashboard', 'dashboard'],
    ['horarios', 'Liberar horários', 'clock'],
    ['agenda', 'Minha agenda', 'calendar'],
    ['agendados', 'Agendados & Presença', 'clipboard'],
    ['pacientes', 'Pacientes', 'users'],
    ['prontuarios', 'Prontuários', 'file'],
    ['notificacoes', 'Notificações', 'bell'],
    ['perfil', 'Meu perfil', 'user'],
  ],
  clinica: [
    ['', 'Dashboard', 'dashboard'],
    ['agenda', 'Agenda geral', 'calendar'],
    ['agendamentos', 'Agendamentos', 'clipboard'],
    ['pacientes', 'Pacientes', 'users'],
    ['profissionais', 'Profissionais', 'stethoscope'],
    ['prontuarios', 'Prontuários', 'file'],
    ['especialidades', 'Especialidades', 'sparkles'],
    ['relatorios', 'Relatórios', 'chart'],
    ['configuracoes', 'Configurações', 'settings'],
  ],
};
const titles = {
  paciente: 'Área do paciente',
  medico: 'Área do especialista',
  clinica: 'Área da clínica',
};
export function Sidebar({ area, open, onClose }) {
  const { data, patientId, doctorId } = useDemo();
  const person =
    area === 'paciente'
      ? data.patients.find((p) => p.id === patientId)
      : area === 'medico'
        ? data.doctors.find((d) => d.id === doctorId)
        : {
            name: data.clinic?.name || 'Equipe da clínica',
            photo: data.clinic?.photo || data.clinic?.logo,
          };
  return (
    <>
      <div className={`sidebar-scrim ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Brand />
        <div className="workspace-tag">
          <span className="icon-box sage">
            <Icon
              name={area === 'paciente' ? 'heart' : area === 'medico' ? 'stethoscope' : 'users'}
              size={19}
            />
          </span>
          <div>
            <strong>{titles[area]}</strong>
            <small>{area === 'paciente' ? 'Seu espaço de cuidado' : data.clinic.name}</small>
          </div>
          <button className="icon-button close-menu" onClick={onClose} aria-label="Fechar menu">
            <Icon name="x" />
          </button>
        </div>
        <span className="nav-label">
          {area === 'paciente' ? 'MEU CUIDADO' : 'ESPAÇO DE TRABALHO'}
        </span>
        <nav aria-label={`Menu ${titles[area]}`}>
          {menus[area].map(([path, label, icon]) => (
            <NavLink
              end={!path}
              key={path}
              to={`/${area}${path ? '/' + path : ''}`}
              onClick={onClose}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              <Icon name="right" size={14} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="care-tip">
            <Icon name="flower" size={27} />
            <strong>Cuidado que conecta.</strong>
            <p>
              Mais leveza para sua rotina.
              <br />
              Mais tempo para você.
            </p>
          </div>
          <Link
            className="sidebar-profile"
            to={`/${area}/${area === 'clinica' ? 'configuracoes' : 'perfil'}`}
          >
            <Avatar person={person} />
            <span>
              <strong>{person.name}</strong>
              <small>
                {area === 'paciente' ? 'Seu bem-estar importa' : 'Perfil demonstrativo'}
              </small>
            </span>
            <Icon name="right" size={15} />
          </Link>
        </div>
      </aside>
    </>
  );
}
export function MobileBottomNavigation({ area }) {
  const list =
    area === 'paciente'
      ? [
          ['', 'Início', 'dashboard'],
          ['agendar', 'Buscar', 'search'],
          ['agendamentos', 'Consultas', 'calendar'],
          ['notificacoes', 'Avisos', 'bell'],
          ['perfil', 'Perfil', 'user'],
        ]
      : area === 'medico'
        ? [
            ['', 'Início', 'dashboard'],
            ['agenda', 'Agenda', 'calendar'],
            ['agendados', 'Agendados', 'clipboard'],
            ['pacientes', 'Pacientes', 'users'],
          ]
        : [
            ['', 'Início', 'dashboard'],
            ['agenda', 'Agenda', 'calendar'],
            ['pacientes', 'Pacientes', 'users'],
            ['profissionais', 'Equipe', 'stethoscope'],
          ];
  return (
    <nav className="bottom-navigation" aria-label="Navegação mobile">
      {list.map(([path, label, icon]) => (
        <NavLink end={!path} key={path} to={`/${area}${path ? '/' + path : ''}`}>
          <Icon name={icon} size={21} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
export function TopHeader({ area, onMenu }) {
  const navigate = useNavigate();
  const { account, logout } = useDemo();
  return (
    <header className="top-header">
      <div className="top-context">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Abrir menu">
          <Icon name="menu" />
        </button>
        <span className="header-area">{titles[area]}</span>
        <span className="demo-pill">{area === 'clinica' ? 'Administrador' : 'Demonstração'}</span>
      </div>
      <div className="header-tools">
        <span className="signed-in-email">{account.email}</span>
        {area !== 'clinica' && (
          <Link
            className="icon-button notification-link"
            to={`/${area}/notificacoes`}
            aria-label="Ver notificações"
          >
            <Icon name="bell" />
          </Link>
        )}
        <button
          className="button secondary logout-button"
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
        >
          <Icon name="logout" size={16} />
          Sair
        </button>
      </div>
    </header>
  );
}
export default function AreaLayout({ area }) {
  const { toast, setToast, storageError } = useDemo();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  useDrawerFocus(open, closeMenu);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.title = `MedFlow · ${titles[area]}`;
  }, [location.pathname, area]);
  return (
    <div className={`app-layout theme-${area}`}>
      <a className="skip-link" href="#main">
        Pular para conteúdo
      </a>
      <Sidebar area={area} open={open} onClose={() => setOpen(false)} />
      <div className="workspace">
        <TopHeader area={area} onMenu={() => setOpen(true)} />
        <main id="main" className="page-content">
          {storageError && (
            <p className="error-message" role="alert">
              {storageError}
            </p>
          )}
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            medflow. <span>Cuidado que conecta.</span>
          </span>
          <small>Dados fictícios · Feito para demonstrar</small>
        </footer>
      </div>
      <MobileBottomNavigation area={area} />
      {toast && (
        <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
          <Icon name={toast.type === 'error' ? 'help' : 'check'} />
          <span>{toast.message}</span>
          <button aria-label="Fechar notificação" onClick={() => setToast(null)}>
            <Icon name="x" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
