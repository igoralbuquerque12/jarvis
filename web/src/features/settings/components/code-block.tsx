import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  label?: string;
}

/** Dark code sample with a one-click copy button. */
export function CodeBlock({ code, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block">
      <div className="code-block__head">
        <span>{label ?? 'Exemplo'}</span>
        <button
          type="button"
          className="code-block__copy"
          onClick={() => void handleCopy()}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
