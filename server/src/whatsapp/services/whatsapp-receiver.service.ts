import { Injectable } from '@nestjs/common';
import type { MessageUpsertType, WAMessage } from '@whiskeysockets/baileys';
import type { IncomingAudio } from '../../assistant/dto/receive-message.dto';
import { AssistantMainService } from '../../assistant/services/assistant-main.service';

const DEFAULT_AUDIO_MIMETYPE = 'audio/ogg; codecs=opus';

@Injectable()
export class WhatsappReceiverService {
  constructor(private readonly assistantMainService: AssistantMainService) {}

  readonly handleMessagesUpsert = ({
    messages,
    type,
  }: {
    messages: WAMessage[];
    type: MessageUpsertType;
  }): void => {
    // "notify" contém eventos novos; "append" é histórico sincronizado.
    if (type !== 'notify') {
      return;
    }

    for (const message of messages) {
      const from = message.key.remoteJid;
      const messageId = message.key.id;

      if (message.key.fromMe || !message.message || !from || !messageId) {
        continue;
      }

      const participant = message.key.participant ?? undefined;
      const text = this.getText(message);
      const audio = this.getAudio(message);
      const dataMessage = {
        from,
        ...(participant !== undefined && { participant }),
        messageId,
        ...(text !== undefined && { text }),
        ...(audio !== undefined && { audio }),
        message: {
          key: {
            remoteJid: from,
            remoteJidAlt: message.key.remoteJidAlt ?? from,
            remoteJidUsername: undefined,
            fromMe: false as const,
            id: messageId,
          },
          category: message.message.conversation ?? '',
          messageTimestamp: Number(message.messageTimestamp ?? 0),
        },
        pushName: message.pushName ?? '',
      };
      void this.assistantMainService.receiveMessage(dataMessage);
    }
  };

  /**
   * Voice notes and audio files. The bytes stay on WhatsApp's servers until
   * the assistant asks for them (`download`), after triage.
   */
  private getAudio(message: WAMessage): IncomingAudio | undefined {
    const audio = message.message?.audioMessage;

    if (!audio) {
      return undefined;
    }

    return {
      mimetype: audio.mimetype || DEFAULT_AUDIO_MIMETYPE,
      seconds: Number(audio.seconds ?? 0),
      download: async () => {
        const { downloadMediaMessage } =
          await import('@whiskeysockets/baileys');

        return downloadMediaMessage(message, 'buffer', {});
      },
    };
  }

  private getText(message: WAMessage): string | undefined {
    const content = message.message;

    return (
      content?.conversation ??
      content?.extendedTextMessage?.text ??
      content?.imageMessage?.caption ??
      content?.videoMessage?.caption ??
      content?.documentMessage?.caption ??
      undefined
    );
  }
}
