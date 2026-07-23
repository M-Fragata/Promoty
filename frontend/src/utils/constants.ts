export const STORE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'Mercado Livre': {
    label: 'Mercado Livre',
    color: 'bg-[#F7E000] text-[#2C3E79]',
    icon: '',
  },
  'Amazon': {
    label: 'Amazon',
    color: 'bg-[#F75F01] text-[#06070C]',
    icon: '',
  },
  'Shopee': {
    label: 'Shopee',
    color: 'bg-[#E74B2C] text-[#F7F7F7]',
    icon: '',
  },
  'C&A': {
    label: 'C&A',
    color: 'bg-[#F7F7F7] text-[#1F398D]',
    icon: '',
  },
  'Dafiti': {
    label: 'Dafiti',
    color: 'bg-[#F7F7F7] text-[#0D0D0D]',
    icon: '',
  },
    'Riachuelo': {
    label: 'Riachuelo',
    color: 'bg-[#0C2D2C] text-[#D0C9B3]',
    icon: '',
  },
    'Kabum': {
    label: 'Kabum',
    color: 'bg-[#F6611B] text-[#005BB2]',
    icon: '',
  },
};

export function getStoreInfo(store: string) {
  return STORE_LABELS[store] || {
    label: store,
    color: 'bg-gray-500 text-white',
    icon: '',
  };
}

export const STORES = Object.keys(STORE_LABELS);

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

export interface WhatsAppGroup {
  name: string;
  url: string;
}

export const WHATSAPP_GROUPS: WhatsAppGroup[] = [
  {
    name: 'Fragata | Gamers',
    url: import.meta.env.VITE_WHATSAPP_GROUP_GAMERS || '#',
  },
  {
    name: 'Fragata | Estilo & Lar',
    url: import.meta.env.VITE_WHATSAPP_GROUP_ESTILO || '#',
  },
].filter((g) => g.url !== '#');