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


    // Propriedades da fila - fila independente por JID
    private queues: Map<string, ProductQueue[]> = new Map();
    private processingMap: Map<string, boolean> = new Map();

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

            if (!imageUrl) {
            console.log(`⚠️ [WhatsApp] Imagem nula para produto ID ${productId}. Ignorando envio.`);
            return resolve(false);
        }

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

            // Fila independente por JID (grupo)
            if (!this.queues.has(jid)) {
                this.queues.set(jid, []);
                this.processingMap.set(jid, false);
            }

            const fila = this.queues.get(jid)!;
            fila.push({
                jid,
                text,
                imageUrl,
                productId: productId ? String(productId) : '',
                resolve
            });

            console.log(`📥 [Fila WhatsApp - ${jid.substring(0, 10)}...] Novo item adicionado. Posição: ${fila.length}`);

            this.processQueue(jid);
        });
    }

    private async processQueue(jid: string) {
        const fila = this.queues.get(jid);
        if (!fila) return;

        if (this.processingMap.get(jid)) return;
        if (fila.length === 0) return;

        this.processingMap.set(jid, true);

        const currentItem = fila.shift();

        if (currentItem) {
            const { jid: targetJid, text, imageUrl, resolve } = currentItem;

            const success = await this.executeRealSend(targetJid, text, imageUrl);
            resolve(success);

            const remaining = fila.length;
            if (remaining > 0) {
                const min = 14000
                const max = 20000
                const DELAY_BETWEEN_MESSAGES = Math.floor(Math.random() * (max - min + 1)) + min;

                console.log(`🎲 [Fila WPP - ${targetJid.substring(0, 10)}...] Cadência humana: ${(DELAY_BETWEEN_MESSAGES / 1000).toFixed(1)}s. Restam ${remaining} itens.`)

                await new Promise(res => setTimeout(res, DELAY_BETWEEN_MESSAGES));
            }
        }

        this.processingMap.set(jid, false);
        this.processQueue(jid);
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