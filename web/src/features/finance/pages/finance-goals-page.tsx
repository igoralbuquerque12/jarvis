import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { IconPlus, IconTarget } from '../../../components/ui/icons';
import { Modal, ModalActions } from '../../../components/ui/modal';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { Stat } from '../../../components/ui/stat';
import { useMyGoals } from '../../../hooks/use-my-goals';
import {
  createMyGoal,
  deleteMyGoal,
  updateMyGoal,
} from '../../../services/finance.service';
import type { Goal } from '../../../types/api';
import { Amount } from '../components/amount';
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
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedTarget = parseFloat(target.replace(',', '.'));
    if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormError('Informe um valor alvo maior que zero.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createMyGoal({
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: current ? parseFloat(current.replace(',', '.')) : undefined,
        targetDate: targetDate || undefined,
        icon: icon.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Erro ao criar meta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova meta" onClose={onClose}>
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="field-row" style={{ gridTemplateColumns: '76px 1fr' }}>
          <div className="field">
            <label className="label" htmlFor="goal-icon">
              Ícone
            </label>
            <input
              id="goal-icon"
              className="input"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="✈️"
              maxLength={4}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="goal-name">
              Nome
            </label>
            <input
              id="goal-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Ex.: Viagem para a Europa"
              autoFocus
            />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="goal-target">
            Valor da meta
          </label>
          <div className="money-input">
            <span className="money-input__prefix">R$</span>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="0,00"
              required
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="goal-current">
              Já guardado
            </label>
            <input
              id="goal-current"
              className="input"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="goal-date">
              Prazo
            </label>
            <input
              id="goal-date"
              className="input"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>
        </div>
        {formError ? <Alert variant="error">{formError}</Alert> : null}
        <ModalActions>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Criando…' : 'Criar meta'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
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
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0) {
      setFormError('Informe um valor válido.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await updateMyGoal(goal.id, { currentAmount: parsed });
      onUpdated();
      onClose();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Erro ao atualizar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Atualizar progresso" onClose={onClose}>
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <p className="muted small">
          Quanto você já guardou para <strong>{goal.name}</strong>? A meta é{' '}
          <Amount value={goal.targetAmount} currency={goal.currency} />.
        </p>
        <div className="field">
          <label className="label" htmlFor="goal-upd-val">
            Valor guardado
          </label>
          <div className="money-input">
            <span className="money-input__prefix">R$</span>
            <input
              id="goal-upd-val"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
              required
            />
          </div>
        </div>
        {formError ? <Alert variant="error">{formError}</Alert> : null}
        <ModalActions>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export function FinanceGoalsPage() {
  const { goals, loading, error, reload } = useMyGoals();
  const [creating, setCreating] = useState(false);
  const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta meta?')) return;
    await deleteMyGoal(id);
    reload();
  }

  const active = goals.filter((goal) => goal.currentAmount < goal.targetAmount);
  const completed = goals.filter((goal) => goal.currentAmount >= goal.targetAmount);
  const saved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const target = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const overall = target > 0 ? Math.round((saved / target) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Finanças"
        title="Metas"
        description="Objetivos de economia e quanto falta para cada um."
        actions={
          <Button onClick={() => setCreating(true)}>
            <IconPlus />
            Nova meta
          </Button>
        }
      />

      {loading ? (
        <Spinner page />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconTarget />}
            title="Nenhuma meta ainda"
            action={
              <Button variant="ghost" onClick={() => setCreating(true)}>
                <IconPlus />
                Criar a primeira meta
              </Button>
            }
          >
            Defina um objetivo, como uma viagem ou a reserva de emergência, e
            acompanhe o progresso aqui ou pelo WhatsApp.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="stats stats--3">
            <Stat
              label="Guardado"
              tone="success"
              value={<Amount value={saved} />}
              foot={`${goals.length} ${goals.length === 1 ? 'meta' : 'metas'}`}
            />
            <Stat
              label="Total das metas"
              value={<Amount value={target} />}
              foot={`Faltam ${Math.max(target - saved, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            />
            <Stat
              label="Progresso geral"
              tone="accent"
              value={`${overall}%`}
              foot={`${completed.length} ${completed.length === 1 ? 'concluída' : 'concluídas'}`}
            />
          </div>

          {active.length > 0 ? (
            <section className="stack stack--tight">
              <h3 className="section-title">
                Em andamento <Badge variant="accent">{active.length}</Badge>
              </h3>
              <div className="goals-grid">
                {active.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={(id) => void handleDelete(id)}
                    onUpdateAmount={setUpdatingGoal}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section className="stack stack--tight">
              <h3 className="section-title">
                Concluídas <Badge variant="success">{completed.length}</Badge>
              </h3>
              <div className="goals-grid">
                {completed.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {creating ? (
        <GoalForm onCreated={reload} onClose={() => setCreating(false)} />
      ) : null}

      {updatingGoal ? (
        <UpdateAmountModal
          goal={updatingGoal}
          onUpdated={reload}
          onClose={() => setUpdatingGoal(null)}
        />
      ) : null}
    </>
  );
}
