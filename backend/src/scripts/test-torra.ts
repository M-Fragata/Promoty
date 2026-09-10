/**
 * 🧪 SCRIPT DE TESTE - Scraper Lojas Torra
 * 
 * Este script é para uso em DESENVOLVIMENTO apenas.
 * 
 * Para executar:
 *   cmd /c "set PATH=D:\Node;%PATH% & npx tsx src/scripts/test-torra.ts"
 */

const mockEnvs: Record<string, string> = {
    PORT: '3333',
    FRONTEND_URL: 'http://localhost:5173',
    AMAZON_TAG: 'promocenter0b-20',
    SHOPEE_ID: '123',
    DATABASE_URL: 'postgresql://mock',
    WHATSAPP_GROUP_JID_GAMERS: 'mock',
    WHATSAPP_GROUP_INVITE_GAMERS: 'mock',
    WHATSAPP_GROUP_JID_MODA_FEMININA: 'mock',
    WHATSAPP_GROUP_INVITE_MODA_FEMININA: 'mock',
    TELEGRAM_API_ID: '123',
    TELEGRAM_API_HASH: 'mock',
    AWIN_PUBLISHER_ID: '12345',
    AWIN_CEA_MERCHANT_ID: '111',
    AWIN_RIACHUELO_MERCHANT_ID: '222',
    MELI_ID: '333',
    TELEGRAM_SESSION: 'mock',
    MATT_TOOL: '444',
    KUTT_API_KEY: '555',
    SHOPEE_API_ID: '666',
    SHOPEE_API_PASSWORD: '777',
    TELEGRAM_CHAT_ID: '888',
    TELEGRAM_TOKEN: '999',
    TOKEN_AWIN: 'aaa',
    AWIN_DAFITI_MERCHANT_ID: 'bbb',
    AWIN_KABUM_MERCHANT_ID: 'ccc',
    AWIN_DAFITI_URL: 'ddd',
    AWIN_KABUM_URL: 'eee',
    AWIN_ALIEXPRESS_MERCHANT_ID: 'fff_ali',
    AWIN_LOJASTORRA_MERCHANT_ID: 'ggg_torra',
    ADMIN_EMAILS: 'admin@test.com'
};

for (const [k, v] of Object.entries(mockEnvs)) {
    if (!process.env[k]) {
        process.env[k] = v;
    }
}

const { AccesWeb } = await import('../Services/AcessWebService.js');

async function testarTorra() {
    console.log("🧪 [TESTE] Iniciando teste do scraper Lojas Torra...\n");

    const scraper = new AccesWeb('casa');

    try {
        console.log("🌐 [Torra] Iniciando varredura de teste...");
        const tempoInicio = Date.now();

        await scraper.AcessTorra(async (produtosParciais) => {
            console.log(`\n⚡ [TESTE] Lote de ${produtosParciais.length} produtos recebido!\n`);

            console.log("📋 [TESTE] Amostra de produtos encontrados neste lote:");
            console.log("─".repeat(80));
            for (const prod of produtosParciais.slice(0, 10)) {
                console.log(`  ID: ${prod.id}`);
                console.log(`  Título: ${prod.title}`);
                console.log(`  Preço: R$ ${prod.price.toFixed(2)}`);
                console.log(`  Preço Original: R$ ${prod.originalPrice?.toFixed(2) || 'N/A'}`);
                console.log(`  Desconto: ${prod.badge || 'N/A'}`);
                console.log(`  Loja: ${prod.store}`);
                console.log(`  Link: ${prod.link}`);
                console.log("─".repeat(80));
            }

            console.log(`\n📊 [TESTE] Total de produtos elegíveis no lote: ${produtosParciais.length}\n`);
        });

        const tempoFim = Date.now();
        const tempoTotal = ((tempoFim - tempoInicio) / 1000).toFixed(2);
        console.log(`\n⏱️ [TESTE] Scraper Lojas Torra finalizado em ${tempoTotal} segundos.`);

    } catch (error) {
        console.error("❌ [TESTE] Falha crítica no teste:", error);
    }
}

testarTorra();
