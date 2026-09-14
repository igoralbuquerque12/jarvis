import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button, IconButton } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import {
  IconChevronLeft,
  IconChevronRight,
  IconList,
  IconPlus,
  IconRepeat,
  IconSearch,
} from '../../../components/ui/icons';
import { PageHeader } from '../../../components/ui/page-header';
import { Segmented } from '../../../components/ui/segmented';
import { Spinner } from '../../../components/ui/spinner';
import { Stat } from '../../../components/ui/stat';
import { useMyAccounts } from '../../../hooks/use-my-accounts';
import { useMyCategories } from '../../../hooks/use-my-categories';
import { useMyRecurring } from '../../../hooks/use-my-recurring';
import { useMyTransactions } from '../../../hooks/use-my-transactions';
import {
  currentYearMonth,
  describeISODate,
  formatYearMonth,
  isSameYearMonth,
  monthRange,
  shiftYearMonth,
} from '../../../lib/dates';
import type { YearMonth } from '../../../lib/dates';
import {
  createMyTransaction,
  deleteMyRecurring,
  deleteMyTransaction,
  updateMyTransaction,
} from '../../../services/finance.service';
import type { RecurringTransaction, Transaction } from '../../../types/api';
import { Amount } from '../components/amount';
import { MONTHLY_FACTOR } from '../frequency';
import { RecurringForm } from '../components/recurring-form';
import { RecurringRow } from '../components/recurring-row';
import { TransactionForm } from '../components/transaction-form';
import type { TransactionFormValues } from '../components/transaction-form';
import { TransactionRow } from '../components/transaction-row';

type View = 'ledger' | 'recurring';
type FilterType = 'all' | 'credit' | 'debit';

const PAGE_SIZE = 25;

// ── Month navigation ──────────────────────────────────────────────────────────

function MonthNav({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}) {
  const now = currentYearMonth();
  const isCurrent = isSameYearMonth(value, now);

  return (
    <div className="row" style={{ gap: 8 }}>
      <div className="month-nav" role="group" aria-label="Mês">
        <IconButton
          label="Mês anterior"
          onClick={() => onChange(shiftYearMonth(value, -1))}
        >
          <IconChevronLeft />
        </IconButton>
        <span className="month-nav__label">{formatYearMonth(value)}</span>
        <IconButton
          label="Próximo mês"
          onClick={() => onChange(shiftYearMonth(value, 1))}
          disabled={isCurrent}
        >
          <IconChevronRight />
        </IconButton>
      </div>
      {!isCurrent ? (
        <Button variant="subtle" size="sm" onClick={() => onChange(now)}>
          Mês atual
        </Button>
      ) : null}
    </div>
  );
}

// ── Ledger (transactions of a month) ─────────────────────────────────────────

interface DayGroup {
  date: string;
  items: Transaction[];
  net: number;
}

function groupByDay(items: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const tx of items) {
    const signed = tx.type === 'credit' ? tx.amount : -tx.amount;
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) {
      last.items.push(tx);
      last.net += signed;
    } else {
      groups.push({ date: tx.date, items: [tx], net: signed });
    }
  }
  return groups;
}

function LedgerView({
  creating,
  onCloseCreate,
}: {
  creating: boolean;
  onCloseCreate: () => void;
}) {
  const [ym, setYm] = useState<YearMonth>(currentYearMonth);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { from, to } = monthRange(ym);
  const { data, loading, error, reload } = useMyTransactions({
    from,
    to,
    type: filterType === 'all' ? undefined : filterType,
    q: query || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const { categories } = useMyCategories();
  const { accounts } = useMyAccounts();

  const groups = useMemo(() => groupByDay(data.items), [data.items]);
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const filtered = filterType !== 'all' || query !== '';

  function changeMonth(next: YearMonth) {
    setYm(next);
    setPage(1);
  }

  async function handleCreate(values: TransactionFormValues) {
    await createMyTransaction(values);
    reload();
  }

  async function handleUpdate(values: TransactionFormValues) {
    if (!editingTx) return;
    await updateMyTransaction(editingTx.id, values);
    setEditingTx(null);
    reload();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta transação?')) return;
    await deleteMyTransaction(id);
    reload();
  }

  return (
    <>
      <div className="toolbar">
        <MonthNav value={ym} onChange={changeMonth} />
        <span className="toolbar__spacer" />
        <label className="search">
          <IconSearch />
          <input
            className="input"
            placeholder="Buscar por descrição"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <Segmented<FilterType>
          label="Tipo"
          value={filterType}
          onChange={(next) => {
            setFilterType(next);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Tudo' },
            { value: 'credit', label: 'Receitas' },
            { value: 'debit', label: 'Despesas' },
          ]}
        />
      </div>

      <div className="stats stats--3">
        <Stat
          label="Receitas"
          tone="success"
          value={<Amount value={data.summary.income} />}
          foot={filtered ? 'Considerando os filtros' : formatYearMonth(ym)}
        />
        <Stat
          label="Despesas"
          tone="danger"
          value={<Amount value={-data.summary.expense} />}
          foot={filtered ? 'Considerando os filtros' : formatYearMonth(ym)}
        />
        <Stat
          label="Saldo"
          tone="accent"
          value={<Amount value={data.summary.net} colored />}
          foot={`${data.total} ${data.total === 1 ? 'lançamento' : 'lançamentos'}`}
        />
      </div>

      <Card flush>
        {loading ? (
          <div className="spinner-wrap">
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <Alert variant="error">{error}</Alert>
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState
              icon={<IconList />}
              title={filtered ? 'Nada encontrado' : 'Nenhum lançamento neste mês'}
            >
              {filtered
                ? 'Tente outra busca ou limpe os filtros.'
                : 'Registre uma transação aqui ou mande uma mensagem ao Jarvis, como «gastei 40 no almoço».'}
            </EmptyState>
          </div>
        ) : (
          <div className="tx-groups">
            {groups.map((group) => (
              <section key={group.date} className="tx-group">
                <header className="tx-group__head">
                  <span>{describeISODate(group.date)}</span>
                  <Amount value={group.net} colored />
                </header>
                <ul className="tx-list">
                  {group.items.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onEdit={setEditingTx}
                      onDelete={(id) => void handleDelete(id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <footer className="pagination">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="pagination__controls">
              <IconButton
                label="Página anterior"
                outline
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <IconChevronLeft />
              </IconButton>
              <IconButton
                label="Próxima página"
                outline
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                <IconChevronRight />
              </IconButton>
            </div>
          </footer>
        ) : null}
      </Card>

      {creating ? (
        <TransactionForm
          categories={categories}
          accounts={accounts}
          onSubmit={handleCreate}
          onClose={onCloseCreate}
        />
      ) : null}

      {editingTx ? (
        <TransactionForm
          categories={categories}
          accounts={accounts}
          initial={editingTx}
          onSubmit={handleUpdate}
          onClose={() => setEditingTx(null)}
        />
      ) : null}
    </>
  );
}

// ── Recurring (fixed income / expenses) ──────────────────────────────────────

function monthlyEquivalent(items: RecurringTransaction[]): number {
  return items.reduce(
    (sum, item) => sum + item.amount * (MONTHLY_FACTOR[item.frequency] ?? 1),
    0,
  );
}

function RecurringView({
  creating,
  onCloseCreate,
}: {
  creating: boolean;
  onCloseCreate: () => void;
}) {
  const { recurring, loading, error, reload } = useMyRecurring();
  const { categories } = useMyCategories();

  const incomes = recurring.filter((item) => item.type === 'credit');
  const expenses = recurring.filter((item) => item.type === 'debit');
  const incomeMonthly = monthlyEquivalent(incomes);
  const expenseMonthly = monthlyEquivalent(expenses);

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta conta fixa?')) return;
    await deleteMyRecurring(id);
    reload();
  }

  return (
    <>
      <div className="stats stats--3">
        <Stat
          label="Receitas fixas"
          tone="success"
          value={<Amount value={incomeMonthly} />}
          foot="Equivalente mensal"
        />
        <Stat
          label="Despesas fixas"
          tone="danger"
          value={<Amount value={-expenseMonthly} />}
          foot="Equivalente mensal"
        />
        <Stat
          label="Sobra prevista"
          tone="accent"
          value={<Amount value={incomeMonthly - expenseMonthly} colored />}
          foot="Antes dos gastos variáveis"
        />
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : recurring.length === 0 ? (
        <Card>
          <EmptyState icon={<IconRepeat />} title="Nenhuma conta fixa">
            Cadastre salário, aluguel e assinaturas para prever o mês antes de
            ele começar.
          </EmptyState>
        </Card>
      ) : (
        <div className="cols cols--even">
          <Card flush>
            <CardHeader
              title="Receitas fixas"
              aside={<Badge variant="success">{incomes.length}</Badge>}
            />
            {incomes.length === 0 ? (
              <p className="muted small" style={{ padding: '0 24px 24px' }}>
                Nenhuma receita fixa cadastrada.
              </p>
            ) : (
              <ul className="tx-list">
                {incomes.map((item) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            )}
          </Card>
          <Card flush>
            <CardHeader
              title="Despesas fixas"
              aside={<Badge variant="danger">{expenses.length}</Badge>}
            />
            {expenses.length === 0 ? (
              <p className="muted small" style={{ padding: '0 24px 24px' }}>
                Nenhuma despesa fixa cadastrada.
              </p>
            ) : (
              <ul className="tx-list">
                {expenses.map((item) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {creating ? (
        <RecurringForm
          categories={categories}
          onCreated={reload}
          onClose={onCloseCreate}
        />
      ) : null}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function FinanceTransactionsPage({ view }: { view: View }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // The "new" modal is tied to the view it was opened in, so switching views closes it.
  const [creatingFor, setCreatingFor] = useState<View | null>(null);
  const creating = creatingFor === view || searchParams.get('nova') === '1';

  function closeCreate() {
    setCreatingFor(null);
    if (searchParams.has('nova')) {
      setSearchParams({}, { replace: true });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Finanças"
        title="Transações"
        description={
          view === 'ledger'
            ? 'Tudo que entrou e saiu, mês a mês.'
            : 'Receitas e despesas que se repetem todo período.'
        }
        actions={
          <>
            <Segmented<View>
              label="Visão"
              value={view}
              onChange={(next) =>
                navigate(
                  next === 'ledger'
                    ? '/financas/transacoes'
                    : '/financas/recorrencias',
                )
              }
              options={[
                { value: 'ledger', label: 'Lançamentos' },
                { value: 'recurring', label: 'Contas fixas' },
              ]}
            />
            <Button onClick={() => setCreatingFor(view)}>
              <IconPlus />
              {view === 'ledger' ? 'Nova transação' : 'Nova conta fixa'}
            </Button>
          </>
        }
      />

      {view === 'ledger' ? (
        <LedgerView creating={creating} onCloseCreate={closeCreate} />
      ) : (
        <RecurringView creating={creating} onCloseCreate={closeCreate} />
      )}
    </>
  );
}
