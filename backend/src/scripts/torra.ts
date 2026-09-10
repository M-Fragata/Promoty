import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000));

const TimeBetweenRunsDia = 30; // 30 minutos
const timeBetweensRunsMadrugada = 180; // 3 horas

async function executarRobo() {
    console.log("🛍️ [Lojas Torra] Iniciando crawler de ofertas...\n");

    const scraper = new AccesWeb('casa');

    while (true) {
        const intervaloAtual = hourOfDay();

        try {
            console.log("🌐 [Lojas Torra] Iniciando varredura com fluxo assíncrono...");
            const tempoInicio = Date.now();

            await scraper.AcessTorra(async (produtosParciais) => {
                console.log(`⚡ [Lojas Torra] Lote de ${produtosParciais.length} produtos recebido! Enviando para API local...`);

                try {
                    const response = await fetch("http://localhost:3333/ofertas/torra", {
                        method: "POST",
                        headers: { "Content-type": "application/json" },
                        body: JSON.stringify(produtosParciais)
                    });

                    if (!response.ok) {
                        throw new Error(`${response.status} - ${response.statusText}`);
                    }

                    console.log(`✅ [Lojas Torra] Lote de ${produtosParciais.length} produtos processado com sucesso!`);
                } catch (err: any) {
                    console.error("❌ [Lojas Torra] Erro ao enviar lote parcial para a API:", err.message);
                }
            });

            const tempoFim = Date.now();
            const tempoTotal = ((tempoFim - tempoInicio) / 1000).toFixed(2);
            console.log(`⏱️ [Lojas Torra] Navegador finalizou varredura em ${tempoTotal} segundos!`);

        } catch (error) {
            console.error("❌ [Lojas Torra] Falha crítica no crawler:", error);
        }

        console.log(`\n⏳ [Lojas Torra] Aguardando ${intervaloAtual} minutos para o próximo ciclo...`);
        await delay(intervaloAtual);

        console.log("\n🏁 [Lojas Torra] Ciclo finalizado. Reiniciando...\n");
    }
}

function hourOfDay(): number {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 0 && hours < 7) return timeBetweensRunsMadrugada;

    return TimeBetweenRunsDia;
}

// Iniciar
executarRobo();
