import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AssistantToolGuard } from '../../assistant/guards/assistant-tool.guard';
import { ExecuteOperationDto } from '../../core/dto/execute-operation.dto';

import { AccountsService } from '../accounts/services/accounts.service';
import { AssetsService } from '../assets/services/assets.service';
import { CategoriesService } from '../categories/services/categories.service';
import { GoalsService } from '../goals/services/goals.service';
import { RecurringTransactionsService } from '../recurring-transactions/services/recurring-transactions.service';
import { RulesService } from '../rules/services/rules.service';
import { TransactionsService } from '../transactions/services/transactions.service';

import { CreateAccountDto } from '../accounts/dto/create-account.dto';
import { CreateAssetDto } from '../assets/dto/create-asset.dto';
import { CreateAssetTradeDto } from '../assets/dto/create-asset-trade.dto';
import { CreateAssetValueDto } from '../assets/dto/create-asset-value.dto';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreateGoalDto } from '../goals/dto/create-goal.dto';
import { FindGoalsDto } from '../goals/dto/find-goals.dto';
import { UpdateGoalDto } from '../goals/dto/update-goal.dto';
import { CreateRecurringTransactionDto } from '../recurring-transactions/dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from '../recurring-transactions/dto/update-recurring-transaction.dto';
import { CreateRuleDto } from '../rules/dto/create-rule.dto';
import { UpdateRuleDto } from '../rules/dto/update-rule.dto';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { FindTransactionsDto } from '../transactions/dto/find-transactions.dto';
import { UpdateTransactionDto } from '../transactions/dto/update-transaction.dto';

import { validateDto } from '../../core/utils/validate-dto.util';

@UseGuards(AssistantToolGuard)
@Controller('finance-m2m')
export class FinanceM2mController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly assetsService: AssetsService,
    private readonly categoriesService: CategoriesService,
    private readonly goalsService: GoalsService,
    private readonly recurringTransactionsService: RecurringTransactionsService,
    private readonly rulesService: RulesService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post(':profileId/execute')
  async execute(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: ExecuteOperationDto,
  ) {
    const { operation, data = {} } = body;

    switch (operation) {
      // Accounts
      case 'list_accounts':
        return this.accountsService.findAccounts(profileId);
      case 'create_account': {
        const dto = await validateDto(CreateAccountDto, data);
        return this.accountsService.createAccount(profileId, dto);
      }

      // Transactions
      case 'list_transactions': {
        const dto = await validateDto(FindTransactionsDto, data);
        return this.transactionsService.findTransactions(profileId, dto);
      }
      case 'create_transaction': {
        const dto = await validateDto(CreateTransactionDto, data);
        return this.transactionsService.createTransaction(profileId, dto);
      }
      case 'update_transaction': {
        const { transactionId, ...rest } = data;
        const dto = await validateDto(UpdateTransactionDto, rest);
        return this.transactionsService.updateTransaction(
          profileId,
          transactionId as string,
          dto,
        );
      }
      case 'delete_transaction': {
        return this.transactionsService.removeTransaction(
          profileId,
          data.transactionId as string,
        );
      }

      // Categories
      case 'list_categories':
        return this.categoriesService.findCategories(profileId);
      case 'create_category': {
        const dto = await validateDto(CreateCategoryDto, data);
        return this.categoriesService.createCategory(profileId, dto);
      }
      case 'update_category': {
        const { categoryId, ...rest } = data;
        const dto = await validateDto(UpdateCategoryDto, rest);
        return this.categoriesService.updateCategory(
          profileId,
          categoryId as string,
          dto,
        );
      }
      case 'delete_category': {
        return this.categoriesService.removeCategory(
          profileId,
          data.categoryId as string,
        );
      }

      // Rules
      case 'list_rules':
        return this.rulesService.findRules(profileId);
      case 'create_rule': {
        const dto = await validateDto(CreateRuleDto, data);
        return this.rulesService.createRule(profileId, dto);
      }
      case 'update_rule': {
        const { ruleId, ...rest } = data;
        const dto = await validateDto(UpdateRuleDto, rest);
        return this.rulesService.updateRule(profileId, ruleId as string, dto);
      }
      case 'delete_rule': {
        return this.rulesService.removeRule(profileId, data.ruleId as string);
      }

      // Goals
      case 'list_goals': {
        const dto = await validateDto(FindGoalsDto, data);
        return this.goalsService.findGoals(profileId, dto);
      }
      case 'create_goal': {
        const dto = await validateDto(CreateGoalDto, data);
        return this.goalsService.createGoal(profileId, dto);
      }
      case 'update_goal': {
        const { goalId, ...rest } = data;
        const dto = await validateDto(UpdateGoalDto, rest);
        return this.goalsService.updateGoal(profileId, goalId as string, dto);
      }
      case 'delete_goal': {
        return this.goalsService.removeGoal(profileId, data.goalId as string);
      }

      // Recurring Transactions
      case 'list_recurring_transactions':
        return this.recurringTransactionsService.findRecurringTransactions(
          profileId,
        );
      case 'create_recurring_transaction': {
        const dto = await validateDto(CreateRecurringTransactionDto, data);
        return this.recurringTransactionsService.createRecurringTransaction(
          profileId,
          dto,
        );
      }
      case 'update_recurring_transaction': {
        const { recurringTransactionId, ...rest } = data;
        const dto = await validateDto(UpdateRecurringTransactionDto, rest);
        return this.recurringTransactionsService.updateRecurringTransaction(
          profileId,
          recurringTransactionId as string,
          dto,
        );
      }
      case 'delete_recurring_transaction': {
        return this.recurringTransactionsService.removeRecurringTransaction(
          profileId,
          data.recurringTransactionId as string,
        );
      }

      // Assets
      case 'list_assets':
        return this.assetsService.findAssets(profileId);
      case 'create_asset': {
        const dto = await validateDto(CreateAssetDto, data);
        return this.assetsService.createAsset(profileId, dto);
      }
      case 'add_asset_value': {
        const { assetId, ...rest } = data;
        const dto = await validateDto(CreateAssetValueDto, rest);
        return this.assetsService.addAssetValue(
          profileId,
          assetId as string,
          dto,
        );
      }
      case 'list_asset_trades': {
        return this.assetsService.findAssetTrades(
          profileId,
          data.assetId as string,
        );
      }
      case 'record_asset_trade': {
        const { assetId, ...rest } = data;
        const dto = await validateDto(CreateAssetTradeDto, rest);
        return this.assetsService.createAssetTrade(
          profileId,
          assetId as string,
          dto,
        );
      }
      case 'delete_asset': {
        return this.assetsService.removeAsset(
          profileId,
          data.assetId as string,
        );
      }

      default:
        throw new BadRequestException('Operação não suportada');
    }
  }
}
