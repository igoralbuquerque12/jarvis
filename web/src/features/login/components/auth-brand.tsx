import logoImage from '../../../../../ui ux/logo image jarvis.png';

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <img className="auth-brand__image" src={logoImage} alt="Jarvis, seu assistente pessoal" />
    </div>
  );
}
