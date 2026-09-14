import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import type { ApiKey } from '../../../types/api';

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M18 12v3M15 12v2" />
    </svg>
  );
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : 'nunca';
}

interface ApiKeyRowProps {
  apiKey: ApiKey;
  onToggle: (active: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ApiKeyRow({ apiKey, onToggle, onDelete }: ApiKeyRowProps) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Excluir a chave "${apiKey.name}"? Integrações que a usam vão parar de funcionar.`,
    );
    if (confirmed) {
      void run(onDelete);
    }
  }

  return (
    <li
      className={
        apiKey.active ? 'api-key-row' : 'api-key-row api-key-row--inactive'
      }
    >
      <span className="api-key-row__icon">
        <KeyIcon />
      </span>
      <div className="api-key-row__body">
        <span className="api-key-row__name">{apiKey.name}</span>
        <span className="api-key-row__meta">
          <span className="key-chip">{apiKey.prefix}…</span>
          <span>Criada em {formatDate(apiKey.createdAt)}</span>
          <span>· Último uso: {formatDate(apiKey.lastUsedAt)}</span>
        </span>
      </div>
      <div className="api-key-row__actions">
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={apiKey.active}
          aria-label={apiKey.active ? 'Desativar chave' : 'Ativar chave'}
          title={apiKey.active ? 'Ativa — clique para pausar' : 'Inativa — clique para ativar'}
          disabled={busy}
          onClick={() => void run(() => onToggle(!apiKey.active))}
        />
        <Button
          variant="danger"
          size="sm"
          disabled={busy}
          onClick={handleDelete}
        >
          Excluir
        </Button>
      </div>
    </li>
  );
}
