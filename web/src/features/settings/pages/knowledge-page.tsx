import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { IconLayers, IconPlus } from '../../../components/ui/icons';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { useMyDatabaseInformation } from '../../../hooks/use-my-database-information';
import { deleteMyDatabaseInformation } from '../../../services/database-information.service';
import type { DatabaseInformation } from '../../../types/api';
import { DatabaseInformationFormModal } from '../components/database-information-form-modal';
import { DatabaseInformationRow } from '../components/database-information-row';

const MAX_BASES = 10;

export function KnowledgePage() {
  const { items, setItems, loading, error } = useMyDatabaseInformation();

  // `null` = closed, `'new'` = creating, otherwise the base being edited.
  const [modal, setModal] = useState<DatabaseInformation | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const limitReached = items.length >= MAX_BASES;

  function handleSaved(saved: DatabaseInformation) {
    setItems((current) =>
      current.some((item) => item.id === saved.id)
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current],
    );
  }

  async function handleDelete(item: DatabaseInformation) {
    setActionError(null);
    try {
      await deleteMyDatabaseInformation(item.id);
      setItems((current) => current.filter((other) => other.id !== item.id));
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Não foi possível excluir a base de dados.',
      );
    }
  }

  let body: React.ReactNode;

  if (loading) {
    body = <Spinner />;
  } else if (error) {
    body = <Alert variant="error">{error}</Alert>;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon={<IconLayers />}
        title="Nenhuma base de dados ainda"
        action={
          <Button onClick={() => setModal('new')}>
            <IconPlus />
            Adicionar primeira base
          </Button>
        }
      >
        Cole um texto e o Jarvis identifica sozinho do que ele trata.
      </EmptyState>
    );
  } else {
    body = (
      <ul className="hc-list">
        {items.map((item) => (
          <DatabaseInformationRow
            key={item.id}
            item={item}
            onEdit={() => setModal(item)}
            onDelete={() => handleDelete(item)}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="api-keys-page">
      <PageHeader
        title="Conhecimento"
        description="Guarde bases de dados em texto. Ao salvar, o Jarvis lê o conteúdo e dá um nome objetivo para cada uma."
        actions={
          <Button onClick={() => setModal('new')} disabled={limitReached}>
            <IconPlus />
            Nova base
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Suas bases de dados"
          subtitle="Editar o conteúdo faz o Jarvis analisar a base de novo."
          aside={
            <Badge variant="neutral">
              {items.length}/{MAX_BASES}
            </Badge>
          }
        />
        {limitReached ? (
          <p className="hint" style={{ marginBottom: 12 }}>
            Você atingiu o limite de bases. Exclua uma para adicionar outra.
          </p>
        ) : null}
        {actionError ? (
          <div style={{ marginBottom: 12 }}>
            <Alert variant="error">{actionError}</Alert>
          </div>
        ) : null}
        {body}
      </Card>

      {modal ? (
        <DatabaseInformationFormModal
          initial={modal === 'new' ? undefined : modal}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
