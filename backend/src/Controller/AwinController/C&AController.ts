import type { Response, Request } from "express";
import { buscarProdutosComDesconto } from "../../Services/CeaVtexService.js";

export class CeAController {

    async iniciarSincronizacao(req: Request, res: Response) {
        try {
            const inicio = Date.now();

            const products = await buscarProdutosComDesconto();

            const fim = Date.now();
            console.log(`⏱️ Tempo total de execução: ${((fim - inicio) / 1000).toFixed(2)} segundos`);
            console.log(`📦 Produtos retornados: ${products.length}`);

            return res.status(200).json(products);
        } catch (erro: any) {
            console.error('❌ Falha crítica no Job:', erro);
            return res.status(400).json({ message: erro.message || erro })
        }
    }
}
