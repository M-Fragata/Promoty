import { chromium } from 'playwright-extra';
import { type Page } from 'playwright'
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
const keywords: string[] = ["notebook", "celular", "smartphone", "monitor", "placa de vídeo", "ssd", "hd", "fone", "headset", "teclado", "mouse", "webcam", "caixa de som bluetooth", "smartwatch", "tablet", "processador", "memória ram", "gabinete gamer", "cooler", "fonte para pc", "impressora", "roteador", "tv", "videogame", "console", "jogo de videogame", "cadeira gamer", "cadeira ergonomica", "cadeira de escritório", "mesa gamer", "power bank", "cabo usb", "carregador portátil", "suporte para notebook", "microfone", "webcam", "filtro de linha", "no-break", "pen drive", "cartão de memória", "nvme", "water cooler"]
const descountMin: number = 35
const maxPrice: number = 3000

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
    gerarBlocoPichau(paginaInicial: number, paginaFinal: number): string[] {
        const urlsBloco: string[] = [];
        for (let p = paginaInicial; p <= paginaFinal; p++) {
            if (p === 1) {
                urlsBloco.push("https://lista.mercadolivre.com.br/loja/pichau/_Discount_20-100_NoIndex_True?tracking_id=c6ca5d7a297815906f045e8ab1fde59c");
            } else {
                // Formula exata para gerar 49, 97, 145...
                const offset = ((p - 1) * 48) + 1;
                urlsBloco.push(`https://lista.mercadolivre.com.br/loja/pichau/_Desde_${offset}_Discount_20-100_NoIndex_True?tracking_id=c6ca5d7a297815906f045e8ab1fde59c`);
            }
        }
        return urlsBloco;
    }
    async getMaxPagesPichau(page: Page): Promise<number> {
        try {
            // Seleciona todos os links numéricos da paginação
            const linksPaginas = await page.$$('.andes-pagination__button a.andes-pagination__link');
            let maxPagina = 1;

            for (const link of linksPaginas) {
                const texto = await link.innerText();
                const numero = parseInt(texto.trim(), 10);
                if (!isNaN(numero) && numero > maxPagina) {
                    maxPagina = numero;
                }
            }
            return maxPagina; // No seu HTML de exemplo, retornará 10
        } catch {
            return 1; // Fallback seguro se o seletor mudar
        }
    }

}

const utils = new secondaryFunction();

export class AccesWeb {

    //=======================
    // Bloco Mercado Livre 
    // ======================
    private static contadorML: number = 0
    // 1- informática; 2- Pichau-ML 3- celulares e telefones; 4- oferta do dia + 1 e 2
    //Adicionar link da reddragon -> https://lista.mercadolivre.com.br/loja/redragon/_Discount_20-100?tracking_id=d0be4182-3fea-462e-b178-9182aafd8d71#applied_filter_id%3Ddiscount%26applied_filter_name%3DDescontos%26applied_filter_order%3D5%26applied_value_id%3D20-100%26applied_value_name%3DMais+de+20%25+OFF%26applied_value_order%3D4%26applied_value_results%3D38%26is_custom%3Dfalse
    private static URLs: string[][] = [

        //utils.gerarBlocoPichau(1, 5), // Pichau (Páginas 1 a 5)

        ["https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=1&promotion_type=lightning", "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=2&promotion_type=lightning", "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=3&promotion_type=lightning",],


        ["https://www.mercadolivre.com.br/ofertas?category=MLB1051&page=1&promotion_type=lightning", "https://www.mercadolivre.com.br/ofertas?category=MLB1051&page=2&promotion_type=lightning", "https://www.mercadolivre.com.br/ofertas?category=MLB1051&page=3&promotion_type=lightning", "https://www.mercadolivre.com.br/ofertas?category=MLB1051&page=4&promotion_type=lightning"],

        ["https://www.mercadolivre.com.br/ofertas?category=MLB1648&container_id=MLB779362-1&promotion_type=deal_of_the_day#filter_applied=category&filter_position=3&origin=qcat",
            "https://www.mercadolivre.com.br/ofertas?category=MLB1051&container_id=MLB779362-1&promotion_type=deal_of_the_day#filter_applied=category&filter_position=3&origin=qcat", "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=4&promotion_type=lightning", "https://www.mercadolivre.com.br/ofertas?category=MLB1051&page=5&promotion_type=lightning"
        ],

    ]

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

        let urlCounter = AccesWeb.URLs.length - 1

        // 🚨 SE O CONTADOR VOLTAR PRO ZERO, RESETAMOS AS ABAS DINÂMICAS!
        if (AccesWeb.contadorML > urlCounter) {
            AccesWeb.contadorML = 0;

            // Corta o array estático de volta para os 4 blocos originais de fábrica
            // eliminando qualquer push de Pichau feito em ciclos passados.
            if (AccesWeb.URLs.length > 4) {
                AccesWeb.URLs.length = 4;
                console.log("♻️ [Fila Dinâmica] Varredura completa reiniciada. Expurgando URLs antigas da memória!");
            }
        }

        try {
            let URLsGroup: string[] = AccesWeb.URLs[AccesWeb.contadorML]!

            // 🔄 O laço percorre as URLs dentro do Try principal
            for (let i = 0; i < URLsGroup.length; i++) {
                const URL = URLsGroup[i]!;

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
                                console.log("URL's passadas", AccesWeb.URLs)

                                // Injeta o próximo lote de 5 páginas na esteira
                                AccesWeb.URLs.push(utils.gerarBlocoPichau(paginaInicialDoProximoBloco, paginaFinalDoProximoBloco));

                                //Verificando URL's presentes
                                console.log("URL's de agora", AccesWeb.URLs)

                                console.log(`📊 [Fila Dinâmica] Total de Grupos na classe agora: ${AccesWeb.URLs.length}`);
                            }

                        }

                    }

                    // Mapeia os cards que aparecem nessa listagem específica
                    const cards = await page.$$('.poly-card');
                    console.log(`📦 Encontrados ${cards.length} cards nesta página.`);


                    if (cards.length === 0) {
                        console.log(`🛑 [Scraper] Página vazia detectada na URL atual.`);
                        await page.screenshot({ path: `logs/erro-mercadolivre-${Date.now()}.png`, fullPage: true });
                        break;
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
                                badge: mlBadge,
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

                        // Chamamos a função sem dar await aqui dentro para liberar o laço
                        onPageScraped?.(productsPage);
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
            AccesWeb.contadorML++
            await browser.close();
        }
    }

    // ================
    // Bloco Amazon
    // ================
    private static contadorAmazon: number = 0

    private static URLsAmazon: string[][] = [
        ["https://www.amazon.com.br/s?i=computers&rh=n%3A16339927011%2Cp_n_deal_type%3A23565493011&dc&page=1&qid=1780962721&rnid=23565491011&xpid=ug7b2y3U-qvbv&ref=sr_pg_1",
            "https://www.amazon.com.br/s?i=electronics&rh=n%3A16209063011%2Cp_n_deal_type%3A23565492011&dc&ds=v1%3AM7qKaAQFjtAAj0anALEbfRkWNv96M0a9N9Z4wPaYslI&page=1&qid=1781002007&rnid=23565491011&ref=sr_nr_p_n_deal_type_3",]

    ]

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
        let urlCounter = AccesWeb.URLsAmazon.length - 1;

        if (AccesWeb.contadorAmazon > urlCounter) {
            AccesWeb.contadorAmazon = 0;
            if (AccesWeb.URLsAmazon.length > 1) AccesWeb.URLsAmazon.length = 1;
        }

        try {

            // Bloqueio de recursos desnecessários (Performance)

            //await page.route('**/*', (route) => {
            /*  if (['stylesheet', 'font', 'image'].includes(route.request().resourceType())) {
                  route.abort();
              } else {
                  route.continue();
              }
          });*/

            let URLsGroup: string[] = AccesWeb.URLsAmazon[AccesWeb.contadorAmazon]!

            for (let i = 0; i < URLsGroup.length; i++) {
                const URL = URLsGroup[i]!;

                //Url dinamica
                const urlDynamic: string[] = []
                urlDynamic.push(URL.replace("page=1", `page=${AccesWeb.contadorAmazon + 1}`))
                if (urlDynamic.length === URLsGroup.length) {
                    AccesWeb.URLsAmazon.push(urlDynamic)
                    urlDynamic.shift()
                }

                try {
                    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await HUMAN_DELAY(3000, 6000);

                    const cards = await page.$$('.s-result-item[data-asin]');
                    console.log(`📦 [Amazon] Encontrados ${cards.length} produtos.`);
                    /*
                                        const isCaptcha = await page.$('input[name="field-keywords"]'); // Exemplo genérico de proteção Amazon
                                        if (isCaptcha) {
                                            console.warn("⚠️ Captcha detectado! Parando para evitar banimento...");
                                            return; // Para o robô totalmente em vez de avançar para a próxima URL erroneamente
                                        }
                    */
                    if (cards.length === 0) {
                        console.log(`📦 Fim dos produtos. Avançando para a próxima categoria.`);
                        AccesWeb.contadorAmazon++;
                        return; // Sai do método para o próximo ciclo
                    }

                    const productsPage: MlProducts[] = [];

                    for (const card of cards) {
                        try {
                            const id = await card.getAttribute('data-asin');
                            if (!id) continue;

                            // Título
                            const titleEl = await card.$('h2');
                            const title = (await titleEl?.innerText()) || "";
                            if (!utils.verifyKeyWords(title)) continue;

                            // Preços (Amazon geralmente tem: [Atual, Original])
                            const priceEls = await card.$$('.a-price .a-offscreen');

                            // Função auxiliar inline para garantir a padronização
                            const formatPrice = (text: string): number => {
                                const val = parseFloat(text.replace(/[^\d,]/g, '').replace(',', '.'));
                                return isNaN(val) ? 0 : Number(val.toFixed(2));
                            };

                            const rawPrice = priceEls[0] ? await priceEls[0].innerText() : "0";
                            const cleanPrice = formatPrice(rawPrice);

                            let originalPrice: number | null = null;
                            if (priceEls.length > 1) {
                                const rawOriginal = await priceEls[1]!.innerText();
                                // Verifica se rawOriginal não é vazio/null antes de processar
                                if (rawOriginal) {
                                    originalPrice = formatPrice(rawOriginal);
                                }
                            }

                            // Badge e Parcelamento
                            const badgeEl = await card.$('.rio-badge-label');
                            const badge = badgeEl ? await badgeEl.innerText() : null;

                            let installments: string | null = null;
                            try {
                                // Na Amazon, o preço e o parcelamento vivem dentro do price-recipe
                                const recipeElement = await card.$('div[data-cy="price-recipe"]');

                                if (recipeElement) {
                                    // 1. Pega o texto limpo de todo o bloco (os spans serão lidos sequencialmente)
                                    const fullText = await recipeElement.innerText();

                                    // 2. Regex para capturar os 3 grupos: (em até Xx de) (R$ valor) (sem juros)
                                    // O .*? entre os grupos garante que ele ignore espaços ou quebras de linha entre os spans
                                    const match = fullText.match(/(em até \d+x de)\s+(R\$[\d,.]+)\s+(sem juros)/i);
                                    console.log("Texto de parcelamento full:", fullText)
                                    if (match) {
                                        // match[1] = "em até 12x de"
                                        // match[2] = "R$ 93,33"
                                        // match[3] = "sem juros"

                                        // 3. Formatação:
                                        let parcelas = match[1].split("até ")[2]; // Mantém como está
                                        let valor = match[2].replace(',', '.'); // Troca vírgula por ponto (R$ 93.33)
                                        let condicao = "s/ juros"; // Seu padrão abreviado

                                        // Resultado final: "em até 12x de R$ 93.33 s/ juros"
                                        installments = `${parcelas} ${valor} ${condicao}`;
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
                                coupon: null, // Amazon cupons geralmente aparecem como badge ou text
                                badge: badge,
                                imageUrl: await (await card.$('img.s-image'))?.getAttribute('src') || null,
                                link: 'https://www.amazon.com.br' + (await (await card.$('a.a-link-normal'))?.getAttribute('href') || ""),
                                store: 'Amazon',
                                installments: installments
                            });

                        } catch (e) { continue; }
                    }

                    if (productsPage.length > 0) {
                        onPageScraped?.(productsPage);
                    }

                } catch (err) {
                    console.error(`❌ Erro na URL Amazon: ${URL}`, err);
                }
            }
        } catch (error) {
            console.error("❌ Erro catastrófico na Amazon:", error);
        } finally {
            await browser.close();
            console.log("Urls geradas dinamicamente", AccesWeb.URLsAmazon)
            AccesWeb.contadorAmazon++
            if (AccesWeb.URLsAmazon.length > 50) {
                // Mantém apenas os últimos 50 registros para não estourar a memória
                AccesWeb.URLsAmazon = AccesWeb.URLsAmazon.slice(-50);
            }
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
                                installments: null,
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


