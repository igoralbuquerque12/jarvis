import { DatabaseInformationM2mController } from './database-information-m2m.controller';
import { DatabaseInformationService } from '../services/database-information.service';

describe('DatabaseInformationM2mController', () => {
  const profileId = '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';
  const databaseInformationId = '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';

  function makeController() {
    const service = {
      findOneForAssistant: jest.fn().mockResolvedValue({ id: 'x' }),
    };
    const controller = new DatabaseInformationM2mController(
      service as unknown as DatabaseInformationService,
    );

    return { controller, service };
  }

  it('reads a base for get_database_information', async () => {
    const { controller, service } = makeController();

    await expect(
      controller.execute(profileId, {
        operation: 'get_database_information',
        data: { databaseInformationId },
      }),
    ).resolves.toEqual({ id: 'x' });
    expect(service.findOneForAssistant).toHaveBeenCalledWith(
      profileId,
      databaseInformationId,
    );
  });

  it('rejects a missing or malformed id as validation_error', async () => {
    const { controller, service } = makeController();

    await expect(
      controller.execute(profileId, {
        operation: 'get_database_information',
        data: { databaseInformationId: 'nope' },
      }),
    ).rejects.toMatchObject({
      fields: { databaseInformationId: expect.any(String) as string },
    });
    expect(service.findOneForAssistant).not.toHaveBeenCalled();
  });

  it('rejects an unknown operation', async () => {
    const { controller } = makeController();

    await expect(
      controller.execute(profileId, { operation: 'delete_everything' }),
    ).rejects.toBeDefined();
  });
});
