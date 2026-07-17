import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
