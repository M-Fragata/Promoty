import { type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../Database/Prisma.js';

// Schema de validação para parâmetros
const productIdParamSchema = z.object({
  productId: z.string().min(1, 'ID do produto é obrigatório')
});

export class FavoritesController {

  addFavorite = async (req: Request, res: Response) => {
    try {
      // Validar parâmetros com Zod
      const validation = productIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: errors
        });
      }

      const { productId } = validation.data;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar se o produto existe
      const product = await prisma.productsMl.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Verificar se já é favorito
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });

      if (existingFavorite) {
        return res.status(400).json({ error: 'Produto já está nos favoritos' });
      }

      // Criar favorito
      const favorite = await prisma.favorite.create({
        data: {
          userId,
          productId
        }
      });

      return res.status(201).json({ 
        message: 'Produto adicionado aos favoritos',
        favorite 
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  removeFavorite = async (req: Request, res: Response) => {
    try {
      // Validar parâmetros com Zod
      const validation = productIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: errors
        });
      }

      const { productId } = validation.data;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Verificar se o favorito existe
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });

      if (!existingFavorite) {
        return res.status(404).json({ error: 'Favorito não encontrado' });
      }

      // Remover favorito
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });

      return res.status(200).json({ 
        message: 'Produto removido dos favoritos' 
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  getFavorites = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Buscar favoritos com dados do produto
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
          product: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Extrair apenas os produtos
      const products = favorites.map(fav => fav.product);

      return res.status(200).json({ 
        favorites: products 
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  checkFavorite = async (req: Request, res: Response) => {
    try {
      // Validar parâmetros com Zod
      const validation = productIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: errors
        });
      }

      const { productId } = validation.data;
      const userId = req.user?.sub;

      // Se não estiver logado, retorna false
      if (!userId) {
        return res.status(200).json({ isFavorite: false });
      }

      // Verificar se é favorito
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });

      return res.status(200).json({ 
        isFavorite: !!favorite 
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

export const favoritesController = new FavoritesController();
