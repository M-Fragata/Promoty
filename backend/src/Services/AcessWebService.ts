import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(stealthPlugin());

import { type MlProducts } from "../types/MLPRODUCTS";

export class AccesWeb {

    async AcessMercadoLivre(): Promise<MlProducts[]> {

        // 1- informática; 2- celulares e telefones; 3-games
        const URLs: string[] = [
            "https://www.mercadolivre.com.br/ofertas?category=MLB1648&promotion_type=lightning#filter_applied=category&filter_position=3&origin=qcat",
            "https://www.mercadolivre.com.br/ofertas?category=MLB1051&promotion_type=lightning#filter_applied=category&filter_position=3&origin=qcat",
            "https://www.mercadolivre.com.br/ofertas?category=MLB1144&promotion_type=lightning#filter_applied=category&filter_position=3&origin=qcat"
        ];

        const browser = await chromium.launch({
            headless: false, // false ele irá abrir a tela do chrome
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            locale: 'pt-BR'
        });

        const page = await context.newPage();
        const produtosEncontrados: MlProducts[] = [];

        try {
            // 🔄 O laço percorre as URLs dentro do Try principal
            for (const URL of URLs) {
                try {
                    console.log(`🌐 [Scraper] Acessando URL: ${URL.substring(0, 60)}...`);

                    // O robô navega exatamente para a URL com os filtros que você escolheu
                    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    // Mapeia os cards que aparecem nessa listagem específica
                    const cards = await page.$$('.poly-card');
                    console.log(`📦 Encontrados ${cards.length} cards nesta página.`);

                    for (const card of cards) {
                        try {
                            // 1. CAPTURA LINK e ID
                            const linkElement = await card.$('.poly-component__title');
                            if (!linkElement) continue;

                            const linkOriginal = await linkElement.getAttribute('href');
                            if (!linkOriginal) continue;

                            const idHtml = await card.getAttribute('id');
                            if (!idHtml) continue;
                            const id = idHtml.trim();

                            // 2. CAPTURA TÍTULO
                            const title = await linkElement.innerText();

                            // 3. CAPTURA IMAGEM
                            const imgElement = await card.$('.poly-card__portada img');

                            let imageUrl = imgElement
                                ? await imgElement.getAttribute('data-src') || await imgElement.getAttribute('src')
                                : null;

                            // 4. CAPTURA PREÇO ATUAL
                            const precoElement = await card.$('.poly-price__current .andes-money-amount__fraction');
                            const precoTexto = precoElement ? await precoElement.innerText() : '0';
                            const price = parseFloat(precoTexto.replace(/[^\d]/g, ''));

                            // 5. CAPTURA PREÇO ANTIGO (Se houver)
                            const precoOriginalElement = await card.$('.andes-money-amount--previous .andes-money-amount__fraction');
                            const precoOriginalTexto = precoOriginalElement ? await precoOriginalElement.innerText() : null;
                            const originalPrice = precoOriginalTexto ? parseFloat(precoOriginalTexto.replace(/[^\d]/g, '')) : null;

                            // 6. CAPTURA CUPOM (Se houver)
                            const cupomElement = await card.$('.poly-coupons__pill');
                            const coupon = cupomElement ? await cupomElement.innerText() : null;

                            //7. captura a BADGE (se houver)
                            let mlBadge: string | null = null;

                            try {
                                const textosDestaque: string[] = [];

                                // 1. Captura a porcentagem de desconto (ex: "66% OFF") - Seletor Corrigido!
                                const discountElement = await card.$('.poly-price__disc_label.andes-money-amount__discount.poly-price__disc_label--pill');
                                if (discountElement) {
                                    const discountText = await discountElement.innerText();
                                    if (discountText && discountText.trim()) {
                                        textosDestaque.push(discountText.trim());
                                    }
                                }

                                // 2. Captura a Oferta Relâmpago
                                const countdownContainer = await card.$('.poly-component__highlight-countdown');
                                if (countdownContainer) {
                                    const textElement = await countdownContainer.$('.poly-highlight-countdown__text');
                                    if (textElement) {
                                        const labelText = await textElement.innerText();
                                        if (labelText && labelText.toUpperCase().includes('RELÂMPAGO')) {
                                            textosDestaque.push('Oferta Relâmpago');
                                        }
                                    }
                                }

                                // Se encontrou alguma coisa, junta com o separador visual
                                if (textosDestaque.length > 0) {
                                    mlBadge = textosDestaque.join(' • '); // Resultado: "66% OFF • ⚡ Oferta Relâmpago"
                                }
                            } catch (error) {
                                // Se falhar em algum card específico, apenas mantém o badge como null e não quebra a raspagem
                                mlBadge = null;
                            }


                            produtosEncontrados.push({
                                id,
                                title: title.trim(),
                                price,
                                originalPrice,
                                coupon: coupon ? coupon.trim() : null,
                                badge: mlBadge,
                                imageUrl,
                                link: linkOriginal,
                                store: 'Mercado Livre'
                            });

                        } catch (erroCard) {
                            continue; // Se falhar um card, vai para o próximo card
                        }
                    }

                } catch (errorUrl: any) {
                    // Trata o erro de uma página específica (ex: timeout) e deixa o laço ir para a próxima URL
                    console.error(`❌ Erro ao acessar a URL filtrada do Mercado Livre:`, errorUrl.message);
                }
            } // 🔄 Fim do laço for

        } catch (error) {
            console.error("❌ Erro catastrófico geral no processamento das páginas:", error);
        } finally {
            // O bloco finally fecha o navegador uma única vez ao término de todas as iterações ou em caso de quebra do try principal
            console.log("🔒 [Scraper] Finalizando sessões e fechando o navegador de forma segura...");
            await browser.close();
        }

        return produtosEncontrados;
    }

    async AcessAmazon(): Promise<MlProducts[]> {
        // 1- computadores e informática; 2- eletrônicos e tecnologia; 3- games e consoles
        const URLs: string[] = [
            "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216339927011%255C%2522%255D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
            "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216209063011%255C%2522%255D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522&promotionsSearchLastSeenAsin=B0F6YJVZ5L&promotionsSearchStartIndex=0&promotionsSearchPageSize=60",
            "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%25227791986011%255C%2522%255D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522"
        ];

        const browser = await chromium.launch({
            headless: false,
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            locale: 'pt-BR'
        });

        const page = await context.newPage();
        const produtosEncontrados: MlProducts[] = [];

        try {
            for (const URL of URLs) {
                try {
                    console.log(`🌐 [Amazon Scraper] Acessando URL de Departamento...`);

                    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    // Espera carregar os cards da nova estrutura da Amazon baseada em CSS Modules
                    await page.waitForSelector('div[data-testid="product-card"]', { timeout: 10000 }).catch(() => null);

                    // Mapeia os cards baseado na tag test-id que vimos no exemplo do HTML
                    const cards = await page.$$('div[data-testid="product-card"]');
                    console.log(`📦 Encontrados ${cards.length} cards nesta página da Amazon.`);

                    for (const card of cards) {
                        try {
                            // 1. CAPTURA LINK E ASIN (ID Único da Amazon)
                            const linkElement = await card.$('a[data-testid="product-card-link"]');
                            if (!linkElement) continue;

                            const linkOriginal = await linkElement.getAttribute('href');
                            if (!linkOriginal) continue;

                            const asin = await card.getAttribute('data-asin');
                            if (!asin) continue;

                            // 2. CAPTURA TÍTULO
                            const titleElement = await card.$('.ProductCard-module__title_awabIOxk6xfKvxKcdKDH .a-truncate-full');
                            const title = titleElement ? await titleElement.innerText() : 'Produto sem título';

                            // 3. CAPTURA IMAGEM (Buscando dinamicamente pela classe de imagem do card)
                            const imgElement = await card.$('.ProductCardImage-module__image_SU6C7KYJpko3vQ2fK7Kf');
                            const imageUrl = imgElement ? await imgElement.getAttribute('src') : null;

                            // 4. CAPTURA PREÇO ATUAL (Por)
                            const precoElement = await card.$('.ProductCard-module__priceToPay_olAgJzVNGyj2javg2pAe .a-offscreen');
                            if (!precoElement) continue; // Se não tem preço visível, pula o card
                            const precoTexto = await precoElement.innerText();
                            // Remove o texto "Preço da Oferta: R$" deixando apenas os números
                            const price = parseFloat(precoTexto.replace(/[^\d]/g, '')) / 100;

                            // 5. CAPTURA PREÇO ANTIGO (De - se houver)
                            const precoOriginalElement = await card.$('.ProductCard-module__wrapPrice__sMO92NjAjHmGPn3jnIH .a-text-price .a-offscreen');
                            let originalPrice: number | null = null;
                            if (precoOriginalElement) {
                                const precoOriginalTexto = await precoOriginalElement.innerText();
                                originalPrice = parseFloat(precoOriginalTexto.replace(/[^\d]/g, '')) / 100;
                            }

                            //6 captura a badge
                            let badgeText: string | null = null;
                            const badgeContainer = await card.$('div[data-component="dui-badge"]');
                            if (badgeContainer) {
                                // Pega todos os spans internos (um costuma ser a porcentagem e o outro o texto)
                                const spans = await badgeContainer.$$('span.a-size-mini');
                                const textosBadge: string[] = [];

                                for (const span of spans) {
                                    const texto = await span.innerText();
                                    if (texto && texto.trim()) {
                                        textosBadge.push(texto.trim());
                                    }
                                }

                                // Se encontrou algum texto, junta eles. Ex: "29% off - Oferta" ou "34% off - Menor preço em 365 dias"
                                if (textosBadge.length > 0) {
                                    badgeText = textosBadge.join(' • ');
                                }
                            }

                            produtosEncontrados.push({
                                id: asin.trim(),
                                title: title.trim(),
                                price,
                                originalPrice,
                                coupon: null,
                                badge: badgeText,
                                imageUrl,
                                link: linkOriginal,
                                store: 'Amazon'
                            });

                        } catch (erroCard) {
                            continue; // Erro em um item não para a raspagem da página toda
                        }
                    }

                } catch (errorUrl: any) {
                    console.error(`❌ Erro ao acessar departamento da Amazon:`, errorUrl.message);
                }
            }

        } catch (error) {
            console.error("❌ Erro geral no processamento das páginas da Amazon:", error);
        } finally {
            console.log("🔒 [Amazon Scraper] Fechando navegador de forma segura...");
            await browser.close();
        }

        return produtosEncontrados;
    }
}