import { type Request, type Response } from "express";
import { whatsAppService } from "../app.js";
import { prisma } from "../Database/Prisma.js";
import { Env } from "../utils/Envirolment.js";

import { EncurtaLinkController } from "./EncutarLinkController.js";

import { type MlProducts } from "../types/MLPRODUCTS.js"

const MARGEM_TOLERANCIA = 0.04 //Margem de tolerância: 4% acima do menor preço histórico

const groupURL = "https://chat.whatsapp.com/DVuVPqJ2DwZ4oZUU1maZIi"

export class PromosController {

    async messageFormat(product: MlProducts) {

        const lines: string[] = []

        lines.push(`*${product.title.trim()}*`);
        lines.push(''); // Linha em branco para respirar

        if (product.badge) {
            const badgeTrimmed = product.badge.trim()
            // Se a badge começar com nossos gatilhos fortes, removemos o "⚡ Destaque:"
            if (badgeTrimmed.startsWith('🔥') || badgeTrimmed.startsWith('✨')) {
                lines.push(`_${badgeTrimmed}_`);
            } else {
                // Para capturas normais do scraper, mantém o formato padrão que você já usa
                lines.push(`⚡ *Destaque:* _${badgeTrimmed}_`);
            }
        }
        lines.push('')

        // 3. Bloco de Preços
        if (product.originalPrice) {
            lines.push(`~De: R$ ${product.originalPrice.toFixed(2)}~`);
        }

        lines.push('')

        lines.push(`Por: R$ *${product.price.toFixed(2)}*`);
        if(product.installments){
            lines.push(`💳 ${product.installments}`)
        }
/*
        // 2. Alerta de Cupom (Se houver)
        if (product.coupon) {
            // Remove quebras de linha (\n, \r) e espaços duplicados trazidos pelo scraper
            const cupomLimpo = product.coupon
                .replace(/[\r\n]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (cupomLimpo) {
                // Se a string já contiver a palavra "Cupom", não duplicamos o texto
                if (cupomLimpo.toLowerCase().includes('cupom')) {
                    lines.push(`🎟️ *${cupomLimpo}*`);
                } else {
                    lines.push(`🎟️ *Cupom:* \`${cupomLimpo}\``);
                }
                lines.push(''); // Linha em branco para separar do preço
            }
        }
*/
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
            // 1. Tenta encontrar o código ASIN na rota da URL usando Regex
            // O ASIN sempre tem 10 caracteres alfanuméricos após /dp/ ou /gp/product/
            const asinMatch = urlObj.pathname.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);

            if (asinMatch && asinMatch[1]) {
                const asin = asinMatch[1].toUpperCase();

                // 2. Simplifica a rota da URL deixando apenas /dp/ASIN
                urlObj.pathname = `/dp/${asin}`;

                // 3. Limpa TODOS os parâmetros de busca antigos de uma vez só
                urlObj.search = '';
            } else {
                // Caso não ache o ASIN (mecanismo de segurança), remove apenas os principais lixos que você já tinha mapeado
                urlObj.searchParams.delete('qid');
                urlObj.searchParams.delete('sr');

                urlObj.searchParams.delete('pf_rd_r');
                urlObj.searchParams.delete('pf_rd_p');
                urlObj.searchParams.delete('ref_');
                urlObj.searchParams.delete('sbo');
                urlObj.searchParams.delete('linkCode');
                urlObj.searchParams.delete('linkId');
            }

            // 4. Injeta o seu ID exclusivo do Amazon Associados (garante a comissão)
            urlObj.searchParams.set('tag', Env.AMAZON_TAG);
        }

        const customSlug = GetCustomSlug(product.title);
        const urlEncurt = await EncurtaLinkController(urlObj.toString(), customSlug);

        // Encurtamos essa URL customizada (vamos falar disso abaixo)
        lines.push(`*Link com desconto:*`);
        lines.push(urlEncurt);

        //link do grupo
        lines.push('')
        lines.push('🔥 *As melhores ofertas aqui:*')
        lines.push(groupURL)


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

                        const { caption, image } = await this.messageFormat(prod);

                        await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image, prod.id);
                    } else {
                        const precoHistorico = produtoExistente.price;
                        const precoNovo = prod.price;

                        // Calcula o teto aceitável da margem (ex: 420 * 1.04 = 436.80)
                        const precoLimiteMaximo = precoHistorico * (1 + MARGEM_TOLERANCIA);

                        if (precoNovo < precoHistorico) {
                            // 📉 Sub-cenário B1: Bateu um novo recorde absoluto de menor preço!
                            console.log(`📉 [ML - BAIXOU REAL] ${prod.title} caiu de R$ ${precoHistorico} para R$ ${precoNovo}!`);


                            prod.badge = `🔥 MENOR PREÇO HISTÓRICO! • ${prod.badge || ''}`;

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    price: precoNovo, // Define o novo recorde no banco de dados
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });

                            const { caption, image } = await this.messageFormat(prod);
                            await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image, prod.id);

                        } else if (precoNovo <= precoLimiteMaximo) {
                            // ⭐ Sub-cenário B2: Está dentro da margem de 4% (Preço Excelente)
                            // Aplicamos o Cooldown de 24 horas usando o updatedAt para evitar o spam de loops idênticos
                            const tempoCooldown = new Date(Date.now() - 24 * 60 * 60 * 1000);

                            if (produtoExistente.updatedAt < tempoCooldown) {
                                console.log(`⭐ [ML - REANÚNCIO NA MARGEM] ${prod.title} continua por R$ ${precoNovo}. Já se passaram 24h, reenviando...`);

                                prod.badge = `✨ Preço Excelente! • ${prod.badge || ''}`;

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                        // O Prisma joga o updatedAt para NOW() automaticamente aqui, resetando o relógio
                                    }
                                });

                                const { caption, image } = await this.messageFormat(prod);

                                await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image, prod.id);
                            } else {
                                // 🤫 Continua na promoção pelo mesmo preço dentro da janela de 24h
                                console.log(`🤫 [ML - SILENCIADO] ${prod.title} continua por R$ ${precoNovo} dentro das 24h. Apenas atualizando banco.`);

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
                            // 🔺 Sub-cenário B3: O preço subiu ou flutuou fora do limite aceitável
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
            const products: MlProducts[] = req.body;

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
                        const { caption, image } = await this.messageFormat(prod);

                        // Envia de forma assíncrona protegida
                        await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image, prod.id);

                    } else {

                        const precoHistorico = produtoExistente.price
                        const precoNovo = prod.price

                        const precoLimiteMaximo = precoHistorico * (1 + MARGEM_TOLERANCIA)

                        if (precoNovo < precoHistorico) {

                            console.log(`📉 [AMAZON - BAIXOU REAL] ${prod.title} caiu de R$ ${precoHistorico} para R$ ${precoNovo}!`);

                            // Forçamos o badge a destacar o novo menor preço histórico
                            prod.badge = `🔥 MENOR PREÇO HISTÓRICO! • ${prod.badge || ''}`;

                            await prisma.productsMl.update({
                                where: { id: prod.id },
                                data: {
                                    price: precoNovo, // Atualiza para o novo recorde no banco
                                    originalPrice: prod.originalPrice,
                                    coupon: prod.coupon,
                                    badge: prod.badge,
                                    link: prod.link
                                }
                            });

                            const { caption, image } = await this.messageFormat(prod);
                            await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image, prod.id);

                        } else if (precoNovo <= precoLimiteMaximo) {
                            // ⏰ Define o tempo de Cooldown (Ex: 24 horas atrás)
                            const tempoCooldown = new Date(Date.now() - 24 * 60 * 60 * 1000);

                            // Checa se a última atualização do produto no banco aconteceu HÁ MAIS de 24 horas
                            if (produtoExistente.updatedAt < tempoCooldown) {

                                console.log(`⭐ [AMAZON - REANÚNCIO NA MARGEM] ${prod.title} continua por R$ ${precoNovo} (dentro da margem). Já se passaram 24h, reenviando...`);

                                prod.badge = `✨ Preço Excelente! • ${prod.badge || ''}`;

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                        // O Prisma atualiza o 'updatedAt' automaticamente para 'now()' aqui, resetando o relógio de 24h!
                                    }
                                });

                                const { caption, image } = await this.messageFormat(prod);
                                await whatsAppService.sendMessage(Env.WHATSAPP_GROUP_JID, caption, image, prod.id);

                            } else {
                                // 🤫 O preço continua igual e está dentro das 24h desde o último envio.
                                console.log(`🤫 [AMAZON - SILENCIADO] ${prod.title} continua por R$ ${precoNovo}. Já foi postado recentemente nas últimas 24h. Apenas atualizando dados.`);

                                await prisma.productsMl.update({
                                    where: { id: prod.id },
                                    data: {
                                        originalPrice: prod.originalPrice,
                                        coupon: prod.coupon,
                                        badge: prod.badge,
                                        link: prod.link
                                    }
                                });
                                // NÃO envia para o WhatsApp!
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

function GetCustomSlug(title: string): string {
    // 1. Deixa em minúsculas e remove acentos
    const textoTratado = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

    // 2. Transforma hifens, barras ou caracteres especiais em espaços simples para isolar as palavras puro texto
    const textoLimpo = textoTratado
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // 3. Divide estritamente por espaços e captura as 5 primeiras palavras reais
    const palavras = textoLimpo.split(" ").filter(p => p.length > 0);
    const primeirasPalavras = palavras.slice(0, 5);

    // 4. Junta tudo com hífen
    const slugFinal = primeirasPalavras.join("-");

    // 5. Garantia total anti-rejeição: remove hifens que possam ter sobrado nas pontas
    return slugFinal.replace(/^-+|-+$/g, "");
}