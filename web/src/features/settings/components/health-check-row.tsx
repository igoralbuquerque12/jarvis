import { useState } from 'react';
import { IconButton } from '../../../components/ui/button';
import { IconActivity, IconEdit, IconTrash } from '../../../components/ui/icons';
import type { HealthCheckConfig } from '../../../types/api';
import { buildDisplayUrl } from '../health-check-variables';

interface HealthCheckRowProps {
  config: HealthCheckConfig;
  onToggle: (active: boolean) => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function HealthCheckRow({
  config,
  onToggle,
  onEdit,
  onDelete,
}: HealthCheckRowProps) {
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
    if (window.confirm(`Excluir o monitoramento "${config.name}"?`)) {
      void run(onDelete);
    }
  }

  return (
    <li
      className={
        config.active ? 'hc-row' : 'hc-row hc-row--paused'
      }
    >
      <span className="hc-row__icon">
        <IconActivity />
      </span>
      <div className="hc-row__body">
        <div className="hc-row__head">
          <span className="hc-row__name">{config.name}</span>
          <span className="hc-row__status">
            {config.active ? 'Monitorando' : 'Pausado'}
          </span>
        </div>
        <span className="hc-row__target">
          <span className="method-badge">{config.httpMethod}</span>
          <span className="hc-row__url">
            {buildDisplayUrl(config.url, config.endpoint)}
          </span>
        </span>
        <p className="hc-row__message">{config.alertMessage}</p>
      </div>
      <div className="hc-row__actions">
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={config.active}
          aria-label={
            config.active ? 'Pausar monitoramento' : 'Ativar monitoramento'
          }
          title={
            config.active
              ? 'Ativo — clique para pausar'
              : 'Pausado — clique para ativar'
          }
          disabled={busy}
          onClick={() => void run(() => onToggle(!config.active))}
        />
        <IconButton label="Editar" disabled={busy} onClick={onEdit}>
          <IconEdit />
        </IconButton>
        <IconButton label="Excluir" danger disabled={busy} onClick={handleDelete}>
          <IconTrash />
        </IconButton>
      </div>
    </li>
  );
}
