import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { apiBaseUrl } from '../../../lib/config';
import { CodeBlock } from '../components/code-block';

const SAMPLE_KEY = 'jrv_SUA_CHAVE_AQUI';

// ── Examples ──────────────────────────────────────────────────────────────────

type Language = 'curl' | 'javascript' | 'python';

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
];

function buildExamples(baseUrl: string): Record<Language, string> {
  return {
    curl: `curl -X POST ${baseUrl}/v1/messages \\
  -H "Authorization: Bearer ${SAMPLE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Deploy finalizado com sucesso ✅"}'`,
    javascript: `const response = await fetch('${baseUrl}/v1/messages', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ${SAMPLE_KEY}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Deploy finalizado com sucesso ✅' }),
});

const result = await response.json();
// { sent: true, sentAt: '2026-09-10T15:04:05.000Z' }`,
    python: `import requests

response = requests.post(
    "${baseUrl}/v1/messages",
    headers={"Authorization": "Bearer ${SAMPLE_KEY}"},
    json={"message": "Deploy finalizado com sucesso ✅"},
)

print(response.json())
# {'sent': True, 'sentAt': '2026-09-10T15:04:05.000Z'}`,
  };
}

function ExamplesSection({ baseUrl }: { baseUrl: string }) {
  const [language, setLanguage] = useState<Language>('curl');
  const examples = buildExamples(baseUrl);

  return (
    <Card className="docs-section" id="exemplos">
      <h3>Exemplos</h3>
      <p>
        Troque <code>{SAMPLE_KEY}</code> por uma chave criada em{' '}
        <Link to="/configuracoes/api">Chaves de API</Link>.
      </p>
      <div className="lang-tabs" role="tablist" aria-label="Linguagem">
        {LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={language === item.id}
            onClick={() => setLanguage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <CodeBlock code={examples[language]} label={language} />
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TOC = [
  { group: 'Começando', items: [
    { href: '#introducao', label: 'Introdução' },
    { href: '#autenticacao', label: 'Autenticação' },
  ] },
  { group: 'Endpoints', items: [
    { href: '#enviar-mensagem', label: 'Enviar mensagem' },
  ] },
  { group: 'Referência', items: [
    { href: '#exemplos', label: 'Exemplos' },
    { href: '#erros', label: 'Erros' },
    { href: '#boas-praticas', label: 'Boas práticas' },
  ] },
];

export function ApiDocsPage() {
  const baseUrl = apiBaseUrl;

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Configurações</span>
        <h2>Documentação da API</h2>
        <p>
          Tudo que você precisa para acionar o Jarvis a partir de scripts,
          automações e outros serviços.
        </p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Sumário">
          {TOC.map((group) => (
            <div key={group.group}>
              <span className="docs-toc__group">{group.group}</span>
              {group.items.map((item) => (
                <a key={item.href} href={item.href} style={{ display: 'block' }}>
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="docs-content">
          <Card className="docs-section" id="introducao">
            <h3>Introdução</h3>
            <p>
              A API pública do Jarvis é uma interface HTTP com JSON. Todas as
              rotas ficam sob <code>/v1</code> e agem sempre em nome do dono da
              chave: você nunca informa telefone ou identificador de perfil.
            </p>
            <h4>URL base</h4>
            <CodeBlock code={`${baseUrl}/v1`} label="Base URL" />
            <p style={{ marginTop: 10 }}>
              Versão atual: <Badge variant="accent">v1</Badge>. Mudanças
              incompatíveis virão em uma nova versão, sem quebrar as chamadas
              existentes.
            </p>
          </Card>

          <Card className="docs-section" id="autenticacao">
            <h3>Autenticação</h3>
            <p>
              Cada requisição precisa de uma chave de API no header{' '}
              <code>Authorization</code>, no formato Bearer. As chaves começam
              com <code>jrv_</code> e são geradas na aba{' '}
              <Link to="/configuracoes/api">Chaves de API</Link>.
            </p>
            <CodeBlock
              code={`Authorization: Bearer ${SAMPLE_KEY}`}
              label="Header"
            />
            <p style={{ marginTop: 10 }}>
              Também aceitamos o header <code>x-api-key</code> com o mesmo valor.
              Chaves pausadas ou excluídas passam a responder <code>401</code>{' '}
              imediatamente.
            </p>
          </Card>

          <Card className="docs-section" id="enviar-mensagem">
            <h3>Enviar mensagem</h3>
            <div className="docs-endpoint">
              <span className="method-badge">POST</span>
              <span className="docs-endpoint__path">/v1/messages</span>
            </div>
            <p>
              Faz o Jarvis enviar uma mensagem de texto para o{' '}
              <strong>seu próprio WhatsApp</strong>. Ideal para avisos de
              deploy, alertas de monitoramento, resultados de scripts ou
              qualquer notificação que você queira receber pelo assistente.
            </p>

            <h4>Corpo da requisição</h4>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Tipo</th>
                    <th>Obrigatório</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>message</code></td>
                    <td>string</td>
                    <td>sim</td>
                    <td>Texto da mensagem, de 1 a 4000 caracteres.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <CodeBlock
              code={`{ "message": "Deploy finalizado com sucesso ✅" }`}
              label="Request body"
            />

            <h4>Resposta · 201 Created</h4>
            <CodeBlock
              code={`{ "sent": true, "sentAt": "2026-09-10T15:04:05.000Z" }`}
              label="Response body"
            />
            <p style={{ marginTop: 10 }}>
              <code>sentAt</code> é o instante do envio em UTC (ISO 8601).
            </p>
          </Card>

          <ExamplesSection baseUrl={baseUrl} />

          <Card className="docs-section" id="erros">
            <h3>Erros</h3>
            <p>
              Erros seguem o formato padrão{' '}
              <code>{'{ "statusCode": 401, "message": "..." }'}</code>. O campo{' '}
              <code>message</code> pode ser uma lista quando a validação do corpo
              falha.
            </p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Quando acontece</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>400</code></td>
                    <td>Corpo inválido: campo faltando, vazio, longo demais ou desconhecido.</td>
                  </tr>
                  <tr>
                    <td><code>401</code></td>
                    <td>Chave ausente, inválida ou pausada.</td>
                  </tr>
                  <tr>
                    <td><code>409</code></td>
                    <td>Sua conta ainda não vinculou um número de WhatsApp.</td>
                  </tr>
                  <tr>
                    <td><code>503</code></td>
                    <td>O WhatsApp do Jarvis está temporariamente desconectado. Tente de novo em instantes.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="docs-section" id="boas-praticas">
            <h3>Boas práticas</h3>
            <ul className="steps-list">
              <li>
                <strong>Uma chave por integração.</strong> Assim você pausa ou
                exclui uma sem afetar as outras.
              </li>
              <li>
                <strong>Nunca versione a chave.</strong> Guarde em variável de
                ambiente ou em um cofre de segredos.
              </li>
              <li>
                <strong>Vazou?</strong> Exclua a chave na hora e gere outra. A
                antiga para de funcionar imediatamente.
              </li>
              <li>
                <strong>Trate o 503.</strong> Um retry com alguns segundos de
                espera resolve a maioria das desconexões momentâneas.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
