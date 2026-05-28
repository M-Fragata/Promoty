export class LinkParserService {

    amazonTag = process.env.AMAZON_TAG;
    shopeeId = process.env.SHOPEE_ID;

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
            })

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
            let targetUrl = url;

            // CASO 1: Links encurtados oficiais da Amazon (amzn.to ou a.co)
            if (targetUrl.includes("amzn.to") || targetUrl.includes("a.co")) {
                // Remove qualquer barra extra ou espaços
                const cleanUrl = targetUrl.trim();

                // Retorna o link usando o endpoint global de redirecionamento de afiliados da Amazon.
                // O próprio navegador do usuário vai resolver o produto e aplicar seu ID de afiliado.
                return `https://www.amazon.com.br/g/ch/redirect?url=${encodeURIComponent(cleanUrl)}&tag=${this.amazonTag}`;
            }

            // CASO 2: Links já expandidos ou links longos diretos
            const urlObj = new URL(targetUrl);

            if (urlObj.hostname.includes("amazon.com")) {
                urlObj.searchParams.set("tag", this.amazonTag!);
                return urlObj.toString();
            }

            if (urlObj.hostname.includes("shopee.com")) {
                urlObj.searchParams.set("shopId", this.shopeeId!);
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