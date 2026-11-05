import { Injectable } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AssistantToolRegistry } from '../services/assistant-tool-registry.service';
import { ASSISTANT_TOOLS } from '../tools/main.tools';
import {
  AssistantToolHandler,
  AssistantToolHandlerFor,
} from '../tools/tool-handler';

const handler = (): AssistantToolHandler => ({ execute: jest.fn() });

describe('AssistantToolRegistry', () => {
  describe('load', () => {
    it('resolves each catalogue tool to its handler', () => {
      const registry = new AssistantToolRegistry({} as never);
      const events = handler();

      registry.load([{ name: 'events', handler: events }], ['events']);

      expect(registry.get('events')).toBe(events);
    });

    it('fails when a catalogue tool has no handler', () => {
      const registry = new AssistantToolRegistry({} as never);

      expect(() =>
        registry.load(
          [{ name: 'events', handler: handler() }],
          ['events', 'finance'],
        ),
      ).toThrow('Assistant tools without a handler: finance');
    });

    it('fails when two handlers claim the same tool', () => {
      const registry = new AssistantToolRegistry({} as never);

      expect(() =>
        registry.load(
          [
            { name: 'events', handler: handler() },
            { name: 'events', handler: handler() },
          ],
          ['events'],
        ),
      ).toThrow('more than one handler');
    });

    it('answers unsupported_operation for an unknown tool', () => {
      const registry = new AssistantToolRegistry({} as never);
      registry.load([], []);

      expect(() => registry.get('nope')).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            code: 'unsupported_operation',
          }) as unknown,
        }) as Error,
      );
    });
  });

  describe('discovery', () => {
    @Injectable()
    @AssistantToolHandlerFor('events')
    class FakeEventsHandler implements AssistantToolHandler {
      execute = jest.fn();
    }

    it('finds providers marked with @AssistantToolHandlerFor', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [DiscoveryModule],
        providers: [AssistantToolRegistry, FakeEventsHandler],
      }).compile();
      const registry = moduleRef.get(AssistantToolRegistry);
      const loadSpy = jest.spyOn(registry, 'load').mockImplementation();

      registry.onModuleInit();

      const [entries, catalogue] = loadSpy.mock.calls[0];
      expect(entries).toEqual([
        { name: 'events', handler: moduleRef.get(FakeEventsHandler) },
      ]);
      expect(catalogue).toEqual(ASSISTANT_TOOLS.map((tool) => tool.name));
    });
  });
});
