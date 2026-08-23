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
import { CreateRecurringTransactionDto } from '../dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from '../dto/update-recurring-transaction.dto';
import { RecurringTransactionsService } from '../services/recurring-transactions.service';

@Controller('finance/me/recurring-transactions')
export class RecurringTransactionsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly recurringTransactionsService: RecurringTransactionsService,
  ) {}

  @Get()
  async findMyRecurringTransactions(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.recurringTransactionsService.findRecurringTransactions(
      profile.id,
    );
  }

  @Post()
  async createMyRecurringTransaction(
    @Req() request: Request,
    @Body() data: CreateRecurringTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.recurringTransactionsService.createRecurringTransaction(
      profile.id,
      data,
    );
  }

  @Patch(':recurringTransactionId')
  async updateMyRecurringTransaction(
    @Req() request: Request,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
    @Body() data: UpdateRecurringTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.recurringTransactionsService.updateRecurringTransaction(
      profile.id,
      recurringTransactionId,
      data,
    );
  }

  @Delete(':recurringTransactionId')
  async removeMyRecurringTransaction(
    @Req() request: Request,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.recurringTransactionsService.removeRecurringTransaction(
      profile.id,
      recurringTransactionId,
    );
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
