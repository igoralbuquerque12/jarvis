import { Badge } from '../../../components/ui/badge';
import { IconButton } from '../../../components/ui/button';
import { IconTrash } from '../../../components/ui/icons';
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
            <span className="key-chip">{asset.ticker}</span>
          )}
        </div>
      </td>
      <td>
        <Badge variant="plain">
          {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
        </Badge>
      </td>
      <td className="asset-table__num">
        {asset.units != null ? (
          <span className="mono">{asset.units.toLocaleString('pt-BR')}</span>
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td className="asset-table__num">
        {asset.totalCost != null ? (
          <Amount value={asset.totalCost} currency={asset.currency} />
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td className="asset-table__num">
        {asset.currentValue != null ? (
          <Amount value={asset.currentValue} currency={asset.currency} />
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
      <td className="table__actions">
        {onDelete && (
          <IconButton label="Remover ativo" danger onClick={() => onDelete(asset.id)}>
            <IconTrash />
          </IconButton>
        )}
      </td>
    </tr>
  );
}
