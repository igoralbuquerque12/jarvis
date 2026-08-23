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
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesService } from '../services/categories.service';

@Controller('finance-m2m')
export class CategoriesM2mController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get(':profileId/categories')
  findCategories(@Param('profileId', ParseUUIDPipe) profileId: string) {
    return this.categoriesService.findCategories(profileId);
  }

  @Post(':profileId/categories')
  createCategory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() data: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(profileId, data);
  }

  @Patch(':profileId/categories/:categoryId')
  updateCategory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(profileId, categoryId, data);
  }

  @Delete(':profileId/categories/:categoryId')
  removeCategory(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.removeCategory(profileId, categoryId);
  }
}
