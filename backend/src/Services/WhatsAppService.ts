import makeWASocket, { DisconnectReason, type WASocket, useMultiFileAuthState } from "@whiskeysockets/baileys"
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

import qrcode from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WhatsAppService {

    private socket: WASocket | null = null;
    private authFolder = path.resolve(__dirname, '../../auth_info_baileys');

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

    async sendMessage(jid: string, text: string, imageUrl?: string | null): Promise<boolean> {
        try {
            if (!this.socket) {
                console.error('❌ [WhatsAppService] Erro: O socket não foi inicializado.');
                return false;
            }

            // Determina o payload correto do Baileys baseado na presença da imagem
            const messagePayload = (imageUrl)
                ? { image: { url: imageUrl }, caption: text } // Envia a foto com o texto embaixo
                : { text: text };                             // Envia apenas o texto puro

            const delay = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_BAILEYS')), ms));

            // Passa o payload dinâmico para o Baileys
            const sendPromise = this.socket.sendMessage(jid.trim(), messagePayload);

            await Promise.race([sendPromise, delay(8000)]);

            return true;

        } catch (error: any) {
            if (error?.message === 'TIMEOUT_BAILEYS') {
                console.error(`⏳ [WhatsAppService] Timeout de 8s atingido! O servidor do WhatsApp não respondeu a tempo para o JID ${jid}.`);
            } else {
                console.error(`💥 [WhatsAppService] Erro ao enviar mensagem para o JID ${jid}:`, error);
            }
            return false;
        }
    }
}