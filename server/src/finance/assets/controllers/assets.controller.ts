import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../../auth/services/better-auth.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreateAssetTradeDto } from '../dto/create-asset-trade.dto';
import { CreateAssetValueDto } from '../dto/create-asset-value.dto';
import { AssetsService } from '../services/assets.service';

@Controller('finance/me/assets')
export class AssetsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly assetsService: AssetsService,
  ) {}

  @Get()
  async findMyAssets(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.assetsService.findAssets(profile.id);
  }

  @Post()
  async createMyAsset(@Req() request: Request, @Body() data: CreateAssetDto) {
    const profile = await this.requireProfile(request);
    return this.assetsService.createAsset(profile.id, data);
  }

  @Post(':assetId/values')
  async addMyAssetValue(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetValueDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.assetsService.addAssetValue(profile.id, assetId, data);
  }

  @Get(':assetId/trades')
  async findMyAssetTrades(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.assetsService.findAssetTrades(profile.id, assetId);
  }

  @Post(':assetId/trades')
  async createMyAssetTrade(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetTradeDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.assetsService.createAssetTrade(profile.id, assetId, data);
  }

  @Delete(':assetId')
  async removeMyAsset(
    @Req() request: Request,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.assetsService.removeAsset(profile.id, assetId);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
