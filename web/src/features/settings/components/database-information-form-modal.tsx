import type { FormEvent } from 'react';
import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Field, TextArea } from '../../../components/ui/field';
import { Modal, ModalActions } from '../../../components/ui/modal';
import {
  createMyDatabaseInformation,
  updateMyDatabaseInformation,
} from '../../../services/database-information.service';
import type { DatabaseInformation } from '../../../types/api';

const MAX_CONTENT_LENGTH = 20_000;

interface DatabaseInformationFormModalProps {
  initial?: DatabaseInformation;
  onSaved: (saved: DatabaseInformation) => void;
  onClose: () => void;
}

export function DatabaseInformationFormModal({
  initial,
  onSaved,
  onClose,
}: DatabaseInformationFormModalProps) {
  const [content, setContent] = useState(initial?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = { content: content.trim() };

    try {
      const saved = initial
        ? await updateMyDatabaseInformation(initial.id, payload)
        : await createMyDatabaseInformation(payload);

      onSaved(saved);
      onClose();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível salvar a base de dados.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      wide
      title={initial ? 'Editar base de dados' : 'Nova base de dados'}
      onClose={onClose}
    >
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <Field
          label="Conteúdo"
          hint={`${content.length.toLocaleString('pt-BR')}/${MAX_CONTENT_LENGTH.toLocaleString('pt-BR')} caracteres. O Jarvis dá o nome e a descrição da base sozinho.`}
        >
          {(id) => (
            <TextArea
              id={id}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={MAX_CONTENT_LENGTH}
              rows={14}
              placeholder="Cole aqui o texto da sua base de dados."
              disabled={saving}
              autoFocus
              required
            />
          )}
        </Field>

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <ModalActions>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !content.trim()}>
            {saving ? 'Analisando…' : 'Salvar'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
