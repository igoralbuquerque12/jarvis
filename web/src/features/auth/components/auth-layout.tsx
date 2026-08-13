import type { ReactNode } from 'react';
import { Wordmark } from '../../../components/ui/wordmark';

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.4-2.9 8.2-7 10-4.1-1.8-7-5.6-7-10V6l7-3z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" />
    </svg>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <Wordmark size="lg" tagline />

        <div className="auth__tagline">
          <span className="eyebrow">Assistente pessoal · WhatsApp</span>
          <h1>
            Sua rotina, <em>no piloto automático</em>
          </h1>
          <p>
            Converse com o Jarvis como conversa com qualquer contato — ele
            anota, agenda e te lembra na hora certa.
          </p>

          <div className="chat-mock" aria-hidden="true">
            <div className="chat-bubble chat-bubble--user">
              Jarvis, me lembra amanhã às 9h de pagar o boleto da internet
            </div>
            <div className="chat-bubble chat-bubble--jarvis">
              <span className="chat-bubble__sender">Jarvis</span>
              Anotado! Te aviso amanhã às 09:00.
              <br />
              <span className="chat-chip">Lembrete · amanhã 09:00</span>
            </div>
            <div className="chat-bubble chat-bubble--typing">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="feature-chips">
            <span className="feature-chip">Lembretes</span>
            <span className="feature-chip">Rotinas recorrentes</span>
            <span className="feature-chip">Contexto pessoal</span>
          </div>
        </div>

        <p className="auth__footnote">
          © {new Date().getFullYear()} Jarvis · assistente pessoal por WhatsApp
        </p>

        <div className="auth__panel-sun" aria-hidden="true" />
        <div className="auth__horizon" aria-hidden="true" />
      </aside>

      <div className="auth__form-side">
        <span className="auth__watermark" aria-hidden="true">
          Jarvis
        </span>
        <div className="auth__glow" aria-hidden="true" />
        <div className="auth__dots" aria-hidden="true" />

        <div className="auth__form-col">
          <span className="sunset-bar" aria-hidden="true" />
          <div className="auth__form-card">{children}</div>
          <ul className="trust-list">
            <li>
              <ShieldIcon />
              Sessão criptografada
            </li>
            <li>
              <BoltIcon />
              Resposta em segundos
            </li>
            <li>
              <ChatIcon />
              Direto no seu WhatsApp
            </li>
          </ul>
          <p className="auth__terminal">
            &gt; jarvis pronto para conectar
            <span className="auth__cursor" aria-hidden="true" />
          </p>
        </div>
      </div>
    </div>
  );
}
