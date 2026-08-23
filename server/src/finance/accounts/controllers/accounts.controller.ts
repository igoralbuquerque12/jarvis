import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../../auth/services/better-auth.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountsService } from '../services/accounts.service';

@Controller('finance/me/accounts')
export class AccountsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly accountsService: AccountsService,
  ) {}

  @Get()
  async findMyAccounts(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.accountsService.findAccounts(profile.id);
  }

  @Post()
  async createMyAccount(
    @Req() request: Request,
    @Body() data: CreateAccountDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.accountsService.createAccount(profile.id, data);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
