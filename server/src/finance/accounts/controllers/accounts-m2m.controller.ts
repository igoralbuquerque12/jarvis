import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountsService } from '../services/accounts.service';

@Controller('finance-m2m')
export class AccountsM2mController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':profileId/accounts')
  findAccounts(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.accountsService.findAccounts(profileId);
  }

  @Post(':profileId/accounts')
  createAccount(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateAccountDto,
  ) {
    return this.accountsService.createAccount(profileId, data);
  }
}
