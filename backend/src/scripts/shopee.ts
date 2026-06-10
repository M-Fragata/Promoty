
const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000))

async function executarRobo() {
    console.log("🤖 Iniciando bateria de promoções para Shopee...\n");

    while (true) {
        // ==========================================
        // 🟠 BLOCO TESTE: AMAZON
        // ==========================================
        try {
            console.log("🌐 [Shopee] Iniciando varredura com fluxo assíncrono...");
            const tempoInicioML = Date.now();

            const responseShopee = await fetch("http://localhost:3333/ofertas/shopee/shop", {
                method: "GET",
                headers: { "Content-type": "application/json" },
            })

            if (!responseShopee.ok) return console.log("Erro no fetch")

            const produtos = await responseShopee.json()

            const responseApi = await fetch("http://localhost:3333/ofertas/amazon", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtos)
            });

            if (!responseApi.ok) {
                throw new Error(`${responseApi.status} - ${responseApi.statusText}`);
            }

            console.log(`✅ [Crawler] Lote de ${produtos.length} produtos processado com sucesso!`);

            const tempoFimML = Date.now();
            const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
            console.log(`⏱️ [Shopee] Navegador finalizou o fetch em ${tempoTotalML} segundos!`);

        } catch (error) {

            console.error("❌ [Shopee] Falha crítica no teste principal:", error);

        }



        console.log('⏳ Aguardando 10 minutos de intervalo de segurança...', Date.now());
        await delay(10);
    }
}


executarRobo();