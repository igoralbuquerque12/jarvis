import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KNOWLEDGE_INDEX_SWEEP_BATCH } from '../constants/database-information.constant';
import { KnowledgeIndexerService } from '../services/knowledge-indexer.service';

/**
 * Safety net of the indexing started right after each save: picks bases left
 * PENDING, FAILED with attempts left, or PROCESSING abandoned by a restart.
 * It also rebuilds everything after a fresh database or an embedding model
 * change (reset the bases to PENDING and this sweep does the rest).
 */
@Injectable()
export class KnowledgeIndexSchedule {
  private readonly logger = new Logger(KnowledgeIndexSchedule.name);
  private running = false;

  constructor(private readonly indexer: KnowledgeIndexerService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweep() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const ids = await this.indexer.findIndexable(KNOWLEDGE_INDEX_SWEEP_BATCH);

      for (const id of ids) {
        await this.indexer.index(id);
      }
    } catch (error) {
      this.logger.error(
        `Knowledge index sweep failed: ${(error as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }
}
