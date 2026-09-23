import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { Field, TextInput } from '../../../components/ui/field';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { useMyApiKeys } from '../../../hooks/use-my-api-keys';
import { useMyProfile } from '../../../hooks/use-my-profile';
import {
  createMyApiKey,
  deleteMyApiKey,
  updateMyApiKey,
} from '../../../services/api-keys.service';
import type { ApiKey, CreatedApiKey } from '../../../types/api';
import { ApiKeyRow } from '../components/api-key-row';
import { NewApiKeyModal } from '../components/new-api-key-modal';

const MAX_KEYS = 10;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateKeyCard({
  total,
  onCreated,
}: {
  total: number;
  onCreated: (apiKey: CreatedApiKey) => void;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limitReached = total >= MAX_KEYS;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const created = await createMyApiKey(name.trim());
      setName('');
      onCreated(created);
    } catch (submitError) {
      setError(errorMessage(submitError, 'Não foi possível criar a chave.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Nova chave"
        subtitle="Dê um nome que identifique onde ela será usada."
      />
      <form onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Nome" hint="Ex.: Automação n8n, Script de deploy, Home Assistant.">
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="Automação n8n"
              disabled={limitReached}
              required
            />
          )}
        </Field>
        <div className="auth__actions">
          {error ? <Alert variant="error">{error}</Alert> : null}
          <div>
            <Button type="submit" disabled={saving || limitReached}>
              {saving ? 'Gerando…' : 'Gerar chave'}
            </Button>
          </div>
        </div>
      </form>
      {limitReached ? (
        <p className="hint" style={{ marginTop: 12 }}>
          Você atingiu o limite de chaves. Exclua uma para criar outra.
        </p>
      ) : null}
    </Card>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorksCard({ whatsappLinked }: { whatsappLinked: boolean }) {
  return (
    <Card>
      <CardHeader
        title="Como funciona"
        aside={
          whatsappLinked ? (
            <Badge variant="success">WhatsApp conectado</Badge>
          ) : (
            <Badge variant="accent">WhatsApp pendente</Badge>
          )
        }
      />
      <ol className="steps-list">
        <li>
          <strong>Gere uma chave</strong> e guarde o segredo: ele aparece uma
          única vez.
        </li>
        <li>
          <strong>Chame a API</strong> com{' '}
          <span className="key-chip">Authorization: Bearer jrv_…</span>
        </li>
        <li>
          <strong>O Jarvis envia a mensagem</strong> para o seu próprio
          WhatsApp, em seu nome.
        </li>
      </ol>
      {!whatsappLinked ? (
        <p className="hint" style={{ marginTop: 14 }}>
          As chamadas só funcionam depois de vincular seu WhatsApp no{' '}
          <Link to="/dashboard">painel</Link>.
        </p>
      ) : null}
      <p className="hint" style={{ marginTop: 14 }}>
        Endpoints, exemplos e códigos de erro estão na{' '}
        <Link to="/configuracoes/documentacao">documentação</Link>.
      </p>
    </Card>
  );
}

// ── Key list ──────────────────────────────────────────────────────────────────

function KeyListCard({
  apiKeys,
  loading,
  error,
  onChange,
  onRemoved,
}: {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  onChange: (apiKey: ApiKey) => void;
  onRemoved: (id: string) => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleToggle(apiKey: ApiKey, active: boolean) {
    setActionError(null);
    try {
      onChange(await updateMyApiKey(apiKey.id, { active }));
    } catch (toggleError) {
      setActionError(
        errorMessage(toggleError, 'Não foi possível atualizar a chave.'),
      );
    }
  }

  async function handleDelete(apiKey: ApiKey) {
    setActionError(null);
    try {
      await deleteMyApiKey(apiKey.id);
      onRemoved(apiKey.id);
    } catch (deleteError) {
      setActionError(
        errorMessage(deleteError, 'Não foi possível excluir a chave.'),
      );
    }
  }

  let body: React.ReactNode;

  if (loading) {
    body = <Spinner />;
  } else if (error) {
    body = <Alert variant="error">{error}</Alert>;
  } else if (apiKeys.length === 0) {
    body = (
      <div className="event-empty">
        <strong>Nenhuma chave ainda</strong>
        <p>Crie a primeira chave abaixo para começar a integrar o Jarvis.</p>
      </div>
    );
  } else {
    body = (
      <ul className="api-key-list">
        {apiKeys.map((apiKey) => (
          <ApiKeyRow
            key={apiKey.id}
            apiKey={apiKey}
            onToggle={(active) => handleToggle(apiKey, active)}
            onDelete={() => handleDelete(apiKey)}
          />
        ))}
      </ul>
    );
  }

  return (
    <Card className="api-keys-list-card">
      <CardHeader
        title="Suas chaves"
        subtitle="Pause uma chave para bloquear o acesso sem perdê-la, ou exclua de vez."
        aside={<Badge variant="neutral">{apiKeys.length}/{MAX_KEYS}</Badge>}
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

export function ApiKeysPage() {
  const { apiKeys, setApiKeys, loading, error } = useMyApiKeys();
  const { profile } = useMyProfile();
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  function handleCreated(apiKey: CreatedApiKey) {
    setApiKeys((current) => [apiKey, ...current]);
    setCreated(apiKey);
  }

  function handleChange(updated: ApiKey) {
    setApiKeys((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  function handleRemoved(id: string) {
    setApiKeys((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="api-keys-page">
      <PageHeader
        title="Chaves de API"
        description="Use o Jarvis a partir dos seus próprios sistemas. Cada chave identifica você e permite que scripts e automações enviem mensagens pelo assistente."
      />

      <div className="api-keys-page__content">
        <KeyListCard
          apiKeys={apiKeys}
          loading={loading}
          error={error}
          onChange={handleChange}
          onRemoved={handleRemoved}
        />
        <div className="api-keys-page__support">
          <CreateKeyCard total={apiKeys.length} onCreated={handleCreated} />
          <HowItWorksCard whatsappLinked={profile?.whatsappLinked ?? true} />
        </div>
      </div>

      {created ? (
        <NewApiKeyModal apiKey={created} onClose={() => setCreated(null)} />
      ) : null}
    </div>
  );
}
