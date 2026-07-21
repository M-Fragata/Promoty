# Plano: Sistema de Blog/Artigos

## Objetivo

Criar um sistema de blog/artigos para o site `ofertas.fragata.me` a fim de atender ao requisito da Amazon Associates de "conteúdo original que forneça informações valiosas e de qualidade sobre um produto/assunto que podem ser difíceis de conseguir".

## Requisitos da Amazon

- Mínimo de 10 posts/artigos com conteúdo original
- Conteúdo deve ser "recente" (publicado nos últimos 60 dias)
- Conteúdo deve fornecer informações valiosas e de qualidade
- Site deve ter conteúdo que justifique a visita do cliente
- Experiência ou visão única que não pode ser encontrada em outro local

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│  Prisma Schema  →  BlogController  →  BlogRoutes           │
│  (model Article)    (CRUD + SEO)      (/api/blog/*)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  App.tsx  →  Blog.tsx  →  BlogPost.tsx  →  components/     │
│  (rotas)     (listagem)   (detalhe)       (ArticleCard)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Schema Prisma (Backend)

**Arquivo:** `backend/prisma/schema.prisma`

Adicionar model `Article`:

```prisma
model Article {
  id            String   @id @default(uuid())
  slug          String   @unique
  title         String
  excerpt       String   // Resumo curto (até 160 chars para SEO)
  content       String   // Conteúdo em Markdown ou HTML
  coverImage    String?  // URL da imagem de capa
  category      String   // Ex: "guias", "reviews", "comparativos", "dicas"
  tags          String[] // Tags para filtros
  author        String   @default("Fragata")
  published     Boolean  @default(false)
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // SEO
  metaTitle     String?  // Título customizado para SEO
  metaDescription String? // Descrição customizada para SEO

  // Métricas
  viewCount     Int      @default(0)
  readTime      Int      // Tempo de leitura em minutos

  @@index([slug])
  @@index([category])
  @@index([published, publishedAt])
  @@map("articles")
}
```

### Migration

```bash
npx prisma migrate dev --name add_blog_articles
```

---

## 2. Tipos TypeScript (Backend)

**Arquivo:** `backend/src/types/blog.ts`

```typescript
export interface ArticleInput {
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags?: string[];
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ArticleResponse {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  author: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
  readTime: number;
  metaTitle: string | null;
  metaDescription: string | null;
}

export type ArticleCategory = 
  | "guias" 
  | "reviews" 
  | "comparativos" 
  | "dicas" 
  | "noticias";
```

---

## 3. Controller (Backend)

**Arquivo:** `backend/src/Controller/BlogController.ts`

```typescript
import { type Request, type Response } from "express";
import { prisma } from "../Database/Prisma.js";
import { z } from "zod";

const PAGE_SIZE = 9;

// Schema de validação
const articleSchema = z.object({
  title: z.string().min(5).max(200),
  excerpt: z.string().min(10).max(300),
  content: z.string().min(50),
  coverImage: z.string().url().optional(),
  category: z.enum(["guias", "reviews", "comparativos", "dicas", "noticias"]),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

// Função para gerar slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Função para calcular tempo de leitura
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export class BlogController {

  // Listar artigos publicados
  listPublished = async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const category = req.query.category as string | undefined;
      const skip = (page - 1) * PAGE_SIZE;

      const where = {
        published: true,
        ...(category ? { category } : {}),
      };

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          skip,
          take: PAGE_SIZE,
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverImage: true,
            category: true,
            tags: true,
            author: true,
            publishedAt: true,
            readTime: true,
          },
        }),
        prisma.article.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: articles,
        pagination: {
          page,
          pageSize: PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / PAGE_SIZE),
        },
      });
    } catch (error) {
      console.error("Erro ao listar artigos:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Buscar artigo por slug
  getBySlug = async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const article = await prisma.article.findUnique({
        where: { slug, published: true },
      });

      if (!article) {
        return res.status(404).json({ success: false, error: "Artigo não encontrado." });
      }

      // Incrementar contagem de visualizações
      await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      });

      return res.status(200).json({ success: true, data: article });
    } catch (error) {
      console.error("Erro ao buscar artigo:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Buscar artigo por ID (admin)
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const article = await prisma.article.findUnique({
        where: { id },
      });

      if (!article) {
        return res.status(404).json({ success: false, error: "Artigo não encontrado." });
      }

      return res.status(200).json({ success: true, data: article });
    } catch (error) {
      console.error("Erro ao buscar artigo:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Criar artigo (admin)
  create = async (req: Request, res: Response) => {
    try {
      const data = articleSchema.parse(req.body);
      const slug = generateSlug(data.title);

      // Verificar se slug já existe
      const existing = await prisma.article.findUnique({ where: { slug } });
      if (existing) {
        return res.status(400).json({ success: false, error: "Já existe um artigo com esse título." });
      }

      const article = await prisma.article.create({
        data: {
          ...data,
          slug,
          readTime: calculateReadTime(data.content),
          publishedAt: data.published ? new Date() : null,
        },
      });

      return res.status(201).json({ success: true, data: article });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Dados inválidos.", details: error.errors });
      }
      console.error("Erro ao criar artigo:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Atualizar artigo (admin)
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = articleSchema.partial().parse(req.body);

      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Artigo não encontrado." });
      }

      const updateData: any = { ...data };
      
      if (data.title) {
        updateData.slug = generateSlug(data.title);
      }
      
      if (data.content) {
        updateData.readTime = calculateReadTime(data.content);
      }

      // Se publicando pela primeira vez
      if (data.published && !existing.published) {
        updateData.publishedAt = new Date();
      }

      const article = await prisma.article.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({ success: true, data: article });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: "Dados inválidos.", details: error.errors });
      }
      console.error("Erro ao atualizar artigo:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Deletar artigo (admin)
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Artigo não encontrado." });
      }

      await prisma.article.delete({ where: { id } });

      return res.status(200).json({ success: true, message: "Artigo deletado." });
    } catch (error) {
      console.error("Erro ao deletar artigo:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Listar todos os artigos (admin)
  listAll = async (req: Request, res: Response) => {
    try {
      const articles = await prisma.article.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          published: true,
          publishedAt: true,
          viewCount: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ success: true, data: articles });
    } catch (error) {
      console.error("Erro ao listar artigos:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };

  // Buscar categorias
  getCategories = async (req: Request, res: Response) => {
    try {
      const categories = await prisma.article.groupBy({
        by: ["category"],
        where: { published: true },
        _count: { id: true },
      });

      return res.status(200).json({ success: true, data: categories });
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return res.status(500).json({ success: false, error: "Erro interno." });
    }
  };
}
```

---

## 4. Rotas (Backend)

**Arquivo:** `backend/src/Routes/BlogRoutes.ts`

```typescript
import { Router } from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import { BlogController } from '../Controller/BlogController.js';

const router = Router();
const blogController = new BlogController();

// Rotas públicas
router.get('/published', blogController.listPublished);
router.get('/categories', blogController.getCategories);
router.get('/slug/:slug', blogController.getBySlug);

// Rotas admin (protegidas)
router.get('/admin', authMiddleware, blogController.listAll);
router.get('/admin/:id', authMiddleware, blogController.getById);
router.post('/admin', authMiddleware, blogController.create);
router.put('/admin/:id', authMiddleware, blogController.update);
router.delete('/admin/:id', authMiddleware, blogController.delete);

export const blogRoutes = router;
```

**Arquivo:** `backend/src/Routes/index.ts` (atualizar)

```typescript
import { blogRoutes } from './BlogRoutes.js';

// Adicionar junto com as outras rotas
routes.use('/api/blog', blogRoutes);
```

---

## 5. Frontend - Tipos

**Arquivo:** `frontend/src/types/blog.ts`

```typescript
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  author: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
  readTime: number;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string | null;
  readTime: number;
}

export interface BlogCategory {
  category: string;
  _count: { id: number };
}

export type ArticleCategory = 
  | "guias" 
  | "reviews" 
  | "comparativos" 
  | "dicas" 
  | "noticias";
```

---

## 6. Frontend - Serviço API

**Arquivo:** `frontend/src/services/api.ts` (atualizar)

Adicionar métodos para blog:

```typescript
// ============================================
// BLOG (artigos)
// ============================================

async getPublishedArticles(page: number = 1, category?: string): Promise<{ articles: ArticleSummary[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({ page: String(page) });
  if (category) params.set('category', category);
  const response = await fetchJson<{ success: boolean; data: ArticleSummary[]; pagination: PaginationInfo }>(
    `/api/blog/published?${params.toString()}`
  );
  return { articles: response.data, pagination: response.pagination };
},

async getArticleBySlug(slug: string): Promise<Article> {
  const response = await fetchJson<{ success: boolean; data: Article }>(`/api/blog/slug/${slug}`);
  if (!response.success || !response.data) {
    throw new Error('Artigo não encontrado');
  }
  return response.data;
},

async getBlogCategories(): Promise<BlogCategory[]> {
  const response = await fetchJson<{ success: boolean; data: BlogCategory[] }>('/api/blog/categories');
  return response.data;
},
```

---

## 7. Frontend - Componentes

### 7.1 Card de Artigo

**Arquivo:** `frontend/src/components/blog/ArticleCard.tsx`

```tsx
import { Link } from 'react-router-dom';
import { Clock, Eye } from 'lucide-react';
import type { ArticleSummary } from '../../types/blog';

interface ArticleCardProps {
  article: ArticleSummary;
}

const CATEGORY_LABELS: Record<string, string> = {
  guias: 'Guia de Compra',
  reviews: 'Review',
  comparativos: 'Comparativo',
  dicas: 'Dicas',
  noticias: 'Notícias',
};

const CATEGORY_COLORS: Record<string, string> = {
  guias: 'bg-blue-100 text-blue-800',
  reviews: 'bg-green-100 text-green-800',
  comparativos: 'bg-purple-100 text-purple-800',
  dicas: 'bg-yellow-100 text-yellow-800',
  noticias: 'bg-gray-100 text-gray-800',
};

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <Link 
      to={`/blog/${article.slug}`}
      className="group flex flex-col bg-card-bg rounded-xl border border-card-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Imagem de Capa */}
      {article.coverImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-4">
        {/* Categoria */}
        <div className="mb-2">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-800'}`}>
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
        </div>

        {/* Título */}
        <h3 className="font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-brand transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-3 flex-1">
          {article.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime} min
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {article.viewCount} views
          </span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}
```

### 7.2 Lista de Artigos

**Arquivo:** `frontend/src/components/blog/ArticleList.tsx`

```tsx
import { ArticleCard } from './ArticleCard';
import type { ArticleSummary } from '../../types/blog';

interface ArticleListProps {
  articles: ArticleSummary[];
}

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Nenhum artigo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### 7.3 Filtro de Categorias

**Arquivo:** `frontend/src/components/blog/CategoryFilter.tsx`

```tsx
import { clsx } from 'clsx';
import type { BlogCategory } from '../../types/blog';

interface CategoryFilterProps {
  categories: BlogCategory[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  guias: 'Guias',
  reviews: 'Reviews',
  comparativos: 'Comparativos',
  dicas: 'Dicas',
  noticias: 'Notícias',
};

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          selected === null
            ? 'bg-brand text-brand-on'
            : 'bg-surface-container text-text-secondary hover:bg-surface-container-high'
        )}
      >
        Todos
      </button>
      {categories.map(({ category, _count }) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={clsx(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selected === category
              ? 'bg-brand text-brand-on'
              : 'bg-surface-container text-text-secondary hover:bg-surface-container-high'
          )}
        >
          {CATEGORY_LABELS[category] || category}
          <span className="ml-1 text-xs opacity-70">({_count.id})</span>
        </button>
      ))}
    </div>
  );
}
```

---

## 8. Frontend - Páginas

### 8.1 Página de Listagem do Blog

**Arquivo:** `frontend/src/pages/Blog.tsx`

```tsx
import { useState, useEffect } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { ArticleList } from '../components/blog/ArticleList';
import { CategoryFilter } from '../components/blog/CategoryFilter';
import { Pagination } from '../components/ui/Pagination';
import { api } from '../services/api';
import type { ArticleSummary, BlogCategory } from '../types/blog';

export function Blog() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, currentPage]);

  const loadCategories = async () => {
    try {
      const data = await api.getBlogCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const { articles: data, pagination } = await api.getPublishedArticles(
        currentPage,
        selectedCategory || undefined
      );
      setArticles(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-2">
          Blog Fragata
        </h1>
        <p className="text-text-secondary">
          Guias de compra, reviews, comparativos e dicas para você economizar nas suas compras.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={(cat) => {
            setSelectedCategory(cat);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Lista de Artigos */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-card-bg rounded-xl border border-card-border overflow-hidden">
              <div className="aspect-video bg-surface-container" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-container rounded w-1/4" />
                <div className="h-6 bg-surface-container rounded w-3/4" />
                <div className="h-4 bg-surface-container rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ArticleList articles={articles} />
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-8"
        />
      )}
    </PageShell>
  );
}
```

### 8.2 Página de Detalhe do Artigo

**Arquivo:** `frontend/src/pages/BlogPost.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, Tag } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import type { Article } from '../types/blog';

const CATEGORY_LABELS: Record<string, string> = {
  guias: 'Guia de Compra',
  reviews: 'Review',
  comparativos: 'Comparativo',
  dicas: 'Dicas',
  noticias: 'Notícias',
};

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getArticleBySlug(slug!);
      setArticle(data);
    } catch (err) {
      setError('Artigo não encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-surface-container rounded w-1/4 mb-4" />
          <div className="h-12 bg-surface-container rounded w-3/4 mb-8" />
          <div className="aspect-video bg-surface-container rounded-xl mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-surface-container rounded w-full" />
            <div className="h-4 bg-surface-container rounded w-5/6" />
            <div className="h-4 bg-surface-container rounded w-4/6" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !article) {
    return (
      <PageShell>
        <div className="text-center py-20">
          <p className="text-text-secondary mb-4">{error || 'Artigo não encontrado'}</p>
          <Link to="/blog">
            <Button>Voltar ao Blog</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <PageShell>
      <article className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-text-secondary hover:text-brand transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          {/* Categoria */}
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-brand-container text-brand-on mb-4">
            {CATEGORY_LABELS[article.category] || article.category}
          </span>

          {/* Título */}
          <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-4">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {publishedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.readTime} min de leitura
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.viewCount} visualizações
            </span>
          </div>
        </header>

        {/* Imagem de Capa */}
        {article.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div 
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Tag className="w-4 h-4 text-text-secondary" />
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs bg-surface-container text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 bg-surface-container-low rounded-lg border border-card-border">
          <p className="text-sm text-text-secondary">
            <strong>Disclosure:</strong> Como associado da Amazon, eu recebo por compras qualificadas. 
            Os links neste artigo podem conter IDs de rastreamento de afiliados.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
```

---

## 9. Rotas do Frontend

**Arquivo:** `frontend/src/App.tsx` (atualizar)

```tsx
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';

// Adicionar rotas
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />

// Páginas estáticas
<Route path="/sobre" element={<Sobre />} />
<Route path="/privacidade" element={<Privacidade />} />
<Route path="/termos" element={<Termos />} />
```

---

## 10. Páginas Estáticas

### 10.1 Página Sobre

**Arquivo:** `frontend/src/pages/Sobre.tsx`

```tsx
import { PageShell } from '../components/layout/PageShell';

export function Sobre() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-6">
          Sobre o Fragata
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p>
            O Fragata é um agregador de ofertas independente que reúne as melhores promoções 
            de diversas lojas online, incluindo Mercado Livre, Amazon e Shopee.
          </p>
          
          <h2>Nossa Missão</h2>
          <p>
            Ajudar você a encontrar as melhores ofertas e economizar nas suas compras online, 
            reunindo tudo em um só lugar com informações claras e atualizadas.
          </p>
          
          <h2>Como Funciona</h2>
          <p>
            Nosso sistema monitora preços em tempo real e identifica as melhores promoções 
            disponíveis. Quando você encontra uma oferta interessante, podemos receber uma 
            comissão por compra qualificada realizada através dos nossos links, sem nenhum 
            custo adicional para você.
          </p>
          
          <h2>Transparência</h2>
          <p>
            Participamos do Programa de Associados da Amazon e de outros programas de afiliados. 
            Isso significa que podemos receber comissões por compras qualificadas realizadas 
            através dos links indicados em nosso site.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
```

### 10.2 Página de Privacidade

**Arquivo:** `frontend/src/pages/Privacidade.tsx`

```tsx
import { PageShell } from '../components/layout/PageShell';

export function Privacidade() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-6">
          Política de Privacidade
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>Coleta de Dados</h2>
          <p>
            Coletamos apenas os dados necessários para o funcionamento do site, como 
            endereço de e-mail (para cadastro) e informações de navegação para melhorar 
            sua experiência.
          </p>
          
          <h2>Uso de Cookies</h2>
          <p>
            Utilizamos cookies para melhorar sua experiência de navegação e para fins 
            de análise estística. Você pode configurar seu navegador para recusar cookies, 
            mas isso pode afetar o funcionamento do site.
          </p>
          
          <h2>Links de Afiliados</h2>
          <p>
            Nosso site contém links de afiliados. Quando você clica em um link e realiza 
            uma compra, podemos receber uma comissão. Isso não afeta o preço que você paga.
          </p>
          
          <h2>Seus Direitos</h2>
          <p>
            Você tem direito de acessar, corrigir ou excluir seus dados pessoais. 
            Para exercer esses direitos, entre em contato conosco.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
```

### 10.3 Página de Termos

**Arquivo:** `frontend/src/pages/Termos.tsx`

```tsx
import { PageShell } from '../components/layout/PageShell';

export function Termos() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-6">
          Termos de Uso
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>Aceitação</h2>
          <p>
            Ao acessar e utilizar o Fragata, você concorda com estes Termos de Uso. 
            Se não concordar, por favor, não utilize o site.
          </p>
          
          <h2>Uso do Site</h2>
          <p>
            O Fragata é fornecido "como está" sem garantias de qualquer tipo. 
            Não nos responsabilizamos por decisões tomadas com base nas informações 
            apresentadas em nosso site.
          </p>
          
          <h2>Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo do site, incluindo textos, imagens e design, é protegido 
            por direitos autorais. Você pode compartilhar links para nossas páginas, 
            mas não pode reproduzir nosso conteúdo sem autorização.
          </p>
          
          <h2>Links Externos</h2>
          <p>
            Nosso site contém links para sites de terceiros. Não nos responsabilizamos 
            pelo conteúdo ou práticas de privacidade desses sites.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
```

---

## 11. SEO e Meta Tags

### 11.1 Atualizar index.html

**Arquivo:** `frontend/index.html`

```html
<!-- Adicionar Open Graph tags -->
<meta property="og:title" content="Fragata Ofertas - As Melhores Ofertas Online" />
<meta property="og:description" content="Encontre as melhores ofertas de Mercado Livre, Amazon e Shopee em um só lugar." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://ofertas.fragata.me" />
<meta property="og:image" content="https://ofertas.fragata.me/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Fragata Ofertas" />
<meta name="twitter:description" content="As melhores ofertas online" />
```

### 11.2 Criar robots.txt

**Arquivo:** `frontend/public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://ofertas.fragata.me/sitemap.xml
```

### 11.3 Criar sitemap.xml

**Arquivo:** `frontend/public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ofertas.fragata.me/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ofertas.fragata.me/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ofertas.fragata.me/sobre</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://ofertas.fragata.me/privacidade</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://ofertas.fragata.me/termos</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

---

## 12. Atualização do Footer

**Arquivo:** `frontend/src/components/layout/Footer.tsx` (atualizar)

```tsx
// Adicionar link para blog e páginas estáticas
<div className="flex flex-wrap justify-center gap-4 text-label-bold">
  <a href="/blog" className="text-text-secondary hover:text-brand transition-colors">
    Blog
  </a>
  <a href="/sobre" className="text-text-secondary hover:text-brand transition-colors">
    Sobre nós
  </a>
  <a href="/privacidade" className="text-text-secondary hover:text-brand transition-colors">
    Política de Privacidade
  </a>
  <a href="/termos" className="text-text-secondary hover:text-brand transition-colors">
    Termos de Uso
  </a>
</div>

// Atualizar disclosure para usar phrasing da Amazon
<p className="text-text-secondary text-body-md leading-relaxed max-w-3xl">
  Como associado da Amazon, eu recebo por compras qualificadas. 
  Somos um agregador de ofertas independente. Participamos do Programa de Associados 
  da Amazon e de outros programas de afiliados de e-commerce. 
  Os links neste site podem conter IDs de rastreamento de afiliados.
</p>
```

---

## 13. Conteúdo Inicial (Mínimo 10 Artigos)

Para atender ao requisito da Amazon, criar pelo menos 10 artigos iniciais:

| # | Título | Categoria | Excerpt |
|---|--------|-----------|---------|
| 1 | Como Economizar em Compras Online: Guia Completo | guias | Dicas práticas para economizar nas suas compras na internet |
| 2 | Melhores Fones de Ouvido Bluetooth em 2024 | guias | Análise dos melhores fones de ouvido sem fio disponíveis |
| 3 | Samsung Galaxy S24 vs iPhone 15: Qual Vale a Pena? | comparativos | Comparativo completo entre os flagships de Samsung e Apple |
| 4 | Review: Robot Aspirador Xiaomi S10+ | reviews | Análise detalhada do robot aspirador mais vendido |
| 5 | 10 Produtos Essenciais para Home Office | guias | Lista dos produtos indispensáveis para trabalhar em casa |
| 6 | Como Escolher uma TV Smart: O que Observar | guias | Guia de compra para televisores inteligentes |
| 7 | Melhores Ofertas de Eletrodomésticos | dicas | Como encontrar as melhores promoções de eletrodomésticos |
| 8 | Review: Air Fryer Mondial Family Inox | reviews | Análise da air fryer mais popular do Brasil |
| 9 | Notebook para Estudos: Guia de Compra | guias | Como escolher o melhor notebook para estudar |
| 10 | Dicas para Comprar com Segurança Online | dicas | Proteja-se durante suas compras na internet |

---

## 14. Ordem de Implementação

### Fase 1: Backend (1-2 dias)
1. Atualizar schema Prisma com model `Article`
2. Criar migration
3. Criar tipos TypeScript
4. Criar BlogController
5. Criar BlogRoutes
6. Atualizar routes/index.ts

### Fase 2: Frontend - Componentes (1-2 dias)
1. Criar tipos blog.ts
2. Criar ArticleCard
3. Criar ArticleList
4. Criar CategoryFilter
5. Atualizar api.ts

### Fase 3: Frontend - Páginas (1-2 dias)
1. Criar página Blog.tsx
2. Criar página BlogPost.tsx
3. Criar páginas estáticas (Sobre, Privacidade, Termos)
4. Atualizar App.tsx com novas rotas

### Fase 4: Conteúdo (2-3 dias)
1. Criar 10 artigos iniciais via API/admin
2. Adicionar imagens de capa
3. Otimizar para SEO

### Fase 5: SEO e Configurações (1 dia)
1. Atualizar index.html com meta tags
2. Criar robots.txt
3. Criar sitemap.xml
4. Atualizar Footer

---

## 15. Arquivos a Criar/Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `backend/prisma/schema.prisma` | Modificar - adicionar model Article | Alta |
| `backend/src/types/blog.ts` | Criar - tipos TypeScript | Alta |
| `backend/src/Controller/BlogController.ts` | Criar - controller CRUD | Alta |
| `backend/src/Routes/BlogRoutes.ts` | Criar - rotas | Alta |
| `backend/src/Routes/index.ts` | Modificar - adicionar blog routes | Alta |
| `frontend/src/types/blog.ts` | Criar - tipos frontend | Alta |
| `frontend/src/components/blog/ArticleCard.tsx` | Criar - componente card | Alta |
| `frontend/src/components/blog/ArticleList.tsx` | Criar - componente lista | Alta |
| `frontend/src/components/blog/CategoryFilter.tsx` | Criar - filtro categorias | Média |
| `frontend/src/pages/Blog.tsx` | Criar - página listagem | Alta |
| `frontend/src/pages/BlogPost.tsx` | Criar - página detalhe | Alta |
| `frontend/src/pages/Sobre.tsx` | Criar - página estática | Média |
| `frontend/src/pages/Privacidade.tsx` | Criar - página estática | Média |
| `frontend/src/pages/Termos.tsx` | Criar - página estática | Média |
| `frontend/src/App.tsx` | Modificar - adicionar rotas | Alta |
| `frontend/src/services/api.ts` | Modificar - métodos blog | Alta |
| `frontend/src/components/layout/Footer.tsx` | Modificar - links e disclosure | Média |
| `frontend/index.html` | Modificar - meta tags SEO | Média |
| `frontend/public/robots.txt` | Criar - SEO | Baixa |
| `frontend/public/sitemap.xml` | Criar - SEO | Baixa |

---

## 16. Benefícios Esperados

1. **Conformidade com Amazon** - Site terá conteúdo original e valioso
2. **SEO Melhorado** - Artigos indexados por buscadores
3. **Engajamento** - Usuários voltam para ler novos artigos
4. **Autoridade** - Site se posiciona como referência em ofertas
5. **Tráfego Orgânico** - Artigos atraem visitantes de busca

---

## 17. Métricas de Sucesso

- [ ] Pelo menos 10 artigos publicados
- [ ] Artigos com mais de 500 palavras cada
- [ ] Imagens de capa em todos os artigos
- [ ] Disclaimer de afiliado em todas as páginas
- [ ] Páginas estáticas funcionando (Sobre, Privacidade, Termos)
- [ ] SEO otimizado (meta tags, sitemap)
- [ ] Footer com links atualizados

---

## 18. Próximos Passos

1. Criar migration do Prisma
2. Implementar BlogController
3. Criar componentes frontend
4. Criar páginas do blog
5. Criar páginas estáticas
6. Criar conteúdo inicial (10 artigos)
7. Testar todas as funcionalidades
8. Fazer deploy em produção
9. Submeter novo site para Amazon Associates
