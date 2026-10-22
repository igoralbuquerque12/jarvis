import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from '../../../components/ui/field';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { useMyHealthChecks } from '../../../hooks/use-my-health-checks';
import { useMyProfile } from '../../../hooks/use-my-profile';
import {
  createMyHealthCheckConfig,
  deleteMyHealthCheckConfig,
  updateMyHealthCheckConfig,
} from '../../../services/health-check.service';
import type {
  HealthCheckConfig,
  HealthCheckHttpMethod,
} from '../../../types/api';

const SUGGESTED_ALERT_MESSAGE =
  'Olá, ${my_name}! A API monitorada apresentou falha em ${formated_timestamp} com código ${error_code} (${erro_translation}). Retorno da requisição: ${body_request}';

const DYNAMIC_VARIABLES = [
  {
    token: '${my_name}',
    label: 'Nome do usuário',
    description: 'Substituído pelo nome cadastrado no seu perfil.',
    sample: 'Igor',
  },
  {
    token: '${error_code}',
    label: 'Código do erro',
    description:
      'Código HTTP retornado pela requisição (ex.: 400, 401, 500) ou TIMEOUT.',
    sample: '500',
  },
  {
    token: '${formated_timestamp}',
    label: 'Quando ocorreu',
    description:
      'Data e hora formatadas (dd/MM/aaaa HH:mm:ss) no fuso horário do seu perfil.',
    sample: '21/10/2026 15:30:00',
  },
  {
    token: '${body_request}',
    label: 'Body da requisição',
    description: 'Conteúdo retornado no corpo da resposta quando o erro ocorre.',
    sample: '{"error":"Internal Server Error","service":"billing"}',
  },
  {
    token: '${erro_translation}',
    label: 'Tradução do erro (pt-BR)',
    description:
      'Significado em português do código HTTP (ex.: 400, 401, 421, 500, 501).',
    sample: 'Erro interno do servidor (Internal Server Error)',
  },
] as const;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function renderMessagePreview(template: string, userName?: string): string {
  const effectiveTemplate = template.trim() || SUGGESTED_ALERT_MESSAGE;
  return effectiveTemplate
    .replace(/\$\{my_name\}/g, userName || 'Igor')
    .replace(/\$\{error_code\}/g, '500')
    .replace(/\$\{formated_timestamp\}/g, '21/10/2026 15:30:00')
    .replace(/\$\{formatted_timestamp\}/g, '21/10/2026 15:30:00')
    .replace(
      /\$\{body_request\}/g,
      '{"error":"Internal Server Error","service":"api"}',
    )
    .replace(
      /\$\{erro_translation\}/g,
      'Erro interno do servidor (Internal Server Error)',
    )
    .replace(
      /\$\{error_translation\}/g,
      'Erro interno do servidor (Internal Server Error)',
    );
}

function buildDisplayUrl(url: string, endpoint: string): string {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.trim();
  if (!cleanEndpoint) {
    return cleanUrl;
  }
  return cleanEndpoint.startsWith('/')
    ? `${cleanUrl}${cleanEndpoint}`
    : `${cleanUrl}/${cleanEndpoint}`;
}

// ── Guide card ────────────────────────────────────────────────────────────────

function AlertMessageGuideCard({
  whatsappLinked,
  userName,
  currentTemplate,
  onUseSuggestion,
  onInsertVariable,
}: {
  whatsappLinked: boolean;
  userName?: string;
  currentTemplate: string;
  onUseSuggestion: () => void;
  onInsertVariable: (token: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Guia da mensagem de alerta"
        subtitle="Monte sua mensagem usando variáveis dinâmicas traduzidas automaticamente quando um erro ocorrer."
        aside={
          whatsappLinked ? (
            <Badge variant="success">WhatsApp conectado</Badge>
          ) : (
            <Badge variant="accent">WhatsApp pendente</Badge>
          )
        }
      />

      <p className="hint" style={{ marginBottom: 12 }}>
        A cada <strong>30 minutos</strong>, o Jarvis verifica todas as APIs
        salvas. Se o status for <strong>200 (2xx)</strong>, nada é feito. Se
        retornar erro (ex.: 400, 500) ou timeout, a sua{' '}
        <code>alertMessage</code> é enviada no WhatsApp.
      </p>

      <div className="hc-guide__variables">
        <span className="hc-guide__section-title">
          Variáveis dinâmicas disponíveis (clique para inserir)
        </span>
        <ul className="hc-variable-list">
          {DYNAMIC_VARIABLES.map((variable) => (
            <li key={variable.token} className="hc-variable-item">
              <div className="hc-variable-item__top">
                <button
                  type="button"
                  className="key-chip hc-variable-chip"
                  onClick={() => onInsertVariable(variable.token)}
                  title="Clique para adicionar à mensagem"
                >
                  {variable.token}
                </button>
                <span className="hc-variable-item__label">{variable.label}</span>
              </div>
              <p className="hc-variable-item__desc">{variable.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="hc-guide__suggestion">
        <div className="hc-guide__suggestion-head">
          <span className="hc-guide__section-title">Sugestão de estrutura</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onUseSuggestion}
          >
            Usar sugestão
          </Button>
        </div>
        <code className="hc-guide__template-box">{SUGGESTED_ALERT_MESSAGE}</code>
      </div>

      <div className="hc-guide__preview">
        <span className="hc-guide__section-title">
          Pré-visualização no WhatsApp (exemplo de erro 500)
        </span>
        <div className="hc-guide__preview-bubble">
          {renderMessagePreview(currentTemplate, userName)}
        </div>
      </div>

      {!whatsappLinked ? (
        <p className="hint" style={{ marginTop: 14 }}>
          Os alertas só são entregues depois de{' '}
          <Link to="/dashboard#conectar">vincular seu WhatsApp</Link>.
        </p>
      ) : null}
    </Card>
  );
}

// ── Config list card ──────────────────────────────────────────────────────────

function HealthCheckListCard({
  configs,
  loading,
  error,
  editingId,
  onEdit,
  onRemoved,
}: {
  configs: HealthCheckConfig[];
  loading: boolean;
  error: string | null;
  editingId: string | null;
  onEdit: (config: HealthCheckConfig) => void;
  onRemoved: (id: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(config: HealthCheckConfig) {
    const confirmed = window.confirm(
      `Excluir o monitoramento "${config.name}"?`,
    );
    if (!confirmed) {
      return;
    }

    setBusyId(config.id);
    setActionError(null);
    try {
      await deleteMyHealthCheckConfig(config.id);
      onRemoved(config.id);
    } catch (deleteError) {
      setActionError(
        errorMessage(
          deleteError,
          'Não foi possível excluir a configuração de Health Check.',
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  let body: React.ReactNode;

  if (loading) {
    body = <Spinner />;
  } else if (error) {
    body = <Alert variant="error">{error}</Alert>;
  } else if (configs.length === 0) {
    body = (
      <div className="event-empty">
        <strong>Nenhuma API monitorada ainda</strong>
        <p>
          Cadastre uma API ao lado para que o Jarvis monitore seu status a cada
          30 minutos e avise você no WhatsApp em caso de falha.
        </p>
      </div>
    );
  } else {
    body = (
      <ul className="api-key-list">
        {configs.map((config) => {
          const fullUrl = buildDisplayUrl(config.url, config.endpoint);
          const isEditing = editingId === config.id;
          return (
            <li
              key={config.id}
              className={
                isEditing
                  ? 'api-key-row hc-config-row hc-config-row--editing'
                  : 'api-key-row hc-config-row'
              }
            >
              <div className="api-key-row__body">
                <div className="hc-config-row__head">
                  <span className="method-badge">{config.httpMethod}</span>
                  <span className="api-key-row__name">{config.name}</span>
                  {config.authKey ? (
                    <Badge variant="neutral">
                      Header: {config.authKey} (encriptado)
                    </Badge>
                  ) : null}
                </div>
                <span className="api-key-row__meta">
                  <span className="key-chip">{fullUrl}</span>
                </span>
                <p className="hc-config-row__message">{config.alertMessage}</p>
              </div>
              <div className="api-key-row__actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busyId === config.id}
                  onClick={() => onEdit(config)}
                >
                  {isEditing ? 'Editando' : 'Editar'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={busyId === config.id}
                  onClick={() => void handleDelete(config)}
                >
                  Excluir
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card className="api-keys-list-card">
      <CardHeader
        title="APIs monitoradas"
        subtitle="Configurações salvas em cache (3 dias) e verificadas automaticamente a cada 30 minutos."
        aside={<Badge variant="neutral">{configs.length}</Badge>}
      />
      {actionError ? (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="error">{actionError}</Alert>
        </div>
      ) : null}
      {body}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function HealthCheckPage() {
  const { configs, setConfigs, loading, error } = useMyHealthChecks();
  const { profile } = useMyProfile();

  const [editing, setEditing] = useState<HealthCheckConfig | null>(null);
  const [name, setName] = useState('');
  const [httpMethod, setHttpMethod] = useState<HealthCheckHttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [authValue, setAuthValue] = useState('');
  const [alertMessage, setAlertMessage] = useState(SUGGESTED_ALERT_MESSAGE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setEditing(null);
    setName('');
    setHttpMethod('GET');
    setUrl('');
    setEndpoint('');
    setAuthKey('');
    setAuthValue('');
    setAlertMessage(SUGGESTED_ALERT_MESSAGE);
    setFormError(null);
  }

  function handleStartEdit(config: HealthCheckConfig) {
    setEditing(config);
    setName(config.name);
    setHttpMethod(config.httpMethod);
    setUrl(config.url);
    setEndpoint(config.endpoint);
    setAuthKey(config.authKey ?? '');
    setAuthValue('');
    setAlertMessage(config.alertMessage);
    setFormError(null);
  }

  function handleInsertVariable(token: string) {
    setAlertMessage((current) => {
      if (!current) {
        return token;
      }
      const needsSpace = !current.endsWith(' ') && !current.endsWith('\n');
      return `${current}${needsSpace ? ' ' : ''}${token}`;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const cleanKey = authKey.trim();
      const cleanValue = authValue.trim();

      if (editing) {
        const updated = await updateMyHealthCheckConfig(editing.id, {
          name: name.trim(),
          url: url.trim(),
          httpMethod,
          endpoint: endpoint.trim(),
          authKey: cleanKey ? cleanKey : null,
          ...(cleanValue ? { authValue: cleanValue } : {}),
          ...(!cleanKey ? { authValue: null } : {}),
          alertMessage: alertMessage.trim(),
        });

        setConfigs((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        resetForm();
      } else {
        const created = await createMyHealthCheckConfig({
          name: name.trim(),
          url: url.trim(),
          httpMethod,
          endpoint: endpoint.trim(),
          ...(cleanKey ? { authKey: cleanKey } : {}),
          ...(cleanValue ? { authValue: cleanValue } : {}),
          alertMessage: alertMessage.trim(),
        });

        setConfigs((current) => [created, ...current]);
        resetForm();
      }
    } catch (submitError) {
      setFormError(
        errorMessage(
          submitError,
          'Não foi possível salvar a configuração de Health Check.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="api-keys-page">
      <PageHeader
        title="Health Check de APIs"
        description="Cadastre suas APIs para que o Jarvis faça verificações periódicas e envie um alerta personalizado no seu WhatsApp caso ocorra erro 4xx, 5xx ou timeout."
      />

      <div className="api-keys-page__content">
        <div className="hc-page__left">
          <Card>
            <CardHeader
              title={
                editing ? `Editar: ${editing.name}` : 'Nova API monitorada'
              }
              subtitle="Defina o endpoint, autenticação opcional no header e o template de alerta."
              aside={
                editing ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    Cancelar edição
                  </Button>
                ) : null
              }
            />

            <form
              className="hc-form"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div className="hc-form__row">
                <Field
                  label="Nome da API"
                  hint="Ex.: API de Pagamentos, Backend Produção."
                >
                  {(id) => (
                    <TextInput
                      id={id}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={80}
                      placeholder="API de Produção"
                      required
                    />
                  )}
                </Field>

                <Field label="Método HTTP" hint="GET ou POST.">
                  {(id) => (
                    <Select
                      id={id}
                      value={httpMethod}
                      onChange={(event) =>
                        setHttpMethod(
                          event.target.value as HealthCheckHttpMethod,
                        )
                      }
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </Select>
                  )}
                </Field>
              </div>

              <div className="hc-form__row">
                <Field
                  label="URL Base"
                  hint="Ex.: https://api.seudominio.com.br"
                >
                  {(id) => (
                    <TextInput
                      id={id}
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      maxLength={500}
                      placeholder="https://api.seudominio.com.br"
                      required
                    />
                  )}
                </Field>

                <Field label="Endpoint" hint="Ex.: /health ou /v1/status">
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
              </div>

              <div className="hc-form__row">
                <Field
                  label="Auth Key (Header — opcional)"
                  hint="Nome exato do header. Ex.: Authorization ou x-api-key"
                >
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

                <Field
                  label="Auth Value (encriptado no banco)"
                  hint={
                    editing && editing.hasAuthValue
                      ? 'Deixe em branco para manter o valor atual, ou digite um novo.'
                      : 'Valor exato enviado no header. Ex.: Bearer seu-token'
                  }
                >
                  {(id) => (
                    <TextInput
                      id={id}
                      type="password"
                      value={authValue}
                      onChange={(event) => setAuthValue(event.target.value)}
                      maxLength={2000}
                      placeholder={
                        editing && editing.hasAuthValue
                          ? '•••••••••••• (salvo e encriptado)'
                          : 'Bearer eyJhbGci...'
                      }
                    />
                  )}
                </Field>
              </div>

              <Field
                label="Mensagem de alerta (alertMessage)"
                hint="Use as variáveis dinâmicas do guia ao lado para personalizar o aviso enviado no WhatsApp."
              >
                {(id) => (
                  <TextArea
                    id={id}
                    rows={4}
                    value={alertMessage}
                    onChange={(event) => setAlertMessage(event.target.value)}
                    maxLength={1500}
                    required
                  />
                )}
              </Field>

              <div className="auth__actions">
                {formError ? <Alert variant="error">{formError}</Alert> : null}
                <div>
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? 'Salvando…'
                      : editing
                        ? 'Salvar alterações'
                        : 'Adicionar monitoramento'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          <HealthCheckListCard
            configs={configs}
            loading={loading}
            error={error}
            editingId={editing?.id ?? null}
            onEdit={handleStartEdit}
            onRemoved={(id) => {
              setConfigs((current) => current.filter((item) => item.id !== id));
              if (editing?.id === id) {
                resetForm();
              }
            }}
          />
        </div>

        <div className="api-keys-page__support">
          <AlertMessageGuideCard
            whatsappLinked={profile?.whatsappLinked ?? true}
            userName={profile?.name}
            currentTemplate={alertMessage}
            onUseSuggestion={() => setAlertMessage(SUGGESTED_ALERT_MESSAGE)}
            onInsertVariable={handleInsertVariable}
          />
        </div>
      </div>
    </div>
  );
}

