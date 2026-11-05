import { AssistantRunStatus } from '@prisma/client';

import type { PrismaService } from '../../prisma/services/prisma.service';
import { AssistantRunService } from '../services/assistant-run.service';

describe('AssistantRunService', () => {
  const profileId = '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';
  const runId = '1a2b3c4d-1111-4b2c-8d3e-4f5a6b7c8d9e';

  function makeService() {
    const assistantRun = {
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
    };
    const service = new AssistantRunService({
      assistantRun,
    } as unknown as PrismaService);

    return { service, assistantRun };
  }

  describe('start', () => {
    it('opens a PROCESSING run for the message', async () => {
      const { service, assistantRun } = makeService();
      assistantRun.create.mockResolvedValue({ id: runId });

      await expect(service.start(profileId, 'WA-1')).resolves.toEqual({
        id: runId,
      });
      expect(assistantRun.create).toHaveBeenCalledWith({
        data: { profileId, waMessageId: 'WA-1' },
      });
    });

    it('returns null when the message already has a run (P2002)', async () => {
      const { service, assistantRun } = makeService();
      assistantRun.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.start(profileId, 'WA-1')).resolves.toBeNull();
    });

    it('rethrows any other database error', async () => {
      const { service, assistantRun } = makeService();
      const failure = new Error('connection lost');
      assistantRun.create.mockRejectedValue(failure);

      await expect(service.start(profileId, 'WA-1')).rejects.toBe(failure);
    });
  });

  it('completes a run with finishedAt', async () => {
    const { service, assistantRun } = makeService();

    await service.complete(runId);

    expect(assistantRun.update).toHaveBeenCalledWith({
      where: { id: runId },
      data: {
        status: AssistantRunStatus.COMPLETED,
        finishedAt: expect.any(Date) as Date,
      },
    });
  });

  it('fails a run keeping a bounded reason', async () => {
    const { service, assistantRun } = makeService();

    await service.fail(runId, 'x'.repeat(5000));

    const [[call]] = assistantRun.update.mock.calls as [
      [{ data: { status: string; error: string; finishedAt: Date } }],
    ];
    expect(call.data.status).toBe(AssistantRunStatus.FAILED);
    expect(call.data.error).toHaveLength(2000);
    expect(call.data.finishedAt).toBeInstanceOf(Date);
  });

  describe('findActive', () => {
    it('returns a PROCESSING run with its profile', async () => {
      const { service, assistantRun } = makeService();
      const run = {
        id: runId,
        status: AssistantRunStatus.PROCESSING,
        profile: { id: profileId },
      };
      assistantRun.findUnique.mockResolvedValue(run);

      await expect(service.findActive(runId)).resolves.toBe(run);
      expect(assistantRun.findUnique).toHaveBeenCalledWith({
        where: { id: runId },
        include: { profile: true },
      });
    });

    it('answers 404 for an unknown run', async () => {
      const { service, assistantRun } = makeService();
      assistantRun.findUnique.mockResolvedValue(null);

      await expect(service.findActive(runId)).rejects.toMatchObject({
        status: 404,
      });
    });

    it.each([AssistantRunStatus.COMPLETED, AssistantRunStatus.FAILED])(
      'answers 409 for a %s run',
      async (status) => {
        const { service, assistantRun } = makeService();
        assistantRun.findUnique.mockResolvedValue({ id: runId, status });

        await expect(service.findActive(runId)).rejects.toMatchObject({
          status: 409,
        });
      },
    );
  });
});
