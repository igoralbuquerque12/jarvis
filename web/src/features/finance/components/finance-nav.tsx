import { NavLink } from 'react-router-dom';
import { PrivacyToggle } from './privacy-toggle';

const NAV_ITEMS = [
  { to: '/financas', label: 'Visão Geral', end: true },
  { to: '/financas/transacoes', label: 'Transações', end: false },
  { to: '/financas/recorrencias', label: 'Recorrências', end: false },
  { to: '/financas/metas', label: 'Metas', end: false },
  { to: '/financas/investimentos', label: 'Investimentos', end: false },
  { to: '/financas/configuracoes', label: 'Configurações', end: false },
];

export function FinanceNav() {
  return (
    <div className="finance-nav">
      <nav className="finance-nav__tabs" aria-label="Navegação financeira">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'finance-nav__tab finance-nav__tab--active' : 'finance-nav__tab'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <PrivacyToggle />
    </div>
  );
}
