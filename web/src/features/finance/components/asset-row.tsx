import type { Asset } from '../../../types/api';
import { Amount } from './amount';

interface AssetRowProps {
  asset: Asset;
  onDelete?: (id: string) => void;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Ação',
  crypto: 'Cripto',
  real_estate: 'Imóvel',
  fixed_income: 'Renda Fixa',
  other: 'Outro',
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      width={16}
      height={16}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export function AssetRow({ asset, onDelete }: AssetRowProps) {
  const gain =
    asset.currentValue != null && asset.totalCost != null
      ? asset.currentValue - asset.totalCost
      : null;

  return (
    <tr className="asset-table__row">
      <td>
        <div className="asset-table__name-cell">
          <span className="asset-table__name">{asset.name}</span>
          {asset.ticker && (
            <span className="badge badge--neutral">{asset.ticker}</span>
          )}
        </div>
      </td>
      <td>
        <span className="badge badge--accent">
          {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
        </span>
      </td>
      <td className="asset-table__num">
        {asset.currentValue != null ? (
          <Amount value={asset.currentValue} currency={asset.currency} />
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td className="asset-table__num">
        {asset.units != null ? (
          <span className="mono">{asset.units.toLocaleString('pt-BR')}</span>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td className="asset-table__num">
        {gain != null ? (
          <Amount value={gain} currency={asset.currency} colored />
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td>
        {onDelete && (
          <button
            type="button"
            className="tx-row__action-btn tx-row__action-btn--danger"
            title="Remover ativo"
            onClick={() => onDelete(asset.id)}
          >
            <TrashIcon />
          </button>
        )}
      </td>
    </tr>
  );
}
