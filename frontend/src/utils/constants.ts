export const STORE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'Mercado Livre': {
    label: 'Mercado Livre',
    color: 'bg-yellow-500 text-white',
    icon: '',
  },
  'Amazon': {
    label: 'Amazon',
    color: 'bg-orange-500 text-white',
    icon: '',
  },
  'Shopee': {
    label: 'Shopee',
    color: 'bg-pink-500 text-white',
    icon: '',
  },
};

export function getStoreInfo(store: string) {
  return STORE_LABELS[store] || {
    label: store,
    color: 'bg-gray-500 text-white',
    icon: '🏪',
  };
}

export const CATEGORIES = [
  'Todos',
  'Eletrônicos',
  'Casa',
  'Moda',
  'Beleza',
] as const;

export type CategoryOption = (typeof CATEGORIES)[number];

export const SORT_OPTIONS = [
  { value: 'discount', label: 'Maior desconto' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'newest', label: 'Mais recentes' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];