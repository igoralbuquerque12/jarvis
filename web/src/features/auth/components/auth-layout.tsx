import type { ReactNode } from 'react';
import {
  IconBell,
  IconBriefcase,
  IconRepeat,
  IconTag,
  IconTarget,
  IconWallet,
} from '../../../components/ui/icons';
import { Wordmark } from '../../../components/ui/wordmark';

const CAPABILITIES = [
  {
    icon: <IconBell />,
    title: 'Lembretes e compromissos',
    detail: 'Únicos ou recorrentes, na hora certa.',
  },
  {
    icon: <IconWallet />,
    title: 'Gastos e ganhos',
    detail: 'Registre pelo chat, veja o saldo do mês.',
  },
  {
    icon: <IconTag />,
    title: 'Categorias automáticas',
    detail: 'Regras que organizam seus lançamentos.',
  },
  {
    icon: <IconRepeat />,
    title: 'Contas fixas',
    detail: 'Salário, aluguel, assinaturas.',
  },
  {
    icon: <IconTarget />,
    title: 'Metas de economia',
    detail: 'Acompanhe o progresso de cada objetivo.',
  },
  {
    icon: <IconBriefcase />,
    title: 'Investimentos',
    detail: 'Ações, cripto, renda fixa e imóveis.',
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <Wordmark size="lg" tagline />

        <div className="auth__hero">
          <span className="eyebrow">Assistente pessoal · WhatsApp</span>
          <h1>
            Sua rotina e seu dinheiro <em>numa conversa</em>
          </h1>
          <p>
            Fale com o Jarvis como fala com qualquer contato. Ele agenda,
            anota gastos, organiza contas e te avisa na hora certa.
          </p>

          <div className="chat-mock" aria-hidden="true">
            <div className="chat-bubble chat-bubble--user">
              Gastei 86 no mercado agora e me lembra amanhã 9h de pagar a
              internet
            </div>
            <div className="chat-bubble chat-bubble--jarvis">
              <span className="chat-bubble__sender">Jarvis</span>
              Anotado: R$ 86,00 em Alimentação. Seu saldo do mês está em
              R$ 1.240,00.
              <br />
              <span className="chat-chip">Lembrete · amanhã 09:00</span>
            </div>
          </div>

          <ul className="capabilities">
            {CAPABILITIES.map((item) => (
              <li key={item.title}>
                {item.icon}
                <div>
                  {item.title}
                  <span>{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth__footnote">
          © {new Date().getFullYear()} Jarvis · assistente pessoal por WhatsApp
        </p>

        <div className="auth__panel-sun" aria-hidden="true" />
        <div className="auth__horizon" aria-hidden="true" />
      </aside>

      <div className="auth__form-side">
        <div className="auth__form-col">
          <div className="auth__form-mobile-brand">
            <Wordmark size="lg" />
          </div>
          {children}
          <p className="auth__form-foot">
            Ao entrar, você conecta o Jarvis ao seu WhatsApp em menos de um
            minuto.
          </p>
        </div>
      </div>
    </div>
  );
}
