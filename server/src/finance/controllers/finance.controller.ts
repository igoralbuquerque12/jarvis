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

import { BetterAuthService } from '../../auth/better-auth.service';
import { ProfileService } from '../../profile/profile.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreateAssetTradeDto } from '../dto/create-asset-trade.dto';
import { CreateAssetValueDto } from '../dto/create-asset-value.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { CreateRecurringTransactionDto } from '../dto/create-recurring-transaction.dto';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { FindGoalsDto } from '../dto/find-goals.dto';
import { FindTransactionsDto } from '../dto/find-transactions.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { UpdateRecurringTransactionDto } from '../dto/update-recurring-transaction.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { FinanceService } from '../services/finance.service';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly financeService: FinanceService,
  ) {}

  // Accounts

  @Get('me/accounts')
  async findMyAccounts(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.financeService.findAccounts(profile.id);
  }

  @Post('me/accounts')
  async createMyAccount(
    @Req() request: Request,
    @Body() data: CreateAccountDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.createAccount(profile.id, data);
  }

  // Transactions

  @Post('me/transactions')
  async createMyTransaction(
    @Req() request: Request,
    @Body() data: CreateTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.createTransaction(profile.id, data);
  }

  @Get('me/transactions')
  async findMyTransactions(
    @Req() request: Request,
    @Query() filters: FindTransactionsDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.findTransactions(profile.id, filters);
  }

  @Patch('me/transactions/:transactionId')
  async updateMyTransaction(
    @Req() request: Request,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() data: UpdateTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.updateTransaction(
      profile.id,
      transactionId,
      data,
    );
  }

  @Delete('me/transactions/:transactionId')
  async removeMyTransaction(
    @Req() request: Request,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.removeTransaction(profile.id, transactionId);
  }

  // Categories

  @Get('me/categories')
  async findMyCategories(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.financeService.findCategories(profile.id);
  }

  @Post('me/categories')
  async createMyCategory(
    @Req() request: Request,
    @Body() data: CreateCategoryDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.createCategory(profile.id, data);
  }

  @Patch('me/categories/:categoryId')
  async updateMyCategory(
    @Req() request: Request,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() data: UpdateCategoryDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.updateCategory(profile.id, categoryId, data);
  }

  @Delete('me/categories/:categoryId')
  async removeMyCategory(
    @Req() request: Request,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.removeCategory(profile.id, categoryId);
  }

  // Rules

  @Get('me/rules')
  async findMyRules(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.financeService.findRules(profile.id);
  }

  @Post('me/rules')
  async createMyRule(@Req() request: Request, @Body() data: CreateRuleDto) {
    const profile = await this.requireProfile(request);
    return this.financeService.createRule(profile.id, data);
  }

  @Patch('me/rules/:ruleId')
  async updateMyRule(
    @Req() request: Request,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() data: UpdateRuleDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.updateRule(profile.id, ruleId, data);
  }

  @Delete('me/rules/:ruleId')
  async removeMyRule(
    @Req() request: Request,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.removeRule(profile.id, ruleId);
  }

  // Goals

  @Get('me/goals')
  async findMyGoals(@Req() request: Request, @Query() filters: FindGoalsDto) {
    const profile = await this.requireProfile(request);
    return this.financeService.findGoals(profile.id, filters);
  }

  @Post('me/goals')
  async createMyGoal(@Req() request: Request, @Body() data: CreateGoalDto) {
    const profile = await this.requireProfile(request);
    return this.financeService.createGoal(profile.id, data);
  }

  @Patch('me/goals/:goalId')
  async updateMyGoal(
    @Req() request: Request,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() data: UpdateGoalDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.updateGoal(profile.id, goalId, data);
  }

  @Delete('me/goals/:goalId')
  async removeMyGoal(
    @Req() request: Request,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.removeGoal(profile.id, goalId);
  }

  // Recurring transactions

  @Get('me/recurring-transactions')
  async findMyRecurringTransactions(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.financeService.findRecurringTransactions(profile.id);
  }

  @Post('me/recurring-transactions')
  async createMyRecurringTransaction(
    @Req() request: Request,
    @Body() data: CreateRecurringTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.createRecurringTransaction(profile.id, data);
  }

  @Patch('me/recurring-transactions/:recurringTransactionId')
  async updateMyRecurringTransaction(
    @Req() request: Request,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
    @Body() data: UpdateRecurringTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.updateRecurringTransaction(
      profile.id,
      recurringTransactionId,
      data,
    );
  }

  @Delete('me/recurring-transactions/:recurringTransactionId')
  async removeMyRecurringTransaction(
    @Req() request: Request,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.removeRecurringTransaction(
      profile.id,
      recurringTransactionId,
    );
  }

  // Assets

  @Get('me/assets')
  async findMyAssets(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.financeService.findAssets(profile.id);
  }

  @Post('me/assets')
  async createMyAsset(@Req() request: Request, @Body() data: CreateAssetDto) {
    const profile = await this.requireProfile(request);
    return this.financeService.createAsset(profile.id, data);
  }

  @Post('me/assets/:assetId/values')
  async addMyAssetValue(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetValueDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.addAssetValue(profile.id, assetId, data);
  }

  @Get('me/assets/:assetId/trades')
  async findMyAssetTrades(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.findAssetTrades(profile.id, assetId);
  }

  @Post('me/assets/:assetId/trades')
  async createMyAssetTrade(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetTradeDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.createAssetTrade(profile.id, assetId, data);
  }

  @Delete('me/assets/:assetId')
  async removeMyAsset(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.financeService.removeAsset(profile.id, assetId);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);

    return this.profileService.ensureAuthProfile(session.user);
  }
}
