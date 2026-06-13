import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000))

const TimeBetweenRuns = 30; //30minutos
const scraper = new AccesWeb();

async function executarRobo() {
    console.log("🤖 Motor de monitoramento iniciado em modo de esteira alternada...\n");

    // Definição das tarefas que serão alternadas a cada ciclo de 30 minutos
    const tarefas: Array<() => any> = [
        executShopeeTerabyte,   // 1º Shopee (API Rápida - Loja Oficial Terabyte)
        executMercadoLivre,     // 2º Mercado Livre (Playwright - Fluxo Assíncrono)
        executShopeeKeywords,   // 3º Shopee (API Rápida - Termos Gerais)
        executShopeePichau,     // 4º Shopee (API Rápida - Loja Oficial Pichau)
        executAmazon,           // 5º Amazon (Playwright - Fluxo Assíncrono)
    ];

    let indiceTarefaAtual = 0;

    while (true) {
        // Se NÃO for horário comercial/diurno, entra em modo de espera
        if (!isHorarioComercial()) {
            console.log(`😴 [Modo Hibernação] Horário de madrugada detectado. Pulando ciclo... [${new Date().toLocaleTimeString('pt-BR')}]`);
            await delay(TimeBetweenRuns);
            continue;
        }

        // Pega a função da vez baseada no índice atual
        const tarefaDaVez = tarefas[indiceTarefaAtual];

        console.log(`\n🔔 [Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

        if (!tarefaDaVez) {
            console.error(`❌ Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
            continue;
        }

        // Executa a raspagem da rede atual (aguarda finalizar a navegação/chamada base)
        await tarefaDaVez();

        // Incrementa o índice para a próxima rodada (e reseta para 0 se chegar ao fim do array)
        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;

        // Aguarda os 30 minutos planejados ANTES de ir para a próxima rede da lista
        console.log(`⏳ Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos para a próxima rede... [Próxima chamada às: ${new Date(Date.now() + TimeBetweenRuns * 60 * 1000).toLocaleTimeString('pt-BR')}]`);
        await delay(TimeBetweenRuns);
    }
}

// 🟠 TAREFA 1: SHOPEE KEYWORDS
async function executShopeeKeywords() {
    try {
        console.log("🔍 [Bot] Iniciando varredura de produtos na Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/products", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            // Se a API responder com 404, 500, etc., captura o erro aqui
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Shopee - keywords] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Shopee - keywords] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }

    } catch (error: any) {
        // Captura erros se o servidor local estiver desligado ou a rede cair
        console.error("❌ [Shopee - keywords] Falha crítica no teste principal:", error.message);
    }
}

// 🟡 TAREFA 2: AMAZON CRAWLER
async function executAmazon() {
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

    } catch (error: any) {
        console.error("❌ [Amazon] Falha crítica no teste principal:", error.message);
    }
}

// 🟠 TAREFA 3: SHOPEE LOJAS OFICIAIS (PICHAU)
async function executShopeePichau() {
    try {
        console.log("🔍 [Bot] Iniciando varredura de produtos na Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/pichau", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            // Se a API responder com 404, 500, etc., captura o erro aqui
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Shopee - Pichau] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Shopee - Pichau] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }
    } catch (error: any) {
        // Captura erros se o servidor local estiver desligado ou a rede cair
        console.error("❌ [Shopee - Pichau] Falha crítica no teste principal:", error.message);
    }
}

// 🔵 TAREFA 4: MERCADO LIVRE CRAWLER
async function executMercadoLivre() {
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
}

// 🔵 TAREFA 5: MERCADO LIVRE CRAWLER
async function executShopeeTerabyte() {
    try {
        console.log("🔍 [Bot] Iniciando varredura de produtos na Terabyte Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/terabyte", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            // Se a API responder com 404, 500, etc., captura o erro aqui
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Shopee - Terabyte] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Shopee - Terabyte] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }
    } catch (error: any) {
        // Captura erros se o servidor local estiver desligado ou a rede cair
        console.error("❌ [Shopee - Terabyte] Falha crítica no teste principal:", error.message);
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