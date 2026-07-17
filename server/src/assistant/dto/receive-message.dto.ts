import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class IncomingMessageDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsOptional()
  @IsString()
  participant?: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsObject()
  message: IncomingMessage;

  @IsOptional()
  @IsString()
  pushName: string;
}

interface IncomingMessage {
  key: {
    remoteJid: string;
    remoteJidAlt: string;
    remoteJidUsername: undefined;
    fromMe: false;
    id: string;
  };
  category: string;
  messageTimestamp: number;
}
