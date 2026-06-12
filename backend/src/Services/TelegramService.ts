import type { Page } from "playwright";
import { Env } from "../utils/Envirolment";

// 1. Interfaces separadas para cada responsabilidade
interface PrintProps {
    page: Page;
    store: string;
    produtosLength: number;
    tempoExecucao: number;
    status: string;
    url: string
}

interface TelegramProps {
    screenShot: Buffer;
    store: string;
    produtosLength: number;
    tempoExecucao: number;
    status: string;
    url: string
}

// 2. Fila simples para não travar o bot
const telegramQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || telegramQueue.length === 0) return;
    isProcessing = true;
    while (telegramQueue.length > 0) {
        const task = telegramQueue.shift();
        if (task) await task().catch(console.error);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    isProcessing = false;
}

// 3. Serviço de Print (Captura)
export async function TakePrintScreenService({ page, ...rest }: PrintProps) {
    try {
        const screenShot = await page.screenshot({ type: 'png', fullPage: true });

        const data = {
            store: String(rest.store),
            status: String(rest.status),
            produtosLength: Number(rest.produtosLength),
            tempoExecucao: Number(rest.tempoExecucao),
            url: String(rest.url)
        }

        // Enfileira a tarefa sem dar await (Fire and Forget)
        telegramQueue.push(async () => SendTelegramMessageService({ screenShot, ...data }));
        processQueue(); // Inicia o processamento da fila

    } catch (error) {
        console.error("❌ Falha ao tirar print:", error);
    }
}

// 4. Serviço de Telegram (Envio)
async function SendTelegramMessageService({ screenShot, store, produtosLength, tempoExecucao, status, url }: TelegramProps) {
    try {
        const mensagem = `*🤖 RELATÓRIO DO RÔBO [${store}]*\n\n` +
            `✅ *Status:* ${status}\n no acesso da URL: ${url}` +
            `📦 *Produtos processados:* ${produtosLength}\n` +
            `⏱️ *Tempo de execução:* ${tempoExecucao}s\n` +
            `📅 *Data:* ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`;

        const formData = new FormData();
        formData.append("chat_id", Env.TELEGRAM_CHAT_ID);
        formData.append("caption", mensagem);
        formData.append("parse_mode", "Markdown");
        formData.append("photo", new Blob([new Uint8Array(screenShot)], { type: "image/png" }));

        // IMPORTANTE: Não passar headers aqui, o fetch gera o 'multipart/form-data' corretamente sozinho
        await fetch(`https://api.telegram.org/bot${Env.TELEGRAM_TOKEN}/sendPhoto`, {
            method: "POST",
            body: formData
        });

        console.log("🚀 Relatório enviado para o Telegram!");
    } catch (err) {
        console.error("❌ Falha ao enviar notificação para o Telegram:", err);
    }
}