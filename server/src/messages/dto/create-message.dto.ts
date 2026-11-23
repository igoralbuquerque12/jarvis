import { MessageContentType, MessageType } from '@prisma/client';
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

  /** How the content arrived. Defaults to TEXT; AUDIO is a transcription. */
  @IsOptional()
  @IsEnum(MessageContentType)
  contentType?: MessageContentType;

  /** Assistant run that produced (or received) the message. */
  @IsOptional()
  @IsUUID()
  runId?: string;
}
