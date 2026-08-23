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
} from '@nestjs/common';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { FindGoalsDto } from '../dto/find-goals.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { GoalsService } from '../services/goals.service';

@Controller('finance-m2m')
export class GoalsM2mController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get(':profileId/goals')
  findGoals(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() filters: FindGoalsDto,
  ) {
    return this.goalsService.findGoals(profileId, filters);
  }

  @Post(':profileId/goals')
  createGoal(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateGoalDto,
  ) {
    return this.goalsService.createGoal(profileId, data);
  }

  @Patch(':profileId/goals/:goalId')
  updateGoal(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() data: UpdateGoalDto,
  ) {
    return this.goalsService.updateGoal(profileId, goalId, data);
  }

  @Delete(':profileId/goals/:goalId')
  removeGoal(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.goalsService.removeGoal(profileId, goalId);
  }
}
