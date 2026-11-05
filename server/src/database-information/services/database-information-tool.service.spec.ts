import { DatabaseInformationToolService } from './database-information-tool.service';
import { DatabaseInformationService } from './database-information.service';

describe('DatabaseInformationToolService', () => {
  const profileId = '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';
  const databaseInformationId = '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';

  function makeHandler() {
    const service = {
      findOneForAssistant: jest.fn().mockResolvedValue({ id: 'x' }),
    };
    const handler = new DatabaseInformationToolService(
      service as unknown as DatabaseInformationService,
    );

    return { handler, service };
  }

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
