import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getMyTransactions } from '../../../services/finance.service';

interface MonthData {
  month: string;
  receita: number;
  despesa: number;
}

function formatBRLShort(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(1)}k`;
  return `R$${value.toFixed(0)}`;
}

function getPastMonths(count: number): Array<{ year: number; month: number; label: string }> {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
    });
  }
  return result;
}

export function MonthlyChart() {
  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const months = getPastMonths(6);

    Promise.all(
      months.map(({ year, month, label }) => {
        const from = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return getMyTransactions({ from, to, limit: 1 }).then((page) => ({
          month: label,
          receita: page.summary.income,
          despesa: page.summary.expense,
        }));
      }),
    )
      .then((data) => {
        if (active) setChartData(data);
      })
      .catch(() => {
        // fail silently — chart is optional
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="monthly-chart monthly-chart--loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="monthly-chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          barGap={3}
          barCategoryGap="28%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(34,27,16,0.07)"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#a2957f', fontFamily: 'Space Grotesk' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatBRLShort}
            tick={{ fontSize: 10, fill: '#a2957f', fontFamily: 'Space Grotesk' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(val) => {
              const num = typeof val === 'number' ? val : 0;
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(num);
            }}
            contentStyle={{
              background: '#fffdf8',
              border: '1px solid #e9dfcd',
              borderRadius: 10,
              fontFamily: 'Space Grotesk',
              fontSize: 13,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, fontFamily: 'Space Grotesk' }}
          />
          <Bar dataKey="receita" fill="#2f8f5b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesa" fill="#f4690f" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
