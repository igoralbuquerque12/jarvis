import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  about?: string;

  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
