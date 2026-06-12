import { type Request, type Response } from "express";
import { Env } from "../utils/Envirolment.js";
import crypto from "node:crypto"

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

    async GetProducts(req: Request, res: Response) {

        // Keywords para filtro (garante que é gamer/tech)
        const keywords: string[] = [
            "Teclado Mecanico",
            "SSD NVMe M2",
            "Mouse Gamer",
            "Memoria RAM DDR4",
            "Headset Gamer"
        ]

        const produtos: any[] = []

        try {

            for (const keyword of keywords) {

                const timeStamp = Math.floor(Date.now() / 1000);

                const payload = {
                    query: `query {
                        productOfferV2(keywords: "${keyword}", limit: 20, sortType: 1) {
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

                const produtosShopee = await data.map((produto: Produto) => {

                    const priceNumber = Number(produto.priceMin);
                    const priceOrginalNumber = priceNumber / (1 - produto.priceDiscountRate / 100);

                    return {
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
                    }
                })

                produtos.push(...produtosShopee)

                // Pausa de 2 segundos entre chamadas para não estourar limite da API
                await sleep(2000);
            }

            // 😎 Só responde quando processar TODAS as palavras-chave
            console.log(`✅ [Shopee API] Total de ${produtos.length} produtos minerados com sucesso.`);
            return res.json(produtos)

        } catch (error: any) {
            console.error("Erro crítico no loop:", error);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }
    }

    async GetPichauShop(req: Request, res: Response) {

        const timeStamp = Math.floor(Date.now() / 1000);
        const shopID = 627750190
        const payload = {
            query: `query {
                    productOfferV2(
                    shopId: ${shopID}, limit: 20, sortType: 1
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

        const produtos = await data.map((produto: Produto) => {

            const priceNumber = Number(produto.priceMin);
            const priceOrginalNumber = priceNumber / (1 - produto.priceDiscountRate / 100);

            return {
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
            }
        })

        return res.json(produtos)
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