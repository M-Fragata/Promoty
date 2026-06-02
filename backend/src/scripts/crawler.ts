import { AccesWeb } from '../Services/AcessWebService';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000))

async function executarRobo() {
    console.log("🤖 Iniciando bateria de promoções para Amazon e Mercado Livre...\n");

    const scraper = new AccesWeb();
    while (true) {
        // ==========================================
        // 🟠 BLOCO TESTE: AMAZON
        // ==========================================
        try {
            console.log("🌐 [Amazon] Iniciando varredura com fluxo assíncrono...");
            const tempoInicioML = Date.now();

            // Chamamos o método passando a função de callback
            // O await aqui serve APENAS para esperar o Playwright terminar de navegar nas 4 páginas,
            // mas o processamento das ofertas vai acontecendo em paralelo!
            await scraper.AcessAmazon((produtosParciais) => {

                // 🔥 ISTO RODA EM SEGUNDO PLANO (Fire and Forget)
                // Toda vez que o scraper acha uma página, esse bloco é disparado imediatamente
                console.log(`⚡ [Crawler Background] Lote de ${produtosParciais.length} recebido! Enviando para API local...`);

                fetch("http://localhost:3333/ofertas/amazon", {
                    method: "POST",
                    headers: { "Content-type": "application/json" },
                    body: JSON.stringify(produtosParciais)
                })
                    .then(async (response) => {
                        if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                        console.log(`✅ [Crawler Background] Lote de ${produtosParciais.length} produtos processado pela API com sucesso!`);
                    })
                    .catch((err) => {
                        console.error("❌ [Crawler Background] Erro ao enviar lote parcial para a API:", err.message);
                    });

            });

            const tempoFimML = Date.now();
            const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
            console.log(`⏱️ [Amazon] Navegador finalizou todas as URLs em ${tempoTotalML} segundos!`);

        } catch (error) {
            console.error("❌ [Amazon] Falha crítica no teste principal:", error);
        }

        console.log('⏳ Aguardando 10 minutos de intervalo de segurança...', Date.now());
        await delay(10);

        // ==========================================
        // 🔵 BLOCO TESTE: MERCADO LIVRE
        // ==========================================
        try {
            console.log("🌐 [Mercado Livre] Iniciando varredura com fluxo assíncrono...");
            const tempoInicioML = Date.now();

            // Chamamos o método passando a função de callback
            // O await aqui serve APENAS para esperar o Playwright terminar de navegar nas 4 páginas,
            // mas o processamento das ofertas vai acontecendo em paralelo!
            await scraper.AcessMercadoLivre((produtosParciais) => {

                // 🔥 ISTO RODA EM SEGUNDO PLANO (Fire and Forget)
                // Toda vez que o scraper acha uma página, esse bloco é disparado imediatamente
                console.log(`⚡ [Crawler Background] Lote de ${produtosParciais.length} recebido! Enviando para API local...`);

                fetch("http://localhost:3333/ofertas/mercadolivre", {
                    method: "POST",
                    headers: { "Content-type": "application/json" },
                    body: JSON.stringify(produtosParciais)
                })
                    .then(async (response) => {
                        if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                        console.log(`✅ [Crawler Background] Lote de ${produtosParciais.length} produtos processado pela API com sucesso!`);
                    })
                    .catch((err) => {
                        console.error("❌ [Crawler Background] Erro ao enviar lote parcial para a API:", err.message);
                    });

            });

            const tempoFimML = Date.now();
            const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
            console.log(`⏱️ [Mercado Livre] Navegador finalizou todas as URLs em ${tempoTotalML} segundos!`);

        } catch (error) {
            console.error("❌ [Mercado Livre] Falha crítica no teste principal:", error);
        }

        console.log('⏳ Aguardando 10 minutos de intervalo de segurança...', Date.now());
        await delay(10);

        console.log("\n🏁 Bateria de testes finalizada.");
    }
}

executarRobo();