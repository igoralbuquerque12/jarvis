import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../../components/ui/card';
import { IconArrowRight } from '../../../components/ui/icons';
import { MonthlyChart } from '../../finance/components/monthly-chart';

/** Income vs. expense bars for the last 6 months. */
export function DashChartCard() {
  return (
    <Card>
      <CardHeader
        title="Receita e despesa"
        subtitle="Últimos 6 meses"
        aside={
          <Link to="/financas" className="btn btn--ghost btn--sm">
            Ver finanças <IconArrowRight />
          </Link>
        }
      />
      <MonthlyChart />
    </Card>
  );
}
