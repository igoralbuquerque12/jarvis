import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardHeader } from '../../components/ui/card';
import { Field, Select, TextArea, TextInput } from '../../components/ui/field';
import { Spinner } from '../../components/ui/spinner';
import { useMyProfile } from '../../hooks/use-my-profile';
import { authClient } from '../../lib/auth-client';
import { updateMyProfile } from '../../services/profile.service';
import type { ProfileMe } from '../../types/api';
import { listTimezones } from './timezones';

export function ProfilePage() {
  const { profile, setProfile, loading, error } = useMyProfile();

  if (loading) {
    return <Spinner page />;
  }

  if (error || !profile) {
    return (
      <Alert variant="error">
        {error ?? 'Não foi possível carregar o seu perfil.'}
      </Alert>
    );
  }

  return <ProfileView profile={profile} onUpdated={setProfile} />;
}

function ProfileView({
  profile,
  onUpdated,
}: {
  profile: ProfileMe;
  onUpdated: (profile: ProfileMe) => void;
}) {
  const { data: session } = authClient.useSession();

  const [name, setName] = useState(profile.name);
  const [about, setAbout] = useState(profile.about);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const timezones = useMemo(() => listTimezones(timezone), [timezone]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        about: about.trim(),
        timezone,
      });
      onUpdated(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (submitError) {
      setSaveError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível salvar as alterações.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Perfil</span>
        <h2>Sua identidade</h2>
        <p>
          O que você escreve aqui vira contexto para o Jarvis: quanto mais ele
          souber sobre você, melhores ficam as respostas.
        </p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div className="profile-grid">
        <Card>
          <CardHeader
            title="Dados do perfil"
            subtitle="Informações usadas pela IA nas conversas."
          />
          <form onSubmit={(event) => void handleSubmit(event)}>
            <Field label="Nome" hint="Como o Jarvis deve te chamar.">
              {(id) => (
                <TextInput
                  id={id}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                />
              )}
            </Field>

            <Field
              label="Sobre você"
              hint="Rotina, preferências, trabalho, família — tudo que ajudar o Jarvis a te entender."
            >
              {(id) => (
                <TextArea
                  id={id}
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  maxLength={2000}
                  placeholder="Ex.: Sou desenvolvedor, trabalho de casa, treino às 7h e prefiro lembretes objetivos."
                />
              )}
            </Field>

            <Field
              label="Fuso horário"
              hint="Usado para agendar seus eventos na hora certa."
            >
              {(id) => (
                <Select
                  id={id}
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                >
                  {timezones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="auth__actions">
              {saveError ? <Alert variant="error">{saveError}</Alert> : null}
              {saved ? (
                <Alert variant="success">Perfil atualizado com sucesso.</Alert>
              ) : null}
              <div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Conta"
            aside={<Badge variant="accent">{profile.subscription.name}</Badge>}
          />
          <dl style={{ margin: 0 }}>
            <div className="account-row">
              <dt>E-mail</dt>
              <dd>{session?.user.email ?? '—'}</dd>
            </div>
            <div className="account-row">
              <dt>WhatsApp</dt>
              <dd>
                {profile.whatsappLinked ? (
                  <Badge variant="success">Conectado</Badge>
                ) : (
                  <Badge variant="neutral">Não conectado</Badge>
                )}
              </dd>
            </div>
            <div className="account-row">
              <dt>Membro desde</dt>
              <dd>
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'long',
                }).format(new Date(profile.createdAt))}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
