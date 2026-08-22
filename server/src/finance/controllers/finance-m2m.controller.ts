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

@Controller('finance-m2m')
export class FinanceM2mController {
  constructor(private readonly financeService: FinanceService) {}

  // Accounts

  @Get(':profileId/accounts')
  findAccounts(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.financeService.findAccounts(profileId);
  }

  @Post(':profileId/accounts')
  createAccount(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateAccountDto,
  ) {
    return this.financeService.createAccount(profileId, data);
  }

  // Transactions

  @Post(':profileId/transactions')
  createTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateTransactionDto,
  ) {
    return this.financeService.createTransaction(profileId, data);
  }

  @Get(':profileId/transactions')
  findTransactions(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() filters: FindTransactionsDto,
  ) {
    return this.financeService.findTransactions(profileId, filters);
  }

  @Patch(':profileId/transactions/:transactionId')
  updateTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() data: UpdateTransactionDto,
  ) {
    return this.financeService.updateTransaction(
      profileId,
      transactionId,
      data,
    );
  }

  @Delete(':profileId/transactions/:transactionId')
  removeTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.financeService.removeTransaction(profileId, transactionId);
  }

  // Categories

  @Get(':profileId/categories')
  findCategories(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.financeService.findCategories(profileId);
  }

  @Post(':profileId/categories')
  createCategory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateCategoryDto,
  ) {
    return this.financeService.createCategory(profileId, data);
  }

  @Patch(':profileId/categories/:categoryId')
  updateCategory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.financeService.updateCategory(profileId, categoryId, data);
  }

  @Delete(':profileId/categories/:categoryId')
  removeCategory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.financeService.removeCategory(profileId, categoryId);
  }

  // Rules

  @Get(':profileId/rules')
  findRules(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.financeService.findRules(profileId);
  }

  @Post(':profileId/rules')
  createRule(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateRuleDto,
  ) {
    return this.financeService.createRule(profileId, data);
  }

  @Patch(':profileId/rules/:ruleId')
  updateRule(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() data: UpdateRuleDto,
  ) {
    return this.financeService.updateRule(profileId, ruleId, data);
  }

  @Delete(':profileId/rules/:ruleId')
  removeRule(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ) {
    return this.financeService.removeRule(profileId, ruleId);
  }

  // Goals

  @Get(':profileId/goals')
  findGoals(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() filters: FindGoalsDto,
  ) {
    return this.financeService.findGoals(profileId, filters);
  }

  @Post(':profileId/goals')
  createGoal(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateGoalDto,
  ) {
    return this.financeService.createGoal(profileId, data);
  }

  @Patch(':profileId/goals/:goalId')
  updateGoal(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() data: UpdateGoalDto,
  ) {
    return this.financeService.updateGoal(profileId, goalId, data);
  }

  @Delete(':profileId/goals/:goalId')
  removeGoal(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.financeService.removeGoal(profileId, goalId);
  }

  // Recurring transactions

  @Get(':profileId/recurring-transactions')
  findRecurringTransactions(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.financeService.findRecurringTransactions(profileId);
  }

  @Post(':profileId/recurring-transactions')
  createRecurringTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateRecurringTransactionDto,
  ) {
    return this.financeService.createRecurringTransaction(profileId, data);
  }

  @Patch(':profileId/recurring-transactions/:recurringTransactionId')
  updateRecurringTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
    @Body() data: UpdateRecurringTransactionDto,
  ) {
    return this.financeService.updateRecurringTransaction(
      profileId,
      recurringTransactionId,
      data,
    );
  }

  @Delete(':profileId/recurring-transactions/:recurringTransactionId')
  removeRecurringTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
  ) {
    return this.financeService.removeRecurringTransaction(
      profileId,
      recurringTransactionId,
    );
  }

  // Assets

  @Get(':profileId/assets')
  findAssets(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.financeService.findAssets(profileId);
  }

  @Post(':profileId/assets')
  createAsset(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateAssetDto,
  ) {
    return this.financeService.createAsset(profileId, data);
  }

  @Post(':profileId/assets/:assetId/values')
  addAssetValue(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetValueDto,
  ) {
    return this.financeService.addAssetValue(profileId, assetId, data);
  }

  @Get(':profileId/assets/:assetId/trades')
  findAssetTrades(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.financeService.findAssetTrades(profileId, assetId);
  }

  @Post(':profileId/assets/:assetId/trades')
  createAssetTrade(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetTradeDto,
  ) {
    return this.financeService.createAssetTrade(profileId, assetId, data);
  }

  @Delete(':profileId/assets/:assetId')
  removeAsset(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.financeService.removeAsset(profileId, assetId);
  }
}
