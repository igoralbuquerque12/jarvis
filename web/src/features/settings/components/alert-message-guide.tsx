import { Button } from '../../../components/ui/button';
import { IconCheck, IconPlus } from '../../../components/ui/icons';
import {
  ALERT_VARIABLES,
  canonicalToken,
  splitTemplate,
  SUGGESTED_ALERT_MESSAGE,
} from '../health-check-variables';

interface AlertMessageGuideProps {
  message: string;
  userName?: string;
  onInsert: (token: string) => void;
  onUseSuggestion: () => void;
}

export function AlertMessageGuide({
  message,
  userName,
  onInsert,
  onUseSuggestion,
}: AlertMessageGuideProps) {
  const used = new Set(
    splitTemplate(message)
      .filter((segment) => segment.variable?.known)
      .map((segment) => canonicalToken(segment.text)),
  );
  const unknown = splitTemplate(message).filter(
    (segment) => segment.variable && !segment.variable.known,
  );
  const preview = splitTemplate(message.trim() || SUGGESTED_ALERT_MESSAGE);

  return (
    <div className="hc-guide">
      <div className="hc-guide__block">
        <div className="hc-guide__head">
          <span className="hc-guide__title">Variáveis</span>
          <Button
            variant="subtle"
            size="sm"
            onClick={onUseSuggestion}
            title="Substitui o texto pelo modelo sugerido"
          >
            Usar modelo pronto
          </Button>
        </div>
        <p className="hc-guide__lead">
          Clique para encaixar no texto, onde está o cursor. Na hora do alerta o
          Jarvis troca cada uma pelo valor real.
        </p>
        <ul className="hc-vars">
          {ALERT_VARIABLES.map((variable) => {
            const isUsed = used.has(variable.token);
            return (
              <li key={variable.token}>
                <button
                  type="button"
                  className={
                    isUsed ? 'hc-var hc-var--used' : 'hc-var'
                  }
                  onClick={() => onInsert(variable.token)}
                >
                  <span className="hc-var__icon">
                    {isUsed ? <IconCheck /> : <IconPlus />}
                  </span>
                  <span className="hc-var__text">
                    <span className="hc-var__label">{variable.label}</span>
                    <span className="hc-var__desc">{variable.description}</span>
                  </span>
                  <span className="hc-var__token">{variable.token}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {unknown.length > 0 ? (
          <p className="hc-guide__warn">
            {unknown.map((segment) => segment.text).join(', ')} não existe
            {unknown.length > 1 ? 'm' : ''} e será enviada
            {unknown.length > 1 ? 's' : ''} como texto.
          </p>
        ) : null}
      </div>

      <div className="hc-guide__block">
        <span className="hc-guide__title">Como chega no seu WhatsApp</span>
        <div className="hc-bubble">
          {preview.map((segment, index) =>
            segment.variable?.known ? (
              <span key={index} className="hc-bubble__value">
                {segment.text === '${my_name}'
                  ? userName || segment.variable.sample
                  : segment.variable.sample}
              </span>
            ) : (
              segment.text
            ),
          )}
        </div>
        <p className="hc-guide__note">
          Exemplo com um erro 500. Os destaques são os valores que mudam a cada
          alerta.
        </p>
      </div>
    </div>
  );
}
