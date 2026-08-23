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
import { CreateRecurringTransactionDto } from '../dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from '../dto/update-recurring-transaction.dto';
import { RecurringTransactionsService } from '../services/recurring-transactions.service';

@Controller('finance-m2m')
export class RecurringTransactionsM2mController {
  constructor(
    private readonly recurringTransactionsService: RecurringTransactionsService,
  ) {}

  @Get(':profileId/recurring-transactions')
  findRecurringTransactions(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.recurringTransactionsService.findRecurringTransactions(
      profileId,
    );
  }

  @Post(':profileId/recurring-transactions')
  createRecurringTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateRecurringTransactionDto,
  ) {
    return this.recurringTransactionsService.createRecurringTransaction(
      profileId,
      data,
    );
  }

  @Patch(':profileId/recurring-transactions/:recurringTransactionId')
  updateRecurringTransaction(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('recurringTransactionId', ParseUUIDPipe)
    recurringTransactionId: string,
    @Body() data: UpdateRecurringTransactionDto,
  ) {
    return this.recurringTransactionsService.updateRecurringTransaction(
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
    return this.recurringTransactionsService.removeRecurringTransaction(
      profileId,
      recurringTransactionId,
    );
  }
}
