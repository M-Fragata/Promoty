import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type MlProducts } from "../types/MLPRODUCTS.js";
import { Env } from '../utils/Envirolment.js';

chromium.use(stealthPlugin());

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
]

const HUMAN_DELAY = (min = 2000, max = 5000) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)))

// Váriaveis globais
const keywords: string[] = ["notebook", "celular", "smartphone", "monitor", "placa de vídeo", "ssd", "hd", "fone", "headset", "teclado", "mouse", "webcam", "caixa de som bluetooth", "smartwatch", "tablet", "processador", "memória ram", "gabinete gamer", "cooler", "fonte para pc", "impressora", "roteador", "tv", "videogame", "console", "jogo de videogame", "cadeira gamer", "cadeira ergonomica", "cadeira de escritório", "mesa gamer", "power bank", "cabo usb", "carregador portátil", "suporte para notebook", "microfone", "webcam", "filtro de linha", "no-break", "pen drive", "cartão de memória", "nvme"]
const descountMin: number = 25
const maxPrice: number = 4000

export class AccesWeb {

    async AcessMercadoLivre(onPageScraped?: (produtos: MlProducts[]) => void): Promise<void> {

        // 1- informática; 2- celulares e telefones; 3-games, 4- oferta do dia
        const URLs: string[] = [
            "https://www.mercadolivre.com.br/ofertas?category=MLB1648&promotion_type=lightning#filter_applied=category&filter_position=3&origin=qcat",
            "https://www.mercadolivre.com.br/ofertas?category=MLB1051&promotion_type=lightning#filter_applied=category&filter_position=3&origin=qcat",
            "https://www.mercadolivre.com.br/ofertas?category=MLB1144&promotion_type=lightning#filter_applied=category&filter_position=3&origin=qcat", "https://www.mercadolivre.com.br/ofertas?category=MLB1648&container_id=MLB779362-1&promotion_type=deal_of_the_day#filter_applied=category&filter_position=3&origin=qcat"
        ];

        const browser = await chromium.launch({
            headless: Env.HEADLESS, // false ele irá abrir a tela do chrome
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const userAgentRandom = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] ?? USER_AGENTS[0]

        const context = await browser.newContext({
            userAgent: userAgentRandom as string,
            viewport: { width: 1366, height: 768 }, // Resolução padrão de notebook comum
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo',
        });

        const page = await context.newPage();
        //const produtosEncontrados: MlProducts[] = [];

        try {
            // 🔄 O laço percorre as URLs dentro do Try principal
            for (const URL of URLs) {
                try {
                    console.log(`🌐 [Scraper] Acessando URL: ${URL.substring(0, 60)}...`);

                    // O robô navega exatamente para a URL com os filtros que você escolheu
                    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    await HUMAN_DELAY(3000, 6000)

                    // Mapeia os cards que aparecem nessa listagem específica
                    const cards = await page.$$('.poly-card');
                    console.log(`📦 Encontrados ${cards.length} cards nesta página.`);

                    const productsPage: MlProducts[] = [];

                    for (const card of cards) {
                        try {
                            // 1. CAPTURA LINK e ID
                            const linkElement = await card.$('.poly-component__title');
                            if (!linkElement) continue;

                            const linkOriginal = await linkElement.getAttribute('href');
                            if (!linkOriginal) continue;

                            let id: string = ""

                            const splitUrl = linkOriginal.split("?")
                            if (splitUrl[1]) {
                                const parameters = splitUrl[1].split("&")
                                const parametersWithWid = parameters.find((p) => p.startsWith("wid="))
                                if (parametersWithWid) {
                                    const ProductId = parametersWithWid.split("=")[1]
                                    id = ProductId ? ProductId : "falhou2"
                                } else {
                                    id = "falhou_sem_wid"
                                }
                            } else {
                                id = "falhou1"
                            }

                            // 2. CAPTURA TÍTULO
                            const title = await linkElement.innerText();
                            //Verifica se o titulo contains the key words
                            if (!utils.verifyKeyWords(title)) continue


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

                            // Verifica se o produto tem desconto mínimo e preço máximo
                            if (!utils.verifyDiscount(originalPrice, price) || !utils.verifyMaxPrice(price)) continue;

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
                                        textosDestaque.push(labelText);
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


                            productsPage.push({
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

                        if (productsPage.length > 0) {
                            console.log(`🚀 [Scraper] Página processada! Enviando ${productsPage.length} produtos para o Crawler em background...`);

                            // Chamamos a função sem dar await aqui dentro para liberar o laço
                            onPageScraped?.(productsPage);
                        }
                    }

                } catch (errorUrl: any) {
                    // Trata o erro de uma página específica (ex: timeout) e deixa o laço ir para a próxima URL
                    await page.screenshot({ path: `logs/erro-mercadolivre-${Date.now()}.png`, fullPage: true });
                    console.error(`❌ Erro ao acessar a URL filtrada do Mercado Livre:`, errorUrl.message);
                }
            } // 🔄 Fim do laço for

        } catch (error) {
            await page.screenshot({ path: `logs/erro-mercadolivre-${Date.now()}.png`, fullPage: true });
            console.error("❌ Erro catastrófico geral no processamento das páginas:", error);
        } finally {
            // O bloco finally fecha o navegador uma única vez ao término de todas as iterações ou em caso de quebra do try principal
            console.log("🔒 [Scraper] Finalizando sessões e fechando o navegador de forma segura...");
            await browser.close();
        }
    }

    async AcessAmazon(onPageScraped?: (produtos: MlProducts[]) => void): Promise<void> {
        // 1- computadores e informática; 2- eletrônicos e tecnologia; 3- games e consoles
        const URLs: string[] = [
            "https://www.amazon.com.br/events/ofertasmensais?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216339927011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A20%252C%255C%2522max%255C%2522%253A70%257D%252C%255C%2522price%255C%2522%253A%257B%255C%2522min%255C%2522%253A0%252C%255C%2522max%255C%2522%253A4100%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
            "https://www.amazon.com.br/events/ofertasmensais?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216209063011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A20%252C%255C%2522max%255C%2522%253A80%257D%252C%255C%2522price%255C%2522%253A%257B%255C%2522min%255C%2522%253A0%252C%255C%2522max%255C%2522%253A4200%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
            "https://www.amazon.com.br/events/ofertasmensais?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%25227791986011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A25%252C%255C%2522max%255C%2522%253A90%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522"
        ];

        const browser = await chromium.launch({
            headless: Env.HEADLESS,
            slowMo: 100,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const userAgentRandom = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] ?? USER_AGENTS[0]

        const context = await browser.newContext({
            userAgent: userAgentRandom as string,
            viewport: { width: 1366, height: 768 }, // Resolução padrão de notebook comum
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo',
        });

        const page = await context.newPage();
        //const produtosEncontrados: MlProducts[] = [];

        try {
            for (const URL of URLs) {

                try {
                    console.log(`🌐 [Amazon Scraper] Acessando URL de Departamento...`);

                    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    await HUMAN_DELAY(3000, 6000)

                    // Espera carregar os cards da nova estrutura da Amazon baseada em CSS Modules
                    await page.waitForSelector('div[data-testid="product-card"]', { timeout: 10000 }).catch(() => null);

                    // Mapeia os cards baseado na tag test-id que vimos no exemplo do HTML
                    const cards = await page.$$('div[data-testid="product-card"]');
                    console.log(`📦 Encontrados ${cards.length} cards nesta página da Amazon.`);

                    const productsPage: MlProducts[] = [];

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

                            if (!utils.verifyDiscount(originalPrice, price) || !utils.verifyMaxPrice(price) || !utils.verifyKeyWords(title)) continue;

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

                            productsPage.push({
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

                        // Se terminou a página e achou produtos, envia IMEDIATAMENTE para o callback
                        if (productsPage.length > 0 && onPageScraped) {
                            console.log(`🚀 [Scraper] Página processada! Enviando ${productsPage.length} produtos para o Crawler em background...`);

                            // Chamamos a função sem dar await aqui dentro para liberar o laço
                            onPageScraped(productsPage);
                        }

                    }

                } catch (errorUrl: any) {
                    await page.screenshot({ path: `logs/erro-amazon-${Date.now()}.png`, fullPage: true });
                    console.error(`❌ Erro ao acessar departamento da Amazon:`, errorUrl.message);
                }
            }

        } catch (error) {
            await page.screenshot({ path: `logs/erro-amazon-${Date.now()}.png`, fullPage: true });
            console.error("❌ Erro geral no processamento das páginas da Amazon:", error);
        } finally {
            console.log("🔒 [Amazon Scraper] Fechando navegador de forma segura...");
            await browser.close();
        }

    }

    async AcessShopee(onPageScraped?: (produtos: MlProducts[]) => void): Promise<void> {

        const URLs: string[] = [
            "https://shopee.com.br/Computadores-e-Acess%C3%B3rios-cat.11059977?page=0&sortBy=sales",
            "https://shopee.com.br/flash_sale?categoryId=18&promotionId=275866672377856"
        ];

        let browser: any = null;

        try {
            browser = await chromium.launch({
                headless: Env.HEADLESS,
                slowMo: 100,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const userAgentRandom = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] ?? USER_AGENTS[0];

            const context = await browser.newContext({
                userAgent: userAgentRandom as string,
                viewport: { width: 1366, height: 768 },
                locale: 'pt-BR',
                timezoneId: 'America/Sao_Paulo',
            });

            const page = await context.newPage();

            // Mantemos a lista global caso queira acumular tudo de todas as páginas
            const produtosEncontrados: MlProducts[] = [];

            for (const URL of URLs) {
                try {
                    console.log(`🌐 [Shopee Scraper] Navegando para: ${URL}`);
                    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });

                    // Uma pequena pausa para garantir a renderização dos cards injetados por JS
                    await page.waitForTimeout(3000);

                    // 1. Captura a lista de todos os cards da página atual
                    const cards = await page.$$('.t13OEo');
                    console.log(`📦 [Shopee Scraper] Encontrados ${cards.length} cards potenciais nesta página.`);

                    // Criamos uma lista temporária apenas para a página atual para controlar o callback por lote
                    const produtosDaPagina: MlProducts[] = [];

                    for (const card of cards) {
                        try {
                            // ==========================================
                            // 1. CAPTURA E VALIDA TÍTULO
                            // ==========================================
                            const titleElement = await card.$('.EAIlz5');
                            if (!titleElement) continue;
                            const title = await titleElement.innerText();

                            if (!utils.verifyKeyWords(title)) continue;

                            // ==========================================
                            // 2. CAPTURA E VALIDA PREÇO ATUAL (COM DESCONTO)
                            // ==========================================
                            const priceElement = await card.$('.v8KtmX .iwH3_q');
                            if (!priceElement) continue;

                            const priceText = await priceElement.innerText();
                            const currentPrice = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));

                            if (!utils.verifyMaxPrice(currentPrice)) continue;

                            // ==========================================
                            // 3. CAPTURA PORCENTAGEM E CALCULA PREÇO ORIGINAL
                            // ==========================================
                            const discountElement = await card.$('.EKx6p6');
                            let discountText = '';
                            if (discountElement) {
                                discountText = await discountElement.innerText();
                            }

                            const originalPrice = utils.verifyOriginalPrice(currentPrice, discountText);
                            if (originalPrice === currentPrice) continue;

                            if (!utils.verifyDiscount(originalPrice, currentPrice)) {
                                console.log(`🤫 [SHOPEE - REJEITADO] ${title.substring(0, 25)}... Desconto abaixo do mínimo.`);
                                continue;
                            }

                            // ==========================================
                            // 4. CAPTURA LINK E EXTRAI O PRODUCT ID
                            // ==========================================
                            const linkElement = await card.$('a');
                            if (!linkElement) continue;
                            const href = await linkElement.getAttribute('href');

                            if (!href) continue;
                            const fullLink = `https://shopee.com.br${href}`;

                            const idMatch = href.match(/i\.\d+\.(\d+)/);
                            const productId = idMatch ? idMatch[1] : `shopee-${Date.now()}`;

                            // ==========================================
                            // 5. CAPTURA A IMAGEM DO PRODUTO
                            // ==========================================
                            const imgElement = await card.$('.kwL5yd');
                            let imageUrl = '';
                            if (imgElement) {
                                const style = await imgElement.getAttribute('style');
                                const urlMatch = style?.match(/url\("(.+?)"\)/);
                                if (urlMatch && urlMatch[1]) {
                                    imageUrl = urlMatch[1].replace('_tn', '');
                                }
                            }

                            // ==========================================
                            // 🌟 PRODUTO APROVADO COM SUCESSO!
                            // ==========================================
                            const discountNumber = parseInt(discountText.replace(/[^0-9]/g, ''), 10);
                            const produtoFinal: MlProducts = {
                                id: productId,
                                title,
                                price: currentPrice,
                                coupon: null,
                                originalPrice,
                                badge: discountNumber.toString() + '% OFF',
                                link: fullLink,
                                imageUrl,
                                store: "Shopee"
                            };

                            console.log(`💎 [PRODUTO OURO APROVADO]: ${title}`);
                            produtosDaPagina.push(produtoFinal);
                            produtosEncontrados.push(produtoFinal);

                        } catch (cardError) {
                            console.error('❌ Erro ao processar card específico da Shopee:', cardError);
                            continue;
                        }
                    } // Fim do laço de cards

                    // Dispara o lote específico que acabou de ser coletado nesta URL
                    /*if (onPageScraped && produtosDaPagina.length > 0) {
                        onPageScraped(produtosDaPagina);
                    }*/

                } catch (pageError) {
                    console.error(`❌ Erro ao processar a URL da vez (${URL}):`, pageError);
                    continue; // Avança para a próxima URL sem estourar o robô
                }
            } // Fim do laço de URLs

        } catch (globalError) {
            console.error('💥 Erro fatal no inicializador do Scraper da Shopee:', globalError);
        } finally {
            // 🔥 AQUI SIM! O browser só fecha quando TODAS as URLs terminarem de rodar.
            if (browser) {
                console.log("🔒 [Shopee Scraper] Todas as páginas processadas. Fechando navegador de forma segura...");
                await browser.close();
            }
        }
    }

}//Fim da classe

class secondaryFunction {
    verifyKeyWords(text: string): boolean {
        const textLower = text.toLowerCase();
        return keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
    }
    verifyDiscount(originalPrice: number | null, currentPrice: number): boolean {
        if (!originalPrice || originalPrice <= currentPrice) return false;

        const percentualDesconto = ((originalPrice - currentPrice) / originalPrice) * 100;
        return percentualDesconto >= descountMin;
    }
    verifyMaxPrice(price: number): boolean {
        return price <= maxPrice;
    }
    verifyOriginalPrice(priceWithDescount: number, descountPercentage: string): number {

        // 1. Limpa a string tirando símbolos e converte para número inteiro positivo
        const discountNumber = parseInt(descountPercentage.replace(/[^0-9]/g, ''), 10);

        // 2. Valida se o número é válido ou zerado (evita NaN e divisões por zero)
        if (isNaN(discountNumber) || discountNumber <= 0 || discountNumber >= 100) {
            return priceWithDescount;
        }

        // 3. 🔥 CORREÇÃO: Usa a variável limpa 'discountNumber' em vez da string original
        const descount = 1 - (discountNumber / 100);

        // 4. Retorna o preço original (arredondado para duas casas decimais para evitar dízimas do JS)
        return parseFloat((priceWithDescount / descount).toFixed(2));
    }
}

const utils = new secondaryFunction();