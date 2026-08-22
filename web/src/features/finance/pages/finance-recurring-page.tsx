import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Spinner } from '../../../components/ui/spinner';
import { useMyCategories } from '../../../hooks/use-my-categories';
import { useMyRecurring } from '../../../hooks/use-my-recurring';
import {
  createMyRecurring,
  deleteMyRecurring,
} from '../../../services/finance.service';
import { RecurringRow } from '../components/recurring-row';

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
];

function CreateRecurringForm({
  categories,
  onCreated,
  onClose,
}: {
  categories: { id: string; name: string }[];
  onCreated: () => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debit' | 'credit'>('credit');
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setErr('Informe um valor positivo.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await createMyRecurring({
        description,
        amount: parsed,
        type,
        frequency,
        dayOfMonth: dayOfMonth ? Number(dayOfMonth) : undefined,
        categoryId: categoryId || undefined,
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card__header">
        <h3 className="card__title">Nova Recorrência</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          Cancelar
        </button>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="auth__switch" style={{ marginBottom: 16 }}>
          {(['credit', 'debit'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className="auth__switch-btn"
              aria-selected={type === t}
              onClick={() => setType(t)}
            >
              {t === 'credit' ? 'Receita' : 'Despesa'}
            </button>
          ))}
        </div>
        <div className="field">
          <label className="label" htmlFor="rec-desc">Descrição</label>
          <input id="rec-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ex: Salário" />
        </div>
        <div className="field">
          <label className="label" htmlFor="rec-amount">Valor (R$)</label>
          <input id="rec-amount" className="input" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="rec-freq">Frequência</label>
          <select id="rec-freq" className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {FREQ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {frequency === 'monthly' && (
          <div className="field">
            <label className="label" htmlFor="rec-day">Dia do mês</label>
            <input id="rec-day" className="input" type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="Ex: 5" />
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="rec-cat">Categoria</label>
          <select id="rec-cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {err && <div className="alert alert--error" style={{ marginTop: 12 }}>{err}</div>}
        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Criando…' : 'Criar recorrência'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function FinanceRecurringPage() {
  const { recurring, loading, error, reload } = useMyRecurring();
  const { categories } = useMyCategories();
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta recorrência?')) return;
    await deleteMyRecurring(id);
    reload();
  }

  const incomes = recurring.filter((r) => r.type === 'credit');
  const expenses = recurring.filter((r) => r.type === 'debit');

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Recorrências</span>
        <h2>Transações Fixas</h2>
        <p>Salários, assinaturas e outros lançamentos automáticos.</p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? '× Cancelar' : '+ Nova recorrência'}
        </button>
      </div>

      {showForm && (
        <CreateRecurringForm
          categories={categories}
          onCreated={reload}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <Spinner page />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : recurring.length === 0 ? (
        <div className="card">
          <div className="event-empty">
            <strong>Nenhuma recorrência</strong>
            <p>Adicione um salário ou assinatura para começar.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {incomes.length > 0 && (
            <div className="card">
              <div className="card__header">
                <h3 className="card__title">Receitas fixas</h3>
                <span className="badge badge--success">{incomes.length}</span>
              </div>
              <ul className="tx-list">
                {incomes.map((r) => (
                  <RecurringRow
                    key={r.id}
                    item={r}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            </div>
          )}
          {expenses.length > 0 && (
            <div className="card">
              <div className="card__header">
                <h3 className="card__title">Despesas fixas</h3>
                <span className="badge badge--danger">{expenses.length}</span>
              </div>
              <ul className="tx-list">
                {expenses.map((r) => (
                  <RecurringRow
                    key={r.id}
                    item={r}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
