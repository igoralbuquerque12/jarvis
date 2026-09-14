import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/configuracoes/api', label: 'Chaves de API' },
  { to: '/configuracoes/documentacao', label: 'Documentação' },
];

export function SettingsNav() {
  return (
    <div className="section-nav">
      <nav className="section-nav__tabs" aria-label="Configurações">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? 'section-nav__tab section-nav__tab--active'
                : 'section-nav__tab'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
