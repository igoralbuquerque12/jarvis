import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../auth/better-auth.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: BetterAuthService,
  ) {}

  @Get('me')
  async getCurrentProfile(@Req() request: Request) {
    const session = await this.authService.requireSession(request.headers);
    const profile = await this.profileService.ensureAuthProfile(session.user);

    return profile;
  }

  @Patch('me')
  async updateCurrentProfile(
    @Req() request: Request,
    @Body() data: UpdateProfileDto,
  ) {
    const session = await this.authService.requireSession(request.headers);
    await this.profileService.ensureAuthProfile(session.user);

    return this.profileService.updateByUserId(session.user.id, data);
  }
}
