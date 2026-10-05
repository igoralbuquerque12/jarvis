import { useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { IconCopy } from '../../../components/ui/icons';
import { assistantWhatsappNumber } from '../../../lib/config';
import { getMyProfile } from '../../../services/profile.service';
import type { ProfileMe } from '../../../types/api';

const LINK_POLL_INTERVAL_MS = 5000;

function buildConnectMessage(token: string) {
  return `Oi Jarvis! Este é o meu token de conexão: ${token}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => void handleCopy()}>
      <IconCopy />
      {copied ? 'Copiado' : label}
    </Button>
  );
}

/** While pairing is pending, polls the profile so the card flips to connected on its own. */
function useLinkPolling(
  pending: boolean,
  onLinked?: (profile: ProfileMe) => void,
) {
  useEffect(() => {
    if (!pending || !onLinked) {
      return;
    }

    let active = true;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      getMyProfile()
        .then((updated) => {
          if (active && updated.whatsappLinked) {
            onLinked(updated);
          }
        })
        .catch(() => undefined);
    }, LINK_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pending, onLinked]);
}

export function WhatsappCard({
  profile,
  onLinked,
}: {
  profile: ProfileMe;
  onLinked?: (profile: ProfileMe) => void;
}) {
  useLinkPolling(!profile.whatsappLinked, onLinked);

  const connectMessage = buildConnectMessage(profile.token);
  const whatsappLink = assistantWhatsappNumber
    ? `https://wa.me/${assistantWhatsappNumber}?text=${encodeURIComponent(connectMessage)}`
    : null;

  if (profile.whatsappLinked) {
    return (
      <Card id="conectar">
        <CardHeader
          title="WhatsApp"
          aside={<Badge variant="success">Conectado</Badge>}
        />
        <div className="connected-banner">
          <span className="connected-banner__dot" aria-hidden="true" />
          <div>
            <strong>Tudo certo por aqui.</strong>
            <p className="muted small">
              Conta vinculada ao número{' '}
              <span className="mono">{profile.whatsappNumber}</span>.
            </p>
          </div>
        </div>
        <details className="disclosure">
          <summary>Trocou de número?</summary>
          <p className="hint" style={{ marginTop: 8 }}>
            Envie o token abaixo pelo novo WhatsApp para reconectar.
          </p>
          <div className="token-box">
            <span className="token-box__value">{profile.token}</span>
            <CopyButton value={profile.token} label="Copiar" />
          </div>
        </details>
      </Card>
    );
  }

  return (
    <Card id="conectar">
      <CardHeader
        title="Conectar WhatsApp"
        subtitle="Vincule seu número em menos de um minuto."
        aside={<Badge variant="accent">Pendente</Badge>}
      />
      <ol className="connect-steps">
        <li>
          <strong>Copie a mensagem de conexão</strong>
          <p className="muted">Ela contém o seu token pessoal.</p>
          <div className="token-box">
            <span className="token-box__value">{profile.token}</span>
            <CopyButton value={connectMessage} label="Copiar mensagem" />
          </div>
        </li>
        <li>
          <strong>Envie para o Jarvis no WhatsApp</strong>
          <p className="muted">
            Cole a mensagem na conversa com o número do assistente.
          </p>
          {whatsappLink ? (
            <div style={{ marginTop: 10 }}>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn--primary btn--sm"
              >
                Abrir no WhatsApp
              </a>
            </div>
          ) : null}
        </li>
        <li>
          <strong>Aguarde a confirmação</strong>
          <p className="muted">
            O Jarvis responde na hora confirmando a conexão da sua conta.
          </p>
          {onLinked ? (
            <p className="connect-waiting" role="status">
              <span className="connect-waiting__dot" aria-hidden="true" />
              Aguardando sua mensagem, esta tela atualiza sozinha.
            </p>
          ) : null}
        </li>
      </ol>
      <p className="hint" style={{ marginTop: 18 }}>
        Seu token é pessoal. Não compartilhe com ninguém.
      </p>
    </Card>
  );
}
