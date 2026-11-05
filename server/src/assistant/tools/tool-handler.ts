import { DiscoveryService } from '@nestjs/core';

/**
 * Backend side of one entry of `ASSISTANT_TOOLS`. Each domain module owns the
 * handler of its tool and marks it with `@AssistantToolHandlerFor('<name>')`;
 * `AssistantToolRegistry` discovers them on boot, so the assistant module never
 * imports the domain modules and n8n never needs a new node per tool.
 *
 * `profileId` always comes from the run, never from the model. Errors thrown
 * here leave the endpoint through `M2mExceptionFilter`.
 */
export interface AssistantToolHandler {
  execute(
    profileId: string,
    operation: string,
    data: Record<string, unknown>,
  ): Promise<unknown>;
}

/** Marks a provider as the handler of the tool with the given name. */
export const AssistantToolHandlerFor =
  DiscoveryService.createDecorator<string>();
