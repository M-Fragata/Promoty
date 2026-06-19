export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function calculateDiscount(originalPrice: number | null, currentPrice: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function formatDiscount(originalPrice: number | null, currentPrice: number): string {
  const discount = calculateDiscount(originalPrice, currentPrice);
  return discount > 0 ? `${discount}% OFF` : '';
}

export function getDiscountColor(discount: number): string {
  if (discount >= 50) return 'bg-red-600 text-white';
  if (discount >= 30) return 'bg-brand-color text-white';
  if (discount >= 15) return 'bg-amber-500 text-white';
  return 'bg-gray-500 text-white';
}