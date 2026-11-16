import { KnowledgeIndexerService } from '../services/knowledge-indexer.service';
import { KnowledgeIndexSchedule } from './knowledge-index.schedule';

describe('KnowledgeIndexSchedule', () => {
  function makeSchedule(ids: string[]) {
    const indexer = {
      findIndexable: jest.fn().mockResolvedValue(ids),
      index: jest.fn().mockResolvedValue('indexed'),
    };

    return {
      indexer,
      schedule: new KnowledgeIndexSchedule(
        indexer as unknown as KnowledgeIndexerService,
      ),
    };
  }

  it('indexes every base the indexer says is due, one at a time', async () => {
    const { schedule, indexer } = makeSchedule(['a', 'b']);

    await schedule.sweep();

    expect(indexer.index.mock.calls).toEqual([['a'], ['b']]);
  });

  it('does not overlap a tick that is still running', async () => {
    const { schedule, indexer } = makeSchedule(['a']);
    let release!: () => void;
    indexer.index.mockReturnValueOnce(
      new Promise((resolve) => {
        release = () => resolve('indexed');
      }),
    );

    const first = schedule.sweep();
    await Promise.resolve();
    await schedule.sweep();
    release();
    await first;

    expect(indexer.findIndexable).toHaveBeenCalledTimes(1);
  });

  it('survives a failing lookup', async () => {
    const { schedule, indexer } = makeSchedule([]);
    indexer.findIndexable.mockRejectedValue(new Error('db down'));

    await expect(schedule.sweep()).resolves.toBeUndefined();
  });
});
