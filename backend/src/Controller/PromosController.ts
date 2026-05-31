import { type Request, type Response } from "express";
import { whatsAppService } from "../app.js";
import { prisma } from "../Database/Prisma.js";
import { Env } from "../utils/Envirolment.js";


import { type MlProducts } from "../types/MLPRODUCTS.js"

export class PromosController {


    messageFormat(product: MlProducts) {

        const lines: string[] = []

        lines.push(`🔥 *${product.title.trim()}*`);
        lines.push(''); // Linha em branco para respirar

        if ((product).badge) {
            lines.push(`⚡ *Destaque:* _${product.badge}_`);
        }
        lines.push('')

        // 2. Alerta de Cupom (Se houver)
        if (product.coupon) {
            lines.push(`🏷️ ${product.coupon} `);
        }

        // 3. Bloco de Preços
        if (product.originalPrice) {
            lines.push(`De: ~~R$ ${product.originalPrice.toFixed(2).replace('.', ',')}~~`);
        }

        lines.push(`*Por: R$ ${product.price.toFixed(2).replace('.', ',')}*`);
        lines.push('');

        // 4. Link de Destino (Onde a mágica acontece)
        const urlOriginal = product.link;

        // Injetamos as tuas tags de afiliado direto nela usando a sintaxe de URL do JS
        const urlObj = new URL(urlOriginal);

        if (urlObj.hostname.toLowerCase().includes("mercadolivre")) {
            urlObj.searchParams.set('matt_tool', Env.MATT_TOOL);
            urlObj.searchParams.set('matt_word', Env.MELI_ID);
            urlObj.searchParams.set('forceInApp', 'true');
        }
        if (urlObj.hostname.toLowerCase().includes("amazon")) {
            // Injeta o seu ID exclusivo do Amazon Associados
            urlObj.searchParams.set('tag', Env.AMAZON_TAG);

            // Limpeza opcional: remove lixos de rastreamento do scraper para encurtar o link longo original
            urlObj.searchParams.delete('qid');
            urlObj.searchParams.delete('sr');
            urlObj.searchParams.delete('pf_rd_r');
            urlObj.searchParams.delete('pf_rd_p');
            urlObj.searchParams.delete('ref_');
        }

        // Encurtamos essa URL customizada (vamos falar disso abaixo)
        lines.push(`*Link com desconto:*`);
        lines.push(urlObj.toString());

        // Retorna todas as linhas juntas separadas por quebra de linha do WhatsApp
        return {
            caption: lines.join('\n'), // O texto formatado que será a legenda
            image: product.imageUrl    // O link da foto que capturamos no scraping
        };
    }

    processProductsML = async (req: Request, res: Response) => {
        try {
            const products = req.body;

            if (!Array.isArray(products)) {
                return res.status(400).json({ error: "O corpo da requisição deve ser um array de produtos." });
            }

            for (const prod of products) {
                try {
                    // 1. Busca se esse ID de promoção já existe no banco
                    const produtoExistente = await prisma.productsMl.findUnique({
                        where: { id: prod.id }
                    });

                    if (!produtoExistente) {
                        // 🚀 CENÁRIO A: Produto/Promoção nova! 
                        // Salva no banco e dispara para o WhatsApp
                        await prisma.productsMl.create({ data: prod });

                        console.log(`📣 [NOVA OFERTA ML] ${prod.title} por R$ ${prod.price} - Enviando para o WhatsApp...`);

                        // Formata a mensagem para enviar
                        const { caption, image } = this.messageFormat(prod);

                        // Envia de forma assíncrona protegida para não travar o loop caso o Baileys falhe
                        await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image);
                    }
                } catch (itemError: any) {
                    // Se der erro em UM produto, loga o erro mas NÃO quebra o loop dos outros produtos
                    console.error(`❌ [Erro Item ML] Falha ao processar o produto ID: ${prod.id}. Erro:`, itemError.message);
                }
            }

            // Responde ao robô que o processamento terminou com sucesso
            return res.status(200).json({ success: true, message: "Produtos do Mercado Livre processados." });

        } catch (error: any) {
            // Captura falhas graves de infraestrutura (ex: banco desconectado)
            console.error("💥 [Erro Crítico ML] Falha geral no processProductsML:", error);
            return res.status(500).json({ error: "Erro interno ao processar ofertas do Mercado Livre." });
        }
    }

    processProductsAmazon = async (req: Request, res: Response) => {
        try {
            const products = req.body;

            if (!Array.isArray(products)) {
                return res.status(400).json({ error: "O corpo da requisição deve ser um array de produtos." });
            }

            for (const prod of products) {
                try {
                    // 1. Busca se esse ID de promoção já existe no banco
                    const produtoExistente = await prisma.productsMl.findUnique({
                        where: { id: prod.id }
                    });

                    if (!produtoExistente) {
                        // 🚀 CENÁRIO A: Produto/Promoção nova! 
                        // Salva no banco e dispara para o WhatsApp
                        await prisma.productsMl.create({ data: prod });

                        console.log(`📣 [NOVA OFERTA AMAZON] ${prod.title} por R$ ${prod.price} - Enviando para o WhatsApp...`);

                        // Formata a mensagem para enviar
                        const { caption, image } = this.messageFormat(prod);

                        // Envia de forma assíncrona protegida
                        await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image);
                    }
                } catch (itemError: any) {
                    // Se der erro em um produto da Amazon, continua o loop de forma segura
                    console.error(`❌ [Erro Item Amazon] Falha ao processar o produto ID: ${prod.id}. Erro:`, itemError.message);
                }
            }

            // Responde ao robô que o processamento terminou com sucesso
            return res.status(200).json({ success: true, message: "Produtos da Amazon processados." });

        } catch (error: any) {
            console.error("💥 [Erro Crítico Amazon] Falha geral no processProductsAmazon:", error);
            return res.status(500).json({ error: "Erro interno ao processar ofertas da Amazon." });
        }
    }
}