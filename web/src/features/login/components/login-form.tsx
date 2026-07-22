import { useId, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import type { LoginPageViewModel } from '../types';

interface LoginFormProps {
  model: LoginPageViewModel;
}

export function LoginForm({ model }: LoginFormProps) {
  const isSignUp = model.mode === 'signUp';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const tabId = useId();
  const errorId = useId();

  function selectMode(mode: 'signIn' | 'signUp') {
    if (mode !== model.mode) {
      setIsPasswordVisible(false);
      model.setMode(mode);
    }
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const nextMode = isSignUp ? 'signIn' : 'signUp';
    selectMode(nextMode);
    document.getElementById(`${tabId}-${nextMode === 'signUp' ? 'signup' : 'signin'}`)?.focus();
  }

  return (
    <div>
      <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
        <button id={`${tabId}-signin`} type="button" className="auth-tabs__tab" role="tab" aria-selected={!isSignUp} aria-controls={`${tabId}-panel`} tabIndex={isSignUp ? -1 : 0} onClick={() => selectMode('signIn')} onKeyDown={handleTabKeyDown}>
          Entrar
        </button>
        <button id={`${tabId}-signup`} type="button" className="auth-tabs__tab" role="tab" aria-selected={isSignUp} aria-controls={`${tabId}-panel`} tabIndex={isSignUp ? 0 : -1} onClick={() => selectMode('signUp')} onKeyDown={handleTabKeyDown}>
          Cadastro
        </button>
      </div>

      <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${isSignUp ? 'signup' : 'signin'}`}>
        <h1 className="auth-heading">{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
        <p className="auth-subheading">
          {isSignUp ? 'Comece a organizar sua rotina com o Jarvis.' : 'Que bom ter você por aqui! Faça login para continuar.'}
        </p>

        <form className="stack auth-form" onSubmit={model.handleSubmit}>
          {isSignUp ? (
            <div className="form-field">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" autoComplete="name" value={model.name} onChange={(event) => model.setName(event.target.value)} placeholder="Seu nome" />
            </div>
          ) : null}

          <div className="form-field">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" autoComplete="email" inputMode="email" value={model.email} onChange={(event) => model.setEmail(event.target.value)} placeholder="voce@exemplo.com" aria-describedby={model.errorMessage ? errorId : undefined} />
          </div>

          <div className="form-field">
            <div className="form-field__label-row">
              <Label htmlFor="password">Senha</Label>
              {!isSignUp ? <button className="ui-link-button" type="button" onClick={() => document.querySelector<HTMLDetailsElement>('.auth-assist')?.setAttribute('open', '')}>Esqueci minha senha</button> : null}
            </div>
            <div className="password-field">
              <Input id="password" name="password" type={isPasswordVisible ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} value={model.password} onChange={(event) => model.setPassword(event.target.value)} placeholder="••••••••" aria-describedby={model.errorMessage ? errorId : undefined} />
              <button className="password-field__toggle" type="button" aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={isPasswordVisible} onClick={() => setIsPasswordVisible((visible) => !visible)}>
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {model.errorMessage ? <div id={errorId} className="ui-feedback ui-feedback--error" role="alert">{model.errorMessage}</div> : null}
          {model.statusMessage ? <div className="ui-feedback ui-feedback--success" role="status">{model.statusMessage}</div> : null}

          <Button type="submit" fullWidth disabled={!model.canSubmit || model.isSubmitting}>
            {model.isSubmitting ? 'Processando...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>

          <div className="form-divider" aria-hidden="true">ou</div>

          <Button type="button" variant="secondary" fullWidth onClick={model.handleGoogleSignIn}>
            <GoogleMark />
            Continuar com Google
          </Button>
        </form>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
}

function EyeOffIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m3 3 18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-3 3.7M6.2 6.2A17.8 17.8 0 0 0 2.5 12S6 18 12 18c1.4 0 2.6-.3 3.7-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>;
}

function GoogleMark() {
  return <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.3c2-1.8 3-4.5 3-7.4Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8C17 3.1 14.7 2 12 2A10 10 0 0 0 3 7.5l3.4 2.6C7.2 7.7 9.4 6 12 6Z" /></svg>;
}
