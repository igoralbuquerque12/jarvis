import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreateAssetTradeDto } from '../dto/create-asset-trade.dto';
import { CreateAssetValueDto } from '../dto/create-asset-value.dto';
import { AssetsService } from '../services/assets.service';

@Controller('finance-m2m')
export class AssetsM2mController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':profileId/assets')
  findAssets(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.assetsService.findAssets(profileId);
  }

  @Post(':profileId/assets')
  createAsset(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateAssetDto,
  ) {
    return this.assetsService.createAsset(profileId, data);
  }

  @Post(':profileId/assets/:assetId/values')
  addAssetValue(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetValueDto,
  ) {
    return this.assetsService.addAssetValue(profileId, assetId, data);
  }

  @Get(':profileId/assets/:assetId/trades')
  findAssetTrades(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.assetsService.findAssetTrades(profileId, assetId);
  }

  @Post(':profileId/assets/:assetId/trades')
  createAssetTrade(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() data: CreateAssetTradeDto,
  ) {
    return this.assetsService.createAssetTrade(profileId, assetId, data);
  }

  @Delete(':profileId/assets/:assetId')
  removeAsset(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.assetsService.removeAsset(profileId, assetId);
  }
}
