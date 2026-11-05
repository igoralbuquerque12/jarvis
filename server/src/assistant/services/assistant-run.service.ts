import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssistantRunStatus } from '@prisma/client';
import type { AssistantRun, Profile } from '@prisma/client';

import { PrismaService } from '../../prisma/services/prisma.service';

/** Failure reasons are diagnostic text; keep the column bounded. */
const MAX_ERROR_LENGTH = 2000;

export type ActiveAssistantRun = AssistantRun & { profile: Profile };

/**
 * Lifecycle of an assistant run: one per inbound WhatsApp message that passed
 * triage. `PROCESSING → COMPLETED | FAILED`, no retries. The runId is what n8n
 * receives; it only grants access while the run is still PROCESSING.
 */
@Injectable()
export class AssistantRunService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Opens a run for the message. Returns `null` when the same WhatsApp
   * message already has a run (redelivery): the unique
   * (profileId, waMessageId) constraint is the idempotency guard.
   */
  async start(
    profileId: string,
    waMessageId: string,
  ): Promise<AssistantRun | null> {
    try {
      return await this.prisma.assistantRun.create({
        data: { profileId, waMessageId },
      });
    } catch (error) {
      if (this.isDuplicateRun(error)) {
        return null;
      }
      throw error;
    }
  }

  complete(runId: string) {
    return this.prisma.assistantRun.update({
      where: { id: runId },
      data: { status: AssistantRunStatus.COMPLETED, finishedAt: new Date() },
    });
  }

  fail(runId: string, reason: string) {
    return this.prisma.assistantRun.update({
      where: { id: runId },
      data: {
        status: AssistantRunStatus.FAILED,
        error: reason.slice(0, MAX_ERROR_LENGTH),
        finishedAt: new Date(),
      },
    });
  }

  /**
   * Run n8n is allowed to act on: it must exist and still be PROCESSING.
   * Finished runs answer `conflict`, so a leaked runId is useless afterwards.
   */
  async findActive(runId: string): Promise<ActiveAssistantRun> {
    const run = await this.prisma.assistantRun.findUnique({
      where: { id: runId },
      include: { profile: true },
    });

    if (!run) {
      throw new NotFoundException('Run não encontrada.');
    }

    if (run.status !== AssistantRunStatus.PROCESSING) {
      throw new ConflictException('Run já finalizada.');
    }

    return run;
  }

  private isDuplicateRun(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
