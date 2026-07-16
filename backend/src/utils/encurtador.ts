import { Env } from './Envirolment.js';

export async function encurtarLink(longUrl: string, customSlug?: string): Promise<string> {
    try {
        const KUTT_API_URL = "https://fragata.me/api/v2/links"
        const API_KEY = Env.KUTT_API_KEY;

        if (!API_KEY) {
            console.warn("⚠️ KUTT_API_KEY não encontrada no arquivo .env.");
            return longUrl;
        }

        const requestBody: any = {
            target: longUrl
        };

        if (customSlug) {
            requestBody.custom = customSlug;
            requestBody.reuse = false;
        } else {
            requestBody.reuse = true;
        }

        const response = await fetch(KUTT_API_URL, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.link;

    } catch (error) {
        console.error("❌ Falha ao encurtar link no Kutt. Retornando link original:", error);
        return longUrl;
    }
}
