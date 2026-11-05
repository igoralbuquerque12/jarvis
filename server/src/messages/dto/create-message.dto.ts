import { MessageType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;

  /** Assistant run that produced (or received) the message. */
  @IsOptional()
  @IsUUID()
  runId?: string;
}
