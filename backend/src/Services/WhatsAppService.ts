import makeWASocket, { DisconnectReason, type WASocket, useMultiFileAuthState } from "@whiskeysockets/baileys"
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface para itens que entram na nossa fila
interface ProductQueue {
    jid: string;
    text: string;
    imageUrl: string | null;
    productId: string | number;
    resolve: (value: boolean) => void;
}

export class WhatsAppService {

    private socket: WASocket | null = null;
    private authFolder = path.resolve(__dirname, '../../auth_info_baileys');


    // Propriedades da fila
    private queue: ProductQueue[] = [];
    private isProcessingQueue = false;

    private processedIdsInCurrentCycle = new Set<string>();

    constructor() {
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔍 Tentando ler a pasta de autenticação em:', this.authFolder);
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            console.log('✅ Pasta de autenticação carregada com sucesso.');

            const sock = makeWASocket({
                logger: pino({ level: 'silent' }),
                auth: state,
                printQRInTerminal: false,
                defaultQueryTimeoutMs: undefined
            });

            this.socket = sock;
            console.log('🤖 Socket criado. Aguardando eventos do WhatsApp...');

            // Monitoramento da Conexão
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log('\n🟩 --- ESCANEIE O QR CODE ABAIXO --- 🟩\n');
                    qrcode.generate(qr, { small: true });
                    console.log('\n🟩 ---------------------------------- 🟩\n');
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('❌ Conexão fechada. Reconectando:', shouldReconnect);
                    if (shouldReconnect) { this.initialize() }

                } else if (connection === 'open') {
                    console.log('🎉 Parabéns! Seu robô está conectado com sucesso ao WhatsApp e pronto para enviar ofertas!');
                    console.log('✅ [WhatsApp] Conectado com sucesso e em prontidão!');
                }
            });

            sock.ev.on('creds.update', saveCreds);

        } catch (error) {
            console.error('💥 Erro CRÍTICO dentro do WhatsAppService:', error);
        }
    }

    async sendMessage(jid: string, text: string, imageUrl?: string | null, productId?: string | number): Promise<boolean> {
        return new Promise<boolean>((resolve) => {

            if (!imageUrl) return resolve(false);

            if (productId) {
                const idString = String(productId);

                if (this.processedIdsInCurrentCycle.has(idString)) {
                    console.log(`🛡️ [Fila WhatsApp] Bloqueio de ciclo: Produto ID ${idString} já entrou na fila recentemente. Ignorando duplicação.`);
                    return resolve(false);
                }

                this.processedIdsInCurrentCycle.add(idString);

                setTimeout(() => {
                    this.processedIdsInCurrentCycle.delete(idString);
                }, 120000); // 2 minutos
            }

            console.log(`📥 [Fila WhatsApp] Novo item adicionado. Posição atual: ${this.queue.length + 1}`);

            // 🔥 CORREÇÃO: Adicione o productId aqui dentro do objeto da fila!
            // Usamos String(productId) para garantir que ele salve sempre como string na fila se a interface pedir string
            this.queue.push({
                jid,
                text,
                imageUrl,
                productId: productId ? String(productId) : '', // Evita quebra caso venha vazio
                resolve
            });

            this.processQueue();
        });
    }

    private async processQueue() {

        //Se a fila já estiver trabalhando em uma mensagem, este disparo apenas retorna e espera o ciclo acabar
        if (this.isProcessingQueue) return;
        // Se a fila estiver vazia, encerra o motor
        if (this.queue.length === 0) return;

        this.isProcessingQueue = true;

        const currentItem = this.queue.shift();

        if (currentItem) {
            const { jid, text, imageUrl, resolve } = currentItem;

            // Executa o envio real utilizando o método privado interno
            const success = await this.executeRealSend(jid, text, imageUrl);

            // Devolve a resposta de sucesso ou falha para o Controller original que estava aguardando
            resolve(success);

            // Se ainda existirem itens na fila, aplica o respiro obrigatório anti-ban
            if (this.queue.length > 0) {

                const min = 7000
                const max = 12000
                const DELAY_BETWEEN_MESSAGES = Math.floor(Math.random() * (max - min + 1)) + min;

                console.log(`🎲 [Fila WPP] Cadência humana ativada: aguardando ${(DELAY_BETWEEN_MESSAGES / 1000).toFixed(1)}s antes do próximo post. Restam ${this.queue.length} itens.`)

                await new Promise(res => setTimeout(res, DELAY_BETWEEN_MESSAGES));
            }
        }

        // Libera a trava e chama o motor novamente de forma recursiva para processar o próximo item da lista
        this.isProcessingQueue = false;
        this.processQueue();
    }

    private async executeRealSend(jid: string, text: string, imageUrl?: string | null): Promise<boolean> {
        try {

            if (!this.socket) {
                console.error('❌ [WhatsAppService] Erro: O socket não foi inicializado.');
                return false;
            }

            console.log(`📤 [Fila WhatsApp] Enviando postagem real agora para o JID ${jid}...`);

            const messagePayload = (imageUrl)
                ? { image: { url: imageUrl }, caption: text }
                : { text: text };

            const delayTimeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_BAILEYS')), ms));
            const sendPromise = this.socket.sendMessage(jid.trim(), messagePayload);

            await Promise.race([sendPromise, delayTimeout(12000)]); // Subi para 12s para garantir uploads de imagens pesadas

            console.log(`✅ [Fila WhatsApp] Mensagem enviada com sucesso!`);
            return true;

        } catch (error: any) {

            if (error?.message === 'TIMEOUT_BAILEYS') {
                console.error(`⏳ [WhatsAppService] Timeout atingido! O servidor do WhatsApp demorou muito para responder para o JID ${jid}.`);
            } else {
                console.error(`💥 [WhatsAppService] Erro físico ao enviar via Baileys para o JID ${jid}:`, error);
            }
            return false;
        }
    }
}