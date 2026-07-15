import type { Page } from "playwright";
import type { NicheConfig } from "../types/niche.js";


export class SecondaryFunction {
    verifyKeyWords(text: string, niche?: NicheConfig): boolean {
        const textLower = text.toLowerCase();
        const kw = niche?.keywords ?? [];
        return kw.some(keyword => textLower.includes(keyword.toLowerCase()));
    }
    verifyBanWords(text: string, niche?: NicheConfig): boolean {
        const textLower = text.toLowerCase();
        const bw = niche?.banwords ?? [];
        return bw.some(banword => textLower.includes(banword.toLowerCase()));
    }
    checkLimitedWords(text: string, niche?: NicheConfig): boolean {
        const textLower = text.toLowerCase();
        const lw = niche?.limitedWords;

        if (!lw || lw.length === 0) return true;

        const limitedWord = lw.find(w => textLower.includes(w.toLowerCase()))

        if (!limitedWord) return true

        if (wordsAlreadyUsed.has(limitedWord)) return false

        wordsAlreadyUsed.add(limitedWord)

        return true
    }
    resetWordsAlreadyUsed() {
        wordsAlreadyUsed.clear()
    }
    verifyDiscount(originalPrice: number | null, currentPrice: number, niche?: NicheConfig): boolean {
        if (!originalPrice || originalPrice <= currentPrice) return false;

        const percentualDesconto = ((originalPrice - currentPrice) / originalPrice) * 100;
        const minDisc = niche?.minDiscount ?? 0;
        return percentualDesconto >= minDisc;
    }
    GetDiscount(originalPrice: number, currentPrice: number): String {
        const percentualDesconto = ((originalPrice - currentPrice) / originalPrice) * 100;
        return `${percentualDesconto.toFixed(0)}% OFF`;
    }
    verifyMaxPrice(price: number, niche?: NicheConfig): boolean {
        const maxP = niche?.maxPrice ?? Infinity;
        return price <= maxP;
    }
    gerarBlocoPichau(paginaInicial: number, paginaFinal: number): string[] {
        const urlsBloco: string[] = [];
        for (let p = paginaInicial; p <= paginaFinal; p++) {
            if (p === 1) {
                urlsBloco.push("https://lista.mercadolivre.com.br/loja/pichau/_Discount_20-100_NoIndex_True?tracking_id=c6ca5d7a297815906f045e8ab1fde59c");
            } else {
                // Formula exata para gerar 49, 97, 145...
                const offset = ((p - 1) * 48) + 1;
                urlsBloco.push(`https://lista.mercadolivre.com.br/loja/pichau/_Desde_${offset}_Discount_20-100_NoIndex_True?tracking_id=c6ca5d7a297815906f045e8ab1fde59c`);
            }
        }
        return urlsBloco;
    }
    async getMaxPagesPichau(page: Page): Promise<number> {
        try {
            // Seleciona todos os links numéricos da paginação
            const linksPaginas = await page.$$('.andes-pagination__button a.andes-pagination__link');
            let maxPagina = 1;

            for (const link of linksPaginas) {
                const texto = await link.innerText();
                const numero = parseInt(texto.trim(), 10);
                if (!isNaN(numero) && numero > maxPagina) {
                    maxPagina = numero;
                }
            }
            return maxPagina; // No seu HTML de exemplo, retornará 10
        } catch {
            return 1; // Fallback seguro se o seletor mudar
        }
    }

}

let wordsAlreadyUsed = new Set<string>()
