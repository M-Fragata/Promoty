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
            // 1. Primeiro expande a URL para o caso de ser um encurtador (ex: tidd.ly ou amzn.to)
            let targetUrl = await this.expandUrl(url);

            // CASO 1: Links encurtados oficiais da Amazon (amzn.to ou a.co)
            if (targetUrl.includes("amzn.to") || targetUrl.includes("a.co")) {
                const cleanUrl = targetUrl.trim();
                return `https://www.amazon.com.br/g/ch/redirect?url=${encodeURIComponent(cleanUrl)}&tag=${this.amazonTag}`;
            }

            // CASO 2: Links já expandidos ou links longos diretos
            const urlObj = new URL(targetUrl);

            // --- INSTÂNCIA DA KABUM (AWIN) ---
            if (urlObj.hostname.includes("kabum.com.br")) {
                // Remove parâmetros antigos de rastreamento do Telegram alheio
                urlObj.searchParams.delete("utm_source");
                urlObj.searchParams.delete("utm_medium");
                urlObj.searchParams.delete("utm_campaign");
                const cleanKabumUrl = urlObj.toString();

                // Mude para 'true' assim que a KaBuM! aprovar o "Pendente" no painel da Awin!
                const kabumAprovado = false;

                if (kabumAprovado) {
                    const kabumMerchantId = "22143";   // ID fixo da KaBuM! na Awin

                    // CORREÇÃO AQUI: Adicionado o "this." para acessar a propriedade da classe
                    return `https://awin1.com/cread.php?awinmid=${kabumMerchantId}&awinaffid=${this.awinId}&ued=${encodeURIComponent(cleanKabumUrl)}`;
                }

                // Enquanto estiver pendente, envia o link limpo original para o grupo rodar os testes
                return cleanKabumUrl;
            }

            // --- INSTÂNCIA DA AMAZON ---
            if (urlObj.hostname.includes("amazon.com")) {
                urlObj.searchParams.set("tag", this.amazonTag);
                return urlObj.toString();
            }

            // --- INSTÂNCIA DA SHOPEE ---
            if (urlObj.hostname.includes("shopee.com")) {
                urlObj.searchParams.set("shopId", this.shopeeId);
                return urlObj.toString();
            }

            return targetUrl;

        } catch (error) {
            console.error("Erro ao converter URL:", error);
            return url;
        }
    }

    extractUrls(text: string): string[] {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

}