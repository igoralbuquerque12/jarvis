import type { FormEvent } from 'react';
import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from '../../../components/ui/field';
import { Modal, ModalActions } from '../../../components/ui/modal';
import { Segmented } from '../../../components/ui/segmented';
import { describeRecurrence, toLocalInputValue } from '../../../lib/format';
import { createMyEvent, updateMyEvent } from '../../../services/events.service';
import type {
  EventSeriesType,
  RecurrenceMode,
  UpcomingEvent,
} from '../../../types/api';

interface EventFormModalProps {
  /** Reminder being edited; omit to create a new one. */
  initial?: UpcomingEvent;
  timezone: string;
  onSaved: () => void;
  onClose: () => void;
}

const UNIT_OPTIONS: { value: RecurrenceMode; label: string }[] = [
  { value: 'HOUR', label: 'hora(s)' },
  { value: 'DAY', label: 'dia(s)' },
  { value: 'WEEK', label: 'semana(s)' },
  { value: 'MONTH', label: 'mês(es)' },
];

export function EventFormModal({
  initial,
  timezone,
  onSaved,
  onClose,
}: EventFormModalProps) {
  const initialStart = initial
    ? toLocalInputValue(initial.scheduledAt, timezone)
    : '';

  const [type, setType] = useState<EventSeriesType>('UNIQUE');
  const [content, setContent] = useState(initial?.content ?? '');
  const [startAt, setStartAt] = useState(initialStart);
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [unit, setUnit] = useState<RecurrenceMode>('DAY');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const recurring = initial
    ? initial.series.type === 'RECURRENCE'
    : type === 'RECURRENCE';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (initial) {
        await updateMyEvent(initial.id, {
          content: content.trim(),
          // Leaving the date alone must not trip the "future only" rule.
          ...(startAt !== initialStart ? { startAt } : {}),
        });
      } else {
        await createMyEvent({
          type,
          startAt,
          content: content.trim(),
          ...(type === 'RECURRENCE'
            ? { recurrenceInterval: Number(repeatEvery), recurrenceMode: unit }
            : {}),
        });
      }
      onSaved();
      onClose();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível salvar o lembrete.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? 'Editar lembrete' : 'Novo lembrete'} onClose={onClose}>
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        {initial ? null : (
          <Segmented<EventSeriesType>
            className="tx-form__type"
            label="Tipo"
            block
            value={type}
            onChange={setType}
            options={[
              { value: 'UNIQUE', label: 'Uma vez' },
              { value: 'RECURRENCE', label: 'Repetir' },
            ]}
          />
        )}

        <Field label="O que lembrar">
          {(id) => (
            <TextArea
              id={id}
              className="textarea textarea--short"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={1000}
              placeholder="Pagar o boleto do cartão"
              autoFocus
              required
            />
          )}
        </Field>

        <Field
          label={recurring && !initial ? 'Primeiro aviso' : 'Quando'}
          hint={`Fuso ${timezone}. O horário é ajustado para múltiplos de 10 minutos.`}
        >
          {(id) => (
            <TextInput
              id={id}
              type="datetime-local"
              value={startAt}
              min={toLocalInputValue(new Date(), timezone)}
              onChange={(event) => setStartAt(event.target.value)}
              required
            />
          )}
        </Field>

        {!initial && type === 'RECURRENCE' ? (
          <div className="field-row">
            <Field label="Repetir a cada">
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={repeatEvery}
                  onChange={(event) => setRepeatEvery(event.target.value)}
                  required
                />
              )}
            </Field>
            <Field label="Unidade">
              {(id) => (
                <Select
                  id={id}
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as RecurrenceMode)
                  }
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        ) : null}

        {initial && recurring ? (
          <p className="hint">
            {describeRecurrence(initial.series)}. Mudar o texto ou o horário vale
            também para as próximas repetições; para trocar o intervalo, cancele e
            crie outro.
          </p>
        ) : null}

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
                : 'Criar lembrete'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
