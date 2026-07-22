import { type Request, type Response } from "express";
import { prisma } from "../Database/Prisma.js";
import { z } from "zod";

const PAGE_SIZE = 15;

export class AdminController {

  getProducts = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const skip = (page - 1) * PAGE_SIZE;
      const q = (req.query.q as string || "").trim();
      const category = (req.query.category as string || "").trim();
      const store = (req.query.store as string || "").trim();

      const where: any = {};

      if (q) {
        where.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { store: { contains: q, mode: "insensitive" } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (store) {
        where.store = store;
      }

      const [products, total] = await Promise.all([
        prisma.productsMl.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: PAGE_SIZE,
        }),
        prisma.productsMl.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: products,
        pagination: {
          page,
          pageSize: PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / PAGE_SIZE),
        },
      });
    } catch (error: any) {
      console.error("💥 [AdminController] Erro ao buscar produtos:", error);
      return res.status(500).json({ success: false, error: "Erro interno ao buscar produtos." });
    }
  };

  deleteProduct = async (req: Request, res: Response) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(req.params);

      const product = await prisma.productsMl.findUnique({ where: { id } });

      if (!product) {
        return res.status(404).json({ success: false, error: "Produto não encontrado." });
      }

      await prisma.productsMl.delete({ where: { id } });

      return res.status(200).json({ success: true, message: "Produto excluído com sucesso." });
    } catch (error: any) {
      console.error("💥 [AdminController] Erro ao excluir produto:", error);
      return res.status(500).json({ success: false, error: "Erro interno ao excluir produto." });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { category } = z.object({ category: z.string() }).parse(req.body);

      const validCategories = ["Eletrônicos", "Casa", "Moda", "Beleza", "Sem Nicho"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, error: `Categoria inválida. Use: ${validCategories.join(', ')}` });
      }

      const product = await prisma.productsMl.findUnique({ where: { id } });

      if (!product) {
        return res.status(404).json({ success: false, error: "Produto não encontrado." });
      }

      await prisma.productsMl.update({
        where: { id },
        data: { category },
      });

      return res.status(200).json({ success: true, message: "Categoria atualizada com sucesso." });
    } catch (error: any) {
      console.error("💥 [AdminController] Erro ao atualizar categoria:", error);
      return res.status(500).json({ success: false, error: "Erro interno ao atualizar categoria." });
    }
  };
}
