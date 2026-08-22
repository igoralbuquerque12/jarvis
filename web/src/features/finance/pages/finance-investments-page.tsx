import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Spinner } from '../../../components/ui/spinner';
import { useMyAssets } from '../../../hooks/use-my-assets';
import {
  createMyAsset,
  deleteMyAsset,
} from '../../../services/finance.service';
import { Amount } from '../components/amount';
import { AssetRow } from '../components/asset-row';

const ASSET_TYPES = [
  { value: 'stock', label: 'Ação' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'real_estate', label: 'Imóvel' },
  { value: 'fixed_income', label: 'Renda Fixa' },
  { value: 'other', label: 'Outro' },
];

function CreateAssetForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('stock');
  const [ticker, setTicker] = useState('');
  const [units, setUnits] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await createMyAsset({
        name,
        type,
        ticker: ticker || undefined,
        units: units ? parseFloat(units) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        currentValue: currentValue ? parseFloat(currentValue) : undefined,
        purchaseDate: purchaseDate || undefined,
      });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar ativo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card__header">
        <h3 className="card__title">Novo Ativo</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Cancelar</button>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="field">
          <label className="label" htmlFor="asset-name">Nome</label>
          <input id="asset-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: PETR4, Bitcoin, Apartamento" />
        </div>
        <div className="field">
          <label className="label" htmlFor="asset-type">Tipo</label>
          <select id="asset-type" className="select" value={type} onChange={(e) => setType(e.target.value)}>
            {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="asset-ticker">Ticker (opcional)</label>
          <input id="asset-ticker" className="input" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="Ex: PETR4" />
        </div>
        <div className="field">
          <label className="label" htmlFor="asset-units">Quantidade</label>
          <input id="asset-units" className="input" type="number" step="any" min="0" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="Ex: 100" />
        </div>
        <div className="field">
          <label className="label" htmlFor="asset-buy-price">Preço de compra (R$)</label>
          <input id="asset-buy-price" className="input" type="number" step="0.000001" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="asset-curr-val">Valor atual (R$)</label>
          <input id="asset-curr-val" className="input" type="number" step="0.01" min="0" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="asset-date">Data de compra</label>
          <input id="asset-date" className="input" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        {err && <div className="alert alert--error" style={{ marginTop: 12 }}>{err}</div>}
        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Criando…' : 'Adicionar ativo'}</button>
        </div>
      </form>
    </div>
  );
}

export function FinanceInvestmentsPage() {
  const { assets, loading, error, reload } = useMyAssets();
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm('Remover este ativo? Esta ação não pode ser desfeita.')) return;
    await deleteMyAsset(id);
    reload();
  }

  const totalValue = assets.reduce((sum, a) => sum + (a.currentValue ?? 0), 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.totalCost ?? 0), 0);
  const totalGain = totalValue - totalCost;

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Investimentos</span>
        <h2>Portfólio</h2>
        <p>Acompanhe seus ativos e o desempenho da carteira.</p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      {/* Portfolio KPIs */}
      {!loading && assets.length > 0 && (
        <div className="fin-kpi-row" style={{ marginBottom: 24 }}>
          <div className="fin-kpi">
            <span className="fin-kpi__label">Valor total</span>
            <Amount value={totalValue} className="fin-kpi__value" />
          </div>
          <div className="fin-kpi">
            <span className="fin-kpi__label">Custo total</span>
            <Amount value={totalCost} className="fin-kpi__value" />
          </div>
          <div className="fin-kpi">
            <span className="fin-kpi__label">Ganho/Perda</span>
            <Amount value={totalGain} colored className="fin-kpi__value" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? '× Cancelar' : '+ Novo ativo'}
        </button>
      </div>

      {showForm && (
        <CreateAssetForm onCreated={reload} onClose={() => setShowForm(false)} />
      )}

      {loading ? (
        <Spinner page />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : assets.length === 0 ? (
        <div className="card">
          <div className="event-empty">
            <strong>Nenhum ativo cadastrado</strong>
            <p>Adicione ações, cripto, renda fixa e outros investimentos.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="asset-table">
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Tipo</th>
                <th className="asset-table__num">Valor atual</th>
                <th className="asset-table__num">Qtd.</th>
                <th className="asset-table__num">Ganho/Perda</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <AssetRow
                  key={a.id}
                  asset={a}
                  onDelete={(id) => void handleDelete(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
