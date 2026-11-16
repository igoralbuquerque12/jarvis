import { Injectable } from '@nestjs/common';

import type { AssistantToolContext } from '../../assistant/tools/tool-handler';
import {
  AssistantToolHandler,
  AssistantToolHandlerFor,
} from '../../assistant/tools/tool-handler';
import { unsupportedOperation } from '../../core/errors/m2m.errors';
import { requireUuid } from '../../core/utils/require-uuid.util';
import { validateDto } from '../../core/utils/validate-dto.util';
import { SearchKnowledgeDto } from '../dto/search-knowledge.dto';
import { toKnowledgeSearchAssistantView } from '../entities/knowledge-search.view';
import { DatabaseInformationService } from './database-information.service';
import { KnowledgeSearchService } from './knowledge-search.service';

/** Handler of the `database_information` assistant tool (knowledge bases). */
@Injectable()
@AssistantToolHandlerFor('database_information')
export class DatabaseInformationToolService implements AssistantToolHandler {
  constructor(
    private readonly databaseInformationService: DatabaseInformationService,
    private readonly knowledgeSearchService: KnowledgeSearchService,
  ) {}

  async execute(
    profileId: string,
    operation: string,
    data: Record<string, unknown>,
    context?: AssistantToolContext,
  ) {
    switch (operation) {
      case 'search_knowledge': {
        const { query, databaseInformationId } = await validateDto(
          SearchKnowledgeDto,
          data,
        );

        return toKnowledgeSearchAssistantView(
          await this.knowledgeSearchService.search(profileId, query, {
            databaseInformationId,
            runId: context?.runId,
          }),
        );
      }
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
