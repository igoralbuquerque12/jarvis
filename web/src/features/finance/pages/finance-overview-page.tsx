import { Link } from 'react-router-dom';
import { Alert } from '../../../components/ui/alert';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import {
  IconArrowRight,
  IconList,
  IconPlus,
  IconTarget,
} from '../../../components/ui/icons';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { Stat } from '../../../components/ui/stat';
import { useMyGoals } from '../../../hooks/use-my-goals';
import { useMyTransactions } from '../../../hooks/use-my-transactions';
import { currentYearMonth, formatYearMonth, monthRange } from '../../../lib/dates';
import { Amount } from '../components/amount';
import { GoalCard } from '../components/goal-card';
import { MonthlyChart } from '../components/monthly-chart';
import { TransactionRow } from '../components/transaction-row';

const RECENT = 8;

export function FinanceOverviewPage() {
  const ym = currentYearMonth();
  const { from, to } = monthRange(ym);
  const { data, loading, error } = useMyTransactions({ from, to, limit: RECENT });
  const { goals, loading: goalsLoading } = useMyGoals();

  const activeGoals = goals
    .filter((goal) => goal.currentAmount < goal.targetAmount)
    .slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Finanças"
        title={formatYearMonth(ym)}
        description="Resumo do mês, evolução dos últimos meses e metas em andamento."
        actions={
          <Link to="/financas/transacoes?nova=1" className="btn btn--primary">
            <IconPlus />
            Nova transação
          </Link>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="stats stats--3">
        <Stat
          label="Receitas"
          tone="success"
          value={loading ? '…' : <Amount value={data.summary.income} />}
          foot="No mês atual"
        />
        <Stat
          label="Despesas"
          tone="danger"
          value={loading ? '…' : <Amount value={-data.summary.expense} />}
          foot="No mês atual"
        />
        <Stat
          label="Saldo"
          tone="accent"
          value={loading ? '…' : <Amount value={data.summary.net} colored />}
          foot={`${data.total} ${data.total === 1 ? 'lançamento' : 'lançamentos'}`}
        />
      </div>

      <div className="cols cols--3-2">
        <Card>
          <CardHeader title="Receita e despesa" subtitle="Últimos 6 meses" />
          <MonthlyChart />
        </Card>

        <Card flush>
          <CardHeader
            title="Últimos lançamentos"
            aside={
              <Link to="/financas/transacoes" className="btn btn--ghost btn--sm">
                Ver todos <IconArrowRight />
              </Link>
            }
          />
          {loading ? (
            <div className="spinner-wrap">
              <Spinner />
            </div>
          ) : data.items.length === 0 ? (
            <div style={{ padding: '0 24px 24px' }}>
              <EmptyState icon={<IconList />} title="Nada registrado este mês">
                Registre pelo site ou mande «gastei 40 no almoço» para o
                Jarvis.
              </EmptyState>
            </div>
          ) : (
            <ul className="tx-list">
              {data.items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} showDate />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Metas em andamento"
          aside={
            <Link to="/financas/metas" className="btn btn--ghost btn--sm">
              Ver todas <IconArrowRight />
            </Link>
          }
        />
        {goalsLoading ? (
          <div className="spinner-wrap">
            <Spinner />
          </div>
        ) : activeGoals.length === 0 ? (
          <EmptyState
            icon={<IconTarget />}
            title="Nenhuma meta em andamento"
            action={
              <Link to="/financas/metas" className="btn btn--ghost btn--sm">
                <IconPlus />
                Criar meta
              </Link>
            }
          >
            Uma meta dá direção ao que sobra no fim do mês.
          </EmptyState>
        ) : (
          <div className="goals-grid">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
