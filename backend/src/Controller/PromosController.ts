import { type Request, type Response } from "express";
import { LinkParserService } from "../Services/LinkParserService.js";
import { whatsAppService } from "../app.js";
import { prisma } from "../Database/Prisma.js";

import { Env } from "../utils/Envirolment.js";
import { text } from "input";

const linkParser = new LinkParserService();

export class PromosController {

    private formatTextForWhatsApp(text: string, convertedUrl: string): string {
        let formatted = text;

        // Se a oferta vier da KaBuM!, aplica o tratamento estético profissional
        if (text.toLowerCase().includes("kabum.com.br") || convertedUrl.includes("awin")) {
            const lines = formatted.split("\n");

            const processedLines = lines.map(line => {
                let trimmedLine = line.trim();

                if (/^De:/i.test(trimmedLine)) {
                    const preco = trimmedLine.replace(/^De:\s*/i, "").trim();
                    return `De: ~${preco}~`;
                }

                if (/^Por:/i.test(trimmedLine)) {
                    const preco = trimmedLine.replace(/^Por:\s*/i, "").trim();
                    return `Por: 🔥 *${preco}*`;
                }

                return line;
            });

            formatted = processedLines.join("\n");

            // 🔥 AQUI ESTÁ A SOLUÇÃO: Removemos o "GARANTA AQUI!" antigo e 
            // colocamos a chamada de ação com o seu link de afiliado logo abaixo dela!
            formatted = formatted.replace(
                /GARANTA AQUI!/gi,
                `\n🛒 *GARANTA AQUI:* \n${convertedUrl}`
            );
        } else {
            // Caso não seja KaBuM (ex: Amazon), apenas anexa o link convertido ao final
            formatted = `${formatted}\n\n${convertedUrl}`;
        }

        return formatted;
    }

    getPromo = async (req: Request, res: Response) => {
        try {
            const { sourceId, rawText } = req.body;

            // 1. Validações básicas iniciais
            if (!rawText) return res.status(400).json({ error: "Mensagem é obrigatória" });

            const urls = linkParser.extractUrls(rawText);
            if (urls.length === 0) return res.status(400).json({ error: "Nenhuma URL encontrada na mensagem" });

            const originalUrl = urls[0];
            if (!originalUrl) return res.status(400).json({ error: "URL é obrigatória" });

            // 2. Proteção contra duplicidade usando findUnique (mais performático)
            const checkDuplicate = await prisma.ofertas.findFirst({
                where: { source_id: sourceId }
            });

            if (checkDuplicate) {
                return res.status(200).json({ message: "Promoção já cadastrada para essa fonte", oferta: checkDuplicate });
            }

            // 3. Conversão de links síncrona/blindada
            const convertedUrl = await linkParser.convertUrl(originalUrl);
            const textWithMyLink = rawText.replace(originalUrl, "").trim();

            const formattedText = this.formatTextForWhatsApp(textWithMyLink, convertedUrl)

            // 4. Salva no banco com status 'Posted' assumindo que vai enviar
            const offer = await prisma.ofertas.create({
                data: {
                    source_id: sourceId,
                    title: "",
                    original_url: originalUrl,
                    converted_url: convertedUrl,
                    status: "Posted",
                }
            });

            // 5. DISPARO PARA O GRUPO DO WHATSAPP
            // Buscando o JID do grupo das variáveis de ambiente (.env)
            const TARGET_GROUP_JID = Env.WHATSAPP_GROUP_JID;

            const whatsappDispatched = await whatsAppService.sendMessage(TARGET_GROUP_JID, formattedText);

            // Se por acaso o Baileys falhar (ex: deslogou), mudamos para Failed para você saber no banco
            if (!whatsappDispatched) {
                await prisma.ofertas.update({
                    where: { id: offer.id },
                    data: { status: "Failed" }
                });
                return res.status(500).json({ error: "Erro ao enviar a mensagem para o grupo do WhatsApp." });
            }

            // Retorna a resposta de sucesso para o Insomnia/Telegram
            return res.status(200).json({
                message: "Oferta processada e enviada para o WhatsApp!",
                offer
            });

        } catch (error) {
            console.error("Erro interno no PromosController:", error);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }


}