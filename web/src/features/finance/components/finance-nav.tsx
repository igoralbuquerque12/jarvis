import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconBriefcase,
  IconList,
  IconPie,
  IconSettings,
  IconTarget,
} from '../../../components/ui/icons';
import { PrivacyToggle } from './privacy-toggle';

interface Tab {
  to: string;
  label: string;
  icon: ReactNode;
  /** Every path prefix that keeps this tab highlighted. */
  match: string[];
}

const TABS: Tab[] = [
  { to: '/financas', label: 'Visão geral', icon: <IconPie />, match: ['/financas'] },
  {
    to: '/financas/transacoes',
    label: 'Transações',
    icon: <IconList />,
    match: ['/financas/transacoes', '/financas/recorrencias'],
  },
  { to: '/financas/metas', label: 'Metas', icon: <IconTarget />, match: ['/financas/metas'] },
  {
    to: '/financas/investimentos',
    label: 'Investimentos',
    icon: <IconBriefcase />,
    match: ['/financas/investimentos'],
  },
];

function isActive(tab: Tab, pathname: string): boolean {
  if (tab.to === '/financas') return pathname === '/financas';
  return tab.match.some((prefix) => pathname.startsWith(prefix));
}

export function FinanceNav() {
  const { pathname } = useLocation();
  const settingsActive = pathname.startsWith('/financas/configuracoes');

  return (
    <div className="finance-nav">
      <nav className="finance-nav__tabs" aria-label="Navegação financeira">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={
              isActive(tab, pathname)
                ? 'finance-nav__tab finance-nav__tab--active'
                : 'finance-nav__tab'
            }
            aria-current={isActive(tab, pathname) ? 'page' : undefined}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="finance-nav__aside">
        <PrivacyToggle />
        <Link
          to="/financas/configuracoes"
          className={
            settingsActive
              ? 'icon-btn icon-btn--outline icon-btn--active'
              : 'icon-btn icon-btn--outline'
          }
          title="Contas, categorias e regras"
          aria-label="Contas, categorias e regras"
          aria-current={settingsActive ? 'page' : undefined}
        >
          <IconSettings />
        </Link>
      </div>
    </div>
  );
}
