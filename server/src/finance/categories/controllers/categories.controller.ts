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
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesService } from '../services/categories.service';

@Controller('finance/me/categories')
export class CategoriesController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  async findMyCategories(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    return this.categoriesService.findCategories(profile.id);
  }

  @Post()
  async createMyCategory(
    @Req() request: Request,
    @Body() data: CreateCategoryDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.categoriesService.createCategory(profile.id, data);
  }

  @Patch(':categoryId')
  async updateMyCategory(
    @Req() request: Request,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() data: UpdateCategoryDto,
  ) {
    const profile = await this.requireProfile(request);
    return this.categoriesService.updateCategory(profile.id, categoryId, data);
  }

  @Delete(':categoryId')
  async removeMyCategory(
    @Req() request: Request,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    const profile = await this.requireProfile(request);
    return this.categoriesService.removeCategory(profile.id, categoryId);
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);
    return this.profileService.ensureAuthProfile(session.user);
  }
}
