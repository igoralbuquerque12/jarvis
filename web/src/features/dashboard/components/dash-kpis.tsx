import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBell,
  IconWallet,
} from '../../../components/ui/icons';
import { Stat } from '../../../components/ui/stat';
import { useFinanceSummary } from '../../../hooks/use-finance-summary';
import { formatEventInstant } from '../../../lib/format';
import type { UpcomingEvent } from '../../../types/api';
import { Amount } from '../../finance/components/amount';

interface DashKpisProps {
  events: UpcomingEvent[];
  timezone: string;
}

function monthLabel() {
  const label = new Date().toLocaleString('pt-BR', { month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Four tiles: month income, month expense, month balance and next reminder. */
export function DashKpis({ events, timezone }: DashKpisProps) {
  const { summary, loading } = useFinanceSummary();
  const next = events[0];
  const month = monthLabel();

  const value = (amount: number | undefined, colored = false) =>
    loading ? (
      <span className="muted">…</span>
    ) : (
      <Amount value={amount ?? 0} colored={colored} />
    );

  return (
    <div className="stats">
      <Stat
        label={`Receita · ${month}`}
        icon={<IconArrowDownLeft />}
        tone="success"
        value={value(summary?.income)}
        to="/financas/transacoes"
      />
      <Stat
        label={`Despesa · ${month}`}
        icon={<IconArrowUpRight />}
        tone="danger"
        value={value(summary ? -summary.expense : 0)}
        to="/financas/transacoes"
      />
      <Stat
        label="Saldo do mês"
        icon={<IconWallet />}
        tone="accent"
        value={value(summary?.net, true)}
        to="/financas"
      />
      <Stat
        label="Próximo lembrete"
        icon={<IconBell />}
        text
        value={next ? next.content : 'Nada agendado'}
        foot={
          next
            ? (() => {
                const instant = formatEventInstant(next.scheduledAt, timezone);
                return `${instant.weekday}, ${instant.day} ${instant.month} · ${instant.time}`;
              })()
            : 'Peça ao Jarvis no WhatsApp'
        }
      />
    </div>
  );
}
