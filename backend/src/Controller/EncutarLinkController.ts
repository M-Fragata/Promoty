import { Env } from '../utils/Envirolment.js';

export async function EncurtaLinkController(longUrl: string, customSlug?: string): Promise<string> {
    try {
        const KUTT_API_URL = "https://fragata.me/api/v2/links"
        const API_KEY = Env.KUTT_API_KEY;

        if (!API_KEY) {
            console.warn("⚠️ KUTT_API_KEY não encontrada no arquivo .env.");
            return longUrl;
        }

        // Montamos o corpo da requisição
        const requestBody: any = {
            target: longUrl
        };

        // Se o slug customizado foi enviado, injetamos no parâmetro "custom" que o Kutt espera
        if (customSlug) {
            requestBody.custom = customSlug;
            requestBody.reuse = false; // 👈 ADICIONE ESSA LINHA AQUI!
        } else {
            requestBody.reuse = true;  // 👈 E ESSA AQUI (caso algum link não tenha título)
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
        return data.link; // Retorna o link encurtador pronto (ex: http://localhost:3000/xyz)

    } catch (error) {
        console.error("❌ Falha ao encurtar link no Kutt. Retornando link original:", error);
        return longUrl; // Retorna o link original para o bot não quebrar se o container cair
    }
}