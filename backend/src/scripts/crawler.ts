import { AccesWeb } from '../Services/AcessWebService'; 
async function executarRobo() {
    console.log("🤖 Iniciando bateria de promoções para Amazon e Mercado Livre...\n");

    const scraper = new AccesWeb();

    // ==========================================
    // 🟠 BLOCO TESTE: AMAZON
    // ==========================================
    try {
        console.log("🌐 [Amazon] Iniciando varredura...");
        const tempoInicioAmazon = Date.now();
        const produtosAmazon = await scraper.AcessAmazon();
        const tempoFimAmazon = Date.now();

        const tempoTotalAmazon = ((tempoFimAmazon - tempoInicioAmazon) / 1000).toFixed(2);
        console.log(`⏱️ [Amazon] Varredura concluída em ${tempoTotalAmazon} segundos!`);
        console.log(`📦 [Amazon] Total encontrado: ${produtosAmazon.length}`);

        if (produtosAmazon.length === 0) {
            console.log("⚠️ [Amazon] Nenhum produto retornado. Verifique seletores.");
        } else {
            console.log("🚀 [Amazon] Enviando produtos para a API local...");
            const response = await fetch("http://localhost:3333/ofertas/amazon", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosAmazon)
            });

            if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
            await response.json();
            console.log("✅ [Amazon] Processado pela API com sucesso!");
        }
    } catch (error) {
        console.error("❌ [Amazon] Falha crítica no teste:", error);
    }

    console.log("\n------------------------------------------\n");

    // ==========================================
    // 🔵 BLOCO TESTE: MERCADO LIVRE
    // ==========================================
    try {
        console.log("🌐 [Mercado Livre] Iniciando varredura...");
        const tempoInicioML = Date.now();
        const produtosML = await scraper.AcessMercadoLivre();
        const tempoFimML = Date.now();

        const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
        console.log(`⏱️ [Mercado Livre] Varredura concluída em ${tempoTotalML} segundos!`);
        console.log(`📦 [Mercado Livre] Total encontrado: ${produtosML.length}`);

        if (produtosML.length === 0) {
            console.log("⚠️ [Mercado Livre] Nenhum produto retornado. Verifique seletores.");
        } else {
            console.log("🚀 [Mercado Livre] Enviando produtos para a API local...");
            const response = await fetch("http://localhost:3333/ofertas/mercadolivre", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosML)
            });

            if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
            await response.json();
            console.log("✅ [Mercado Livre] Processado pela API com sucesso!");
        }
    } catch (error) {
        console.error("❌ [Mercado Livre] Falha crítica no teste:", error);
    }

    console.log("\n🏁 Bateria de testes finalizada.");
}

executarRobo();