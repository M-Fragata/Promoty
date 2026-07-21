import { type Request, type Response } from "express";
import { whatsAppService } from "../app.js";
import { prisma } from "../Database/Prisma.js";

import type { NicheConfig } from "../types/niche.js";
import { getActiveNiches } from "../config/index.js";
import { dispatchProductToNiches } from "../Services/NicheDispatcher.js";
import { buildAffiliateUrl } from "../utils/affiliateUtils.js";
import { SecondaryFunction } from "../utils/secondaryFunction.js";
import { categorizeProduct } from "../utils/categoryClassifier.js";
import { Env } from "../utils/Envirolment.js";

const MARGEM_TOLERANCIA = 0.04
const utils = new SecondaryFunction();

function ensureCategory(prod: any): void {
  if (!prod.category) {
    const niches = getActiveNiches();
    const matchedNiches = dispatchProductToNiches(prod, niches);
    const nicheId = matchedNiches[0]?.id;
    prod.category = categorizeProduct(prod.title, nicheId);
  }
}

export class PromosController {

    private sendToMatchingNiches = async (product: any) => {
        const niches = getActiveNiches();
        const matched = dispatchProductToNiches(product, niches);

        console.log(`🔍 [DISPATCH] Produto: "${product.title.substring(0, 50)}..." | Nichos ativos: ${niches.length} | Matched: ${matched.length}`);

        if (matched.length === 0) {
            console.log(`⚠️ [DISPATCH] Nenhum nicho aceitou o produto. Verificando motivo...`);
            for (const niche of niches) {
                const kw = utils.verifyKeyWords(product.title, niche);
                const bw = utils.verifyBanWords(product.title, niche);
                const lw = utils.checkLimitedWords(product.title, niche);
                const disc = utils.verifyDiscount(product.originalPrice, product.price, niche);
                const price = utils.verifyMaxPrice(product.price, niche);
                console.log(`  → ${niche.id}: keyword=${kw} banword=${bw} limited=${lw} discount=${disc} price=${price}`);
            }
            return;
        }

        for (const niche of matched) {
            console.log(`📤 [DISPATCH] Enviando para niche: ${niche.id} | groupJid: ${niche.groupJid || 'VAZIO!'}`);

            if (!niche.groupJid) {
                console.log(`❌ [DISPATCH] groupJid vazio! Pulando envio para ${niche.id}`);
                continue;
            }

            const msg = await this.messageFormat(product, niche);
            console.log(`📤 [DISPATCH] imageUrl: ${msg.image ? 'OK' : 'NULL!'}`);

            const result = await whatsAppService.sendMessage(niche.groupJid, msg.caption, msg.image, product.id);
            console.log(`📤 [DISPATCH] Resultado: ${result ? '✅ Sucesso' : '❌ Falha'}`);
        }
    }

    async messageFormat(product: any, niche?: NicheConfig) {

        const lines: string[] = []

        lines.push(`*${product.title.trim()}*`);
        lines.push('');

        if (product.badge) {
            const badgeTrimmed = product.badge.trim();
            const storeName = product.store || '';

            const percentMatch = badgeTrimmed.match(/(\d+%\s*OFF)/i);
            const percent = percentMatch ? percentMatch[1] : '';

            const isMenorPreco = badgeTrimmed.includes('MENOR PREÇO HISTÓRICO');
            const isPrecoExcelente = badgeTrimmed.includes('Preço Excelente');
            const isOfertaRelampago = badgeTrimmed.includes('Oferta Relâmpago');

            if (storeName && percent) {
                lines.push(`${storeName} *${percent}*`);
            } else if (percent) {
                lines.push(`*${percent}*`);
            }

            if (isMenorPreco) {
                lines.push('🔥 Menor preço histórico');
            } else if (isPrecoExcelente) {
                lines.push('✨ Preço Excelente!');
            } else if (isOfertaRelampago) {
                lines.push('⚡ Oferta Relâmpago');
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

        // Link para a página de detalhes do produto no nosso site
        lines.push(`*Link com desconto:*`);
        lines.push(`${Env.FRONTEND_URL}/produto/${product.id}`);

        // URL já vem processada do banco (affiliate + encurtado para ML)
        // lines.push(`*Link com desconto:*`);
        // lines.push(product.link);

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

            const niches = getActiveNiches();

            for (const prod of products) {
                try {
                    // Processar URL com afiliado + encurtar (ML)
                    prod.link = await buildAffiliateUrl(prod.link);

                    // Determinar category antes de salvar
                    ensureCategory(prod);

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
                                    link: prod.link,
                                    category: prod.category
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
                                        link: prod.link,
                                        category: prod.category
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
                                        link: prod.link,
                                        category: prod.category
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
                                    link: prod.link,
                                    category: prod.category
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
                    // Processar URL com afiliado (Amazon: tag, ML: tag + encurtador)
                    prod.link = await buildAffiliateUrl(prod.link);

                    // Determinar category antes de salvar
                    ensureCategory(prod);

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
                                    link: prod.link,
                                    category: prod.category
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
                                        link: prod.link,
                                        category: prod.category
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
                                        link: prod.link,
                                        category: prod.category
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
                                    link: prod.link,
                                    category: prod.category
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

    processProductsAwin = async (products: any) => {
        try {

            if (!Array.isArray(products)) return

            for (const prod of products) {
                try {
                    ensureCategory(prod);

                    const produtoExistente = await prisma.productsMl.findUnique({
                        where: { id: prod.id }
                    });

                    if (!produtoExistente) {
                        await prisma.productsMl.create({ data: prod });

                        console.log(`📣 [NOVA OFERTA AWIN] ${prod.title} por R$ ${prod.price} - Roteando para nichos...`);

                        await this.sendToMatchingNiches(prod);

                    } else {
                        const precoHistorico = produtoExistente.price
                        const precoNovo = prod.price
                        const precoLimiteMaximo = precoHistorico * (1 + MARGEM_TOLERANCIA)

                        if (precoNovo < precoHistorico) {
                            console.log(`📉 [AWIN - BAIXOU REAL] ${prod.title} caiu de R$ ${precoHistorico} para R$ ${precoNovo}!`);

                            prod.badge = `🔥 MENOR PREÇO HISTÓRICO! • ${prod.badge || ''}`;

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    price: precoNovo,
                                    originalPrice: prod.originalPrice,
                                    badge: prod.badge,
                                    link: prod.link,
                                    category: prod.category
                                }
                            });

                            await this.sendToMatchingNiches(prod);

                        } else if (precoNovo <= precoLimiteMaximo) {
                            const tempoCooldown = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

                            if (produtoExistente.updatedAt < tempoCooldown) {
                                console.log(`⭐ [AWIN - REANÚNCIO NA MARGEM] ${prod.title} continua por R$ ${precoNovo} (dentro da margem). Já se passaram 3 dias, reenviando...`);

                                prod.badge = `✨ Preço Excelente! • ${prod.badge || ''}`;

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        badge: prod.badge,
                                        link: prod.link,
                                        category: prod.category
                                    }
                                });

                                await this.sendToMatchingNiches(prod);

                            } else {
                                console.log(`🤫 [AWIN - SILENCIADO] ${prod.title} continua por R$ ${precoNovo}. Já foi postado recentemente nos últimos 3 dias. Apenas atualizando dados.`);

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        badge: prod.badge,
                                        link: prod.link,
                                        category: prod.category
                                    }
                                });
                            }
                        } else {
                            console.log(`🔺 [AWIN - FLUTUAÇÃO] ${prod.title} está por R$ ${precoNovo}, mas o menor histórico é R$ ${precoHistorico} (Limite: R$ ${precoLimiteMaximo.toFixed(2)}). Apenas atualizando banco.`);

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    originalPrice: prod.originalPrice,
                                    badge: prod.badge,
                                    link: prod.link,
                                    category: prod.category
                                }
                            });
                        }
                    }

                } catch (itemError: any) {
                    console.error(`❌ [Erro Item AWIN] Falha ao processar o produto ID: ${prod.id}. Erro:`, itemError.message);
                }
            }

        } catch (error: any) {
            return console.error("💥 [Erro Crítico AWIN] Falha geral no processProductsAwin:", error);
        }
    }

    processProductsShopee = async (products: any) => {
        try {

            if (!Array.isArray(products)) return

            for (const prod of products) {
                try {
                    // Determinar category antes de salvar
                    ensureCategory(prod);

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
                                    link: prod.link,
                                    category: prod.category
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
                                        link: prod.link,
                                        category: prod.category
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
                                        link: prod.link,
                                        category: prod.category
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
                                    link: prod.link,
                                    category: prod.category
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
