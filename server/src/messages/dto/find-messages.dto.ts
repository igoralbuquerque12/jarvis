import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FindMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @IsString()
  userId: string;

  /** Only messages created strictly before this instant. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  before?: Date;
}
