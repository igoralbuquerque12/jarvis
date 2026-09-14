import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';
import { ProfileService } from '../../profile/services/profile.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/update-api-key.dto';
import { toApiKeyView } from '../entities/api-key.view';
import { ApiKeysService } from '../services/api-keys.service';

/** Session-protected management of the logged-in user's API keys. */
@Controller('api-keys')
export class ApiKeysController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Get('me')
  async findMine(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    const apiKeys = await this.apiKeysService.findAllByProfile(profile.id);

    return apiKeys.map(toApiKeyView);
  }

  @Post('me')
  async createMine(@Req() request: Request, @Body() data: CreateApiKeyDto) {
    const profile = await this.requireProfile(request);

    return this.apiKeysService.create(profile.id, data);
  }

  @Patch('me/:id')
  async updateMine(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateApiKeyDto,
  ) {
    const profile = await this.requireProfile(request);
    const apiKey = await this.apiKeysService.update(profile.id, id, data);

    return toApiKeyView(apiKey);
  }

  @Delete('me/:id')
  @HttpCode(204)
  async removeMine(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const profile = await this.requireProfile(request);
    await this.apiKeysService.remove(profile.id, id);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);

    return this.profileService.ensureAuthProfile(session.user);
  }
}
