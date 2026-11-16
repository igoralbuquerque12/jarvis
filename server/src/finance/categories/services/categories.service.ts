import { Injectable } from '@nestjs/common';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { SecuroCategory } from '../entities/category.view';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) {}

  async findCategories(profileId: string) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request<SecuroCategory[]>({
      method: 'GET',
      path: '/api/categories',
      ...this.securoContext.auth(context),
    });
  }

  async createCategory(profileId: string, data: CreateCategoryDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request<SecuroCategory>({
      method: 'POST',
      path: '/api/categories',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    });
  }

  async updateCategory(
    profileId: string,
    categoryId: string,
    data: UpdateCategoryDto,
  ) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request<SecuroCategory>({
      method: 'PATCH',
      path: `/api/categories/${categoryId}`,
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    });
  }

  async removeCategory(profileId: string, categoryId: string) {
    const context = await this.securoContext.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/categories/${categoryId}`,
      ...this.securoContext.auth(context),
    });

    return { deleted: true, categoryId };
  }
}
