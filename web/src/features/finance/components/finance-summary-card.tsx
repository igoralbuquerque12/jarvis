import { Link } from 'react-router-dom';
import { useFinanceSummary } from '../../../hooks/use-finance-summary';
import { Amount } from '../components/amount';
import { PrivacyProvider } from '../context/privacy-context';

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

function SummaryContent() {
  const { summary, loading } = useFinanceSummary();

  const month = new Date().toLocaleString('pt-BR', { month: 'long' });

  return (
    <div className="card finance-dash-card">
      <div className="card__header">
        <div>
          <span className="eyebrow">Finanças</span>
          <h3 className="card__title" style={{ marginTop: 4 }}>
            {month.charAt(0).toUpperCase() + month.slice(1)}
          </h3>
        </div>
        <Link to="/financas" className="btn btn--ghost btn--sm">
          Ver tudo <ArrowIcon />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <div className="spinner" />
        </div>
      ) : summary ? (
        <>
          <div className="finance-dash-summary">
            <div className="finance-dash-summary__item">
              <span className="finance-dash-summary__label">Receita</span>
              <Amount
                value={summary.income}
                colored
                className="finance-dash-summary__value"
              />
            </div>
            <div className="finance-dash-summary__item">
              <span className="finance-dash-summary__label">Despesa</span>
              <Amount
                value={-summary.expense}
                colored
                className="finance-dash-summary__value"
              />
            </div>
            <div className="finance-dash-summary__item finance-dash-summary__item--net">
              <span className="finance-dash-summary__label">Saldo</span>
              <Amount
                value={summary.net}
                colored
                className="finance-dash-summary__value"
              />
            </div>
          </div>
        </>
      ) : (
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          Nenhum dado financeiro este mês.
        </p>
      )}
    </div>
  );
}

/** Wraps in its own PrivacyProvider so it's independent from the finance section */
export function FinanceSummaryCard() {
  return (
    <PrivacyProvider>
      <SummaryContent />
    </PrivacyProvider>
  );
}
