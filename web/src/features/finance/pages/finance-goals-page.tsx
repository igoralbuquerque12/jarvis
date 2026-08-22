import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Spinner } from '../../../components/ui/spinner';
import { useMyGoals } from '../../../hooks/use-my-goals';
import {
  createMyGoal,
  deleteMyGoal,
  updateMyGoal,
} from '../../../services/finance.service';
import type { Goal } from '../../../types/api';
import { GoalCard } from '../components/goal-card';

function GoalForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedTarget = parseFloat(target);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setErr('Informe um valor alvo positivo.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await createMyGoal({
        name,
        targetAmount: parsedTarget,
        currentAmount: current ? parseFloat(current) : undefined,
        targetDate: targetDate || undefined,
        icon: icon || undefined,
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar meta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card__header">
        <h3 className="card__title">Nova Meta</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          Cancelar
        </button>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="field">
          <label className="label" htmlFor="goal-name">Nome</label>
          <input id="goal-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Viagem Europa" />
        </div>
        <div className="field">
          <label className="label" htmlFor="goal-target">Valor alvo (R$)</label>
          <input id="goal-target" className="input" type="number" step="0.01" min="0.01" value={target} onChange={(e) => setTarget(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="goal-current">Valor atual (R$)</label>
          <input id="goal-current" className="input" type="number" step="0.01" min="0" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0,00" />
        </div>
        <div className="field">
          <label className="label" htmlFor="goal-date">Data alvo</label>
          <input id="goal-date" className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="goal-icon">Emoji/ícone</label>
          <input id="goal-icon" className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✈️" maxLength={4} />
        </div>
        {err && <div className="alert alert--error" style={{ marginTop: 12 }}>{err}</div>}
        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Criando…' : 'Criar meta'}
          </button>
        </div>
      </form>
    </div>
  );
}

function UpdateAmountModal({
  goal,
  onUpdated,
  onClose,
}: {
  goal: Goal;
  onUpdated: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(goal.currentAmount));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      setErr('Informe um valor válido.');
      return;
    }
    setSaving(true);
    try {
      await updateMyGoal(goal.id, { currentAmount: parsed });
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao atualizar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(34,27,16,0.35)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 360, width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card__header">
          <h3 className="card__title">Atualizar progresso</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>×</button>
        </div>
        <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 16 }}>
          Meta: <strong>{goal.name}</strong>
        </p>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="field">
            <label className="label" htmlFor="goal-upd-val">Valor atual (R$)</label>
            <input id="goal-upd-val" className="input" type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          {err && <div className="alert alert--error" style={{ marginTop: 10 }}>{err}</div>}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FinanceGoalsPage() {
  const { goals, loading, error, reload } = useMyGoals();
  const [showForm, setShowForm] = useState(false);
  const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta meta?')) return;
    await deleteMyGoal(id);
    reload();
  }

  const active = goals.filter((g) => g.currentAmount < g.targetAmount);
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount);

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Metas</span>
        <h2>Objetivos Financeiros</h2>
        <p>Acompanhe o progresso das suas metas de poupança.</p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? '× Cancelar' : '+ Nova meta'}
        </button>
      </div>

      {showForm && (
        <GoalForm onCreated={reload} onClose={() => setShowForm(false)} />
      )}

      {loading ? (
        <Spinner page />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : goals.length === 0 ? (
        <div className="card">
          <div className="event-empty">
            <strong>Nenhuma meta criada</strong>
            <p>Defina um objetivo de poupança e acompanhe seu progresso.</p>
          </div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>
                Em andamento
              </h3>
              <div className="goals-grid" style={{ marginBottom: 24 }}>
                {active.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onDelete={(id) => void handleDelete(id)}
                    onUpdateAmount={(g) => setUpdatingGoal(g)}
                  />
                ))}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--success)', marginBottom: 12 }}>
                Concluídas ✓
              </h3>
              <div className="goals-grid">
                {completed.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {updatingGoal && (
        <UpdateAmountModal
          goal={updatingGoal}
          onUpdated={reload}
          onClose={() => setUpdatingGoal(null)}
        />
      )}
    </>
  );
}
