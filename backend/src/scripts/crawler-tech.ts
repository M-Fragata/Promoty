import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000))

const TimeBetweenRuns = 30; //30minutos
const scraper = new AccesWeb('tech');

async function executarRobo() {
    console.log("🤖 [Tech] Motor de monitoramento iniciado...\n");

    // Definição das tarefas do nicho Tech
    const tarefas: Array<() => any> = [
        executShopeeTerabyte,   // 1º Shopee (API Rápida - Loja Oficial Terabyte)
        executMercadoLivre,     // 2º Mercado Livre (Playwright - Categorias Tech)
        executShopeeKeywords,   // 3º Shopee (API Rápida - Keywords Tech)
        executShopeePichau,     // 4º Shopee (API Rápida - Loja Oficial Pichau)
        executAmazon,           // 5º Amazon (Playwright - Categorias Tech)
    ];

    let indiceTarefaAtual = 0;

    while (true) {
        // Se NÃO for horário comercial/diurno, entra em modo de espera
        if (!isHorarioComercial()) {
            console.log(`😴 [Tech/Modo Hibernação] Horário de madrugada detectado. Pulando ciclo... [${new Date().toLocaleTimeString('pt-BR')}]`);
            await delay(TimeBetweenRuns);
            continue;
        }

        // Pega a função da vez baseada no índice atual
        const tarefaDaVez = tarefas[indiceTarefaAtual];

        console.log(`\n🔔 [Tech/Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

        if (!tarefaDaVez) {
            console.error(`❌ [Tech] Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
            continue;
        }

        // Executa a raspagem da rede atual (aguarda finalizar a navegação/chamada base)
        await tarefaDaVez();

        // Incrementa o índice para a próxima rodada (e reseta para 0 se chegar ao fim do array)
        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;

        // Aguarda os 30 minutos planejados ANTES de ir para a próxima rede da lista
        console.log(`⏳ [Tech] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos para a próxima rede... [Próxima chamada às: ${new Date(Date.now() + TimeBetweenRuns * 60 * 1000).toLocaleTimeString('pt-BR')}]`);
        await delay(TimeBetweenRuns);
    }
}

// 🟠 TAREFA 1: SHOPEE KEYWORDS (Tech)
async function executShopeeKeywords() {
    try {
        console.log("🔍 [Tech/Bot] Iniciando varredura de keywords na Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/products?niche=tech", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Tech/Shopee - keywords] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Tech/Shopee - keywords] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }

    } catch (error: any) {
        console.error("❌ [Tech/Shopee - keywords] Falha crítica no teste principal:", error.message);
    }
}

// 🟡 TAREFA 2: AMAZON CRAWLER (Tech)
async function executAmazon() {
    try {
        console.log("🌐 [Tech/Amazon] Iniciando varredura com fluxo assíncrono...");
        const tempoInicioML = Date.now();

        await scraper.AcessAmazon((produtosParciais) => {

            console.log(`⚡ [Tech/Crawler Background] Lote de ${produtosParciais.length} recebido! Enviando para API local...`);

            fetch("http://localhost:3333/ofertas/amazon", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosParciais)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                    console.log(`✅ [Tech/Crawler Background] Lote de ${produtosParciais.length} produtos processado pela API com sucesso!`);
                })
                .catch((err) => {
                    console.error("❌ [Tech/Crawler Background] Erro ao enviar lote parcial para a API:", err.message);
                });

        });

        const tempoFimML = Date.now();
        const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
        console.log(`⏱️ [Tech/Amazon] Navegador finalizou todas as URLs em ${tempoTotalML} segundos!`);

    } catch (error: any) {
        console.error("❌ [Tech/Amazon] Falha crítica no teste principal:", error.message);
    }
}

// 🟠 TAREFA 3: SHOPEE LOJAS OFICIAIS (PICHAU - Tech)
async function executShopeePichau() {
    try {
        console.log("🔍 [Tech/Bot] Iniciando varredura de produtos na Pichau Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/pichau", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Tech/Shopee - Pichau] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Tech/Shopee - Pichau] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }
    } catch (error: any) {
        console.error("❌ [Tech/Shopee - Pichau] Falha crítica no teste principal:", error.message);
    }
}

// 🔵 TAREFA 4: MERCADO LIVRE CRAWLER (Tech)
async function executMercadoLivre() {
    try {
        console.log("🌐 [Tech/Mercado Livre] Iniciando varredura com fluxo assíncrono...");
        const tempoInicioML = Date.now();

        await scraper.AcessMercadoLivre((produtosParciais) => {

            console.log(`⚡ [Tech/Crawler Background] Lote de ${produtosParciais.length} recebido! Enviando para API local...`);

            fetch("http://localhost:3333/ofertas/mercadolivre", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosParciais)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                    console.log(`✅ [Tech/Crawler Background] Lote de ${produtosParciais.length} produtos processado pela API com sucesso!`);
                })
                .catch((err) => {
                    console.error("❌ [Tech/Crawler Background] Erro ao enviar lote parcial para a API:", err.message);
                });

        });

        const tempoFimML = Date.now();
        const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
        console.log(`⏱️ [Tech/Mercado Livre] Navegador finalizou todas as URLs em ${tempoTotalML} segundos!`);

    } catch (error) {
        console.error("❌ [Tech/Mercado Livre] Falha crítica no teste principal:", error);
    }
}

// 🟠 TAREFA 5: SHOPEE LOJAS OFICIAIS (TERABYTE - Tech)
async function executShopeeTerabyte() {
    try {
        console.log("🔍 [Tech/Bot] Iniciando varredura de produtos na Terabyte Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/terabyte", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Tech/Shopee - Terabyte] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Tech/Shopee - Terabyte] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }
    } catch (error: any) {
        console.error("❌ [Tech/Shopee - Terabyte] Falha crítica no teste principal:", error.message);
    }
}

// Função auxiliar
function isHorarioComercial(): boolean {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 0 && hours < 7) return false;

    return true
}

//Chamada para iniciar o script
executarRobo();
