import { type Request, type Response } from "express";
import { whatsAppService } from "../app.js";
import { prisma } from "../Database/Prisma.js";
import { Env } from "../utils/Envirolment.js";

import { EncurtaLinkController } from "./EncutarLinkController.js";
import type { NicheConfig } from "../types/niche.js";
import { getActiveNiches } from "../config/index.js";
import { dispatchProductToNiches } from "../Services/NicheDispatcher.js";

const MARGEM_TOLERANCIA = 0.04

export class PromosController {

    private sendToMatchingNiches = async (product: any) => {
        const niches = getActiveNiches();
        const matched = dispatchProductToNiches(product, niches);

        for (const niche of matched) {
            if (!niche.groupJid) continue;

            const msg = await this.messageFormat(product, niche);

            await whatsAppService.sendMessage(niche.groupJid, msg.caption, msg.image, product.id);
        }
    }

    async messageFormat(product: any, niche?: NicheConfig) {

        const lines: string[] = []

        lines.push(`*${product.title.trim()}*`);
        lines.push('');

        if (product.badge) {
            const badgeTrimmed = product.badge.trim()
            if (badgeTrimmed.startsWith('🔥') || badgeTrimmed.startsWith('✨')) {
                lines.push(`_${badgeTrimmed}_`);
            } else {
                lines.push(`⚡ *Destaque:* _${badgeTrimmed}_`);
            }
        }
        lines.push('')

        if (product.originalPrice) {
            lines.push(`~De: R$ ${product.originalPrice.toFixed(2)}~`);
        }

        lines.push(`Por: R$ *${product.price.toFixed(2)}*`);
        lines.push('')

        if (product.installments) {
            lines.push(`💳 ${product.installments}`)
            lines.push('');
        }

        const urlOriginal = product.link;
        const urlObj = new URL(urlOriginal);

        if (urlObj.hostname.toLowerCase().includes("mercadolivre")) {
            urlObj.searchParams.set('matt_tool', Env.MATT_TOOL);
            urlObj.searchParams.set('matt_word', Env.MELI_ID);
            urlObj.searchParams.set('forceInApp', 'true');
        }
        if (urlObj.hostname.toLowerCase().includes("amazon")) {
            const asinMatch = urlObj.pathname.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);

            if (asinMatch && asinMatch[1]) {
                const asin = asinMatch[1].toUpperCase();
                urlObj.pathname = `/dp/${asin}`;
                urlObj.search = '';
            } else {
                urlObj.searchParams.delete('qid');
                urlObj.searchParams.delete('sr');
                urlObj.searchParams.delete('pf_rd_r');
                urlObj.searchParams.delete('pf_rd_p');
                urlObj.searchParams.delete('ref_');
                urlObj.searchParams.delete('sbo');
                urlObj.searchParams.delete('linkCode');
                urlObj.searchParams.delete('linkId');
            }

            urlObj.searchParams.set('tag', Env.AMAZON_TAG);
        }

        let urlEncurt = urlObj.toString()

        if (urlObj.hostname.toLowerCase().includes("mercadolivre")) urlEncurt = await EncurtaLinkController(urlObj.toString());

        lines.push(`*Link com desconto:*`);
        lines.push(urlEncurt);

        if (niche?.groupInviteLink) {
            lines.push('')
            lines.push('🔥 *As melhores ofertas aqui:*')
            lines.push(niche.groupInviteLink)
        }



        return {
            caption: lines.join('\n'),
            image: product.imageUrl
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
                    const produtoExistente = await prisma.productsMl.findUnique({
                        where: { id: prod.id }
                    });

                    if (!produtoExistente) {
                        await prisma.productsMl.create({ data: prod });

                        console.log(`📣 [NOVA OFERTA ML] ${prod.title} por R$ ${prod.price} - Roteando para nichos...`);

                        await this.sendToMatchingNiches(prod);
                    } else {
                        const precoHistorico = produtoExistente.price;
                        const precoNovo = prod.price;
                        const precoLimiteMaximo = precoHistorico * (1 + MARGEM_TOLERANCIA);

                        if (precoNovo < precoHistorico) {
                            console.log(`📉 [ML - BAIXOU REAL] ${prod.title} caiu de R$ ${precoHistorico} para R$ ${precoNovo}!`);

                            prod.badge = `🔥 MENOR PREÇO HISTÓRICO! • ${prod.badge || ''}`;

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    price: precoNovo,
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });

                            await this.sendToMatchingNiches(prod);

                        } else if (precoNovo <= precoLimiteMaximo) {
                            const tempoCooldown = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

                            if (produtoExistente.updatedAt < tempoCooldown) {
                                console.log(`⭐ [ML - REANÚNCIO NA MARGEM] ${prod.title} continua por R$ ${precoNovo}. Já se passou 5 dias, reenviando...`);

                                prod.badge = `✨ Preço Excelente! • ${prod.badge || ''}`;

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });

                                await this.sendToMatchingNiches(prod);
                            } else {
                                console.log(`🤫 [ML - SILENCIADO] ${prod.title} continua por R$ ${precoNovo} dentro dos 5 dias. Apenas atualizando banco.`);

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });
                            }

                        } else {
                            console.log(`🔺 [ML - FLUTUAÇÃO] ${prod.title} subiu para R$ ${precoNovo} (Menor Histórico: R$ ${precoHistorico}). Silenciado.`);

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });
                        }
                    }
                } catch (itemError: any) {
                    console.error(`❌ [Erro Item ML] Falha ao processar o produto ID: ${prod.id}. Erro:`, itemError.message);
                }
            }

            return res.status(200).json({ success: true, message: "Produtos do Mercado Livre processados." });

        } catch (error: any) {
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
                    const produtoExistente = await prisma.productsMl.findUnique({
                        where: { id: prod.id }
                    });

                    if (!produtoExistente) {
                        await prisma.productsMl.create({ data: prod });

                        console.log(`📣 [NOVA OFERTA AMAZON] ${prod.title} por R$ ${prod.price} - Roteando para nichos...`);

                        await this.sendToMatchingNiches(prod);

                    } else {
                        const precoHistorico = produtoExistente.price
                        const precoNovo = prod.price
                        const precoLimiteMaximo = precoHistorico * (1 + MARGEM_TOLERANCIA)

                        if (precoNovo < precoHistorico) {
                            console.log(`📉 [AMAZON - BAIXOU REAL] ${prod.title} caiu de R$ ${precoHistorico} para R$ ${precoNovo}!`);

                            prod.badge = `🔥 MENOR PREÇO HISTÓRICO! • ${prod.badge || ''}`;

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    price: precoNovo,
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });

                            await this.sendToMatchingNiches(prod);

                        } else if (precoNovo <= precoLimiteMaximo) {
                            const tempoCooldown = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

                            if (produtoExistente.updatedAt < tempoCooldown) {
                                console.log(`⭐ [AMAZON - REANÚNCIO NA MARGEM] ${prod.title} continua por R$ ${precoNovo} (dentro da margem). Já se passaram 5 dias, reenviando...`);

                                prod.badge = `✨ Preço Excelente! • ${prod.badge || ''}`;

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });

                                await this.sendToMatchingNiches(prod);

                            } else {
                                console.log(`🤫 [AMAZON - SILENCIADO] ${prod.title} continua por R$ ${precoNovo}. Já foi postado recentemente nos últimos 5 dias. Apenas atualizando dados.`);

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });
                            }
                        } else {
                            console.log(`🔺 [AMAZON - FLUTUAÇÃO] ${prod.title} está por R$ ${precoNovo}, mas o menor histórico é R$ ${precoHistorico} (Limite: R$ ${precoLimiteMaximo.toFixed(2)}). Apenas atualizando banco.`);

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });
                        }
                    }

                } catch (itemError: any) {
                    console.error(`❌ [Erro Item Amazon] Falha ao processar o produto ID: ${prod.id}. Erro:`, itemError.message);
                }
            }

            return res.status(200).json({ success: true, message: "Produtos da Amazon processados." });

        } catch (error: any) {
            console.error("💥 [Erro Crítico Amazon] Falha geral no processProductsAmazon:", error);
            return res.status(500).json({ error: "Erro interno ao processar ofertas da Amazon." });
        }
    }

    processProductsShopee = async (products: any) => {
        try {

            if (!Array.isArray(products)) return

            for (const prod of products) {
                try {
                    const produtoExistente = await prisma.productsMl.findUnique({
                        where: { id: prod.id }
                    });

                    if (!produtoExistente) {
                        await prisma.productsMl.create({ data: prod });

                        console.log(`📣 [NOVA OFERTA SHOPEE] ${prod.title} por R$ ${prod.price} - Roteando para nichos...`);

                        await this.sendToMatchingNiches(prod);

                    } else {
                        const precoHistorico = produtoExistente.price
                        const precoNovo = prod.price
                        const precoLimiteMaximo = precoHistorico * (1 + MARGEM_TOLERANCIA)

                        if (precoNovo < precoHistorico) {
                            console.log(`📉 [SHOPEE - BAIXOU REAL] ${prod.title} caiu de R$ ${precoHistorico} para R$ ${precoNovo}!`);

                            prod.badge = `🔥 MENOR PREÇO HISTÓRICO! • ${prod.badge || ''}`;

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    price: precoNovo,
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });

                            await this.sendToMatchingNiches(prod);

                        } else if (precoNovo <= precoLimiteMaximo) {
                            const tempoCooldown = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

                            if (produtoExistente.updatedAt < tempoCooldown) {
                                console.log(`⭐ [SHOPEE - REANÚNCIO NA MARGEM] ${prod.title} continua por R$ ${precoNovo} (dentro da margem). Já se passaram 3 dias, reenviando...`);

                                prod.badge = `✨ Preço Excelente! • ${prod.badge || ''}`;

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });

                                await this.sendToMatchingNiches(prod);

                            } else {
                                console.log(`🤫 [SHOPEE - SILENCIADO] ${prod.title} continua por R$ ${precoNovo}. Já foi postado recentemente nos últimos 3. Apenas atualizando dados.`);

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });
                            }
                        } else {
                            console.log(`🔺 [SHOPEE - FLUTUAÇÃO] ${prod.title} está por R$ ${precoNovo}, mas o menor histórico é R$ ${precoHistorico} (Limite: R$ ${precoLimiteMaximo.toFixed(2)}). Apenas atualizando banco.`);

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });
                        }
                    }

                } catch (itemError: any) {
                    console.error(`❌ [Erro Item Shopee] Falha ao processar o produto ID: ${prod.id}. Erro:`, itemError.message);
                }
            }

        } catch (error: any) {
            return console.error("💥 [Erro Crítico Shopee] Falha geral no processProductsShopee:", error);
        }
    }
}
