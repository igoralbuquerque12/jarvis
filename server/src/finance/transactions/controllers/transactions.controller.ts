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
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { FindTransactionsDto } from '../dto/find-transactions.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionsService } from '../services/transactions.service';

@Controller('finance/me/transactions')
export class TransactionsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  async createMyTransaction(
    @Req() request: Request,
    @Body() data: CreateTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.transactionsService.createTransaction(profile.id, data);
  }

  @Get()
  async findMyTransactions(
    @Req() request: Request,
    @Query() filters: FindTransactionsDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.transactionsService.findTransactions(profile.id, filters);
  }

  @Patch(':transactionId')
  async updateMyTransaction(
    @Req() request: Request,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() data: UpdateTransactionDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.transactionsService.updateTransaction(
      profile.id,
      transactionId,
      data,
    );
  }

  @Delete(':transactionId')
  async removeMyTransaction(
    @Req() request: Request,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.transactionsService.removeTransaction(
      profile.id,
      transactionId,
    );
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
