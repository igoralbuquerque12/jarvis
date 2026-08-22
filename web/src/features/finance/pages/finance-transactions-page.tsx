import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Spinner } from '../../../components/ui/spinner';
import { useMyAccounts } from '../../../hooks/use-my-accounts';
import { useMyCategories } from '../../../hooks/use-my-categories';
import { useMyTransactions } from '../../../hooks/use-my-transactions';
import {
  createMyTransaction,
  deleteMyTransaction,
  updateMyTransaction,
} from '../../../services/finance.service';
import type { Transaction } from '../../../types/api';
import { Amount } from '../components/amount';
import { TransactionForm } from '../components/transaction-form';
import { TransactionRow } from '../components/transaction-row';

type FilterType = '' | 'debit' | 'credit';

function thisMonthRange() {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function FinanceTransactionsPage() {
  const [filterType, setFilterType] = useState<FilterType>('');
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { from, to } = thisMonthRange();

  const { data, loading, error, reload } = useMyTransactions({
    from,
    to,
    type: filterType || undefined,
    q: filterQ || undefined,
    page,
    limit: 20,
  });

  const { categories } = useMyCategories();
  const { accounts } = useMyAccounts();

  const totalPages = Math.ceil(data.total / data.limit);

  async function handleCreate(values: Parameters<typeof createMyTransaction>[0]) {
    await createMyTransaction(values);
    reload();
  }

  async function handleUpdate(
    values: Parameters<typeof updateMyTransaction>[1],
  ) {
    if (!editingTx) return;
    await updateMyTransaction(editingTx.id, values);
    setEditingTx(null);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return;
    await deleteMyTransaction(id);
    reload();
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Transações</span>
        <h2>Histórico</h2>
        <p>Todas as entradas e saídas do mês atual.</p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      {/* Toolbar */}
      <div className="fin-toolbar">
        <input
          className="input"
          style={{ maxWidth: 240 }}
          placeholder="Buscar…"
          value={filterQ}
          onChange={(e) => {
            setFilterQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="auth__switch" style={{ width: 'auto', marginBottom: 0 }}>
          {(['', 'credit', 'debit'] as FilterType[]).map((t) => (
            <button
              key={t}
              type="button"
              className="auth__switch-btn"
              aria-selected={filterType === t}
              onClick={() => {
                setFilterType(t);
                setPage(1);
              }}
            >
              {t === '' ? 'Todos' : t === 'credit' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShowForm(true)}
        >
          + Nova transação
        </button>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="fin-summary-strip">
          <span>
            Receita:{' '}
            <Amount value={data.summary.income} className="amount--positive" />
          </span>
          <span>
            Despesa:{' '}
            <Amount value={-data.summary.expense} className="amount--negative" />
          </span>
          <span>
            Saldo:{' '}
            <Amount value={data.summary.net} colored />
          </span>
        </div>
      )}

      {/* List */}
      <div className="card" style={{ marginTop: 16 }}>
        {loading ? (
          <Spinner />
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : data.items.length === 0 ? (
          <div className="event-empty">
            <strong>Nenhuma transação encontrada</strong>
            <p>Tente mudar os filtros ou adicione uma nova transação.</p>
          </div>
        ) : (
          <ul className="tx-list">
            {data.items.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onEdit={(t) => setEditingTx(t)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="fin-pagination">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <TransactionForm
          categories={categories}
          accounts={accounts}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit modal */}
      {editingTx && (
        <TransactionForm
          categories={categories}
          accounts={accounts}
          initial={editingTx}
          onSubmit={handleUpdate}
          onClose={() => setEditingTx(null)}
        />
      )}
    </>
  );
}
