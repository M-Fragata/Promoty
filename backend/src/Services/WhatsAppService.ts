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

            this.socket = makeWASocket({
                logger: pino({ level: 'silent' }),
                auth: state,
                printQRInTerminal: false,
                defaultQueryTimeoutMs: undefined
            });
            console.log('🤖 Socket criado. Aguardando eventos do WhatsApp...');

            // Monitoramento da Conexão
            this.socket.ev.on('connection.update', async (update) => {
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
                }
            });

            this.socket.ev.on('creds.update', saveCreds);

        } catch (error) {
            console.error('💥 Erro CRÍTICO dentro do WhatsAppService:', error);
        }
    }

    async sendMessage(jid: string, text: string): Promise<boolean> {
        try {
            if (!this.socket) {
                console.error('❌ [WhatsAppService] Erro: O socket não foi inicializado.');
                return false;
            }

            console.log(`📱 [WhatsAppService] Preparando envio para o JID: ${jid}...`);

            const delay = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_BAILEYS')), ms));
            const sendPromise = this.socket.sendMessage(jid, { text });

            await Promise.race([sendPromise, delay(8000)]);

            console.log('✅ [WhatsAppService] Mensagem entregue ao servidor do WhatsApp com sucesso!');
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