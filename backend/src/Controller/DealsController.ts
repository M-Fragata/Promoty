import { type Request, type Response } from "express";
import { prisma } from "../Database/Prisma.js";

const PAGE_SIZE = 12;

export class DealsController {

  getDeals = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const skip = (page - 1) * PAGE_SIZE;

      const [products, total] = await Promise.all([
        prisma.productsMl.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: PAGE_SIZE,
        }),
        prisma.productsMl.count(),
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
      console.error("💥 [DealsController] Erro ao buscar deals:", error);
      return res.status(500).json({ success: false, error: "Erro interno ao buscar ofertas." });
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string || "").trim();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const skip = (page - 1) * PAGE_SIZE;

      if (!q) {
        return res.status(400).json({ success: false, error: "Parâmetro 'q' é obrigatório." });
      }

      const where = {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { store: { contains: q, mode: "insensitive" as const } },
        ],
      };

      const [products, total] = await Promise.all([
        prisma.productsMl.findMany({
          where,
          orderBy: { createdAt: "desc" },
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
      console.error("💥 [DealsController] Erro na busca:", error);
      return res.status(500).json({ success: false, error: "Erro interno na busca." });
    }
  };

  liveSearch = async (req: Request, res: Response) => {
    const q = (req.query.q as string || "").trim();

    if (!q) {
      return res.status(400).json({ success: false, error: "Parâmetro 'q' é obrigatório." });
    }

    // SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial connection event
    res.write(`event: open\ndata: {}\n\n`);

    try {
      const where = {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { store: { contains: q, mode: "insensitive" as const } },
        ],
      };

      const total = await prisma.productsMl.count({ where });

      // Send progress
      res.write(`event: progress\ndata: ${JSON.stringify({ current: 0, total, store: "all" })}\n\n`);

      // Stream products in batches
      const BATCH_SIZE = 5;
      let skip = 0;
      let current = 0;

      while (true) {
        const batch = await prisma.productsMl.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: BATCH_SIZE,
        });

        if (batch.length === 0) break;

        for (const product of batch) {
          current++;
          res.write(`event: product\ndata: ${JSON.stringify(product)}\n\n`);

          // Send progress update
          res.write(`event: progress\ndata: ${JSON.stringify({ current, total, store: product.store })}\n\n`);
        }

        skip += BATCH_SIZE;
      }

      // Send complete
      res.write(`event: complete\ndata: ${JSON.stringify({ total: current })}\n\n`);
      res.end();

    } catch (error: any) {
      console.error("💥 [DealsController] Erro no live search:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    }
  };
}
