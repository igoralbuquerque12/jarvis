import { IsObject, IsOptional, IsString } from 'class-validator';

export class ExecuteOperationDto {
  @IsString()
  operation: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}
