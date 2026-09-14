import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { IconClose } from './icons';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/**
 * Native <dialog> modal. Closes on backdrop click and on Escape
 * (the browser fires `close`, which we forward to `onClose`).
 *
 * No `close()` on cleanup: unmounting removes the element from the top
 * layer anyway, and closing here would fire `close` → `onClose` during
 * StrictMode's effect re-run and dismiss the modal as soon as it opens.
 */
export function Modal({ title, onClose, children, wide = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // showModal() focuses the first focusable element (the close button);
    // hand focus to the field the form marked as autoFocus instead.
    dialog.querySelector<HTMLElement>('[autofocus]')?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      className={wide ? 'modal modal--wide' : 'modal'}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal__box">
        <header className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <IconClose />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="modal__actions">{children}</div>;
}
