import type { Response, Request } from "express";
import { CeaVtexService } from "../../Services/CeaVtexService.js";
import { PromosController } from "../../Controller/PromosController.js";

const ceaService = new CeaVtexService();
const promosController = new PromosController();

export class CeAController {

    async listar(req: Request, res: Response) {
        try {
            const inicio = Date.now();

            const products = await ceaService.buscarProximoLote();

            promosController.processProductsAwin(products);

            const fim = Date.now();
            console.log(`⏱️ Tempo total C&A: ${((fim - inicio) / 1000).toFixed(2)} segundos`);
            console.log(`📦 Produtos C&A retornados: ${products.length}`);

            return res.status(200).json(products);
        } catch (erro: any) {
            console.error('❌ Erro ao buscar produtos C&A:', erro);
            return res.status(500).json({ error: 'Erro interno no processamento.' });
        }
    }
}
