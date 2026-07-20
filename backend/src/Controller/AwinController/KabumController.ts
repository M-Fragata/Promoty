import type { Response, Request } from 'express';
import { KabumService } from '../../Services/KabumAwinService.js';

const kabumService = new KabumService();

export class KabumController {

    async listar(req: Request, res: Response) {
        try {
            const inicio = Date.now();

            const products = await kabumService.buscarProximoLote();

            const fim = Date.now();
            console.log(`⏱️ Tempo total Kabum: ${((fim - inicio) / 1000).toFixed(2)} segundos`);
            console.log(`📦 Produtos Kabum retornados: ${products.length}`);

            return res.status(200).json(products);
        } catch (erro: any) {
            console.error('❌ Erro ao buscar produtos Kabum:', erro);
            return res.status(500).json({ error: 'Erro interno no processamento.' });
        }
    }
}
