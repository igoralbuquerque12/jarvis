import { JarvisPersona } from './jarvis-persona';

interface SpinnerProps {
  page?: boolean;
}

/** Inline: a small ring. Page: Jarvis "typing" while the page loads. */
export function Spinner({ page = false }: SpinnerProps) {
  if (page) {
    return (
      <div className="persona-loading" role="status">
        <JarvisPersona mood="typing" />
        <span>Carregando…</span>
      </div>
    );
  }

  return <div className="spinner" role="status" aria-label="Carregando" />;
}
