import { Env } from "../utils/Envirolment.js";

export class LinkParserService {

    amazonTag = Env.AMAZON_TAG;
    shopeeId = Env.SHOPEE_ID;
    awinId = Env.AWIN_PUBLISHER_ID;

    async expandUrl(url: string) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                }
            });

            const location = response.headers.get('location');

            if (location) {
                if (location.startsWith('/')) {
                    const originUrl = new URL(url);
                    return `${originUrl.origin}${location}`;
                }
                return location;
            }

            return url;

        } catch (error: any) {
            console.error("Erro ao expandir URL com fetch:", error.message);
            return url;
        }
    }

    async convertUrl(url: string): Promise<string> {
        try {
            // 1. Força a limpeza de espaços/quebras de linha na string da URL recebida
            let targetUrl = (await this.expandUrl(url)).trim();

            // CASO 1: Links encurtados oficiais da Amazon (amzn.to ou a.co)
            if (targetUrl.includes("amzn.to") || targetUrl.includes("a.co")) {
                return `https://www.amazon.com.br/g/ch/redirect?url=${encodeURIComponent(targetUrl)}&tag=${this.amazonTag}`;
            }

            // CASO 2: Garante a criação segura do objeto de URL
            const urlObj = new URL(targetUrl);
            const hostname = urlObj.hostname.toLowerCase();

            // --- INSTÂNCIA DA KABUM (AWIN) ---
            if (hostname.includes("kabum.com.br")) {
                // Cria uma query limpa isolando os utm antigos de terceiros
                const cleanParams = new URLSearchParams(urlObj.search);
                cleanParams.delete("utm_source");
                cleanParams.delete("utm_medium");
                cleanParams.delete("utm_campaign");

                // Reconstrói a URL crua do produto sem a sujeira antiga
                const searchStr = cleanParams.toString();
                const cleanKabumUrl = `${urlObj.origin}${urlObj.pathname}${searchStr ? '?' + searchStr : ''}`;

                const kabumMerchantId = "22143"; // ID fixo da KaBuM! na Awin

                // Retorna diretamente a conversão estruturada da Awin
                return `https://awin1.com/cread.php?awinmid=${kabumMerchantId}&awinaffid=${this.awinId}&ued=${encodeURIComponent(cleanKabumUrl)}`;
            }

            // --- INSTÂNCIA DA AMAZON ---
            if (hostname.includes("amazon.com")) {
                urlObj.searchParams.set("tag", this.amazonTag);
                return urlObj.toString();
            }

            // --- INSTÂNCIA DA SHOPEE ---
            if (hostname.includes("shopee.com")) {
                urlObj.searchParams.set("shopId", this.shopeeId);
                return urlObj.toString();
            }

            return targetUrl;

        } catch (error) {
            console.error("Erro ao converter URL:", error);
            return url;
        }
    }

    // Melhora a Regex para capturar URLs isolando pontuações e quebras de linha comuns do Telegram
    extractUrls(text: string): string[] {
        const urlRegex = /(https?:\/\/[^\s\n\r]+)/g;
        const matches = text.match(urlRegex) || [];
        return matches.map(url => url.trim());
    }
}