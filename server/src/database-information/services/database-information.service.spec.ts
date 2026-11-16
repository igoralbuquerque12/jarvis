import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { AiProvider } from '../../ai/contracts/ai-provider.contract';
import { AiProviderError } from '../../ai/errors/ai-provider.error';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MAX_DATABASE_INFORMATION_PER_PROFILE } from '../constants/database-information.constant';
import { hashKnowledgeContent } from '../utils/knowledge-text';
import { DatabaseInformationService } from './database-information.service';
import { KnowledgeIndexerService } from './knowledge-indexer.service';

describe('DatabaseInformationService', () => {
  const profileId = 'profile-1';

  function makeService(extract = jest.fn()) {
    const databaseInformation = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((args: { data: object }) =>
        Promise.resolve({ id: 'db-new', ...args.data }),
      ),
      update: jest.fn((args: { data: object }) => Promise.resolve(args.data)),
      delete: jest.fn(),
    };
    const prisma = { databaseInformation } as unknown as PrismaService;
    const ai = { extract } as unknown as AiProvider;
    const indexer = { indexInBackground: jest.fn() };

    return {
      databaseInformation,
      extract,
      indexer,
      service: new DatabaseInformationService(
        prisma,
        ai,
        indexer as unknown as KnowledgeIndexerService,
      ),
    };
  }

  describe('create', () => {
    it('saves the extracted name and description with the text as content', async () => {
      const { service, databaseInformation, extract, indexer } = makeService(
        jest.fn().mockResolvedValue({
          name: '  Clientes VIP ',
          description: ' Lista de clientes. ',
        }),
      );

      await service.create(profileId, { content: 'João; Maria' });

      expect(extract).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'João; Maria' }),
      );
      expect(databaseInformation.create).toHaveBeenCalledWith({
        data: {
          profileId,
          name: 'Clientes VIP',
          description: 'Lista de clientes.',
          content: { text: 'João; Maria' },
          contentHash: hashKnowledgeContent('João; Maria'),
        },
      });
      expect(indexer.indexInBackground).toHaveBeenCalledWith('db-new');
    });

    it('blocks at the limit before calling the AI', async () => {
      const { service, databaseInformation, extract } = makeService();
      databaseInformation.count.mockResolvedValue(
        MAX_DATABASE_INFORMATION_PER_PROFILE,
      );

      await expect(service.create(profileId, { content: 'x' })).rejects.toThrow(
        'Limite de 10 bases de dados',
      );
      expect(extract).not.toHaveBeenCalled();
    });

    it('returns 502 and saves nothing when the AI fails', async () => {
      const { service, databaseInformation } = makeService(
        jest.fn().mockRejectedValue(new AiProviderError('down', true)),
      );

      await expect(
        service.create(profileId, { content: 'x' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
      expect(databaseInformation.create).not.toHaveBeenCalled();
    });

    it('rejects an empty extraction', async () => {
      const { service, databaseInformation } = makeService(
        jest.fn().mockResolvedValue({ name: '  ', description: 'ok' }),
      );

      await expect(
        service.create(profileId, { content: 'x' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
      expect(databaseInformation.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = { id: 'db-1', profileId, content: { text: 'antigo' } };

    it('re-extracts, saves and re-indexes when the content changes', async () => {
      const { service, databaseInformation, extract, indexer } = makeService(
        jest.fn().mockResolvedValue({ name: 'Novo', description: 'Nova desc' }),
      );
      databaseInformation.findFirst.mockResolvedValue(existing);

      await service.update(profileId, 'db-1', { content: 'novo' });

      expect(extract).toHaveBeenCalledTimes(1);
      expect(databaseInformation.update).toHaveBeenCalledWith({
        where: { id: 'db-1' },
        data: {
          name: 'Novo',
          description: 'Nova desc',
          content: { text: 'novo' },
          contentHash: hashKnowledgeContent('novo'),
          indexStatus: 'PENDING',
          indexAttempts: 0,
          indexError: null,
        },
      });
      expect(indexer.indexInBackground).toHaveBeenCalledWith('db-1');
    });

    it('skips the AI and the indexing when the content is unchanged', async () => {
      const { service, databaseInformation, extract, indexer } = makeService();
      databaseInformation.findFirst.mockResolvedValue(existing);

      await expect(
        service.update(profileId, 'db-1', { content: 'antigo' }),
      ).resolves.toBe(existing);
      expect(extract).not.toHaveBeenCalled();
      expect(databaseInformation.update).not.toHaveBeenCalled();
      expect(indexer.indexInBackground).not.toHaveBeenCalled();
    });

    it('keeps the old data when the AI fails', async () => {
      const { service, databaseInformation } = makeService(
        jest.fn().mockRejectedValue(new AiProviderError('down', true)),
      );
      databaseInformation.findFirst.mockResolvedValue(existing);

      await expect(
        service.update(profileId, 'db-1', { content: 'novo' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
      expect(databaseInformation.update).not.toHaveBeenCalled();
    });

    it('returns 404 for a base owned by another profile', async () => {
      const { service, databaseInformation } = makeService();
      databaseInformation.findFirst.mockResolvedValue(null);

      await expect(
        service.update(profileId, 'db-1', { content: 'novo' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(databaseInformation.findFirst).toHaveBeenCalledWith({
        where: { id: 'db-1', profileId },
      });
    });
  });

  describe('assistant reads', () => {
    it('lists only id, name and description of the profile bases', async () => {
      const { service, databaseInformation } = makeService();
      databaseInformation.findMany.mockResolvedValue([
        { id: 'db-1', name: 'Clientes', description: 'Lista de clientes.' },
      ]);

      await expect(service.findIndexByProfile(profileId)).resolves.toEqual([
        { id: 'db-1', name: 'Clientes', description: 'Lista de clientes.' },
      ]);
      expect(databaseInformation.findMany).toHaveBeenCalledWith({
        where: { profileId },
        select: { id: true, name: true, description: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns the full base with its text content', async () => {
      const { service, databaseInformation } = makeService();
      databaseInformation.findFirst.mockResolvedValue({
        id: 'db-1',
        profileId,
        name: 'Clientes',
        description: 'Lista de clientes.',
        content: { text: 'João; Maria' },
      });

      await expect(
        service.findOneForAssistant(profileId, 'db-1'),
      ).resolves.toEqual({
        id: 'db-1',
        name: 'Clientes',
        description: 'Lista de clientes.',
        content: 'João; Maria',
      });
    });

    it('404s for a base owned by another profile', async () => {
      const { service, databaseInformation } = makeService();
      databaseInformation.findFirst.mockResolvedValue(null);

      await expect(
        service.findOneForAssistant(profileId, 'db-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('reindex', () => {
    it('queues an owned base again with a fresh attempt budget', async () => {
      const { service, databaseInformation, indexer } = makeService();
      databaseInformation.findFirst.mockResolvedValue({
        id: 'db-1',
        profileId,
      });

      await service.reindex(profileId, 'db-1');

      expect(databaseInformation.update).toHaveBeenCalledWith({
        where: { id: 'db-1' },
        data: { indexStatus: 'PENDING', indexAttempts: 0, indexError: null },
      });
      expect(indexer.indexInBackground).toHaveBeenCalledWith('db-1');
    });

    it('404s for a base owned by another profile', async () => {
      const { service, databaseInformation, indexer } = makeService();
      databaseInformation.findFirst.mockResolvedValue(null);

      await expect(service.reindex(profileId, 'db-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(indexer.indexInBackground).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes an owned base and 404s otherwise', async () => {
      const { service, databaseInformation } = makeService();
      databaseInformation.findFirst.mockResolvedValueOnce(null);

      await expect(service.remove(profileId, 'db-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      databaseInformation.findFirst.mockResolvedValueOnce({ id: 'db-1' });
      await service.remove(profileId, 'db-1');

      expect(databaseInformation.delete).toHaveBeenCalledWith({
        where: { id: 'db-1' },
      });
    });
  });
});
