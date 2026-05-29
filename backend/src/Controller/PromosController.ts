import { type Request, type Response } from "express";
import { LinkParserService } from "../Services/LinkParserService.js";
import { whatsAppService } from "../app.js";
import { prisma } from "../Database/Prisma.js";

import { Env } from "../utils/Envirolment.js";
import { text } from "input";

const linkParser = new LinkParserService();

export class PromosController {

    private formatTextForWhatsApp(text: string, originalUrl: string, convertedUrl: string): string {
        let formatted = text;

        // 1. Identifica se a oferta pertence à KaBuM!
        if (text.toLowerCase().includes("kabum.com.br")) {
            const lines = formatted.split("\n");

            // Descobre em qual linha a URL original está posicionada
            const urlLineIndex = lines.findIndex(line => line.includes(originalUrl));

            if (urlLineIndex !== -1) {
                // A linha imediatamente ANTES da URL costuma ser a chamada de ação (CTA)
                const ctaLineIndex = urlLineIndex - 1;

                // Se existir uma linha de CTA acima da URL, nós limpamos ela
                if (ctaLineIndex >= 0 && lines[ctaLineIndex].trim() !== "") {
                    lines[ctaLineIndex] = "🛒 *GARANTA AQUI:*";
                } else {
                    // Caso a linha anterior esteja vazia, coloca a CTA na própria linha da URL
                    lines[urlLineIndex] = "🛒 *GARANTA AQUI:*\n" + convertedUrl;
                }
            }

            // 2. Processa as linhas de preço (De/Por) de forma isolada
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

                // Substitui a URL original pela sua convertida se ela ainda estiver solta na linha
                if (line.includes(originalUrl) && !line.includes("PROMOÇÃO ATIVA")) {
                    return line.replace(originalUrl, convertedUrl);
                }

                return line;
            });

            formatted = processedLines.join("\n");
        }

        // 3. Fallback para outras lojas (Amazon, Shopee, etc.) se não for KaBuM!
        else {
            formatted = formatted.replace(originalUrl, convertedUrl);
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

        // 2. Proteção contra duplicidade usando findFirst
        const checkDuplicate = await prisma.ofertas.findFirst({
            where: { source_id: sourceId }
        });

        if (checkDuplicate) {
            return res.status(200).json({ message: "Promoção já cadastrada para essa fonte", oferta: checkDuplicate });
        }

        // 3. Conversão de links síncrona/blindada
        const convertedUrl = await linkParser.convertUrl(originalUrl);

        // 🔥 CORREÇÃO AQUI: Passamos os 3 parâmetros e usamos o rawText intacto!
        const formattedText = this.formatTextForWhatsApp(rawText, originalUrl, convertedUrl);

        // 4. Salva no banco com status 'Posted'
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
        const TARGET_GROUP_JID = Env.WHATSAPP_GROUP_JID;
        const whatsappDispatched = await whatsAppService.sendMessage(TARGET_GROUP_JID, formattedText);

        if (!whatsappDispatched) {
            await prisma.ofertas.update({
                where: { id: offer.id },
                data: { status: "Failed" }
            });
            return res.status(500).json({ error: "Erro ao enviar a mensagem para o grupo do WhatsApp." });
        }

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