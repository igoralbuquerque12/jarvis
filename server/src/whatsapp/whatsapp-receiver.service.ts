import { Injectable } from '@nestjs/common';
import type { MessageUpsertType, WAMessage } from '@whiskeysockets/baileys';
import { AssistantMainService } from '../assistant/services/assistant-main.service';

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
      console.log('Received message:', message);
      const from = message.key.remoteJid;
      const messageId = message.key.id;

      if (message.key.fromMe || !message.message || !from || !messageId) {
        continue;
      }

      const participant = message.key.participant ?? undefined;
      const text = this.getText(message);
      const dataMessage = {
        from,
        ...(participant !== undefined && { participant }),
        messageId,
        ...(text !== undefined && { text }),
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
