import { type Request, type Response } from "express";
import { Env } from "../utils/Envirolment.js";
import crypto from "node:crypto"

import { SecondaryFunction } from "../utils/secondaryFunction.js"
import { PromosController } from "./PromosController.js"
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

/*        const CATEGORY = {
            PERIFERICOS: [101996, 101973, 101998],
            HARDWARE: [101950, 101951, 101952, 101955],
            ARMAZENAMENTO: [101961, 101962]
        };
            // Lojas oficiais shopee
    // https://shopee.com.br/eshop.loja 627750190
    // https://shopee.com.br/pichau
        */

export class ShopeePromosController {

    private static counterShopee: number = 0

    async GetProducts(req: Request, res: Response) {

        // Keywords para filtro (garante que é gamer/tech)
        const keywords: string[][] = [
            // Grupo 1: Periféricos de Entrada Principais
            [
                "teclado",
                "mouse"
            ],

            // Grupo 2: Áudio e Comunicação
            [
                "fone",
                "headset",
                "microfone"
            ],

            // Grupo 3: Hardware - Armazenamento Rápido e Tradicional
            [
                "ssd",
                "nvme",
                "hd",
                "pen drive",
                "cartão de memória"
            ],

            // Grupo 4: Hardware - Core (Componentes Principais)
            [
                "processador",
                "memória ram",
                "placa de vídeo"
            ],

            // Grupo 5: Hardware - Gabinete, Energia e Refrigeração
            [
                "gabinete gamer",
                "fonte para pc",
                "cooler",
                "water cooler"
            ],

            // Grupo 6: Telas e Imagem
            [
                "monitor",
                "tv",
                "webcam"
            ],

            // Grupo 7: Dispositivos Portáteis Principais
            [
                "celular",
                "smartphone",
                "tablet",
                "notebook"
            ],

            // Grupo 8: Ergonômicos e Linha Gamer (Móveis)
            [
                "cadeira gamer",
                "cadeira ergonomica",
                "cadeira de escritório",
                "mesa gamer"
            ]
        ];

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

                    if (produto.priceDiscountRate < 30 || !utils.verifyKeyWords(produto.productName) || utils.verifyBanWords(produto.productName) || !utils.checkLimitedWords(produto.productName)) return acc

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
                    console.log(`🚀 [Shopee Pichau] Enviados ${produtos.length} produtos em oferta para processamento.`);
                } else {
                    console.log(`♻️ [Shopee Pichau] Varredura concluída, mas nenhuma oferta bateu os critérios de >30% OFF.`);
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
                    shopId: ${shopID}, limit: 50, sortType: 1
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

                if (produto.priceDiscountRate < 30 || !utils.verifyKeyWords(produto.productName) || utils.verifyBanWords(produto.productName) || !utils.checkLimitedWords(produto.productName)) return acc

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
            }

            await sleep(2000);

            return res.status(200).json({ success: true, total: produtos.length });

        } catch (error) {
            console.error("Erro crítico no loop:", error);
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