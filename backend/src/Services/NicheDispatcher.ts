import type { NicheConfig } from "../types/niche.js";
import { SecondaryFunction } from "../utils/secondaryFunction.js";

const utils = new SecondaryFunction();

export function dispatchProductToNiches(
  product: { title: string; price: number; originalPrice: number | null },
  niches: NicheConfig[]
): NicheConfig[] {
  return niches.filter((niche) => {
    const matchesKeywords = utils.verifyKeyWords(product.title, niche);
    const isBanned = utils.verifyBanWords(product.title, niche);
    const passesLimit = utils.checkLimitedWords(product.title, niche);
    const hasDiscount = utils.verifyDiscount(product.originalPrice, product.price, niche);
    const withinPrice = utils.verifyMaxPrice(product.price, niche);

    return matchesKeywords && !isBanned && passesLimit && hasDiscount && withinPrice;
  });
}

export function getAllNicheKeywords(niches: NicheConfig[]): string[] {
  const all = new Set<string>();
  for (const n of niches) {
    for (const kw of n.keywords) all.add(kw.toLowerCase());
  }
  return [...all];
}

export function getAllNicheBanwords(niches: NicheConfig[]): string[] {
  const all = new Set<string>();
  for (const n of niches) {
    for (const bw of n.banwords) all.add(bw.toLowerCase());
  }
  return [...all];
}
