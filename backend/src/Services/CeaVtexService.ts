import { Env } from '../utils/Envirolment.js';
import { modaFeminina } from '../config/moda-feminina.niche.js';

const VTEX_BASE_URL = 'https://www.cea.com.br/api/catalog_system/pub/products/search';
const PAGE_SIZE = 15;
const LOTE_SIZE = 10;
const DESCONTO_MINIMO = 50;

export interface ProdutoCea {
    id: string;
    title: string;
    price: number;
    originalPrice: number;
    badge: string;
    //description: string | null;
    installments: string;
    imageUrl: string;
    link: string;
    store: string;
}

interface VtexInstallment {
    Value: number;
    InterestRate: number;
    TotalValuePlusInterestRate: number;
    NumberOfInstallments: number;
    PaymentSystemName: string;
    Name: string;
}

interface VtexCommertialOffer {
    Price: number;
    ListPrice: number;
    Installments: VtexInstallment[];
}

interface VtexSeller {
    sellerId: string;
    commertialOffer: VtexCommertialOffer;
}

interface VtexItem {
    itemId: string;
    sellers: VtexSeller[];
    images: { imageUrl: string }[];
}

interface VtexProduct {
    productId: string;
    productName: string;
    description: string;
    link: string;
    items: VtexItem[];
}

function montarLinkAfiliado(productUrl: string): string {
    const encoded = encodeURIComponent(productUrl);
    return `https://www.awin1.com/cread.php?awinmid=${Env.AWIN_CEA_MERCHANT_ID}&awinaffid=${Env.AWIN_PUBLISHER_ID}&ued=${encoded}`;
}

function extrairParcelasSemJuros(installments: VtexInstallment[]): string {
    const semJuros = installments.filter(i => i.InterestRate === 0 && i.NumberOfInstallments > 1);

    if (semJuros.length === 0) {
        return '';
    }

    const maiorParcela = semJuros.reduce((max, curr) =>
        curr.NumberOfInstallments > max.NumberOfInstallments ? curr : max
    );

    const valorParcela = maiorParcela.Value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return `${maiorParcela.NumberOfInstallments}x de ${valorParcela} sem juros`;
}

function temBanword(texto: string): boolean {
    const textLower = texto.toLowerCase();
    return modaFeminina.banwords.some(bw => textLower.includes(bw.toLowerCase()));
}

function mapearProduto(product: VtexProduct): ProdutoCea | null {
    const item = product.items?.[0];
    const seller = item?.sellers?.[0];
    const offer = seller?.commertialOffer;

    if (!offer || !item) return null;

    const price = offer.Price;
    const listPrice = offer.ListPrice;

    if (!listPrice || listPrice <= price || price <= 0) return null;

    const desconto = Math.round((1 - price / listPrice) * 100);

    if (desconto < DESCONTO_MINIMO) return null;

    if (temBanword(product.productName)) return null;

    return {
        id: `C&A${product.productId}`,
        title: product.productName,
        price,
        originalPrice: listPrice,
        badge: `${desconto}% OFF`,
        //description: product.description || '',
        installments: extrairParcelasSemJuros(offer.Installments || []),
        imageUrl: item.images?.[0]?.imageUrl || '',
        link: montarLinkAfiliado(product.link),
        store: 'C&A'
    };
}

export class CeaVtexService {

    private from = 0;

    buscarProximoLote = async (): Promise<ProdutoCea[]> => {
        console.log(`⏳ Buscando produtos C&A com desconto (from: ${this.from})...`);

        const todosProdutos: ProdutoCea[] = [];

        while (todosProdutos.length < LOTE_SIZE) {
            const to = this.from + PAGE_SIZE - 1;

            const url = `${VTEX_BASE_URL}?O=OrderByBestDiscountDESC&_from=${this.from}&_to=${to}`;
            console.log(`📄 Fetching produtos ${this.from} a ${to}...`);

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`❌ Erro na requisição VTEX: ${response.statusText}`);
                break;
            }

            const data: VtexProduct[] = await response.json();

            if (!data || data.length === 0) {
                console.log(`✅ Sem mais produtos a partir do offset ${this.from}`);
                this.from = 0;
                break;
            }

            for (const product of data) {
                const produto = mapearProduto(product);
                if (produto) {
                    todosProdutos.push(produto);
                    if (todosProdutos.length >= LOTE_SIZE) break;
                }
            }

            console.log(`   → ${data.length} recebidos, ${todosProdutos.length} com desconto ≥${DESCONTO_MINIMO}%`);

            this.from += PAGE_SIZE;

            if (data.length < PAGE_SIZE) {
                console.log(`✅ Fim dos produtos C&A`);
                this.from = 0;
                break;
            }
        }

        console.log(`🔥 Total de produtos C&A válidos: ${todosProdutos.length}`);
        return todosProdutos;
    };
}
