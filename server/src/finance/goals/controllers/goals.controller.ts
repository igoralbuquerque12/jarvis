import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../../auth/services/better-auth.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { FindGoalsDto } from '../dto/find-goals.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { GoalsService } from '../services/goals.service';

@Controller('finance/me/goals')
export class GoalsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly goalsService: GoalsService,
  ) { }

  @Get()
  async findMyGoals(@Req() request: Request, @Query() filters: FindGoalsDto) {
    const profile = await this.requireProfile(request);
    return this.goalsService.findGoals(profile.id, filters);
  }

  @Post()
  async createMyGoal(@Req() request: Request, @Body() data: CreateGoalDto) {
    const profile = await this.requireProfile(request);
    return this.goalsService.createGoal(profile.id, data);
  }

  @Patch(':goalId')
  async updateMyGoal(
    @Req() request: Request,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() data: UpdateGoalDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.goalsService.updateGoal(profile.id, goalId, data);
  }

  @Delete(':goalId')
  async removeMyGoal(
    @Req() request: Request,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.goalsService.removeGoal(profile.id, goalId);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
