import { useFinanceSummary } from '../../../hooks/use-finance-summary';
import { useMyGoals } from '../../../hooks/use-my-goals';
import { Spinner } from '../../../components/ui/spinner';
import { Alert } from '../../../components/ui/alert';
import { Amount } from '../components/amount';
import { GoalCard } from '../components/goal-card';
import { MonthlyChart } from '../components/monthly-chart';

function SummaryKpi({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type?: 'income' | 'expense' | 'net';
}) {
  const colorMap = {
    income: 'var(--success)',
    expense: 'var(--danger)',
    net: value >= 0 ? 'var(--success)' : 'var(--danger)',
  };

  return (
    <div className="fin-kpi">
      <span className="fin-kpi__label">{label}</span>
      <Amount
        value={type === 'expense' ? -value : value}
        colored={type === 'net'}
        className="fin-kpi__value"
      />
      {type && (
        <span
          className="fin-kpi__dot"
          style={{ background: colorMap[type] }}
        />
      )}
    </div>
  );
}

export function FinanceOverviewPage() {
  const { summary, loading: summaryLoading, error: summaryError } = useFinanceSummary();
  const { goals, loading: goalsLoading } = useMyGoals();

  const month = new Date().toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Visão Geral</span>
        <h2>{month.charAt(0).toUpperCase() + month.slice(1)}</h2>
        <p>Resumo financeiro do mês atual e tendências dos últimos 6 meses.</p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      {summaryError && (
        <Alert variant="error">{summaryError}</Alert>
      )}

      {/* KPIs */}
      <div className="fin-kpi-row">
        {summaryLoading ? (
          <Spinner />
        ) : summary ? (
          <>
            <SummaryKpi label="Receita" value={summary.income} type="income" />
            <SummaryKpi label="Despesas" value={summary.expense} type="expense" />
            <SummaryKpi label="Saldo" value={summary.net} type="net" />
          </>
        ) : (
          <p className="muted">Nenhuma transação este mês.</p>
        )}
      </div>

      {/* Chart */}
      <div className="card" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="card__header">
          <h3 className="card__title">Receita × Despesa</h3>
          <span className="badge badge--neutral">Últimos 6 meses</span>
        </div>
        <MonthlyChart />
      </div>

      {/* Goals preview */}
      {goals.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Metas em andamento</h3>
          </div>
          {goalsLoading ? (
            <Spinner />
          ) : (
            <div className="goals-grid">
              {goals.slice(0, 4).map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
