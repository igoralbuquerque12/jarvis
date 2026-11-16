import { useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { IconButton } from '../../../components/ui/button';
import {
  IconEdit,
  IconLayers,
  IconRepeat,
  IconTrash,
} from '../../../components/ui/icons';
import type {
  DatabaseInformation,
  KnowledgeIndexStatus,
} from '../../../types/api';

interface DatabaseInformationRowProps {
  item: DatabaseInformation;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onReindex: () => Promise<void>;
}

const INDEX_STATUS: Record<
  KnowledgeIndexStatus,
  { label: string; variant: 'accent' | 'success' | 'danger' }
> = {
  PENDING: { label: 'Indexando…', variant: 'accent' },
  PROCESSING: { label: 'Indexando…', variant: 'accent' },
  READY: { label: 'Pronta para busca', variant: 'success' },
  FAILED: { label: 'Falha na indexação', variant: 'danger' },
};

export function DatabaseInformationRow({
  item,
  onEdit,
  onDelete,
  onReindex,
}: DatabaseInformationRowProps) {
  const [busy, setBusy] = useState(false);
  const status = INDEX_STATUS[item.indexStatus];

  async function handleDelete() {
    if (!window.confirm(`Excluir a base "${item.name}"?`)) {
      return;
    }

    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  }

  async function handleReindex() {
    setBusy(true);
    try {
      await onReindex();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="hc-row">
      <span className="hc-row__icon">
        <IconLayers />
      </span>
      <div className="hc-row__body">
        <div className="hc-row__head">
          <span className="hc-row__name">{item.name}</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="hc-row__message">{item.content}</p>
      </div>
      <div className="hc-row__actions">
        {item.indexStatus === 'FAILED' ? (
          <IconButton
            label="Tentar indexar de novo"
            disabled={busy}
            onClick={() => void handleReindex()}
          >
            <IconRepeat />
          </IconButton>
        ) : null}
        <IconButton label="Editar" disabled={busy} onClick={onEdit}>
          <IconEdit />
        </IconButton>
        <IconButton
          label="Excluir"
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          <IconTrash />
        </IconButton>
      </div>
    </li>
  );
}
