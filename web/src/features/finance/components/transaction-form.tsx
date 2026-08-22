import { useEffect, useRef, useState } from 'react';
import type { FinanceAccount, FinanceCategory, Transaction } from '../../../types/api';

interface TransactionFormProps {
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  initial?: Transaction;
  onSubmit: (data: {
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    date: string;
    categoryId?: string;
    accountId?: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  categories,
  accounts,
  initial,
  onSubmit,
  onClose,
}: TransactionFormProps) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [type, setType] = useState<'debit' | 'credit'>(initial?.type ?? 'debit');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [categoryId, setCategoryId] = useState(initial?.category?.id ?? '');
  const [accountId, setAccountId] = useState(initial?.account?.id ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setFormError('Informe um valor positivo.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        description,
        amount: parsed,
        type,
        date,
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="modal__box">
        <div className="modal__header">
          <h3 className="modal__title">
            {initial ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          {/* Type switch */}
          <div className="auth__switch" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className="auth__switch-btn"
              aria-selected={type === 'debit'}
              onClick={() => setType('debit')}
            >
              Despesa
            </button>
            <button
              type="button"
              className="auth__switch-btn"
              aria-selected={type === 'credit'}
              onClick={() => setType('credit')}
            >
              Receita
            </button>
          </div>

          <div className="field">
            <label className="label" htmlFor="tx-description">
              Descrição
            </label>
            <input
              id="tx-description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Ex: Supermercado"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="tx-amount">
              Valor (R$)
            </label>
            <input
              id="tx-amount"
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0,00"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="tx-date">
              Data
            </label>
            <input
              id="tx-date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="tx-category">
              Categoria
            </label>
            <select
              id="tx-category"
              className="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {accounts.length > 1 && (
            <div className="field">
              <label className="label" htmlFor="tx-account">
                Conta
              </label>
              <select
                id="tx-account"
                className="select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">Padrão (Carteira)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="tx-notes">
              Observações
            </label>
            <textarea
              id="tx-notes"
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              style={{ minHeight: 72 }}
            />
          </div>

          {formError && (
            <div className="alert alert--error" style={{ marginTop: 12 }}>
              {formError}
            </div>
          )}

          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? 'Salvando…' : initial ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
