import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ApiKeyProfile } from '../../api-keys/decorators/api-key-profile.decorator';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { SendSelfMessageDto } from '../dto/send-self-message.dto';
import { PublicApiService } from '../services/public-api.service';

/**
 * Public, versioned API. Every route is protected by an API key
 * and always acts on behalf of the key owner.
 */
@Controller('v1')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Post('messages')
  sendMessage(
    @ApiKeyProfile() profile: Profile,
    @Body() data: SendSelfMessageDto,
  ) {
    return this.publicApiService.sendMessageToSelf(profile, data.message);
  }
}
