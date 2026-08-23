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
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { FindTransactionsDto } from '../dto/find-transactions.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { TransactionsService } from '../services/transactions.service';

@Controller('finance-m2m')
export class TransactionsM2mController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post(':profileId/transactions')
  createTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(profileId, data);
  }

  @Get(':profileId/transactions')
  findTransactions(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Query() filters: FindTransactionsDto,
  ) {
    return this.transactionsService.findTransactions(profileId, filters);
  }

  @Patch(':profileId/transactions/:transactionId')
  updateTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() data: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(
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
    return this.transactionsService.removeTransaction(profileId, transactionId);
  }
}
