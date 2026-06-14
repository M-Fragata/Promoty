import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000));

const TimeBetweenRunsDia = 5; // 5 minutos para teste (produção você ajusta para 30)
const timeBetweensRunsMadrugada = 180; // 3 horas

async function executarRobo() {
    console.log("🤖 Iniciando bateria de promoções para Mercado Livre...\n");

    const scraper = new AccesWeb();

    while (true) {
        // Captura o tempo e o intervalo logo no início do ciclo atual
        const intervaloAtual = hourOfDay();

        try {
            console.log("🌐 [Mercado Livre] Iniciando varredura com fluxo assíncrono...");
            const tempoInicioML = Date.now();

            // Modificamos o callback para async para podermos controlar o fluxo se necessário,
            // mas mantendo a velocidade de execução do Playwright
            await scraper.AcessMercadoLivre(async (produtosParciais) => {
                console.log(`⚡ [Crawler] Lote de ${produtosParciais.length} recebido! Enviando para API local...`);

                try {
                    // Dando await aqui, garantimos que o lote foi entregue à API local 

                    const response = await fetch("http://localhost:3333/ofertas/mercadolivre", {
                        method: "POST",
                        headers: { "Content-type": "application/json" },
                        body: JSON.stringify(produtosParciais)
                    });

                    if (!response.ok) {
                        throw new Error(`${response.status} - ${response.statusText}`);
                    }

                    console.log(`✅ [Crawler] Lote de ${produtosParciais.length} produtos processado com sucesso!`);

                    console.log("Enviaria para a API mas eu comentei o fetch")
                    console.log(produtosParciais)
                    console.log("------------")
                } catch (err: any) {
                    console.error("❌ [Crawler] Erro ao enviar lote parcial para a API:", err.message);
                }
            });

            const tempoFimML = Date.now();
            const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
            console.log(`⏱️ [Mercado Livre] Navegador finalizou todas as URLs do bloco atual em ${tempoTotalML} segundos!`);

        } catch (error) {
            console.error("❌ [Mercado Livre] Falha crítica no teste principal:", error);
        }

        // Exibe o tempo correto baseado na variável calculada no início do ciclo
        console.log(`\n⏳ Aguardando ${intervaloAtual} minutos de intervalo de segurança...`);
        await delay(intervaloAtual);

        console.log("\n🏁 Ciclo finalizado. Reiniciando esteira...\n");
    }
}

function hourOfDay(): number {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 0 && hours < 7) return timeBetweensRunsMadrugada;

    return TimeBetweenRunsDia;
}

// Solta o play!
executarRobo();