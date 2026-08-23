import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { RulesService } from '../services/rules.service';

@Controller('finance-m2m')
export class RulesM2mController {
  constructor(private readonly rulesService: RulesService) {}

  @Get(':profileId/rules')
  findRules(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.rulesService.findRules(profileId);
  }

  @Post(':profileId/rules')
  createRule(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateRuleDto,
  ) {
    return this.rulesService.createRule(profileId, data);
  }

  @Patch(':profileId/rules/:ruleId')
  updateRule(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() data: UpdateRuleDto,
  ) {
    return this.rulesService.updateRule(profileId, ruleId, data);
  }

  @Delete(':profileId/rules/:ruleId')
  removeRule(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ) {
    return this.rulesService.removeRule(profileId, ruleId);
  }
}
