import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DATABASE_INFORMATION_MAX_CONTENT_LENGTH } from '../constants/database-information.constant';

export class CreateDatabaseInformationDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(DATABASE_INFORMATION_MAX_CONTENT_LENGTH)
  content: string;
}
