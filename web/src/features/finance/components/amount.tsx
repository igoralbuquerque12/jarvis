import { usePrivacy } from '../context/privacy-context';

interface AmountProps {
  value: number;
  currency?: string;
  /** If true, positive = green, negative = red */
  colored?: boolean;
  className?: string;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function Amount({
  value,
  currency = 'BRL',
  colored,
  className,
}: AmountProps) {
  const { hidden } = usePrivacy();

  const formatted =
    currency === 'BRL'
      ? formatBRL(value)
      : new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency,
        }).format(value);

  let colorClass = '';
  if (colored) {
    colorClass = value >= 0 ? ' amount--positive' : ' amount--negative';
  }

  return (
    <span className={`amount mono${colorClass}${className ? ` ${className}` : ''}`}>
      {hidden ? '••••••' : formatted}
    </span>
  );
}
