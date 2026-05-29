import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import input from 'input';

import { Env } from '../utils/Envirolment.js';

const apiId = Env.TELEGRAM_API_ID;
const apiHash = Env.TELEGRAM_API_HASH;

// Usamos uma StringSession vazia para começar. Depois podemos salvar o token para não pedir SMS sempre.
const stringSession = new StringSession("");

export class TelegramListener {
    private client: TelegramClient;

    // Lista de IDs ou Usernames dos canais concorrentes que você quer monitorar
    // Exemplo: 'pinguim_promocoes', 'ofertas_promos', ou o ID do canal começando com -100...
    private channelsToMonitor = ['ofertaskabum'];

    constructor() {
        this.client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });
    }

    async start() {
        console.log('📡 [Telegram] Iniciando conexão com o MTProto...');

        // Esse método faz o login. Se for a primeira vez, ele vai pedir seu número e o SMS no terminal!
        await this.client.start({
            phoneNumber: async () => await input.text('Digite seu número do Telegram (+55219XXXXXXXX): '),
            phoneCode: async () => await input.text('Digite o código de verificação recebido no Telegram: '),
            onError: (err) => console.error('Erro no login do Telegram:', err),
        });

        console.log('✅ [Telegram] Conectado e autenticado com sucesso!');

        // Exibe a sessão no terminal. Se você salvar essa string no .env, nunca mais precisará de SMS!
        console.log('💾 String de sessão gerada (guarde se quiser):', this.client.session.save());

        // Configura o ouvinte para interceptar novas mensagens
        this.client.addEventHandler(async (event) => {
            const message = event.message;

            // Verifica se a mensagem veio de um canal
            if (message.peerId && 'channelId' in message.peerId) {
                try {
                    // Pega os dados do canal emissor
                    const sender: any = await message.getSender();
                    const channelUsername = sender?.username;

                    // Se o canal estiver na nossa lista de monitoramento, nós processamos!
                    if (channelUsername && this.channelsToMonitor.includes(channelUsername)) {
                        console.log(`\n📥 [Telegram] Nova oferta detectada no canal: @${channelUsername}`);
                        console.log(`📝 Texto original:\n${message.text}\n`);

                        if (!message.text) return;

                        // 🔥 A MÁGICA: Dispara o texto automaticamente para o seu próprio Express!
                        // Usamos o ID da mensagem do Telegram como sourceId para evitar duplicidade
                        const sourceId = `telegram_${channelUsername}_${message.id}`;

                        await fetch('http://localhost:3333/promos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                sourceId,
                                rawText: message.text
                            })
                        });

                        console.log(`🚀 [Telegram] Oferta enviada com sucesso para a esteira do Express!`);
                    }
                } catch (err: any) {
                    console.error('❌ [Telegram] Erro ao processar mensagem interceptada:', err.message);
                }
            }
        }, new NewMessage({}));
    }
}