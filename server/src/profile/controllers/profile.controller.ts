import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { toProfileMeView } from '../entities/profile-me.view';
import { ProfileService } from '../services/profile.service';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: BetterAuthService,
  ) {}

  @Get('me')
  async getCurrentProfile(@Req() request: Request) {
    const session = await this.authService.requireSession(request.headers);
    await this.profileService.ensureAuthProfile(session.user);
    const profile = await this.profileService.findMeByUserId(session.user.id);

    return toProfileMeView(profile);
  }

  @Patch('me')
  async updateCurrentProfile(
    @Req() request: Request,
    @Body() data: UpdateProfileDto,
  ) {
    const session = await this.authService.requireSession(request.headers);
    await this.profileService.ensureAuthProfile(session.user);
    const profile = await this.profileService.updateByUserId(
      session.user.id,
      data,
    );

    return toProfileMeView(profile);
  }
}
