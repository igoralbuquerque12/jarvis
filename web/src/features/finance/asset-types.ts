export const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Ação',
  crypto: 'Cripto',
  real_estate: 'Imóvel',
  fixed_income: 'Renda fixa',
  other: 'Outro',
};

export const ASSET_TYPE_OPTIONS = Object.entries(ASSET_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
