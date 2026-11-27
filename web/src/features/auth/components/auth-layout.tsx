import type { ReactNode } from 'react';
import { ThemeToggle } from '../../../components/ui/theme-toggle';
import { Wordmark } from '../../../components/ui/wordmark';

/** Single centred column on the bare ground: mark, the page's form, a footnote. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <header className="auth__top">
        <ThemeToggle />
      </header>

      <main className="auth__main">
        <div className="auth__form-col">
          <div className="auth__mark">
            <Wordmark size="lg" />
          </div>
          {children}
          <p className="auth__form-foot">
            Ao entrar, você conecta o Jarvis ao seu WhatsApp em menos de um
            minuto.
          </p>
        </div>
      </main>

      <p className="auth__footnote">
        © {new Date().getFullYear()} Jarvis · assistente pessoal por WhatsApp
      </p>
    </div>
  );
}
