import type { Ref } from 'react';
import { splitTemplate } from '../health-check-variables';

interface AlertMessageEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  textareaRef: Ref<HTMLTextAreaElement>;
}

/**
 * Textarea that paints every `${variable}` as a chip. A mirror <div> with the
 * exact same metrics sits underneath a transparent <textarea>; chips use only
 * background/outline (no padding or weight) so the two layers never drift.
 */
export function AlertMessageEditor({
  id,
  value,
  onChange,
  textareaRef,
}: AlertMessageEditorProps) {
  return (
    <div className="hc-editor">
      <div className="hc-editor__mirror" aria-hidden="true">
        {splitTemplate(value).map((segment, index) =>
          segment.variable ? (
            <span
              key={index}
              className={
                segment.variable.known
                  ? 'hc-token'
                  : 'hc-token hc-token--unknown'
              }
            >
              {segment.text}
            </span>
          ) : (
            segment.text
          ),
        )}
        {value.endsWith('\n') ? '​' : null}
      </div>
      <textarea
        id={id}
        ref={textareaRef}
        className="hc-editor__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={1500}
        spellCheck={false}
        placeholder="Escreva o aviso que você quer receber…"
        required
      />
    </div>
  );
}
