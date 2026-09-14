import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Modal, ModalActions } from '../../../components/ui/modal';
import { Segmented } from '../../../components/ui/segmented';
import { createMyRecurring } from '../../../services/finance.service';
import type { FinanceCategory, TransactionType } from '../../../types/api';
import { FREQUENCY_OPTIONS } from '../frequency';

interface RecurringFormProps {
  categories: FinanceCategory[];
  onCreated: () => void;
  onClose: () => void;
}

export function RecurringForm({
  categories,
  onCreated,
  onClose,
}: RecurringFormProps) {
  const [type, setType] = useState<TransactionType>('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [categoryId, setCategoryId] = useState('');
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
      await createMyRecurring({
        description: description.trim(),
        amount: parsed,
        type,
        frequency,
        dayOfMonth:
          frequency === 'monthly' && dayOfMonth ? Number(dayOfMonth) : undefined,
        categoryId: categoryId || undefined,
      });
      onCreated();
      onClose();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova conta fixa" onClose={onClose}>
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <Segmented<TransactionType>
          className="tx-form__type"
          label="Tipo"
          block
          value={type}
          onChange={setType}
          options={[
            { value: 'debit', label: 'Despesa fixa', tone: 'danger' },
            { value: 'credit', label: 'Receita fixa', tone: 'success' },
          ]}
        />

        <div className="field">
          <label className="label" htmlFor="rec-amount">
            Valor
          </label>
          <div className="money-input">
            <span className="money-input__prefix">R$</span>
            <input
              id="rec-amount"
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
          <label className="label" htmlFor="rec-description">
            Descrição
          </label>
          <input
            id="rec-description"
            className="input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={type === 'debit' ? 'Ex.: Aluguel' : 'Ex.: Salário'}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="rec-frequency">
              Frequência
            </label>
            <select
              id="rec-frequency"
              className="select"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {frequency === 'monthly' ? (
            <div className="field">
              <label className="label" htmlFor="rec-day">
                Dia do mês
              </label>
              <input
                id="rec-day"
                className="input"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(event) => setDayOfMonth(event.target.value)}
                placeholder="Ex.: 5"
              />
            </div>
          ) : null}
        </div>

        <div className="field">
          <label className="label" htmlFor="rec-category">
            Categoria
          </label>
          <select
            id="rec-category"
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

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <ModalActions>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Criar conta fixa'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
