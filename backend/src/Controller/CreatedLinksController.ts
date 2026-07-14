import { type Request, type Response } from 'express';
import { prisma } from '../Database/Prisma.js';
import { detectStore, appendAffiliateParams, type StoreType } from '../utils/affiliateUtils.js';
import { EncurtaLinkController } from './EncutarLinkController.js';

// Mapeamento de loja para nome amigável
const STORE_LABELS: Record<StoreType, string> = {
  mercadolivre: 'Mercado Livre',
  amazon: 'Amazon',
  shopee: 'Shopee',
  other: 'Outro'
};

export class CreatedLinksController {

  /**
   * POST /api/links
   * Cria um link encurtado com parâmetros de afiliado
   */
  create = async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL é obrigatória' });
      }

      // Validar se a URL é válida
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'URL inválida' });
      }

      // Detectar loja e appendar parâmetros de afiliado
      const store = detectStore(url);
      const affiliateUrl = appendAffiliateParams(url, store);

      // Encurtar link via Kutt
      const shortUrl = await EncurtaLinkController(affiliateUrl);

      // Salvar no banco
      const createdLink = await prisma.createdLink.create({
        data: {
          userId,
          originalUrl: url,
          affiliateUrl,
          shortUrl,
          store
        }
      });

      return res.status(201).json({
        id: createdLink.id,
        originalUrl: createdLink.originalUrl,
        affiliateUrl: createdLink.affiliateUrl,
        shortUrl: createdLink.shortUrl,
        store: createdLink.store,
        storeLabel: STORE_LABELS[store],
        clickCount: createdLink.clickCount,
        createdAt: createdLink.createdAt
      });
    } catch (error) {
      console.error('Erro ao criar link:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  /**
   * GET /api/links
   * Lista todos os links criados pelo usuário
   */
  list = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const links = await prisma.createdLink.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const linksWithLabels = links.map(link => ({
        id: link.id,
        originalUrl: link.originalUrl,
        affiliateUrl: link.affiliateUrl,
        shortUrl: link.shortUrl,
        store: link.store,
        storeLabel: STORE_LABELS[link.store as StoreType] || 'Outro',
        clickCount: link.clickCount,
        createdAt: link.createdAt
      }));

      return res.json({ links: linksWithLabels });
    } catch (error) {
      console.error('Erro ao listar links:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  /**
   * DELETE /api/links/:id
   * Remove um link criado
   */
  delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o link existe e pertence ao usuário
      const existingLink = await prisma.createdLink.findFirst({
        where: { id, userId }
      });

      if (!existingLink) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }

      await prisma.createdLink.delete({
        where: { id }
      });

      return res.json({ message: 'Link removido com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar link:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  /**
   * GET /r/:id
   * Redireciona para a URL afiliada e incrementa o contador de cliques
   */
  redirect = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const link = await prisma.createdLink.findUnique({
        where: { id }
      });

      if (!link) {
        return res.status(404).json({ error: 'Link não encontrado' });
      }

      // Incrementar contador de cliques
      await prisma.createdLink.update({
        where: { id },
        data: { clickCount: { increment: 1 } }
      });

      // Redirecionar para a URL afiliada
      return res.redirect(302, link.affiliateUrl);
    } catch (error) {
      console.error('Erro ao redirecionar:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

export const createdLinksController = new CreatedLinksController();
