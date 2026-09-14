import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button';
import type { CreatedApiKey } from '../../../types/api';

interface NewApiKeyModalProps {
  apiKey: CreatedApiKey;
  onClose: () => void;
}

/**
 * Shows the freshly created secret. This is the only time it is visible:
 * the server keeps just a hash, so the modal insists on copying it.
 */
export function NewApiKeyModal({ apiKey, onClose }: NewApiKeyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey.secret);
    setCopied(true);
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal__box">
        <div className="modal__header">
          <h3 className="modal__title">Chave criada</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <p className="muted" style={{ fontSize: '0.9rem', marginBottom: 14 }}>
          A chave <strong>{apiKey.name}</strong> está pronta. Copie agora: por
          segurança, ela <strong>não será exibida novamente</strong>.
        </p>

        <div className="secret-reveal">
          <span className="secret-reveal__label">Sua chave de API</span>
          <code className="secret-reveal__value">{apiKey.secret}</code>
          <div className="secret-reveal__actions">
            <span>
              {copied
                ? 'Copiada para a área de transferência.'
                : 'Guarde em um lugar seguro (cofre, variável de ambiente).'}
            </span>
            <Button size="sm" onClick={() => void handleCopy()}>
              {copied ? 'Copiar de novo' : 'Copiar chave'}
            </Button>
          </div>
        </div>

        <div className="modal__actions">
          <Button variant="ghost" onClick={onClose}>
            {copied ? 'Concluir' : 'Fechar sem copiar'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
