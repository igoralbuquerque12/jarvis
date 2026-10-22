import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { IconActivity, IconPlus } from '../../../components/ui/icons';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { useMyHealthChecks } from '../../../hooks/use-my-health-checks';
import { useMyProfile } from '../../../hooks/use-my-profile';
import {
  deleteMyHealthCheckConfig,
  updateMyHealthCheckConfig,
} from '../../../services/health-check.service';
import type { HealthCheckConfig } from '../../../types/api';
import { HealthCheckFormModal } from '../components/health-check-form-modal';
import { HealthCheckRow } from '../components/health-check-row';

const STEPS = [
  {
    title: 'Cadastre a API',
    text: 'Informe o endereço que o Jarvis deve consultar.',
  },
  {
    title: 'O Jarvis vigia',
    text: 'A cada 30 minutos ele testa. Resposta 2xx, nada acontece.',
  },
  {
    title: 'Você é avisado',
    text: 'Deu erro ou demorou demais? A mensagem chega no seu WhatsApp.',
  },
];

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function HealthCheckPage() {
  const { configs, setConfigs, loading, error } = useMyHealthChecks();
  const { profile } = useMyProfile();
  const whatsappLinked = profile?.whatsappLinked ?? true;

  // `null` = closed, `'new'` = creating, otherwise the config being edited.
  const [modal, setModal] = useState<HealthCheckConfig | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeCount = configs.filter((config) => config.active).length;

  function handleSaved(saved: HealthCheckConfig) {
    setConfigs((current) =>
      current.some((item) => item.id === saved.id)
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current],
    );
  }

  async function handleToggle(config: HealthCheckConfig, active: boolean) {
    setActionError(null);
    try {
      handleSaved(await updateMyHealthCheckConfig(config.id, { active }));
    } catch (toggleError) {
      setActionError(
        errorMessage(toggleError, 'Não foi possível atualizar o monitoramento.'),
      );
    }
  }

  async function handleDelete(config: HealthCheckConfig) {
    setActionError(null);
    try {
      await deleteMyHealthCheckConfig(config.id);
      setConfigs((current) => current.filter((item) => item.id !== config.id));
    } catch (deleteError) {
      setActionError(
        errorMessage(deleteError, 'Não foi possível excluir o monitoramento.'),
      );
    }
  }

  let body: React.ReactNode;

  if (loading) {
    body = <Spinner />;
  } else if (error) {
    body = <Alert variant="error">{error}</Alert>;
  } else if (configs.length === 0) {
    body = (
      <EmptyState
        icon={<IconActivity />}
        title="Nenhuma API vigiada ainda"
        action={
          <Button onClick={() => setModal('new')}>
            <IconPlus />
            Monitorar primeira API
          </Button>
        }
      >
        Cadastre uma API e o Jarvis avisa no seu WhatsApp assim que ela falhar.
      </EmptyState>
    );
  } else {
    body = (
      <ul className="hc-list">
        {configs.map((config) => (
          <HealthCheckRow
            key={config.id}
            config={config}
            onToggle={(active) => handleToggle(config, active)}
            onEdit={() => setModal(config)}
            onDelete={() => handleDelete(config)}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="api-keys-page">
      <PageHeader
        title="Sentinela de APIs"
        description="O Jarvis fica de olho nas suas APIs e avisa você no WhatsApp quando uma delas cair."
        actions={
          <Button onClick={() => setModal('new')}>
            <IconPlus />
            Nova API
          </Button>
        }
      />

      <ol className="hc-steps">
        {STEPS.map((step, index) => (
          <li key={step.title} className="hc-step">
            <span className="hc-step__number">{index + 1}</span>
            <div>
              <strong className="hc-step__title">{step.title}</strong>
              <p className="hc-step__text">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {!whatsappLinked ? (
        <p className="hint">
          Os avisos só são entregues depois de{' '}
          <Link to="/dashboard#conectar">vincular seu WhatsApp</Link>.
        </p>
      ) : null}

      <Card>
        <CardHeader
          title="Suas APIs"
          subtitle="Use o interruptor para pausar ou retomar a vigilância sem perder a configuração."
          aside={
            configs.length > 0 ? (
              <Badge variant={activeCount > 0 ? 'success' : 'neutral'}>
                {activeCount}/{configs.length} ativas
              </Badge>
            ) : null
          }
        />
        {actionError ? (
          <div style={{ marginBottom: 12 }}>
            <Alert variant="error">{actionError}</Alert>
          </div>
        ) : null}
        {body}
      </Card>

      {modal ? (
        <HealthCheckFormModal
          initial={modal === 'new' ? undefined : modal}
          userName={profile?.name}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
