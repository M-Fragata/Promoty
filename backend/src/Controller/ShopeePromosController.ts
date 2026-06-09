import { type Request, type Response } from "express";
import { Env } from "../utils/Envirolment.js";
import crypto from "node:crypto"

export class ShopeePromosController {

    async GetProducts(req: Request, res: Response) {
        // Categorias de Hardware que definimos
        const CATEGORIAS_HARDWARE = [101950, 101951, 101952, 101955, 101949, 101953, 101954];
        const allFilteredProducts: any[] = [];

        // Keywords para filtro secundário (garante que é gamer/tech)
        const keywords = ["notebook", "placa de vídeo", "ssd", "hd", "fone", "headset", "teclado", "mouse", "processador", "memória ram", "gabinete", "cooler", "fonte", "gamer"];

        try {
            for (const catId of CATEGORIAS_HARDWARE) {
                console.log(`🔍 Buscando na categoria ID: ${catId}`);

                const timeStamp = Math.floor(Date.now() / 1000);

                const payload = {
                    query: `query {
                        productOfferV2(productCatId: ${catId}, limit: 10, sortType: 1) {
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

                if (response.ok) {
                    const result = await response.json();
                    if (result.data?.productOfferV2?.nodes) {
                        const produtos = result.data.productOfferV2.nodes;

                        // Filtragem local
                        const filtrados = produtos.filter((p: any) => {
                            const nome = p.productName.toLowerCase();
                            return keywords.some(k => nome.includes(k));
                        });

                        allFilteredProducts.push(...filtrados);
                        console.log(`✅ Categoria ${catId}: Encontrados ${filtrados.length} itens relevantes.`);
                    }
                } else {
                    console.error(`❌ Erro na categoria ${catId}:`, await response.text());
                }

                // Pausa de 2 segundos entre chamadas para não estourar limite da API
                await sleep(2000);
            }

            return res.json({
                total: allFilteredProducts.length,
                produtos: allFilteredProducts
            });

        } catch (error: any) {
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