import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { IconPlus } from '../../../components/ui/icons';
import { Modal, ModalActions } from '../../../components/ui/modal';
import { Segmented } from '../../../components/ui/segmented';
import { todayISO } from '../../../lib/dates';
import type {
  FinanceAccount,
  FinanceCategory,
  Transaction,
  TransactionType,
} from '../../../types/api';

export interface TransactionFormValues {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId?: string;
  accountId?: string;
  notes?: string;
}

interface TransactionFormProps {
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  initial?: Transaction;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  onClose: () => void;
}

export function TransactionForm({
  categories,
  accounts,
  initial,
  onSubmit,
  onClose,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'debit');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [categoryId, setCategoryId] = useState(initial?.category?.id ?? '');
  const [accountId, setAccountId] = useState(initial?.account?.id ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      setFormError('Informe um valor maior que zero.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        description: description.trim(),
        amount: parsed,
        type,
        date,
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={initial ? 'Editar transação' : 'Nova transação'}
      onClose={onClose}
    >
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <Segmented<TransactionType>
          className="tx-form__type"
          label="Tipo"
          block
          value={type}
          onChange={setType}
          options={[
            { value: 'debit', label: 'Despesa', tone: 'danger' },
            { value: 'credit', label: 'Receita', tone: 'success' },
          ]}
        />

        <div className="field">
          <label className="label" htmlFor="tx-amount">
            Valor
          </label>
          <div className="money-input">
            <span className="money-input__prefix">R$</span>
            <input
              id="tx-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              autoFocus
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="tx-description">
            Descrição
          </label>
          <input
            id="tx-description"
            className="input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={type === 'debit' ? 'Ex.: Supermercado' : 'Ex.: Salário'}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="tx-date">
              Data
            </label>
            <input
              id="tx-date"
              className="input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
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
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon ? `${category.icon} ` : ''}
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {accounts.length > 1 ? (
          <div className="field">
            <label className="label" htmlFor="tx-account">
              Conta
            </label>
            <select
              id="tx-account"
              className="select"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              <option value="">Conta padrão</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showNotes ? (
          <div className="field">
            <label className="label" htmlFor="tx-notes">
              Observação
            </label>
            <textarea
              id="tx-notes"
              className="textarea textarea--short"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalhes que ajudem a lembrar deste lançamento"
            />
          </div>
        ) : (
          <div>
            <Button variant="subtle" size="sm" onClick={() => setShowNotes(true)}>
              <IconPlus />
              Adicionar observação
            </Button>
          </div>
        )}

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <ModalActions>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? 'Salvando…'
              : initial
                ? 'Salvar alterações'
                : type === 'debit'
                  ? 'Registrar despesa'
                  : 'Registrar receita'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
