interface SpinnerProps {
  page?: boolean;
}

export function Spinner({ page = false }: SpinnerProps) {
  return (
    <div
      className={page ? 'spinner spinner--page' : 'spinner'}
      role="status"
      aria-label="Carregando"
    />
  );
}
