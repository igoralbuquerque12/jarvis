import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  jid?: string | null;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID()
  subscriptionId: string;
}
