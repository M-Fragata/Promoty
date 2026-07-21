import { type Request, type Response } from "express";
import { Env } from "../utils/Envirolment.js";
import crypto from "node:crypto"

import { SecondaryFunction } from "../utils/secondaryFunction.js"
import { PromosController } from "./PromosController.js"
import { getActiveNiches } from "../config/index.js"

const shopeeController = new PromosController()
const utils = new SecondaryFunction()

interface Produto {
    itemId: string,
    productName: string,
    priceMin: number,
    priceMax: number,
    offerLink: string,
    productLink: string
    imageUrl: string
    priceDiscountRate: number
}

export class ShopeePromosController {

    private static counterShopee: number = 0
    private static counterCategories: number = 0
    private static counterPagePichau: number = 1
    private static counterPageTerabyte: number = 1

    private static getAllShopeeKeywordGroups(niche?: 'tech' | 'casa'): string[][] {
        const niches = getActiveNiches();

        if (niche === 'tech') {
            return niches.find(n => n.id === "tech")?.shopeeKeywordGroups ?? [];
        }
        if (niche === 'casa') {
            return niches.find(n => n.id === "casa-moda-feminina")?.shopeeKeywordGroups ?? [];
        }

        // Fallback: mistura todas (crawler antigo)
        const techGroups = niches.find(n => n.id === "tech")?.shopeeKeywordGroups ?? [];
        const casaGroups = niches.find(n => n.id === "casa-moda-feminina")?.shopeeKeywordGroups ?? [];

        const maxLen = Math.max(techGroups.length, casaGroups.length);
        const mixed: string[][] = [];

        for (let i = 0; i < maxLen; i++) {
            const group: string[] = [];

            // Se techGroups[i] for undefined, o ?? [] garante um array vazio iterável pro spread
            if (i < techGroups.length) {
                group.push(...(techGroups[i] ?? []));
            }

            // O mesmo vale para o grupo de casa
            if (i < casaGroups.length) {
                group.push(...(casaGroups[i] ?? []));
            }

            mixed.push(group);
        }

        return mixed;
    }

    private static productMatchesAnyNiche(productName: string, priceDiscountRate: number, priceNumber: number): boolean {
        const niches = getActiveNiches();
        return niches.some(niche =>
            priceDiscountRate >= niche.minDiscount &&
            utils.verifyKeyWords(productName, niche) &&
            !utils.verifyBanWords(productName, niche) &&
            utils.checkLimitedWords(productName, niche) &&
            utils.verifyMaxPrice(priceNumber, niche)
        );
    }

    async GetProducts(req: Request, res: Response) {

        const niche = req.query.niche as 'tech' | 'casa' | undefined;
        const keywords = ShopeePromosController.getAllShopeeKeywordGroups(niche);

        try {

            if (ShopeePromosController.counterShopee > keywords.length) ShopeePromosController.counterShopee = 0

            for (const keyword of keywords[ShopeePromosController.counterShopee]!) {

                const produtos: any[] = []
                const timeStamp = Math.floor(Date.now() / 1000);

                const payload = {
                    query: `query {
                        productOfferV2(keyword: "${keyword}", limit: 20, sortType: 1) {
                            nodes {
                                itemId
                                productName
                                priceMin
                                priceMax
                                offerLink
                                productLink
                                imageUrl
                                commissionRate
                                priceDiscountRate
                            }
                        }
                    }`
                };

                const payloadString = JSON.stringify(payload);
                const signatureFactor = Env.SHOPEE_API_ID + timeStamp + payloadString + Env.SHOPEE_API_PASSWORD;
                const signature = crypto.createHash('sha256').update(signatureFactor).digest('hex');

                const response = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json",
                        "Authorization": `SHA256 Credential=${Env.SHOPEE_API_ID}, Timestamp=${timeStamp}, Signature=${signature}`
                    },
                    body: payloadString
                });

                if (!response.ok) {
                    console.error(`⚠️ [Shopee API] Erro no fetch da keyword [${keyword}]: Status ${response.status}`);
                    continue;
                }

                const result = await response.json();

                const data = result.data?.productOfferV2?.nodes || []

                const produtosShopee = await data.reduce((acc: any[], produto: Produto) => {

                    const priceNumber = Number(produto.priceMin);
                    const priceOrginalNumber = priceNumber / (1 - produto.priceDiscountRate / 100);

                    if (!ShopeePromosController.productMatchesAnyNiche(produto.productName, produto.priceDiscountRate, priceNumber)) return acc
                    if (acc.some(p => p.title.toLowerCase() === produto.productName.toLowerCase())) return acc

                    acc.push({
                        id: produto.itemId.toString(),
                        title: produto.productName,
                        price: parseFloat(priceNumber.toFixed(2)),
                        originalPrice: parseFloat(priceOrginalNumber.toFixed(2)),
                        coupon: null,
                        badge: (`${produto.priceDiscountRate}% OFF`),
                        imageUrl: produto.imageUrl,
                        link: produto.offerLink,
                        store: "Shopee",
                        installments: null
                    })

                    return acc
                }, [])

                produtos.push(...produtosShopee)

                if (produtos.length > 0) {
                    shopeeController.processProductsShopee(produtos);
                    console.log(`🚀 [Shopee Keywords] Enviados ${produtos.length} produtos em oferta para processamento.`);
                } else {
                    console.log(`♻️ [Shopee Keywords] Varredura concluída, mas nenhuma oferta bateu os critérios de >30% OFF.`);
                }

                // Pausa de 2 segundos entre chamadas para não estourar limite da API
                await sleep(2000);
            }

            ShopeePromosController.counterShopee++

            return res.status(200).json({ success: true });

        } catch (error: any) {
            console.error("Erro crítico no loop:", error);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }

    async GetPichauShop(req: Request, res: Response) {

        const timeStamp = Math.floor(Date.now() / 1000);
        const shopID = 627750190 // ID pichau
        const payload = {
            query: `query {
                    productOfferV2(
                    shopId: ${shopID}, limit: 15, page: ${ShopeePromosController.counterPagePichau} ,sortType: 1
                    ){
                        nodes {
                            itemId
                            productName
                            priceMin
                            priceMax
                            offerLink
                            productLink
                            imageUrl
                            priceDiscountRate
                        }
                    }
                }`
        };

        const payloadString = JSON.stringify(payload);
        const signatureFactor = Env.SHOPEE_API_ID + timeStamp + payloadString + Env.SHOPEE_API_PASSWORD;
        const signature = crypto.createHash('sha256').update(signatureFactor).digest('hex');

        try {

            const response = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": `SHA256 Credential=${Env.SHOPEE_API_ID}, Timestamp=${timeStamp}, Signature=${signature}`
                },
                body: payloadString
            });

            if (!response.ok) {
                console.log("Erro: ", response)
                return res.status(404).json({ error: "Erro na resposta" })
            }
            const result = await response.json();

            const data = result.data?.productOfferV2?.nodes || []

            const produtos: any[] = await data.reduce((acc: any[], produto: Produto) => {

                const priceNumber = Number(produto.priceMin);
                const priceOrginalNumber = priceNumber / (1 - produto.priceDiscountRate / 100);

                if (!ShopeePromosController.productMatchesAnyNiche(produto.productName, produto.priceDiscountRate, priceNumber)) return acc
                if (acc.some(p => p.title.toLowerCase() === produto.productName.toLowerCase())) return acc

                acc.push({
                    id: produto.itemId.toString(),
                    title: produto.productName,
                    price: parseFloat(priceNumber.toFixed(2)),
                    originalPrice: parseFloat(priceOrginalNumber.toFixed(2)),
                    coupon: null,
                    badge: (`${produto.priceDiscountRate}% OFF`),
                    imageUrl: produto.imageUrl,
                    link: produto.offerLink,
                    store: "Shopee",
                    installments: null
                })

                return acc

            }, [])

            if (produtos.length > 0) {
                shopeeController.processProductsShopee(produtos);
                console.log(`🚀 [Shopee Pichau] Enviados ${produtos.length} produtos em oferta para processamento.`);
            } else {
                console.log(`♻️ [Shopee Pichau] Varredura concluída, mas nenhuma oferta bateu os critérios de >30% OFF.`);

                ShopeePromosController.counterPagePichau = 1
            }

            ShopeePromosController.counterPagePichau++

            await sleep(2000);

            return res.status(200).json({ success: true, total: produtos.length });

        } catch (error) {
            console.error("Erro crítico no loop:", error);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }

    async GetTerabyteShop(req: Request, res: Response) {

        const timeStamp = Math.floor(Date.now() / 1000);
        const shopID = 1552226494 // ID terabyte
        const payload = {
            query: `query {
                    productOfferV2(
                    shopId: ${shopID}, limit: 15, page: ${ShopeePromosController.counterPageTerabyte}, sortType: 1
                    ){
                        nodes {
                            itemId
                            productName
                            priceMin
                            priceMax
                            offerLink
                            productLink
                            imageUrl
                            priceDiscountRate
                        }
                    }
                }`
        };

        const payloadString = JSON.stringify(payload);
        const signatureFactor = Env.SHOPEE_API_ID + timeStamp + payloadString + Env.SHOPEE_API_PASSWORD;
        const signature = crypto.createHash('sha256').update(signatureFactor).digest('hex');

        try {

            const response = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": `SHA256 Credential=${Env.SHOPEE_API_ID}, Timestamp=${timeStamp}, Signature=${signature}`
                },
                body: payloadString
            });

            if (!response.ok) {
                console.log("Erro: ", response)
                return res.status(404).json({ error: "Erro na resposta" })
            }
            const result = await response.json();

            const data = result.data?.productOfferV2?.nodes || []

            const produtos: any[] = await data.reduce((acc: any[], produto: Produto) => {

                const priceNumber = Number(produto.priceMin);
                const priceOrginalNumber = priceNumber / (1 - produto.priceDiscountRate / 100);

                if (!ShopeePromosController.productMatchesAnyNiche(produto.productName, produto.priceDiscountRate, priceNumber)) return acc
                if (acc.some(p => p.title.toLowerCase() === produto.productName.toLowerCase())) return acc

                acc.push({
                    id: produto.itemId.toString(),
                    title: produto.productName,
                    price: parseFloat(priceNumber.toFixed(2)),
                    originalPrice: parseFloat(priceOrginalNumber.toFixed(2)),
                    coupon: null,
                    badge: (`${produto.priceDiscountRate}% OFF`),
                    imageUrl: produto.imageUrl,
                    link: produto.offerLink,
                    store: "Shopee",
                    installments: null
                })

                return acc

            }, [])

            if (produtos.length > 0) {
                shopeeController.processProductsShopee(produtos);

                console.log(`🚀 [Shopee Terabyte] Enviados ${produtos.length} produtos em oferta para processamento.`);
                console.log(produtos)
            } else {
                console.log(`♻️ [Shopee Terabyte] Varredura concluída, mas nenhuma oferta bateu os critérios de >30% OFF.`);

                ShopeePromosController.counterPageTerabyte = 1
            }

            ShopeePromosController.counterPageTerabyte++

            await sleep(2000);

            return res.status(200).json({ success: true, total: produtos.length });

        } catch (error) {
            console.error("Erro crítico no loop:", error);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }

    async GetByCategories(req: Request, res: Response) {
        const nicheParam = req.query.niche as string | undefined;
        const niches = getActiveNiches();
        const nicheId = nicheParam === 'casa' ? 'casa-moda-feminina' : nicheParam;
        const categoryGroups = niches.find(n => n.id === nicheId)?.shopeeCategoriesGroup ?? [];

        if (categoryGroups.length === 0) {
            return res.status(400).json({ error: `Nenhuma categoria encontrada para o nicho: ${nicheParam}` });
        }

        if (ShopeePromosController.counterCategories >= categoryGroups.length) {
            ShopeePromosController.counterCategories = 0;
        }

        const group = categoryGroups[ShopeePromosController.counterCategories]!;
        const groupIndex = ShopeePromosController.counterCategories;
        let totalEnviados = 0;

        try {
            for (const category of group) {
                const timeStamp = Math.floor(Date.now() / 1000);

                const payload = {
                    query: `query {
                        productOfferV2(productCatId: ${category.id}, limit: 20, sortType: 2) {
                            nodes {
                                itemId
                                productName
                                priceMin
                                priceMax
                                offerLink
                                productLink
                                imageUrl
                                commissionRate
                                priceDiscountRate
                            }
                        }
                    }`
                };

                const payloadString = JSON.stringify(payload);
                const signatureFactor = Env.SHOPEE_API_ID + timeStamp + payloadString + Env.SHOPEE_API_PASSWORD;
                const signature = crypto.createHash('sha256').update(signatureFactor).digest('hex');

                const response = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json",
                        "Authorization": `SHA256 Credential=${Env.SHOPEE_API_ID}, Timestamp=${timeStamp}, Signature=${signature}`
                    },
                    body: payloadString
                });

                if (!response.ok) {
                    console.error(`⚠️ [Shopee Categories] Erro na categoria [${category.name}]: Status ${response.status}`);
                    await sleep(2000);
                    continue;
                }

                const result = await response.json();
                const data = result.data?.productOfferV2?.nodes || [];

                const produtos = data.reduce((acc: any[], produto: Produto) => {
                    const priceNumber = Number(produto.priceMin);
                    const priceOriginalNumber = priceNumber / (1 - produto.priceDiscountRate / 100);

                    if (!ShopeePromosController.productMatchesAnyNiche(produto.productName, produto.priceDiscountRate, priceNumber)) return acc;
                    if (acc.some(p => p.title.toLowerCase() === produto.productName.toLowerCase())) return acc;

                    acc.push({
                        id: produto.itemId.toString(),
                        title: produto.productName,
                        price: parseFloat(priceNumber.toFixed(2)),
                        originalPrice: parseFloat(priceOriginalNumber.toFixed(2)),
                        coupon: null,
                        badge: (`${produto.priceDiscountRate}% OFF`),
                        imageUrl: produto.imageUrl,
                        link: produto.offerLink,
                        store: "Shopee",
                        installments: null
                    });

                    return acc;
                }, []);

                if (produtos.length > 0) {
                    shopeeController.processProductsShopee(produtos);
                    totalEnviados += produtos.length;
                    console.log(`🚀 [Shopee Categories] Grupo ${groupIndex} - Categoria "${category.name}": ${produtos.length} produtos.`);
                } else {
                    console.log(`♻️ [Shopee Categories] Grupo ${groupIndex} - Categoria "${category.name}": sem ofertas.`);
                }

                await sleep(2000);
            }

            ShopeePromosController.counterCategories++;

            console.log(`✅ [Shopee Categories] Grupo ${groupIndex} finalizado. Total: ${totalEnviados} produtos.`);

            return res.status(200).json({ success: true, total: totalEnviados });

        } catch (error) {
            console.error(`❌ [Shopee Categories] Erro no grupo ${groupIndex}:`, error);
            ShopeePromosController.counterCategories++;
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }

    async GetInfo(req: Request, res: Response) {
        const timeStamp = Math.floor(Date.now() / 1000)

        const payload = {
            query: `{
  __type(name: "ProductOfferNode") { # Ou o nome do tipo que aparece na sua documentação
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}`
        };
        const payloadString = JSON.stringify(payload)
        const signatureFactor = Env.SHOPEE_API_ID + timeStamp + payloadString + Env.SHOPEE_API_PASSWORD
        const signature = crypto.createHash('sha256').update(signatureFactor).digest('hex')

        try {

            const response = await fetch('https://open-api.affiliate.shopee.com.br/graphql', {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "Authorization": `SHA256 Credential=${Env.SHOPEE_API_ID}, Timestamp=${timeStamp}, Signature=${signature}`
                },
                body: payloadString
            })

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erro retornado pela API da Shopee:", errorData);
                return res.status(response.status).json(errorData);
            }

            const result = await response.json()

            // Tratamento de Erro
            if (result.errors) {
                return res.status(400).json({ message: "Erro na API", details: result.errors });
            }

            return res.json(result)

        } catch (error: any) {
            console.error("Erro:", error);
            return res.status(500).json({ error: "Erro interno" });
        }
    }

}

// Função utilitária para delay (Evita Rate Limit)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));