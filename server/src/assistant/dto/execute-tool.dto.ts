import { IsNotEmpty, IsString } from 'class-validator';

import { ExecuteOperationDto } from '../../core/dto/execute-operation.dto';

/** Body of `POST /assistant-m2m/runs/:runId/tools/execute`. */
export class ExecuteToolDto extends ExecuteOperationDto {
  /** Tool name from the catalogue, e.g. "finance". */
  @IsString()
  @IsNotEmpty()
  tool: string;
}
