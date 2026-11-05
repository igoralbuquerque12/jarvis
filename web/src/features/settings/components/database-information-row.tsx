import { useState } from 'react';
import { IconButton } from '../../../components/ui/button';
import { IconEdit, IconLayers, IconTrash } from '../../../components/ui/icons';
import type { DatabaseInformation } from '../../../types/api';

interface DatabaseInformationRowProps {
  item: DatabaseInformation;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function DatabaseInformationRow({
  item,
  onEdit,
  onDelete,
}: DatabaseInformationRowProps) {
  const [busy, setBusy] = useState(false);

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

  return (
    <li className="hc-row">
      <span className="hc-row__icon">
        <IconLayers />
      </span>
      <div className="hc-row__body">
        <div className="hc-row__head">
          <span className="hc-row__name">{item.name}</span>
        </div>
        <p className="hc-row__message">{item.content}</p>
      </div>
      <div className="hc-row__actions">
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
