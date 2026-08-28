import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  jid: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
