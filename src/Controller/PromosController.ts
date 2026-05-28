import { type Request, type Response } from "express";
import { LinkParserService } from "../Services/LinkParserService.js";
import { prisma } from "../Database/Prisma.js";

const linkParser = new LinkParserService();

export class PromosController {

    async getPromo(req: Request, res: Response) {
        try {

            const { sourceId, rawText } = req.body

            if (!rawText) return res.status(400).json({ error: "Mensagem é obrigatória" })

            const urls = linkParser.extractUrls(rawText)

            if (urls.length === 0) return res.status(400).json({ error: "Nenhuma URL encontrada na mensagem" })

            const originalUrl = urls[0]

            if (!originalUrl) return res.status(400).json({ error: "URL é obrigatória" })

            const checkDuplicate = await prisma.ofertas.findMany({
                where: { source_id: sourceId }
            })

            if (checkDuplicate.length > 0) return res.status(200).json({ message: "Promoção já cadastrada para essa fonte" })

            const convertedUrl = await linkParser.convertUrl(originalUrl || "")

            const textWithMyLink = rawText.replace(originalUrl, convertedUrl)

            const offer = await prisma.ofertas.create({
                data: {
                    source_id: sourceId,
                    title: "",
                    original_url: originalUrl,
                    converted_url: convertedUrl,
                    status: "Pending",
                }
            })

            return res.status(200).json(offer)

        } catch (error) {
            console.error("Erro interno no PromosController:", error);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }
}