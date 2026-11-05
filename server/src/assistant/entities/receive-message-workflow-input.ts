/**
 * Payload of the n8n webhook. n8n only gets the run id and reads everything
 * else back from `/assistant-m2m/runs/:runId/*`, so the payload never grows
 * with new context or tools.
 */
export class ReceiveMessageWorkflowInput {
  runId: string;
}
