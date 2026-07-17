import { Injectable } from '@nestjs/common';
import type { MessageUpsertType, WAMessage } from '@whiskeysockets/baileys';

@Injectable()
export class WhatsappReceiverService {
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
      if (message.key.fromMe || !message.message) {
        continue;
      }

      console.log({
        from: message.key.remoteJid,
        participant: message.key.participant,
        messageId: message.key.id,
        text: this.getText(message),
        message,
      });
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
