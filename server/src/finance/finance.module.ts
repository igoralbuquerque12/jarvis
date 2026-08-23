import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';

import { AccountsM2mController } from './accounts/controllers/accounts-m2m.controller';
import { AccountsController } from './accounts/controllers/accounts.controller';
import { AccountsService } from './accounts/services/accounts.service';

import { AssetsM2mController } from './assets/controllers/assets-m2m.controller';
import { AssetsController } from './assets/controllers/assets.controller';
import { AssetsService } from './assets/services/assets.service';

import { CategoriesM2mController } from './categories/controllers/categories-m2m.controller';
import { CategoriesController } from './categories/controllers/categories.controller';
import { CategoriesService } from './categories/services/categories.service';

import { GoalsM2mController } from './goals/controllers/goals-m2m.controller';
import { GoalsController } from './goals/controllers/goals.controller';
import { GoalsService } from './goals/services/goals.service';

import { RecurringTransactionsM2mController } from './recurring-transactions/controllers/recurring-transactions-m2m.controller';
import { RecurringTransactionsController } from './recurring-transactions/controllers/recurring-transactions.controller';
import { RecurringTransactionsService } from './recurring-transactions/services/recurring-transactions.service';

import { RulesM2mController } from './rules/controllers/rules-m2m.controller';
import { RulesController } from './rules/controllers/rules.controller';
import { RulesService } from './rules/services/rules.service';

import { TransactionsM2mController } from './transactions/controllers/transactions-m2m.controller';
import { TransactionsController } from './transactions/controllers/transactions.controller';
import { TransactionsService } from './transactions/services/transactions.service';

import { SecuroApiService } from './core/services/securo-api.service';
import { SecuroContextService } from './core/services/securo-context.service';
import { SecuroProvisioningService } from './core/services/securo-provisioning.service';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => ProfileModule)],
  controllers: [
    AccountsController,
    AccountsM2mController,
    TransactionsController,
    TransactionsM2mController,
    CategoriesController,
    CategoriesM2mController,
    RulesController,
    RulesM2mController,
    GoalsController,
    GoalsM2mController,
    RecurringTransactionsController,
    RecurringTransactionsM2mController,
    AssetsController,
    AssetsM2mController,
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
