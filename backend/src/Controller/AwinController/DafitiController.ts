import type { Response, Request } from 'express';
import { DafitiService } from '../../Services/DafitiAwinService.js';
import { PromosController } from '../../Controller/PromosController.js';

const dafitiService = new DafitiService();
const promosController = new PromosController();

export class DafitiController {

    async listar(req: Request, res: Response) {
        try {
            const inicio = Date.now();

            const products = await dafitiService.buscarProximoLote();

            promosController.processProductsAwin(products);

            const fim = Date.now();
            console.log(`⏱️ Tempo total Dafiti: ${((fim - inicio) / 1000).toFixed(2)} segundos`);
            console.log(`📦 Produtos Dafiti retornados: ${products.length}`);

            return res.status(200).json(products);
        } catch (erro: any) {
            console.error('❌ Erro ao buscar produtos Dafiti:', erro);
            return res.status(500).json({ error: 'Erro interno no processamento.' });
        }
    }
}
