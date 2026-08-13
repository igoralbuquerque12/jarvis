import { useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { assistantWhatsappNumber } from '../../../lib/config';
import type { ProfileMe } from '../../../types/api';

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
      {copied ? 'Copiado!' : label}
    </Button>
  );
}

export function WhatsappCard({ profile }: { profile: ProfileMe }) {
  const connectMessage = buildConnectMessage(profile.token);
  const whatsappLink = assistantWhatsappNumber
    ? `https://wa.me/${assistantWhatsappNumber}?text=${encodeURIComponent(connectMessage)}`
    : null;

  if (profile.whatsappLinked) {
    return (
      <Card>
        <CardHeader
          title="WhatsApp"
          aside={<Badge variant="success">Conectado</Badge>}
        />
        <div className="connected-banner">
          <span className="connected-banner__dot" aria-hidden="true" />
          <div>
            <strong>Tudo certo por aqui.</strong>
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              Conta vinculada ao número{' '}
              <span className="mono">{profile.whatsappNumber}</span>. É só
              conversar com o Jarvis.
            </p>
          </div>
        </div>
        <p className="hint" style={{ marginTop: 14 }}>
          Trocou de número? Envie o token abaixo pelo novo WhatsApp para
          reconectar.
        </p>
        <div className="token-box">
          <span className="token-box__value">{profile.token}</span>
          <CopyButton value={profile.token} label="Copiar" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
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
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <Button size="sm">Abrir no WhatsApp</Button>
              </a>
            </div>
          ) : null}
        </li>
        <li>
          <strong>Aguarde a confirmação</strong>
          <p className="muted">
            O Jarvis responde na hora confirmando a conexão da sua conta.
          </p>
        </li>
      </ol>
      <p className="hint" style={{ marginTop: 18 }}>
        Seu token é pessoal — não compartilhe com ninguém.
      </p>
    </Card>
  );
}
