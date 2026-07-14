# Plano: Sistema de Links Criados

## Objetivo
Criar funcionalidade de "Links Criados" no perfil do usuário, permitindo colar URLs de produtos e gerar links com afiliado global + encurtamento via Kutt (fragata.me). Inclui rastreamento simples de cliques.

## Funcionalidades
- Usuário cola URL de produto (ML, Amazon, Shopee ou outro)
- Sistema detecta automaticamente a loja
- Sistema appenda parâmetros de afiliado global
- Link é encurtado via Kutt (fragata.me)
- Link é salvo no banco de dados
- Usuário pode copiar o link encurtado
- Rastreamento simples de cliques (apenas incrementar contador)
- Usuário pode excluir links criados

## Fluxo Completo

```
1. Usuário cola URL → POST /api/links
2. Backend detecta loja (ML/Amazon/Shopee/Outro)
3. Backend appenda parâmetros de afiliado global
4. Backend encurta via Kutt (fragata.me)
5. Backend salva no banco e retorna link criado
6. Usuário copia o link curto
7. Pessoa clica → GET /r/:id
8. Backend incrementa clickCount e redireciona para URL afiliada
```

## Detecção de Loja e Parâmetros

| Loja | Detecção na URL | Parâmetros Afiliado |
|------|-----------------|---------------------|
| Mercado Livre | `mercadolivre` ou `mercadopago` | `matt_tool`, `matt_word`, `forceInApp` |
| Amazon | `amazon` | `tag=promocenter0b-20` |
| Shopee | `shopee` | Link já vem com afiliado (API Shopee) |
| Outro | Qualquer outra URL | Sem parâmetros |

## Ordem de Implementação

### 1. Schema Prisma + Migration
**Arquivo:** `backend/prisma/schema.prisma`

Adicionar model `CreatedLink`:
```prisma
model CreatedLink {
  id            String   @id @default(uuid())
  userId        String
  originalUrl   String
  affiliateUrl  String
  shortUrl      String?
  store         String   // "mercadolivre" | "amazon" | "shopee" | "other"
  clickCount    Int      @default(0)
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Adicionar relação no model `User`:
```prisma
model User {
  ...existing fields...
  createdLinks CreatedLink[]
}
```

Migration:
```bash
npx prisma migrate dev --name add_created_links
```

### 2. Funções Auxiliares Compartilhadas
**Arquivo:** `backend/src/Utils/affiliateUtils.ts`

```typescript
export function detectStore(url: string): 'mercadolivre' | 'amazon' | 'shopee' | 'other'
export function appendAffiliateParams(url: string, store: string): string
export function extractAmazonAsin(url: string): string | null
```

Funções reutilizáveis entre `PromosController` e `CreatedLinksController`.

### 3. Refatorar PromosController
**Arquivo:** `backend/src/Controller/PromosController.ts`

- Importar funções de `affiliateUtils.ts`
- Substituir lógica duplicada por chamadas às funções auxiliares
- Manter comportamento existente inalterado

### 4. Controller de Links Criados
**Arquivo:** `backend/src/Controller/CreatedLinksController.ts`

Métodos:

| Método | Rota | Descrição |
|--------|------|-----------|
| `create` | `POST /api/links` | Recebe `{ url: string }`, detecta loja, appenda afiliado, encurta via Kutt, salva no banco |
| `list` | `GET /api/links` | Lista todos os links do usuário logado |
| `delete` | `DELETE /api/links/:id` | Remove um link criado |
| `redirect` | `GET /r/:id` | Redireciona para a URL afiliada e incrementa `clickCount` |

### 5. Rotas de Links
**Arquivo:** `backend/src/Routes/CreatedLinksRoutes.ts`

```typescript
import { Router } from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import { CreatedLinksController } from '../Controller/CreatedLinksController.js';

const router = Router();

router.post('/', authMiddleware, CreatedLinksController.create);
router.get('/', authMiddleware, CreatedLinksController.list);
router.delete('/:id', authMiddleware, CreatedLinksController.delete);

export const createdLinksRoutes = router;
```

**Arquivo:** `backend/src/Routes/index.ts`

Adicionar:
```typescript
import { createdLinksRoutes } from './CreatedLinksRoutes.js';

routes.use('/api/links', createdLinksRoutes);
```

Rota de redirect (pública, sem auth):
```typescript
// Em app.ts ou Routes/index.ts
app.get('/r/:id', CreatedLinksController.redirect);
```

### 6. Serviço API Frontend
**Arquivo:** `frontend/src/services/api.ts`

Adicionar métodos:
```typescript
async createLink(url: string): Promise<CreatedLink> { ... }
async getLinks(): Promise<CreatedLink[]> { ... }
async deleteLink(id: string): Promise<void> { ... }
```

### 7. Página de Links Criados
**Arquivo:** `frontend/src/pages/CreatedLinks.tsx`

Layout:
```
┌─────────────────────────────────┐
│  Header (compartilhado)         │
├─────────────────────────────────┤
│  [Input: Cole a URL do produto] │
│  [Botão: Criar Link]            │
├─────────────────────────────────┤
│  Lista de Links Criados:        │
│  ┌───────────────────────────┐  │
│  │ 🛒 ML - iPhone 14         │  │
│  │ fragata.me/abc123         │  │
│  │ 12 cliques • 14/07/2026   │  │
│  │ [Copiar] [Excluir]        │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 📦 Amazon - Mouse Logitech│  │
│  │ fragata.me/xyz789         │  │
│  │ 5 cliques • 13/07/2026    │  │
│  │ [Copiar] [Excluir]        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 8. Atualizar Card no Profile
**Arquivo:** `frontend/src/pages/Profile.tsx`

Substituir card "Links Clicados" por "Links Criados":
- Buscar contagem de links via `api.getLinks()`
- Mostrar contagem real
- Card com `onClick` para navegar para `/links-criados`

### 9. Adicionar Rota no Frontend
**Arquivo:** `frontend/src/App.tsx`

Adicionar:
```tsx
<Route path="/links-criados" element={<ProtectedRoute><CreatedLinks /></ProtectedRoute>} />
```

### 10. Migração em Produção

```bash
# Na VPS
npx prisma migrate deploy
npx prisma generate
```

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Modificar — adicionar model `CreatedLink` + relação em `User` |
| `backend/src/Utils/affiliateUtils.ts` | **Criar** — funções auxiliares compartilhadas |
| `backend/src/Controller/PromosController.ts` | Modificar — importar e usar `affiliateUtils` |
| `backend/src/Controller/CreatedLinksController.ts` | **Criar** — lógica de links |
| `backend/src/Routes/CreatedLinksRoutes.ts` | **Criar** — rotas protegidas |
| `backend/src/Routes/index.ts` | Modificar — adicionar rota `/api/links` |
| `backend/src/app.ts` | Modificar — adicionar rota pública `/r/:id` |
| `frontend/src/services/api.ts` | Modificar — adicionar métodos de links |
| `frontend/src/pages/CreatedLinks.tsx` | **Criar** — página principal |
| `frontend/src/pages/Profile.tsx` | Modificar — atualizar card de links |
| `frontend/src/App.tsx` | Modificar — adicionar rota |

## Dados Salvos por Link

| Campo | Descrição |
|-------|-----------|
| `id` | UUID único |
| `userId` | ID do usuário criador |
| `originalUrl` | URL original colada pelo usuário |
| `affiliateUrl` | Link final com parâmetros de afiliado |
| `shortUrl` | Link encurtado (fragata.me) |
| `store` | Loja detectada (mercadolivre, amazon, shopee, other) |
| `clickCount` | Número de cliques (incrementado a cada redirect) |
| `createdAt` | Data de criação |
