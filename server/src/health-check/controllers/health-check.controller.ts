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
import { CreateHealthCheckConfigDto } from '../dto/create-health-check-config.dto';
import { UpdateHealthCheckConfigDto } from '../dto/update-health-check-config.dto';
import { toHealthCheckConfigView } from '../entities/health-check-config.view';
import { HealthCheckService } from '../services/health-check.service';

@Controller('health-check')
export class HealthCheckController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Get('me')
  async findMine(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    const configs = await this.healthCheckService.findAllByProfile(profile.id);

    return configs.map(toHealthCheckConfigView);
  }

  @Post('me')
  async createMine(
    @Req() request: Request,
    @Body() data: CreateHealthCheckConfigDto,
  ) {
    const profile = await this.requireProfile(request);
    const created = await this.healthCheckService.create(profile.id, data);

    return toHealthCheckConfigView(created);
  }

  @Patch('me/:id')
  async updateMine(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateHealthCheckConfigDto,
  ) {
    const profile = await this.requireProfile(request);
    const updated = await this.healthCheckService.update(profile.id, id, data);

    return toHealthCheckConfigView(updated);
  }

  @Delete('me/:id')
  @HttpCode(204)
  async removeMine(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const profile = await this.requireProfile(request);
    await this.healthCheckService.remove(profile.id, id);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);

    return this.profileService.ensureAuthProfile(session.user);
  }
}
