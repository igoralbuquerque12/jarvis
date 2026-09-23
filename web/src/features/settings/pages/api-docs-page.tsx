import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { apiBaseUrl } from '../../../lib/config';
import { CodeBlock } from '../components/code-block';

const SAMPLE_KEY = 'jrv_SUA_CHAVE_AQUI';

type Language = 'curl' | 'javascript' | 'python';

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
];

const TOC = [
  { href: '#inicio', label: 'Comece por aqui' },
  { href: '#enviar-mensagem', label: 'Envie uma mensagem' },
  { href: '#referencia', label: 'Respostas e segurança' },
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

function Examples({ baseUrl }: { baseUrl: string }) {
  const [language, setLanguage] = useState<Language>('curl');
  const examples = buildExamples(baseUrl);

  return (
    <div className="docs-subsection docs-subsection--example">
      <h4>Exemplo completo</h4>
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
    </div>
  );
}

export function ApiDocsPage() {
  const baseUrl = apiBaseUrl;

  return (
    <>
      <div className="page-head">
        <h2>Documentação da API</h2>
        <p>
          Tudo que você precisa para acionar o Jarvis a partir de scripts,
          automações e outros serviços.
        </p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Sumário">
          {TOC.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="docs-content">
          <Card className="docs-section" id="inicio">
            <div className="docs-section__head">
              <h3>Comece por aqui</h3>
              <p>
                A API pública do Jarvis usa HTTP e JSON. Todas as rotas ficam
                sob <code>/v1</code> e agem em nome do dono da chave, sem pedir
                telefone ou identificador de perfil.
              </p>
            </div>

            <div className="docs-subsection docs-subsection--first">
              <h4>Endereço base</h4>
              <CodeBlock code={`${baseUrl}/v1`} label="Base URL" />
              <p className="docs-note">
                Versão atual: <Badge variant="accent">v1</Badge>. Mudanças
                incompatíveis virão em uma nova versão, sem quebrar as chamadas
                existentes.
              </p>
            </div>

            <div className="docs-subsection" id="autenticacao">
              <h4>Autenticação</h4>
              <p>
                Cada requisição precisa de uma chave de API no header{' '}
                <code>Authorization</code>, no formato Bearer. As chaves começam
                com <code>jrv_</code> e são geradas em{' '}
                <Link to="/configuracoes/api">Chaves de API</Link>.
              </p>
              <CodeBlock
                code={`Authorization: Bearer ${SAMPLE_KEY}`}
                label="Header"
              />
              <p className="docs-note">
                Também aceitamos <code>x-api-key</code> com o mesmo valor.
                Chaves pausadas ou excluídas passam a responder <code>401</code>{' '}
                imediatamente.
              </p>
            </div>
          </Card>

          <Card className="docs-section" id="enviar-mensagem">
            <div className="docs-section__head">
              <h3>Envie uma mensagem</h3>
              <p>
                Use este endpoint para enviar alertas, resultados de scripts e
                notificações diretamente para o seu próprio WhatsApp.
              </p>
            </div>

            <div className="docs-endpoint">
              <span className="method-badge">POST</span>
              <span className="docs-endpoint__path">/v1/messages</span>
            </div>

            <div className="docs-subsection docs-subsection--first">
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
            </div>

            <div className="docs-subsection">
              <h4>Resposta · 201 Created</h4>
              <CodeBlock
                code={`{ "sent": true, "sentAt": "2026-09-10T15:04:05.000Z" }`}
                label="Response body"
              />
              <p className="docs-note">
                <code>sentAt</code> é o instante do envio em UTC (ISO 8601).
              </p>
            </div>

            <Examples baseUrl={baseUrl} />
          </Card>

          <Card className="docs-section" id="referencia">
            <div className="docs-section__head">
              <h3>Respostas e segurança</h3>
              <p>
                Prepare sua integração para os erros esperados e mantenha as
                chaves isoladas de forma segura.
              </p>
            </div>

            <div className="docs-subsection docs-subsection--first">
              <h4>Erros</h4>
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
                      <td><code>429</code></td>
                      <td>Mais de uma requisição com a mesma chave em um minuto.</td>
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
            </div>

            <div className="docs-subsection">
              <h4>Boas práticas</h4>
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
