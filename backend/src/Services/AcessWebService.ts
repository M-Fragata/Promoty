import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type MlProducts } from "../types/MLPRODUCTS.js";
import { Env } from '../utils/Envirolment.js';
import { TakePrintScreenService } from './TelegramService.js';

import { SecondaryFunction } from "../utils/secondaryFunction.js"
import { getActiveNiches } from "../config/index.js"

chromium.use(stealthPlugin());

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
]

const AMAZON_TRACKING_SCRIPTS = [
    'unagi.amazon',
    'ue-full.amazon',
    'fls-na.amazon',
    'aanaxss.amazon',
    'aax-us-east',
    'aax-fe',
    'csm-cj',
    'client-telemetry',
    'client-side-metrics',
    'completion.amazon',
    'm.media-amazon.com',
    'af-in.amazon',
];

const HUMAN_DELAY = (min = 2000, max = 5000) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)))


const utils = new SecondaryFunction();

function titleMatchesAnyNiche(title: string): boolean {
    const niches = getActiveNiches();
    return niches.some(niche =>
        utils.verifyKeyWords(title, niche) && !utils.verifyBanWords(title, niche)
    );
}

function productMatchesAnyNiche(title: string, originalPrice: number | null, currentPrice: number): boolean {
    if (!titleMatchesAnyNiche(title)) return false;
    const niches = getActiveNiches();
    return niches.some(niche =>
        utils.checkLimitedWords(title, niche) &&
        utils.verifyDiscount(originalPrice, currentPrice, niche) &&
        utils.verifyMaxPrice(currentPrice, niche)
    );
}


export class AccesWeb {

    //=======================
    // Bloco Mercado Livre 
    // ======================
    private static readonly BASE_URL_GROUPS = 5
    private contadorML: number = 0
    private urlsMl: string[][]
    private contadorAmazon: number = 0
    private urlsAmazon: string[][]
    private captchaRetryPending = false;
    private lastCaptchaGroupIndex = -1;

    constructor(nicheFilter?: 'tech' | 'casa') {
        const niches = getActiveNiches();
        const niche = niches.find(n =>
            nicheFilter === 'tech' ? n.id === 'tech' :
            nicheFilter === 'casa' ? n.id === 'casa-moda-feminina' :
            true
        );

        if (niche) {
            this.urlsMl = niche.mlUrls;
            this.urlsAmazon = niche.amazonUrls;
        } else {
            // Fallback: todas as URLs (crawler antigo)
            this.urlsMl = niches.flatMap(n => n.mlUrls);
            this.urlsAmazon = niches.flatMap(n => n.amazonUrls);
        }
    }

    private get BASE_URL_GROUPS(): number {
        return AccesWeb.BASE_URL_GROUPS;
    }

    private get URLs(): string[][] {
        return this.urlsMl;
    }

    private set URLs(value: string[][] | number) {
        if (typeof value === 'number') {
            this.urlsMl.length = value;
        } else {
            this.urlsMl = value;
        }
    }

    async AcessMercadoLivre(onPageScraped?: (produtos: MlProducts[]) => void): Promise<void> {

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

        let urlCounter = this.URLs.length - 1

        // 🚨 SE O CONTADOR VOLTAR PRO ZERO, RESETAMOS AS ABAS DINÂMICAS!
        if (this.contadorML > urlCounter) {
            this.contadorML = 0;

            // Corta o array estático de volta para os 4 blocos originais de fábrica
            // eliminando qualquer push de Pichau feito em ciclos passados.
            if (this.URLs.length > this.BASE_URL_GROUPS) {
                this.URLs.length = this.BASE_URL_GROUPS;
                console.log("♻️ [Fila Dinâmica] Varredura completa reiniciada. Expurgando URLs antigas da memória!");
            }
        }

        try {
            let URLsGroup: string[] = this.URLs[this.contadorML]!

            // 🔄 O laço percorre as URLs dentro do Try principal
            for (let i = 0; i < URLsGroup.length; i++) {
                utils.resetWordsAlreadyUsed()//Resetar quantidade de palavras já usadas

                const URL = URLsGroup[i]!;
                const startTime = Date.now() //timer

                try {
                    console.log(`🌐 [Scraper] Acessando URL: ${URL.substring(0, 60)}...`);

                    // 🔥 GARANTE QUE AS ROTAS DA URL ANTERIOR FORAM LIMPAS
                    await page.unroute('**/*');

                    // 1. Cria a regra de bloqueio (o Playwright intercepta via page.route)
                    await page.route('**/*', (route) => {
                        const request = route.request();
                        const resourceType = request.resourceType();

                        // Bloqueia folhas de estilo, fontes e imagens para economizar banda
                        if (['stylesheet', 'font', 'image'].includes(resourceType)) {
                            route.abort();
                        } else {
                            route.fallback(); // O 'fallback' no Playwright é o equivalente ao 'continue'
                        }
                    });

                    // O robô navega exatamente para a URL com os filtros que você escolheu
                    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    await HUMAN_DELAY(3000, 6000)

                    // 🚨 VALIDAÇÃO DE PÁGINA VAZIA COM FALLBACK DINÂMICO
                    if (URL.includes("pichau")) {

                        const isTheLastPageOfGroup = i === (URLsGroup.length - 1)

                        if (isTheLastPageOfGroup) {
                            const maxPagesPichau = await utils.getMaxPagesPichau(page)
                            console.log(`🔍 [Pichau] Última página do bloco processada. Maior número visível no NAV: ${maxPagesPichau}`);

                            const matchDesde = URL.match(/_Desde_(\d+)/);
                            const offsetAtual = matchDesde ? parseInt(matchDesde[1]!, 10) : 1;
                            const paginaAtualReal = matchDesde ? Math.floor((offsetAtual - 1) / 48) + 1 : 1;

                            if (maxPagesPichau > paginaAtualReal) {
                                // O próximo bloco começa na página seguinte à nossa última do bloco
                                let paginaInicialDoProximoBloco = paginaAtualReal + 1;

                                // Definimos o teto do próximo bloco (sempre pegando blocos pequenos de 5 em 5 para não estourar)
                                let paginaFinalDoProximoBloco = paginaInicialDoProximoBloco + 4;

                                // Se o próximo bloco de 5 passar do que o NAV está vendo agora, limitamos ao teto do NAV
                                if (paginaFinalDoProximoBloco > maxPagesPichau) {
                                    paginaFinalDoProximoBloco = maxPagesPichau;
                                }

                                console.log(`➕ [Fila Dinâmica] Nova janela detectada no NAV. Injetando Bloco Pichau (Páginas ${paginaInicialDoProximoBloco} até ${paginaFinalDoProximoBloco}) ao final da fila.`);

                                //Verificando URL's passadas
                                console.log("URL's passadas", this.URLs)

                                // Injeta o próximo lote de 5 páginas na esteira
                                this.URLs.push(utils.gerarBlocoPichau(paginaInicialDoProximoBloco, paginaFinalDoProximoBloco));

                                //Verificando URL's presentes
                                console.log("URL's de agora", this.URLs)

                                console.log(`📊 [Fila Dinâmica] Total de Grupos na classe agora: ${this.URLs.length}`);
                            }

                        }

                    }

                    // Mapeia os cards que aparecem nessa listagem específica
                    const cards = await page.$$('.poly-card');
                    console.log(`📦 Encontrados ${cards.length} cards nesta página.`);

                    if (cards.length === 0) {
                        console.log(`🛑 [Scraper] Página vazia detectada na URL atual.`);
                        const duration = (Date.now() - startTime) / 1000
                        await TakePrintScreenService({
                            page: page,
                            store: "Mercado Livre",
                            produtosLength: 0,
                            tempoExecucao: duration,
                            status: "Falha",
                            url: URL
                        })
                        continue;
                    }

                    const productsPage: MlProducts[] = [];

                    for (const card of cards) {
                        try {
                            // 1. CAPTURA LINK e ID
                            const linkElement = await card.$('.poly-component__title');
                            if (!linkElement) continue;

                            const linkOriginal = await linkElement.getAttribute('href');
                            if (!linkOriginal) continue;

                            let id: string = "falhou_sem_wid"

                            const matchWid = linkOriginal.match(/[?&#]wid=([^&#]+)/);
                            if (matchWid && matchWid[1]) {
                                id = matchWid[1];
                            } else {
                                // Fallback: Se não achar wid=, tenta pegar o código numérico padrão do Mercado Livre na URL (ex: MLB123456)
                                const matchMlb = linkOriginal.match(/(MLB[-_]?\d+)/i);
                                if (matchMlb && matchMlb[1]) {
                                    id = matchMlb[1];
                                }
                            }

                            // 2. CAPTURA TÍTULO
                            const title = await linkElement.innerText();
                            if (!titleMatchesAnyNiche(title) || !utils.checkLimitedWords(title)) continue

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
                            const precoOrigFractionEl = await card.$('.andes-money-amount--previous .andes-money-amount__fraction');
                            const precoOrigCentsEl = await card.$('.andes-money-amount--previous .andes-money-amount__cents');

                            let originalPrice: number | null = null;

                            if (precoOrigFractionEl) {
                                // 1. Pega o texto da fração e remove pontos de milhar e qualquer sujeira, deixando só números
                                const rawFraction = await precoOrigFractionEl.innerText();
                                const cleanFraction = rawFraction.replace(/[^\d]/g, '');

                                // 2. Pega os centavos se existirem, remove sujeiras (como vírgulas residuais). Se não existir, vira '00'
                                let cleanCents = '00';
                                if (precoOrigCentsEl) {
                                    const rawCents = await precoOrigCentsEl.innerText();
                                    cleanCents = rawCents.replace(/[^\d]/g, '');
                                }

                                // 3. Junta tudo criando o float decimal perfeito (ex: "1199" + "." + "00" -> 1199.00)
                                originalPrice = parseFloat(`${cleanFraction}.${cleanCents}`);
                            }

                            if (originalPrice === null) continue;

                            // Verifica se o produto atende os critérios de pelo menos um nicho
                            if (!productMatchesAnyNiche(title, originalPrice, price)) continue;

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
                                    } else {
                                        textosDestaque.push(`${(100 - (price / originalPrice) * 100).toFixed(0)}% OFF`)
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

                            //8. captura o parcelamento sem juros se houver
                            let installments: string | null = null;
                            try {
                                const installmentsElement = await card.$('.poly-price__installments');
                                if (installmentsElement) {
                                    let textInstallments = await installmentsElement.innerText();

                                    // 1. Transforma qualquer sequência de espaços/quebras em um único espaço em branco                                    
                                    textInstallments = textInstallments.replace(/\s+/g, ' ').trim();

                                    // 2. 🔥 REMOVE ESPAÇOS ANTES/DEPOIS DA VÍRGULA E TROCA POR PONTO
                                    // Ex: "34 , 22" vira "34.22"
                                    textInstallments = textInstallments.replace(/\s*,\s*/g, '.');

                                    // 3. Remove possíveis espaços entre o R$ e o número (Ex: "R$ 34.22" -> "R$34.22" se preferir, ou mantém 1 espaço)
                                    // O Mercado Livre costuma quebrar o R$, vamos garantir que fique "R$ 34.22" com apenas um espaço regulamentar
                                    textInstallments = textInstallments.replace(/R\$\s*/g, 'R$ ');

                                    const countCifrao = (textInstallments.match(/R\$/g) || []).length;

                                    // Filtra para garantir que só vai levar se for "sem juros"
                                    if (countCifrao === 1 && textInstallments.toLowerCase().includes("sem juros")) {
                                        textInstallments = textInstallments.replace(/sem juros/i, 's/ juros');
                                        installments = textInstallments; // Resultado limpo: "7x R$ 22,86 sem juros"
                                    } else {
                                        installments = null;
                                    }
                                }
                            } catch (error) {
                                // Mantém como null se o card não tiver parcelamento e não quebra o robô
                                installments = null;
                            }

                            productsPage.push({
                                id,
                                title: title.trim(),
                                price,
                                originalPrice,
                                coupon: coupon ? coupon.trim() : null,
                                badge: mlBadge ? mlBadge : `${(100 - (price / originalPrice) * 100).toFixed(0)}% OFF`,
                                imageUrl,
                                link: linkOriginal,
                                installments,
                                store: 'Mercado Livre'
                            });

                        } catch (erroCard) {
                            continue; // Se falhar um card, vai para o próximo card
                        }

                    }//Fim do laço de cards

                    if (productsPage.length > 0) {
                        console.log(`🚀 [Scraper] Página processada! Enviando ${productsPage.length} produtos para o Crawler em background...`);

                        const duration = (Date.now() - startTime) / 1000

                        await TakePrintScreenService({
                            page: page,
                            store: "Mercado Livre",
                            produtosLength: productsPage.length,
                            tempoExecucao: duration,
                            status: "Sucesso",
                            url: URL
                        })

                        // Chamamos a função sem dar await aqui dentro para liberar o laço
                        onPageScraped?.(productsPage);
                    }

                } catch (errorUrl: any) {
                    // Trata o erro de uma página específica (ex: timeout) e deixa o laço ir para a próxima URL
                    const duration = (Date.now() - startTime) / 1000
                    await TakePrintScreenService({
                        page: page,
                        store: "Mercado Livre",
                        produtosLength: 0,
                        tempoExecucao: duration,
                        status: "Falha",
                        url: URL
                    })
                    console.error(`❌ Erro ao acessar a URL filtrada do Mercado Livre:`, errorUrl.message);
                }

            } // 🔄 Fim do laço for

        } catch (error) {
            await page.screenshot({ path: `logs/erro-mercadolivre-${Date.now()}.png`, fullPage: true });
            console.error("❌ Erro catastrófico geral no processamento das páginas:", error);
        } finally {
            // O bloco finally fecha o navegador uma única vez ao término de todas as iterações ou em caso de quebra do try principal
            console.log("🔒 [Scraper] Finalizando sessões e fechando o navegador de forma segura...");
            this.contadorML++
            await browser.close();
        }
    }

    // ================
    // Bloco Amazon
    // ================
    private static readonly MAX_AMAZON_PAGES = 4

    async AcessAmazon(onPageScraped?: (produtos: MlProducts[]) => void): Promise<void> {
        const browser = await chromium.launch({
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

        try {
            // Bloqueio de recursos desnecessários (Performance + economia de banda para proxy rotativo)
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType();

                if (['stylesheet', 'font', 'image'].includes(resourceType)) {
                    route.abort();
                    return;
                }

                if (resourceType === 'script') {
                    const url = route.request().url();
                    if (AMAZON_TRACKING_SCRIPTS.some(domain => url.includes(domain))) {
                        route.abort();
                        return;
                    }
                }

                route.continue();
            });

            // Verifica se precisa retry de grupo com CAPTCHA
            if (this.captchaRetryPending && this.lastCaptchaGroupIndex === this.contadorAmazon) {
                console.log(`🔄 [Amazon] Retry do grupo ${this.contadorAmazon} (CAPTCHA anterior)...`);
            }

            const group: string[] = this.urlsAmazon[this.contadorAmazon]!

            let groupSuccessCount = 0;

            for (let i = 0; i < group.length; i++) {

                utils.resetWordsAlreadyUsed()

                const startTime = Date.now()
                const URLAmazon = group[i]!;

                try {
                    await page.goto(URLAmazon, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await HUMAN_DELAY(8000, 12000); // 8-12s para Amazon (mais lento para evitar CAPTCHA)

                    const cards = await page.$$('.s-result-item[data-asin]');
                    console.log(`📦 [Amazon] Encontrados ${cards.length} produtos.`);

                    if (cards.length === 0) {
                        const duration = (Date.now() - startTime) / 1000

                        const captchaDog = await page.locator('img#d').count();
                        const captchaForm = await page.locator('form[action*="validateCaptcha"]').count();
                        const isCaptcha = captchaDog > 0 || captchaForm > 0;

                        if (isCaptcha) {
                            // Se já é retry e ainda tem CAPTCHA, pula grupo
                            if (this.captchaRetryPending && this.lastCaptchaGroupIndex === this.contadorAmazon) {
                                console.warn(`⚠️ [Amazon] CAPTCHA persistente no grupo ${this.contadorAmazon}. Pulando...`);
                                this.captchaRetryPending = false;
                                this.contadorAmazon++;
                                break;
                            }

                            console.warn("⚠️ [Amazon] CAPTCHA (Cachorro) detectado! Parando grupo...");

                            await TakePrintScreenService({
                                page: page,
                                produtosLength: 0,
                                store: "Amazon",
                                status: "Falha - Captcha",
                                tempoExecucao: duration,
                                url: URLAmazon
                            })

                            // Marca que precisa retry neste grupo
                            this.captchaRetryPending = true;
                            this.lastCaptchaGroupIndex = this.contadorAmazon;

                            break; // ← Para o grupo INTEIRO, não apenas esta URL
                        }

                        console.log(`📦 Fim dos produtos.`);

                        await TakePrintScreenService({
                            page: page,
                            produtosLength: 0,
                            store: "Amazon",
                            status: "Fim dos produtos",
                            tempoExecucao: duration,
                            url: URLAmazon
                        })

                        continue;
                    }

                    const productsPage: MlProducts[] = [];

                    for (const card of cards) {
                        try {
                            const id = await card.getAttribute('data-asin');
                            if (!id) continue;

                            const titleEl = await card.$('h2');
                            const title = (await titleEl?.innerText()) || "";
                            if (!titleMatchesAnyNiche(title) || !utils.checkLimitedWords(title)) continue

                            const priceEls = await card.$$('.a-price .a-offscreen');

                            const formatPrice = (text: string): number => {
                                const val = parseFloat(text.replace(/[^\d,]/g, '').replace(',', '.'));
                                return isNaN(val) ? 0 : Number(val.toFixed(2));
                            };

                            const rawPrice = priceEls[0] ? await priceEls[0].innerText() : "0";
                            const cleanPrice = formatPrice(rawPrice);

                            let originalPrice: number | null = null;
                            if (priceEls.length > 1) {
                                const rawOriginal = await priceEls[1]!.innerText();
                                if (rawOriginal) {
                                    originalPrice = formatPrice(rawOriginal);
                                }
                            }
                            if (!originalPrice) continue

                            if (!productMatchesAnyNiche(title, originalPrice, cleanPrice)) continue;

                            let badge: String | null = utils.GetDiscount(originalPrice, cleanPrice)
                            if (!badge) badge = null

                            let installments: string | null = null;
                            try {
                                const recipeElement = await card.$('div[data-cy="price-recipe"]');

                                if (recipeElement) {
                                    let fullText = (await recipeElement.innerText()).replace(/\s+/g, ' ').trim();
                                    const match = fullText.match(/(em até \d+x de\s+R\$\s*[\d,]+).*?sem juros/i);

                                    if (match) {
                                        let installmentPart = match[1]!;
                                        installmentPart = installmentPart
                                            .replace(/em até | de/gi, "")
                                            .replace(',', '.');
                                        installments = `${installmentPart} s/ juros`;
                                    } else {
                                        installments = null;
                                    }
                                }
                            } catch (error) {
                                installments = null;
                            }

                            productsPage.push({
                                id: id,
                                title: title.trim(),
                                price: isNaN(cleanPrice) ? 0 : cleanPrice,
                                originalPrice: isNaN(originalPrice || 0) ? null : originalPrice,
                                coupon: null,
                                badge: badge,
                                imageUrl: await (await card.$('img.s-image'))?.getAttribute('src') || null,
                                link: 'https://www.amazon.com.br' + (await (await card.$('a.a-link-normal'))?.getAttribute('href') || ""),
                                store: 'Amazon',
                                installments: installments
                            });

                        } catch (e) { continue; }
                    }

                    if (productsPage.length > 0) {
                        groupSuccessCount++;
                        onPageScraped?.(productsPage);

                        const duration = (Date.now() - startTime) / 1000
                        await TakePrintScreenService({
                            page: page,
                            produtosLength: productsPage.length,
                            store: "Amazon",
                            status: "Sucesso",
                            tempoExecucao: duration,
                            url: URLAmazon
                        })
                    }

                } catch (err) {
                    console.error(`❌ Erro na URL Amazon: ${URLAmazon}`, err);
                }
            }

            // Gera grupo da próxima página se não atingiu o limite
            if (groupSuccessCount > 0 && group.length > 0) {
                const firstUrl = new URL(group[0]!);
                const currentPage = parseInt(firstUrl.searchParams.get('page') || '1');

                if (currentPage < AccesWeb.MAX_AMAZON_PAGES) {
                    const nextPageGroup = group.map(url => {
                        const obj = new URL(url);
                        obj.searchParams.set('page', (currentPage + 1).toString());
                        return obj.toString();
                    });
                    this.urlsAmazon.push(nextPageGroup);
                    console.log(`📄 [Amazon] Grupo page ${currentPage + 1} adicionado à fila.`);
                }
            } else if (groupSuccessCount === 0) {
                console.log(`🛑 [Amazon] Grupo sem produtos. Próxima página não gerada.`);
            }

        } catch (error) {
            console.error("❌ Erro catastrófico na Amazon:", error);
        } finally {
            await browser.close();

            // Só incrementa se não tem retry pendente (CAPTCHA)
            if (!this.captchaRetryPending) {
                this.contadorAmazon++
            }

            if (this.contadorAmazon >= this.urlsAmazon.length) {
                this.contadorAmazon = 0;
                console.log(`🔄 [Amazon] Ciclo reiniciado.`);
            }
        }
    }

}//Fim da classe


