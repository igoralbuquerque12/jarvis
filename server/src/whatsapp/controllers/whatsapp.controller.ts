import { Body, Controller, Get, Post } from '@nestjs/common';
import { SendMessageDto } from '../dto/send-message.dto';
import { WhatsappService } from '../services/whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('qr')
  async getQr(): Promise<{ connected: boolean; qr: string | null }> {
    return this.whatsappService.getQr();
  }

  @Get('status')
  getStatus(): { connected: boolean } {
    return {
      connected: this.whatsappService.isConnected(),
    };
  }

  @Post('send')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<{ sent: true }> {
    return this.whatsappService.sendMessage(
      sendMessageDto.phone,
      sendMessageDto.message,
    );
  }
}
