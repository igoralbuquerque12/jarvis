import { ConflictException } from '@nestjs/common';

import type { AssistantRunService } from '../services/assistant-run.service';
import { AssistantToolDispatcherService } from '../services/assistant-tool-dispatcher.service';
import { AssistantToolRegistry } from '../services/assistant-tool-registry.service';
import type { AssistantToolsService } from '../services/assistant-tools.service';
import type { AssistantTool } from '../tools/tool.types';

const tool = (name: string, operations: string[]): AssistantTool => ({
  name,
  description: name,
  whenToUse: name,
  operations: operations.map((operation) => ({
    name: operation,
    whenToUse: operation,
    fields: [],
    example: {},
  })),
});

describe('AssistantToolDispatcherService', () => {
  const runId = '1a2b3c4d-1111-4b2c-8d3e-4f5a6b7c8d9e';
  const profile = {
    id: '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b',
    subscriptionId: 'sub',
  };

  function makeDispatcher() {
    const runs = { findActive: jest.fn().mockResolvedValue({ profile }) };
    const toolsService = {
      forProfile: jest.fn().mockResolvedValue({
        tools: [
          tool('events', ['create_event']),
          tool('finance', ['list_accounts']),
        ],
        reference: '',
      }),
    };
    const events = { execute: jest.fn().mockResolvedValue({ ok: 'events' }) };
    const finance = { execute: jest.fn().mockResolvedValue({ ok: 'finance' }) };
    const registry = new AssistantToolRegistry({} as never);
    registry.load(
      [
        { name: 'events', handler: events },
        { name: 'finance', handler: finance },
      ],
      ['events', 'finance'],
    );

    const dispatcher = new AssistantToolDispatcherService(
      runs as unknown as AssistantRunService,
      toolsService as unknown as AssistantToolsService,
      registry,
    );

    return { dispatcher, runs, toolsService, events, finance };
  }

  it('runs the handler of the tool with the profile of the run', async () => {
    const { dispatcher, events, finance, toolsService } = makeDispatcher();

    await expect(
      dispatcher.execute(runId, {
        tool: 'events',
        operation: 'create_event',
        data: { content: 'x' },
      }),
    ).resolves.toEqual({ ok: 'events' });

    expect(toolsService.forProfile).toHaveBeenCalledWith(profile);
    expect(events.execute).toHaveBeenCalledWith(profile.id, 'create_event', {
      content: 'x',
    });
    expect(finance.execute).not.toHaveBeenCalled();
  });

  it('defaults data to an empty object', async () => {
    const { dispatcher, finance } = makeDispatcher();

    await dispatcher.execute(runId, {
      tool: 'finance',
      operation: 'list_accounts',
    });

    expect(finance.execute).toHaveBeenCalledWith(
      profile.id,
      'list_accounts',
      {},
    );
  });

  it('rejects a tool the plan does not unlock', async () => {
    const { dispatcher, events, finance } = makeDispatcher();

    await expect(
      dispatcher.execute(runId, {
        tool: 'database_information',
        operation: 'get_database_information',
      }),
    ).rejects.toMatchObject({
      response: { code: 'unsupported_operation' },
    });
    expect(events.execute).not.toHaveBeenCalled();
    expect(finance.execute).not.toHaveBeenCalled();
  });

  it('rejects an operation that belongs to another tool', async () => {
    const { dispatcher, events } = makeDispatcher();

    await expect(
      dispatcher.execute(runId, {
        tool: 'events',
        operation: 'list_accounts',
      }),
    ).rejects.toMatchObject({
      response: { code: 'unsupported_operation' },
    });
    expect(events.execute).not.toHaveBeenCalled();
  });

  it('refuses to act on a finished run', async () => {
    const { dispatcher, runs, events } = makeDispatcher();
    runs.findActive.mockRejectedValue(
      new ConflictException('Run já finalizada.'),
    );

    await expect(
      dispatcher.execute(runId, { tool: 'events', operation: 'create_event' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(events.execute).not.toHaveBeenCalled();
  });
});
