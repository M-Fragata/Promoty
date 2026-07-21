import { Env } from '../utils/Envirolment.js';
import { createGunzip } from 'node:zlib';
import { Readable, Transform } from 'node:stream';
import { parse } from 'csv-parse';
import { modaFeminina } from '../config/moda-feminina.niche.js';

export interface ProdutoDafiti {
    id: string;
    title: string;
    price: number;
    originalPrice: number;
    badge: string;
    installments: string;
    imageUrl: string;
    link: string;
    store: string;
}

function limparPreco(precoStr: string): number {
    if (!precoStr) return 0;
    return parseFloat(precoStr.replace('BRL', '').trim()) || 0;
}

const TABELA_ENCODING: Record<string, string> = {
    'Ã§': 'ç', 'Ã£': 'ã', 'Ãµ': 'õ', 'Ã¡': 'á', 'Ã©': 'é',
    'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã ': 'À', 'Ã‰': 'É',
    'Ãœ': 'Ü', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã´': 'ô', 'Ã¼': 'ü',
    'Ã„': 'Ä', 'Ã–': 'Ö', 'ÃŸ': 'ß', 'Ã¤': 'ä', 'Ã¶': 'ö',
    'Ã±': 'ñ', 'Ã‡': 'Ç', 'Ã€': 'À', 'Ãˆ': 'È', 'ÃŒ': 'Ì',
    'Ã™': 'Ù', 'Ã˜': 'Ø', 'Ã…': 'Å', 'Ã†': 'Æ', 'Ã': 'Ã'
};

function corrigirEncoding(texto: string): string {
    if (!texto) return texto;
    let resultado = texto;
    for (const [de, para] of Object.entries(TABELA_ENCODING)) {
        resultado = resultado.replaceAll(de, para);
    }
    return resultado;
}

function criarDecoderLatin1(): Transform {
    return new Transform({
        transform(buffer, _encoding, callback) {
            let resultado = '';
            for (let i = 0; i < buffer.length; i++) {
                resultado += String.fromCharCode(buffer[i]!);
            }
            callback(null, resultado);
        }
    });
}

const LOTE_SIZE = 10;
const DESCONTO_MINIMO = 50;

function temBanword(texto: string): boolean {
    const textLower = texto.toLowerCase();
    return modaFeminina.banwords.some(bw => textLower.includes(bw.toLowerCase()));
}

function repeatName(text: string, products: ProdutoDafiti[]): boolean {
    const textLower = text.toLowerCase();
    return products.some(p => p.title.toLowerCase() === textLower);
}

export class DafitiService {

    private cacheProdutos: ProdutoDafiti[] = [];
    private contadorOffset = 0;

    private async baixarFeedCompleto(): Promise<void> {
        console.log('⏳ Baixando e processando feed completo da Dafiti...');

        this.cacheProdutos = [];

        const response = await fetch(Env.AWIN_DAFITI_URL);
        if (!response.ok) {
            throw new Error(`Erro ao baixar CSV Dafiti: ${response.statusText}`);
        }

        const nodeStream = Readable.fromWeb(response.body as any);

        const parser = nodeStream
            .pipe(createGunzip())
            .pipe(criarDecoderLatin1())
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true
            }));

        let contagem = 0;

        for await (const row of parser) {
            contagem++;

            const precoAtual = limparPreco(row.search_price);
            const precoAntigo = limparPreco(row.product_price_old);

            if (!precoAntigo || precoAntigo <= precoAtual || precoAtual <= 0) continue;

            const desconto = Math.round(((precoAntigo - precoAtual) / precoAntigo) * 100);
            if (desconto < DESCONTO_MINIMO) continue;

            const titulo = corrigirEncoding(row.product_name);
            if (temBanword(titulo) || repeatName(titulo, this.cacheProdutos)) continue;

            this.cacheProdutos.push({
                id: `Dafiti${row.aw_product_id}`,
                title: titulo,
                price: precoAtual,
                originalPrice: precoAntigo,
                badge: `${desconto}% OFF`,
                installments: '',
                imageUrl: row.merchant_image_url,
                link: row.aw_deep_link,
                store: 'Dafiti'
            });
        }

        console.log(`📋 Total de produtos analisados: ${contagem}`);
        console.log(`🔥 Produtos com desconto (≥${DESCONTO_MINIMO}%): ${this.cacheProdutos.length}`);
    };

    buscarProximoLote = async (): Promise<ProdutoDafiti[]> => {
        if (this.cacheProdutos.length === 0 || this.contadorOffset >= this.cacheProdutos.length) {
            await this.baixarFeedCompleto();
            this.contadorOffset = 0;
        }

        const lote = this.cacheProdutos.slice(this.contadorOffset, this.contadorOffset + LOTE_SIZE);
        this.contadorOffset += LOTE_SIZE;

        console.log(`📦 Lote entregue: ${lote.length} produtos (offset: ${this.contadorOffset})`);
        return lote;
    };

    buscarProdutos = async (): Promise<ProdutoDafiti[]> => {
        await this.baixarFeedCompleto();
        return this.cacheProdutos;
    };
}
