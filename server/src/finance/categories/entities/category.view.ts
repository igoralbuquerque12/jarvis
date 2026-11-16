import { optional } from '../../core/utils/securo-value.util';

/** `CategoryRead` as returned by Securo's `/api/categories`. */
export interface SecuroCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  is_system: boolean;
}

export interface CategoryView {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export function toCategoryView(category: SecuroCategory): CategoryView {
  return {
    id: category.id,
    name: category.name,
    icon: optional(category.icon),
    color: optional(category.color),
    isDefault: category.is_system,
  };
}
