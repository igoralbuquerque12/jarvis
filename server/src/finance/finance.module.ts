import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';

import { FinanceM2mController } from './controllers/finance-m2m.controller';

import { AccountsController } from './accounts/controllers/accounts.controller';
import { AccountsService } from './accounts/services/accounts.service';

import { AssetsController } from './assets/controllers/assets.controller';
import { AssetsService } from './assets/services/assets.service';

import { CategoriesController } from './categories/controllers/categories.controller';
import { CategoriesService } from './categories/services/categories.service';

import { GoalsController } from './goals/controllers/goals.controller';
import { GoalsService } from './goals/services/goals.service';

import { RecurringTransactionsController } from './recurring-transactions/controllers/recurring-transactions.controller';
import { RecurringTransactionsService } from './recurring-transactions/services/recurring-transactions.service';

import { RulesController } from './rules/controllers/rules.controller';
import { RulesService } from './rules/services/rules.service';

import { TransactionsController } from './transactions/controllers/transactions.controller';
import { TransactionsService } from './transactions/services/transactions.service';

import { SecuroApiService } from './core/services/securo-api.service';
import { SecuroContextService } from './core/services/securo-context.service';
import { SecuroProvisioningService } from './core/services/securo-provisioning.service';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => ProfileModule)],
  controllers: [
    FinanceM2mController,
    AccountsController,
    TransactionsController,
    CategoriesController,
    RulesController,
    GoalsController,
    RecurringTransactionsController,
    AssetsController,
  ],
  providers: [
    SecuroApiService,
    SecuroContextService,
    SecuroProvisioningService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    RulesService,
    GoalsService,
    RecurringTransactionsService,
    AssetsService,
  ],
  exports: [
    SecuroProvisioningService,
    SecuroApiService,
    SecuroContextService,
    AccountsService,
    TransactionsService,
    CategoriesService,
    RulesService,
    GoalsService,
    RecurringTransactionsService,
    AssetsService,
  ],
})
export class FinanceModule {}
