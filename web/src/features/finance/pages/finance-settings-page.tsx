import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
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

// ── Accounts Tab ──────────────────────────────────────────────────────────────

function AccountsTab() {
  const { accounts, loading, error } = useMyAccounts();

  if (loading) return <Spinner />;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div>
      {accounts.length === 0 ? (
        <div className="event-empty">
          <strong>Nenhuma conta</strong>
          <p>A conta padrão "Carteira" é criada automaticamente pelo Jarvis.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map((a) => (
            <li key={a.id} className="tx-row">
              <div className="tx-row__body">
                <span className="tx-row__description">{a.name}</span>
                <span className="tx-row__meta">
                  {a.type} · {a.currency}
                  {a.institution && ` · ${a.institution}`}
                  {a.isDefault && ' · Padrão'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Categories Tab ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onDelete,
}: {
  category: FinanceCategory;
  onDelete: () => void;
}) {
  return (
    <li className="tx-row">
      {category.icon && <span style={{ fontSize: '1.1rem' }}>{category.icon}</span>}
      <div className="tx-row__body">
        <span className="tx-row__description">{category.name}</span>
        {category.isDefault && (
          <span className="badge badge--neutral" style={{ marginLeft: 0 }}>padrão</span>
        )}
      </div>
      {!category.isDefault && (
        <button
          type="button"
          className="btn btn--danger btn--sm"
          onClick={onDelete}
        >
          ×
        </button>
      )}
    </li>
  );
}

function CategoriesTab() {
  const { categories, loading, error, reload } = useMyCategories();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await createMyCategory({ name, icon: icon || undefined });
      setName('');
      setIcon('');
      reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir categoria?')) return;
    await deleteMyCategory(id);
    reload();
  }

  if (loading) return <Spinner />;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div>
      <form
        onSubmit={(e) => void handleCreate(e)}
        style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'flex-end' }}
      >
        <div className="field" style={{ flex: 1, marginTop: 0 }}>
          <label className="label" htmlFor="cat-name">Nova categoria</label>
          <input id="cat-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Pets" />
        </div>
        <div className="field" style={{ width: 80, marginTop: 0 }}>
          <label className="label" htmlFor="cat-icon">Emoji</label>
          <input id="cat-icon" className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🐾" maxLength={4} />
        </div>
        <button type="submit" className="btn btn--primary" disabled={saving} style={{ flexShrink: 0 }}>
          {saving ? '…' : 'Criar'}
        </button>
      </form>
      {err && <div className="alert alert--error" style={{ marginBottom: 12 }}>{err}</div>}
      <ul className="tx-list">
        {categories.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            onDelete={() => void handleDelete(c.id)}
          />
        ))}
      </ul>
    </div>
  );
}

// ── Rules Tab ─────────────────────────────────────────────────────────────────

function RuleItem({ rule, onDelete }: { rule: Rule; onDelete: () => void }) {
  return (
    <li className="tx-row" style={{ alignItems: 'center' }}>
      <div className="tx-row__body">
        <span className="tx-row__description">{rule.name}</span>
        <span className="tx-row__meta">
          Prioridade {rule.priority}
          {' · '}
          {rule.conditions.length} condição{rule.conditions.length !== 1 ? 'ões' : ''}
          {' · '}
          {rule.actions.length} ação{rule.actions.length !== 1 ? 'ões' : ''}
        </span>
      </div>
      <span className={`badge ${rule.isActive ? 'badge--success' : 'badge--neutral'}`}>
        {rule.isActive ? 'ativa' : 'inativa'}
      </span>
      <button type="button" className="btn btn--danger btn--sm" onClick={onDelete}>×</button>
    </li>
  );
}

function RulesTab() {
  const { rules, loading, error, reload } = useMyRules();

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta regra de categorização?')) return;
    await deleteMyRule(id);
    reload();
  }

  if (loading) return <Spinner />;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div>
      <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 16 }}>
        As regras categorizam transações automaticamente. Para criar regras, use o assistente via WhatsApp.
      </p>
      {rules.length === 0 ? (
        <div className="event-empty">
          <strong>Nenhuma regra</strong>
          <p>Peça ao Jarvis para criar uma regra de categorização.</p>
        </div>
      ) : (
        <ul className="tx-list">
          {rules.map((r) => (
            <RuleItem
              key={r.id}
              rule={r}
              onDelete={() => void handleDelete(r.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type SettingsTab = 'accounts' | 'categories' | 'rules';

export function FinanceSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('accounts');

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: 'accounts', label: 'Contas' },
    { id: 'categories', label: 'Categorias' },
    { id: 'rules', label: 'Regras' },
  ];

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Configurações</span>
        <h2>Finanças</h2>
        <p>Gerencie contas, categorias e regras de categorização.</p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div className="card">
        {/* Inner tab switcher */}
        <div
          className="auth__switch"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="auth__switch-btn"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'accounts' && <AccountsTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'rules' && <RulesTab />}
      </div>
    </>
  );
}
