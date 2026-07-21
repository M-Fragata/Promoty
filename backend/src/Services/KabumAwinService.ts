import { Env } from '../utils/Envirolment.js';
import { createGunzip } from 'node:zlib';
import { Readable, Transform } from 'node:stream';
import { parse } from 'csv-parse';

export interface ProdutoKabum {
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

const LOTE_SIZE = 500;

export class KabumService {

    private cacheProdutos: ProdutoKabum[] = [];
    private contadorOffset = 0;

    private async baixarEProcessarFeed(): Promise<ProdutoKabum[]> {
        console.log('⏳ Baixando e processando feed da Kabum...');

        const response = await fetch(Env.AWIN_KABUM_URL);
        if (!response.ok) {
            throw new Error(`Erro ao baixar CSV Kabum: ${response.statusText}`);
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
        const produtos: ProdutoKabum[] = [];

        for await (const row of parser) {
            contagem++;

            const precoAtual = limparPreco(row.search_price);
            const precoAntigo = limparPreco(row.product_price_old);

            if (!precoAntigo || precoAntigo <= precoAtual || precoAtual <= 0) continue;

            const desconto = Math.round(((precoAntigo - precoAtual) / precoAntigo) * 100);
            //if (desconto < 20) continue;

            produtos.push({
                id: `Kabum${row.aw_product_id}`,
                title: corrigirEncoding(row.product_name),
                price: precoAtual,
                originalPrice: precoAntigo,
                badge: `${desconto}% OFF`,
                installments: '',
                imageUrl: row.merchant_image_url,
                link: row.aw_deep_link,
                store: 'Kabum'
            });
        }

        console.log(`📋 Total de produtos analisados: ${contagem}`);
        console.log(`🔥 Produtos com desconto (≥20%): ${produtos.length}`);
        return produtos;
    };

    buscarProximoLote = async (): Promise<ProdutoKabum[]> => {
        if (this.cacheProdutos.length === 0 || this.contadorOffset >= this.cacheProdutos.length) {
            this.cacheProdutos = await this.baixarEProcessarFeed();
            this.contadorOffset = 0;
        }

        const lote = this.cacheProdutos.slice(this.contadorOffset, this.contadorOffset + LOTE_SIZE);
        this.contadorOffset += LOTE_SIZE;

        console.log(`📦 Lote entregue: ${lote.length} produtos (offset: ${this.contadorOffset})`);
        return lote;
    };

    buscarProdutos = async (): Promise<ProdutoKabum[]> => {
        return this.baixarEProcessarFeed();
    };
}
