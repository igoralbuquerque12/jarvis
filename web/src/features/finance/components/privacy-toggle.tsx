import { IconEye, IconEyeOff } from '../../../components/ui/icons';
import { usePrivacy } from '../context/privacy-store';

export function PrivacyToggle() {
  const { hidden, toggle } = usePrivacy();

  return (
    <button
      type="button"
      className="privacy-toggle"
      onClick={toggle}
      title={hidden ? 'Mostrar valores' : 'Ocultar valores'}
      aria-pressed={hidden}
    >
      {hidden ? <IconEyeOff /> : <IconEye />}
      <span>{hidden ? 'Mostrar valores' : 'Ocultar valores'}</span>
    </button>
  );
}
