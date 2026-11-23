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

  /** Present when the message is an audio (voice note or audio file). */
  @IsOptional()
  audio?: IncomingAudio;

  @IsObject()
  message: IncomingMessage;

  @IsOptional()
  @IsString()
  pushName: string;
}

/**
 * An inbound audio, not downloaded yet: the channel hands a lazy `download`
 * so the bytes are only fetched for messages that will really be processed.
 */
export interface IncomingAudio {
  mimetype: string;
  /** Duration announced by the sender's client (0 when unknown). */
  seconds: number;
  download(): Promise<Buffer>;
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
