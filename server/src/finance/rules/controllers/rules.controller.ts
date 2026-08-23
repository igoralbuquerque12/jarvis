import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../../auth/services/better-auth.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { RulesService } from '../services/rules.service';

@Controller('finance/me/rules')
export class RulesController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly rulesService: RulesService,
  ) {}

  @Get()
  async findMyRules(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.rulesService.findRules(profile.id);
  }

  @Post()
  async createMyRule(@Req() request: Request, @Body() data: CreateRuleDto) {
    const profile = await this.requireProfile(request);
    return this.rulesService.createRule(profile.id, data);
  }

  @Patch(':ruleId')
  async updateMyRule(
    @Req() request: Request,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() data: UpdateRuleDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.rulesService.updateRule(profile.id, ruleId, data);
  }

  @Delete(':ruleId')
  async removeMyRule(
    @Req() request: Request,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.rulesService.removeRule(profile.id, ruleId);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
