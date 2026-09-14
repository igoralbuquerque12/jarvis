import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { IconBriefcase, IconPlus } from '../../../components/ui/icons';
import { Modal, ModalActions } from '../../../components/ui/modal';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { Stat } from '../../../components/ui/stat';
import { useMyAssets } from '../../../hooks/use-my-assets';
import {
  createMyAsset,
  deleteMyAsset,
} from '../../../services/finance.service';
import { ASSET_TYPE_OPTIONS } from '../asset-types';
import { Amount } from '../components/amount';
import { AssetRow } from '../components/asset-row';

function AssetForm({
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
  const [formError, setFormError] = useState<string | null>(null);

  const number = (value: string) =>
    value ? parseFloat(value.replace(',', '.')) : undefined;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await createMyAsset({
        name: name.trim(),
        type,
        ticker: ticker.trim() || undefined,
        units: number(units),
        purchasePrice: number(purchasePrice),
        currentValue: number(currentValue),
        purchaseDate: purchaseDate || undefined,
      });
      onCreated();
      onClose();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Erro ao criar ativo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo ativo" onClose={onClose}>
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="field">
          <label className="label" htmlFor="asset-name">
            Nome
          </label>
          <input
            id="asset-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Ex.: Petrobras, Bitcoin, Tesouro Selic"
            autoFocus
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="asset-type">
              Tipo
            </label>
            <select
              id="asset-type"
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {ASSET_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="asset-ticker">
              Código
            </label>
            <input
              id="asset-ticker"
              className="input"
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              placeholder="Ex.: PETR4"
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="asset-units">
              Quantidade
            </label>
            <input
              id="asset-units"
              className="input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={units}
              onChange={(event) => setUnits(event.target.value)}
              placeholder="Ex.: 100"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="asset-buy-price">
              Preço de compra (R$)
            </label>
            <input
              id="asset-buy-price"
              className="input"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              placeholder="Por unidade"
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="asset-curr-val">
              Valor atual (R$)
            </label>
            <input
              id="asset-curr-val"
              className="input"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={currentValue}
              onChange={(event) => setCurrentValue(event.target.value)}
              placeholder="Total da posição"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="asset-date">
              Data de compra
            </label>
            <input
              id="asset-date"
              className="input"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
            />
          </div>
        </div>
        {formError ? <Alert variant="error">{formError}</Alert> : null}
        <ModalActions>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Criando…' : 'Adicionar ativo'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export function FinanceInvestmentsPage() {
  const { assets, loading, error, reload } = useMyAssets();
  const [creating, setCreating] = useState(false);

  async function handleDelete(id: string) {
    if (!window.confirm('Remover este ativo? Esta ação não pode ser desfeita.')) {
      return;
    }
    await deleteMyAsset(id);
    reload();
  }

  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue ?? 0), 0);
  const totalCost = assets.reduce((sum, asset) => sum + (asset.totalCost ?? 0), 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Finanças"
        title="Investimentos"
        description="Sua carteira: ações, cripto, renda fixa e imóveis."
        actions={
          <Button onClick={() => setCreating(true)}>
            <IconPlus />
            Novo ativo
          </Button>
        }
      />

      <div className="stats stats--3">
        <Stat
          label="Valor da carteira"
          tone="accent"
          value={<Amount value={totalValue} />}
          foot={`${assets.length} ${assets.length === 1 ? 'ativo' : 'ativos'}`}
        />
        <Stat label="Custo total" value={<Amount value={totalCost} />} foot="Quanto foi investido" />
        <Stat
          label="Resultado"
          tone={totalGain >= 0 ? 'success' : 'danger'}
          value={<Amount value={totalGain} colored />}
          foot={
            totalCost > 0
              ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}% sobre o custo`
              : 'Informe custo e valor atual para ver o resultado'
          }
        />
      </div>

      {loading ? (
        <Spinner page />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : assets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconBriefcase />}
            title="Nenhum ativo cadastrado"
            action={
              <Button variant="ghost" onClick={() => setCreating(true)}>
                <IconPlus />
                Adicionar o primeiro ativo
              </Button>
            }
          >
            Cadastre suas posições para acompanhar o valor da carteira e o
            resultado ao longo do tempo.
          </EmptyState>
        </Card>
      ) : (
        <Card flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Tipo</th>
                  <th className="table__num">Qtd.</th>
                  <th className="table__num">Custo</th>
                  <th className="table__num">Valor atual</th>
                  <th className="table__num">Resultado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {creating ? (
        <AssetForm onCreated={reload} onClose={() => setCreating(false)} />
      ) : null}
    </>
  );
}
