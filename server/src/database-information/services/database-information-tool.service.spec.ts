import { DatabaseInformationToolService } from './database-information-tool.service';
import { DatabaseInformationService } from './database-information.service';
import { KnowledgeSearchService } from './knowledge-search.service';

describe('DatabaseInformationToolService', () => {
  const profileId = '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';
  const databaseInformationId = '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';

  function makeHandler() {
    const service = {
      findOneForAssistant: jest.fn().mockResolvedValue({ id: 'x' }),
    };
    const search = {
      search: jest.fn().mockResolvedValue({
        query: 'senha wifi',
        found: true,
        results: [
          {
            chunkId: 'c-1',
            databaseInformationId,
            baseName: 'Casa',
            position: 0,
            content: 'Base: Casa\n\nsenha: girassol',
            score: 0.03,
            similarity: 0.61,
          },
        ],
      }),
    };
    const handler = new DatabaseInformationToolService(
      service as unknown as DatabaseInformationService,
      search as unknown as KnowledgeSearchService,
    );

    return { handler, service, search };
  }

  it('searches every base for search_knowledge and hides internal scores', async () => {
    const { handler, search } = makeHandler();

    await expect(
      handler.execute(
        profileId,
        'search_knowledge',
        { query: '  senha wifi ' },
        { runId: 'run-1' },
      ),
    ).resolves.toEqual({
      query: 'senha wifi',
      found: true,
      results: [
        {
          databaseInformationId,
          baseName: 'Casa',
          content: 'Base: Casa\n\nsenha: girassol',
        },
      ],
    });
    expect(search.search).toHaveBeenCalledWith(profileId, 'senha wifi', {
      databaseInformationId: undefined,
      runId: 'run-1',
    });
  });

  it('can restrict search_knowledge to one base', async () => {
    const { handler, search } = makeHandler();

    await handler.execute(profileId, 'search_knowledge', {
      query: 'senha',
      databaseInformationId,
    });

    expect(search.search).toHaveBeenCalledWith(profileId, 'senha', {
      databaseInformationId,
      runId: undefined,
    });
  });

  it('rejects an empty query or unknown fields as validation_error', async () => {
    const { handler, search } = makeHandler();

    await expect(
      handler.execute(profileId, 'search_knowledge', { query: '   ' }),
    ).rejects.toMatchObject({
      fields: { query: expect.any(String) as string },
    });
    await expect(
      handler.execute(profileId, 'search_knowledge', {
        query: 'x',
        profileId: 'someone-else',
      }),
    ).rejects.toMatchObject({
      fields: { profileId: expect.any(String) as string },
    });
    expect(search.search).not.toHaveBeenCalled();
  });

  it('reads a base for get_database_information', async () => {
    const { handler, service } = makeHandler();

    await expect(
      handler.execute(profileId, 'get_database_information', {
        databaseInformationId,
      }),
    ).resolves.toEqual({ id: 'x' });
    expect(service.findOneForAssistant).toHaveBeenCalledWith(
      profileId,
      databaseInformationId,
    );
  });

  it('rejects a missing or malformed id as validation_error', async () => {
    const { handler, service } = makeHandler();

    await expect(
      handler.execute(profileId, 'get_database_information', {
        databaseInformationId: 'nope',
      }),
    ).rejects.toMatchObject({
      fields: { databaseInformationId: expect.any(String) as string },
    });
    expect(service.findOneForAssistant).not.toHaveBeenCalled();
  });

  it('rejects an unknown operation', async () => {
    const { handler } = makeHandler();

    await expect(
      handler.execute(profileId, 'delete_everything', {}),
    ).rejects.toMatchObject({
      response: { code: 'unsupported_operation' },
    });
  });
});
