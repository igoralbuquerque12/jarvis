import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

import { unsupportedTool } from '../../core/errors/m2m.errors';
import { ASSISTANT_TOOLS } from '../tools/main.tools';
import {
  AssistantToolHandler,
  AssistantToolHandlerFor,
} from '../tools/tool-handler';

export interface AssistantToolHandlerEntry {
  name: string;
  handler: AssistantToolHandler;
}

/**
 * Maps a catalogue tool name to the provider decorated with
 * `@AssistantToolHandlerFor(name)`, found through Nest discovery so the
 * assistant module does not import the domain modules. Boot fails when a
 * catalogue tool has no handler or two handlers claim the same name.
 */
@Injectable()
export class AssistantToolRegistry implements OnModuleInit {
  private readonly logger = new Logger(AssistantToolRegistry.name);
  private readonly handlers = new Map<string, AssistantToolHandler>();

  constructor(private readonly discoveryService: DiscoveryService) {}

  onModuleInit() {
    const entries = this.discoveryService
      .getProviders({ metadataKey: AssistantToolHandlerFor.KEY })
      .filter((wrapper) => wrapper.instance)
      .map((wrapper) => ({
        name: this.discoveryService.getMetadataByDecorator(
          AssistantToolHandlerFor,
          wrapper,
        ) as string,
        handler: wrapper.instance as AssistantToolHandler,
      }));

    this.load(
      entries,
      ASSISTANT_TOOLS.map((tool) => tool.name),
    );
  }

  load(entries: AssistantToolHandlerEntry[], catalogue: string[]) {
    this.handlers.clear();

    for (const { name, handler } of entries) {
      if (this.handlers.has(name)) {
        throw new Error(`Assistant tool "${name}" has more than one handler.`);
      }
      this.handlers.set(name, handler);
    }

    const missing = catalogue.filter((name) => !this.handlers.has(name));
    if (missing.length > 0) {
      throw new Error(
        `Assistant tools without a handler: ${missing.join(', ')}. Mark the handler with @AssistantToolHandlerFor('<name>').`,
      );
    }

    const orphans = [...this.handlers.keys()].filter(
      (name) => !catalogue.includes(name),
    );
    if (orphans.length > 0) {
      this.logger.warn(
        `Handlers without a catalogue entry (unreachable): ${orphans.join(', ')}`,
      );
    }
  }

  get(name: string): AssistantToolHandler {
    const handler = this.handlers.get(name);

    if (!handler) {
      throw unsupportedTool(name);
    }

    return handler;
  }
}
