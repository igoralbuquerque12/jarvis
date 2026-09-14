import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button, IconButton } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import {
  IconTag,
  IconTrash,
  IconWallet,
} from '../../../components/ui/icons';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { useMyAccounts } from '../../../hooks/use-my-accounts';
import { useMyCategories } from '../../../hooks/use-my-categories';
import { useMyRules } from '../../../hooks/use-my-rules';
import {
  createMyCategory,
  deleteMyCategory,
  deleteMyRule,
} from '../../../services/finance.service';
import type { FinanceCategory, Rule } from '../../../types/api';
import { Amount } from '../components/amount';

// ── Accounts ──────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de crédito',
  cash: 'Dinheiro',
  investment: 'Investimento',
  wallet: 'Carteira',
};

function AccountsCard() {
  const { accounts, loading, error } = useMyAccounts();

  return (
    <Card>
      <CardHeader
        title="Contas"
        subtitle="Onde o dinheiro entra e sai."
        aside={accounts.length > 0 ? <Badge variant="neutral">{accounts.length}</Badge> : undefined}
      />
      {loading ? (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : accounts.length === 0 ? (
        <EmptyState icon={<IconWallet />} title="Nenhuma conta">
          A conta padrão é criada automaticamente pelo Jarvis.
        </EmptyState>
      ) : (
        <ul className="simple-list">
          {accounts.map((account) => (
            <li key={account.id}>
              <span className="simple-list__icon" aria-hidden="true">
                {account.icon ? account.icon : <IconWallet />}
              </span>
              <div className="simple-list__body">
                <span className="simple-list__title">
                  {account.name}
                  {account.isDefault ? (
                    <Badge variant="accent">Padrão</Badge>
                  ) : null}
                </span>
                <span className="simple-list__meta">
                  {[
                    ACCOUNT_TYPE_LABELS[account.type] ?? account.type,
                    account.institution,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <Amount value={account.balance} currency={account.currency} colored />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────

function CategoryItem({
  category,
  onDelete,
}: {
  category: FinanceCategory;
  onDelete: () => void;
}) {
  return (
    <li>
      <span className="simple-list__icon" aria-hidden="true">
        {category.icon ? category.icon : <IconTag />}
      </span>
      <div className="simple-list__body">
        <span className="simple-list__title">{category.name}</span>
        {category.isDefault ? (
          <span className="simple-list__meta">Categoria padrão</span>
        ) : null}
      </div>
      {!category.isDefault ? (
        <IconButton label="Excluir categoria" danger onClick={onDelete}>
          <IconTrash />
        </IconButton>
      ) : null}
    </li>
  );
}

function CategoriesCard() {
  const { categories, loading, error, reload } = useMyCategories();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await createMyCategory({ name: name.trim(), icon: icon.trim() || undefined });
      setName('');
      setIcon('');
      reload();
    } catch (createError: unknown) {
      setFormError(
        createError instanceof Error ? createError.message : 'Erro ao criar.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir categoria?')) return;
    await deleteMyCategory(id);
    reload();
  }

  return (
    <Card>
      <CardHeader
        title="Categorias"
        subtitle="Como os lançamentos são agrupados."
        aside={categories.length > 0 ? <Badge variant="neutral">{categories.length}</Badge> : undefined}
      />
      <form className="inline-form" onSubmit={(event) => void handleCreate(event)}>
        <div className="field field--emoji">
          <label className="label" htmlFor="cat-icon">
            Ícone
          </label>
          <input
            id="cat-icon"
            className="input"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="🐾"
            maxLength={4}
          />
        </div>
        <div className="field field--grow">
          <label className="label" htmlFor="cat-name">
            Nova categoria
          </label>
          <input
            id="cat-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Ex.: Pets"
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? '…' : 'Criar'}
        </Button>
      </form>
      {formError ? (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="error">{formError}</Alert>
        </div>
      ) : null}
      {loading ? (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <ul className="simple-list">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onDelete={() => void handleDelete(category.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────────

function RuleItem({ rule, onDelete }: { rule: Rule; onDelete: () => void }) {
  const conditions = rule.conditions.length;
  const actions = rule.actions.length;

  return (
    <li>
      <div className="simple-list__body">
        <span className="simple-list__title">{rule.name}</span>
        <span className="simple-list__meta">
          Prioridade {rule.priority} · {conditions}{' '}
          {conditions === 1 ? 'condição' : 'condições'} · {actions}{' '}
          {actions === 1 ? 'ação' : 'ações'}
        </span>
      </div>
      <Badge variant={rule.isActive ? 'success' : 'neutral'}>
        {rule.isActive ? 'Ativa' : 'Inativa'}
      </Badge>
      <IconButton label="Excluir regra" danger onClick={onDelete}>
        <IconTrash />
      </IconButton>
    </li>
  );
}

function RulesCard() {
  const { rules, loading, error, reload } = useMyRules();

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta regra de categorização?')) return;
    await deleteMyRule(id);
    reload();
  }

  return (
    <Card>
      <CardHeader
        title="Regras automáticas"
        subtitle="Categorizam lançamentos sozinhas. Para criar uma, peça ao Jarvis no WhatsApp."
        aside={rules.length > 0 ? <Badge variant="neutral">{rules.length}</Badge> : undefined}
      />
      {loading ? (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : rules.length === 0 ? (
        <EmptyState icon={<IconTag />} title="Nenhuma regra">
          Exemplo: «toda compra com "uber" vai para Transporte».
        </EmptyState>
      ) : (
        <ul className="simple-list">
          {rules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              onDelete={() => void handleDelete(rule.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function FinanceSettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Finanças"
        title="Contas, categorias e regras"
        description="A estrutura por trás dos seus lançamentos."
      />
      <div className="cols cols--3">
        <AccountsCard />
        <CategoriesCard />
        <RulesCard />
      </div>
    </>
  );
}
