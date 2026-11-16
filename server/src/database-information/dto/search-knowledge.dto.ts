import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH } from '../constants/database-information.constant';

/** `data` of the `search_knowledge` assistant operation. */
export class SearchKnowledgeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH)
  query: string;

  @IsOptional()
  @IsUUID()
  databaseInformationId?: string;
}
