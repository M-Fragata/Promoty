
const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000))

const NICHE = 'casa'; // 'tech' ou 'casa'

async function executarRobo() {
    console.log(`🤖 Iniciando bateria de promoções para Shopee (Niche: ${NICHE})...\n`);

    while (true) {
        try {
            console.log(`🌐 [Shopee] Iniciando varredura para niche: ${NICHE}...`);
            const tempoInicio = Date.now();

            const response = await fetch(`http://localhost:3333/ofertas/shopee/products?niche=${NICHE}`, {
                method: "GET",
                headers: { "Content-type": "application/json" }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`⚠️ [Shopee] Erro na API: ${response.status}`, errorData);
            } else {
                console.log("✨ [Shopee] Requisição processada e enviada para a fila de transmissão!");
            }

            const tempoFim = Date.now();
            const tempoTotal = ((tempoFim - tempoInicio) / 1000).toFixed(2);
            console.log(`⏱️ [Shopee] Varredura finalizada em ${tempoTotal} segundos!`);

        } catch (error) {
            console.error("❌ [Shopee] Falha crítica:", error);
        }

        console.log('⏳ Aguardando 10 minutos de intervalo de segurança...');
        await delay(10);
    }
}

executarRobo();
