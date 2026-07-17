import { z } from 'zod';

export const ReceiveMessageWorkflowOutputSchema = z.object({
  response: z.string(),
});

export type ReceiveMessageWorkflowOutput = z.infer<
  typeof ReceiveMessageWorkflowOutputSchema
>;
