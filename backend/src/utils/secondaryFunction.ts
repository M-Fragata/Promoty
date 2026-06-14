import type { Page } from "playwright";
import type { NicheConfig } from "../types/niche.js";


export class SecondaryFunction {
    verifyKeyWords(text: string, niche?: NicheConfig): boolean {
        const textLower = text.toLowerCase();
        const kw = niche?.keywords ?? keywords;
        return kw.some(keyword => textLower.includes(keyword.toLowerCase()));
    }
    verifyBanWords(text: string, niche?: NicheConfig): boolean {
        const textLower = text.toLowerCase();
        const bw = niche?.banwords ?? banwords;
        return bw.some(banword => textLower.includes(banword.toLowerCase()));
    }
    checkLimitedWords(text: string, niche?: NicheConfig): boolean {
        const textLower = text.toLowerCase();
        const lw = niche?.limitedWords ?? limitedWords;

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
        const minDisc = niche?.minDiscount ?? descountMin;
        return percentualDesconto >= minDisc;
    }
    GetDiscount(originalPrice: number, currentPrice: number): String {
        const percentualDesconto = ((originalPrice - currentPrice) / originalPrice) * 100;
        return `${percentualDesconto.toFixed(0)}% OFF`;
    }
    verifyMaxPrice(price: number, niche?: NicheConfig): boolean {
        const maxP = niche?.maxPrice ?? maxPrice;
        return price <= maxP;
    }
    
    matchesAnyNiche(title: string, niches: NicheConfig[]): boolean {
        return niches.some(niche =>
            this.verifyKeyWords(title, niche) &&
            !this.verifyBanWords(title, niche)
        );
    }
    verifyOriginalPrice(priceWithDescount: number, descountPercentage: string): number {

        // 1. Limpa a string tirando símbolos e converte para número inteiro positivo
        const discountNumber = parseInt(descountPercentage.replace(/[^0-9]/g, ''), 10);

        // 2. Valida se o número é válido ou zerado (evita NaN e divisões por zero)
        if (isNaN(discountNumber) || discountNumber <= 0 || discountNumber >= 100) {
            return priceWithDescount;
        }

        // 3. 🔥 CORREÇÃO: Usa a variável limpa 'discountNumber' em vez da string original
        const descount = 1 - (discountNumber / 100);

        // 4. Retorna o preço original (arredondado para duas casas decimais para evitar dízimas do JS)
        return parseFloat((priceWithDescount / descount).toFixed(2));
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

// Váriaveis globais
const keywords: string[] = ["notebook", "celular", "smartphone", "monitor", "placa de vídeo", "ssd", "hd", "fone", "headset", "teclado", "mouse", "webcam", "caixa de som bluetooth", "smartwatch", "tablet", "processador", "memória ram", "gabinete gamer", "cooler", "fonte para pc", "impressora", "roteador", "tv", "videogame", "console", "jogo de videogame", "cadeira gamer", "cadeira ergonomica", "cadeira de escritório", "mesa gamer", "power bank", "cabo usb", "carregador portátil", "suporte para notebook", "microfone", "webcam", "filtro de linha", "no-break", "pen drive", "cartão de memória", "nvme", "water cooler"]
const banwords: string[] = ["capa", "capinha", "pés", "ipad", "mulher", "feminino", "cabo smartwatch", "ferramenta", "tela para", "pelicula", "película", "filament", "filamento", "ring light", "corda", "cordão", "cordao", "limpador", "removedor","remoção", "extração","case", "suporte de celular", "suporte celular", "fashion", "suporte tablet", "infantil", "rato", "bebedouros", "bebedouro", "conversor", "lapela", "ddr2", "ddr3", "suporte gpu"] // Implementar palavras indesejáveis
const limitedWords: string[] = ["Carregador", "smartwatch", "power bank"]
const descountMin: number = 35
const maxPrice: number = 4500

let wordsAlreadyUsed = new Set<string>()