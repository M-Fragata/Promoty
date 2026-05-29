import { Env } from "../utils/Envirolment.js";
import { LinkParserService } from "../Services/LinkParserService.js";
import { WhatsAppService } from "../Services/WhatsAppService.js";

export class TelegramController {
    private linkParser: LinkParserService;
    private whatsappService: WhatsAppService;

    constructor(whatsappService: WhatsAppService) {
        this.linkParser = new LinkParserService();
        this.whatsappService = whatsappService;
    }

    // Registra o escutador de mensagens na instância do bot que vier do seu index/app
    public registerListener(bot: any): void {
        console.log("📥 Escutador do Telegram ativado para o canal:", Env.TELEGRAM_KABUM_ID);

        bot.on('message', async (ctx: any) => {
            try {
                const chatId = ctx.chat.id.toString();

                // FILTRO: Só processa se a mensagem vier do canal específico cadastrado no .env
                if (chatId !== Env.TELEGRAM_KABUM_ID) return;

                // Captura texto de mensagens normais ou de mídias (fotos/vídeos)
                let text = ctx.message.text || ctx.message.caption || "";

                const buttons = ctx.message.reply_markup?.inline_keyboard;
                if (buttons) {
                    for (const row of buttons) {
                        for (const button of row) {
                            if (button.url) {
                                // Anexa o link oculto no final do texto para a esteira do Express processar
                                text += `\n\n${button.url}`;
                            }
                        }
                    }
                }

                if(!text.trim()) return

                console.log(`\n📦 Nova oferta detectada no Telegram (com botões tratados).`);

                // 1. Extrai as URLs do texto
                const urls = this.linkParser.extractUrls(text);
                let newText = text;

                // 2. Substitui os links pelos seus convertidos/limpos
                for (const url of urls) {
                    const convertedUrl = await this.linkParser.convertUrl(url);
                    newText = newText.replace(url, convertedUrl);
                }

                // 3. Dispara para o WhatsApp no JID do Promos Gamer 🔥
                await this.whatsappService.sendMessage(Env.WHATSAPP_GROUP_JID!, newText);

                console.log("🚀 Oferta processada e enviada com sucesso para o WhatsApp!");

            } catch (error) {
                console.error("Erro ao processar mensagem no TelegramController:", error);
            }
        });
    }
}