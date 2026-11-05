import { Injectable } from '@nestjs/common';

import {
  AssistantToolHandler,
  AssistantToolHandlerFor,
} from '../../assistant/tools/tool-handler';
import { unsupportedOperation } from '../../core/errors/m2m.errors';
import { requireUuid } from '../../core/utils/require-uuid.util';
import { DatabaseInformationService } from './database-information.service';

/** Handler of the `database_information` assistant tool (knowledge bases). */
@Injectable()
@AssistantToolHandlerFor('database_information')
export class DatabaseInformationToolService implements AssistantToolHandler {
  constructor(
    private readonly databaseInformationService: DatabaseInformationService,
  ) {}

  async execute(
    profileId: string,
    operation: string,
    data: Record<string, unknown>,
  ) {
    switch (operation) {
      case 'get_database_information':
        return this.databaseInformationService.findOneForAssistant(
          profileId,
          requireUuid(data, 'databaseInformationId'),
        );
      default:
        throw unsupportedOperation(operation);
    }
  }
}
