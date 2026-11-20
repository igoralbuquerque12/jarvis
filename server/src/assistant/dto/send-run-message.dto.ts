import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ASSISTANT_MESSAGE_MAX_LENGTH } from '../constants/assistant-message.constant';

/** Body of `POST /assistant-m2m/runs/:runId/messages`. */
export class SendRunMessageDto {
  /** Text of one WhatsApp message, exactly as the user will read it. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(ASSISTANT_MESSAGE_MAX_LENGTH)
  content: string;
}
