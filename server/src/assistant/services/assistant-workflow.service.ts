import { Injectable } from '@nestjs/common';

import { ReceiveMessageWorkflowInput } from '../entities/receive-message-workflow-input';
import {
  ReceiveMessageWorkflowOutput,
  ReceiveMessageWorkflowOutputSchema,
} from '../entities/receive-message-worflow-output';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class AssistantWorkflowService {
  constructor(private readonly configService: ConfigService) {}

  async fetch(
    payload: ReceiveMessageWorkflowInput,
  ): Promise<ReceiveMessageWorkflowOutput> {
    const url = this.configService.get<string>('ASSISTANT_WORKFLOW_URL');
    const key = this.configService.get<string>('ASSISTANT_WORKFLOW_KEY');

    if (!url || !key) {
      throw new Error('Assistant workflow URL or key is not defined');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch assistant workflow: ${response.status} ${response.statusText}`,
      );
    }

    console.log('Response from workflow:', response);
    console.log('Response from workflow:', JSON.stringify(response));

    const data: unknown = await response.json();
    return ReceiveMessageWorkflowOutputSchema.parse(data);
  }
}
