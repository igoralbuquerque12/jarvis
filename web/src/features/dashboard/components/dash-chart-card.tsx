import { Link } from 'react-router-dom';
import { MonthlyChart } from '../../finance/components/monthly-chart';
import { PrivacyProvider } from '../../finance/context/privacy-context';

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ChartContent() {
  return (
    <div className="card dash-chart-card">
      <div className="card__header">
        <div>
          <span className="eyebrow">Financas</span>
          <h3 className="card__title" style={{ marginTop: 4 }}>
            Receita x Despesa
          </h3>
          <p className="card__subtitle">Ultimos 6 meses</p>
        </div>
        <Link to="/financas" className="btn btn--ghost btn--sm">
          Ver tudo <ArrowIcon />
        </Link>
      </div>
      <MonthlyChart />
    </div>
  );
}

/** Grafico de receita x despesa para o painel principal */
export function DashChartCard() {
  return (
    <PrivacyProvider>
      <ChartContent />
    </PrivacyProvider>
  );
}
