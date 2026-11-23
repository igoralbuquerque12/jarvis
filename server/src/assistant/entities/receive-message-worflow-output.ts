import { z } from 'zod';

/**
 * What the n8n webhook answers when the workflow ran to the end. It carries
 * no text: every message to the user is sent during the run through
 * `POST /assistant-m2m/runs/:runId/messages` (the `enviar_mensagem` tool).
 * Anything else (other status, other shape, non-2xx) fails the run.
 */
export const ReceiveMessageWorkflowOutputSchema = z.object({
  status: z.literal('COMPLETED'),
});

export type ReceiveMessageWorkflowOutput = z.infer<
  typeof ReceiveMessageWorkflowOutputSchema
>;
