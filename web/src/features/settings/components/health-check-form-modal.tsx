import type { FormEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Field, Select, TextInput } from '../../../components/ui/field';
import { IconLock } from '../../../components/ui/icons';
import { Modal, ModalActions } from '../../../components/ui/modal';
import {
  createMyHealthCheckConfig,
  updateMyHealthCheckConfig,
} from '../../../services/health-check.service';
import type {
  HealthCheckConfig,
  HealthCheckHttpMethod,
} from '../../../types/api';
import {
  buildDisplayUrl,
  SUGGESTED_ALERT_MESSAGE,
} from '../health-check-variables';
import { AlertMessageEditor } from './alert-message-editor';
import { AlertMessageGuide } from './alert-message-guide';

interface HealthCheckFormModalProps {
  initial?: HealthCheckConfig;
  userName?: string;
  onSaved: (config: HealthCheckConfig) => void;
  onClose: () => void;
}

export function HealthCheckFormModal({
  initial,
  userName,
  onSaved,
  onClose,
}: HealthCheckFormModalProps) {
  const messageId = useId();
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState(initial?.name ?? '');
  const [httpMethod, setHttpMethod] = useState<HealthCheckHttpMethod>(
    initial?.httpMethod ?? 'GET',
  );
  const [url, setUrl] = useState(initial?.url ?? '');
  const [endpoint, setEndpoint] = useState(initial?.endpoint ?? '');
  const [authKey, setAuthKey] = useState(initial?.authKey ?? '');
  const [authValue, setAuthValue] = useState('');
  const [message, setMessage] = useState(
    initial?.alertMessage ?? SUGGESTED_ALERT_MESSAGE,
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const targetUrl = url.trim() ? buildDisplayUrl(url, endpoint) : '';

  function handleInsert(token: string) {
    const field = messageRef.current;
    const start = field?.selectionStart ?? message.length;
    const end = field?.selectionEnd ?? start;
    const caret = start + token.length;

    setMessage(`${message.slice(0, start)}${token}${message.slice(end)}`);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(caret, caret);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const cleanKey = authKey.trim();
    const cleanValue = authValue.trim();

    try {
      const saved = initial
        ? await updateMyHealthCheckConfig(initial.id, {
            name: name.trim(),
            url: url.trim(),
            httpMethod,
            endpoint: endpoint.trim(),
            authKey: cleanKey || null,
            ...(cleanValue ? { authValue: cleanValue } : {}),
            ...(!cleanKey ? { authValue: null } : {}),
            alertMessage: message.trim(),
          })
        : await createMyHealthCheckConfig({
            name: name.trim(),
            url: url.trim(),
            httpMethod,
            endpoint: endpoint.trim(),
            ...(cleanKey ? { authKey: cleanKey } : {}),
            ...(cleanValue ? { authValue: cleanValue } : {}),
            alertMessage: message.trim(),
          });

      onSaved(saved);
      onClose();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível salvar o monitoramento.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      xl
      title={initial ? 'Editar monitoramento' : 'Novo monitoramento'}
      onClose={onClose}
    >
      <form className="form hc-modal" onSubmit={(event) => void handleSubmit(event)}>
        <div className="hc-modal__grid">
          <section className="hc-modal__col">
            <h4 className="hc-modal__section">1 · A API</h4>

            <Field label="Nome">
              {(id) => (
                <TextInput
                  id={id}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  placeholder="API de pagamentos"
                  autoFocus
                  required
                />
              )}
            </Field>

            <div className="hc-modal__row hc-modal__row--method">
              <Field label="Método">
                {(id) => (
                  <Select
                    id={id}
                    value={httpMethod}
                    onChange={(event) =>
                      setHttpMethod(event.target.value as HealthCheckHttpMethod)
                    }
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </Select>
                )}
              </Field>
              <Field label="URL base">
                {(id) => (
                  <TextInput
                    id={id}
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    maxLength={500}
                    placeholder="https://api.seudominio.com"
                    required
                  />
                )}
              </Field>
            </div>

            <Field label="Endpoint (opcional)">
              {(id) => (
                <TextInput
                  id={id}
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  maxLength={255}
                  placeholder="/health"
                />
              )}
            </Field>

            <div className="hc-target" aria-live="polite">
              <span className="hc-target__label">Endereço verificado</span>
              {targetUrl ? (
                <span className="hc-target__url">
                  <span className="method-badge">{httpMethod}</span>
                  {targetUrl}
                </span>
              ) : (
                <span className="hc-target__empty">
                  Preencha a URL para ver o endereço completo.
                </span>
              )}
            </div>

            <fieldset className="hc-auth">
              <legend className="hc-auth__legend">
                <IconLock />
                Autenticação · opcional
              </legend>
              <div className="hc-modal__row">
                <Field label="Nome do header">
                  {(id) => (
                    <TextInput
                      id={id}
                      value={authKey}
                      onChange={(event) => setAuthKey(event.target.value)}
                      maxLength={120}
                      placeholder="Authorization"
                    />
                  )}
                </Field>
                <Field label="Valor do header">
                  {(id) => (
                    <TextInput
                      id={id}
                      type="password"
                      value={authValue}
                      onChange={(event) => setAuthValue(event.target.value)}
                      maxLength={2000}
                      autoComplete="new-password"
                      placeholder={
                        initial?.hasAuthValue
                          ? '•••••••• (mantido)'
                          : 'Bearer seu-token'
                      }
                    />
                  )}
                </Field>
              </div>
              <p className="hc-auth__note">
                {initial?.hasAuthValue
                  ? 'Deixe o valor em branco para manter o atual. '
                  : ''}
                Guardamos o valor criptografado e ele nunca volta para a tela.
              </p>
            </fieldset>
          </section>

          <section className="hc-modal__col hc-modal__col--message">
            <h4 className="hc-modal__section">2 · O aviso no WhatsApp</h4>

            <div className="field">
              <label className="label" htmlFor={messageId}>
                Mensagem de alerta
              </label>
              <AlertMessageEditor
                id={messageId}
                value={message}
                onChange={setMessage}
                textareaRef={messageRef}
              />
            </div>

            <AlertMessageGuide
              message={message}
              userName={userName}
              onInsert={handleInsert}
              onUseSuggestion={() => setMessage(SUGGESTED_ALERT_MESSAGE)}
            />
          </section>
        </div>

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
                : 'Começar a monitorar'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
