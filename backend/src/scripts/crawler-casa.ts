import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000))

const TimeBetweenRuns = 30; //30minutos
const scraper = new AccesWeb('casa');

async function executarRobo() {
    console.log("🏠 [Casa] Motor de monitoramento iniciado...\n");

    // Definição das tarefas do nicho Casa & Moda Feminina
    // NOTA: Pichau e Terabyte são lojas Tech, NÃO são usadas neste crawler
    // NOTA: Amazon não tem categorias de Casa/Moda ainda
    const tarefas: Array<() => any> = [
        executShopeeKeywords,   // 1º Shopee (API Rápida - Keywords Casa/Moda)
        executMercadoLivre,     // 2º Mercado Livre (Playwright - Categorias Casa/Moda)
    ];

    let indiceTarefaAtual = 0;

    while (true) {
        // Se NÃO for horário comercial/diurno, entra em modo de espera
        if (!isHorarioComercial()) {
            console.log(`😴 [Casa/Modo Hibernação] Horário de madrugada detectado. Pulando ciclo... [${new Date().toLocaleTimeString('pt-BR')}]`);
            await delay(TimeBetweenRuns);
            continue;
        }

        // Pega a função da vez baseada no índice atual
        const tarefaDaVez = tarefas[indiceTarefaAtual];

        console.log(`\n🔔 [Casa/Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

        if (!tarefaDaVez) {
            console.error(`❌ [Casa] Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
            continue;
        }

        // Executa a raspagem da rede atual (aguarda finalizar a navegação/chamada base)
        await tarefaDaVez();

        // Incrementa o índice para a próxima rodada (e reseta para 0 se chegar ao fim do array)
        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;

        // Aguarda os 30 minutos planejados ANTES de ir para a próxima rede da lista
        console.log(`⏳ [Casa] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos para a próxima rede... [Próxima chamada às: ${new Date(Date.now() + TimeBetweenRuns * 60 * 1000).toLocaleTimeString('pt-BR')}]`);
        await delay(TimeBetweenRuns);
    }
}

// 🟠 TAREFA 1: SHOPEE KEYWORDS (Casa/Moda)
async function executShopeeKeywords() {
    try {
        console.log("🔍 [Casa/Bot] Iniciando varredura de keywords na Shopee...");

        const response = await fetch("http://localhost:3333/ofertas/shopee/products?niche=casa", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Casa/Shopee - keywords] A API da Shopee retornou um status de erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Casa/Shopee - keywords] Requisição da Shopee processada e enviada para a fila de transmissão!");
        }

    } catch (error: any) {
        console.error("❌ [Casa/Shopee - keywords] Falha crítica no teste principal:", error.message);
    }
}

// 🔵 TAREFA 2: MERCADO LIVRE CRAWLER (Casa/Moda)
async function executMercadoLivre() {
    try {
        console.log("🌐 [Casa/Mercado Livre] Iniciando varredura com fluxo assíncrono...");
        const tempoInicioML = Date.now();

        await scraper.AcessMercadoLivre((produtosParciais) => {

            console.log(`⚡ [Casa/Crawler Background] Lote de ${produtosParciais.length} recebido! Enviando para API local...`);

            fetch("http://localhost:3333/ofertas/mercadolivre", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosParciais)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                    console.log(`✅ [Casa/Crawler Background] Lote de ${produtosParciais.length} produtos processado pela API com sucesso!`);
                })
                .catch((err) => {
                    console.error("❌ [Casa/Crawler Background] Erro ao enviar lote parcial para a API:", err.message);
                });

        });

        const tempoFimML = Date.now();
        const tempoTotalML = ((tempoFimML - tempoInicioML) / 1000).toFixed(2);
        console.log(`⏱️ [Casa/Mercado Livre] Navegador finalizou todas as URLs em ${tempoTotalML} segundos!`);

    } catch (error) {
        console.error("❌ [Casa/Mercado Livre] Falha crítica no teste principal:", error);
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
