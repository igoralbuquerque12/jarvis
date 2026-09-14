import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { monthRange, shiftYearMonth, currentYearMonth } from '../../../lib/dates';
import { getMyTransactions } from '../../../services/finance.service';
import { usePrivacy } from '../context/privacy-store';

interface MonthData {
  month: string;
  Receita: number;
  Despesa: number;
}

const INCOME = '#2f8f5b';
const EXPENSE = '#c34a2b';

function formatBRLShort(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function MonthlyChart({ months = 6 }: { months?: number }) {
  const { hidden } = usePrivacy();
  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const now = currentYearMonth();
    const series = Array.from({ length: months }, (_, index) =>
      shiftYearMonth(now, index - (months - 1)),
    );

    Promise.all(
      series.map((ym) => {
        const { from, to } = monthRange(ym);
        const label = new Date(ym.year, ym.month - 1, 1)
          .toLocaleString('pt-BR', { month: 'short' })
          .replace('.', '');
        return getMyTransactions({ from, to, limit: 1 }).then((page) => ({
          month: label,
          Receita: page.summary.income,
          Despesa: page.summary.expense,
        }));
      }),
    )
      .then((data) => {
        if (active) setChartData(data);
      })
      .catch(() => {
        // chart is optional — fail silently
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [months]);

  if (loading) {
    return (
      <div className="monthly-chart monthly-chart--loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="monthly-chart">
      <div className="chart-legend" style={{ marginBottom: 10 }}>
        <span>
          <i style={{ background: INCOME }} /> Receita
        </span>
        <span>
          <i style={{ background: EXPENSE }} /> Despesa
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          barGap={3}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(34,27,16,0.08)"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#a2957f', fontFamily: 'Space Grotesk' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={hidden ? () => '' : formatBRLShort}
            tick={{ fontSize: 10, fill: '#a2957f', fontFamily: 'Space Grotesk' }}
            axisLine={false}
            tickLine={false}
            width={hidden ? 12 : 64}
          />
          <Tooltip
            cursor={{ fill: 'rgba(244,105,15,0.06)' }}
            formatter={(value) =>
              hidden ? '••••' : formatBRL(typeof value === 'number' ? value : 0)
            }
            contentStyle={{
              background: '#fffdf8',
              border: '1px solid #e9dfcd',
              borderRadius: 10,
              fontFamily: 'Space Grotesk',
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="Receita"
            fill={INCOME}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Despesa"
            fill={EXPENSE}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
