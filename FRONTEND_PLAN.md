# Frontend Implementation Plan - Promoty

## Visão Geral
Interface de agregador de ofertas com Vite + React + TypeScript + Tailwind CSS, suporte nativo a tema claro/escuro, busca local (banco) e busca externa (scraping tempo real via SSE).

---

## 1. Estrutura do Projeto

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css          # CSS Variables + Tailwind directives
│   ├── vite-env.d.ts
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx      # Theme provider + toggle logic
│   │
│   ├── hooks/
│   │   ├── useTheme.ts           # useTheme hook
│   │   ├── useDeals.ts           # Fetch local deals (GET /api/deals)
│   │   ├── useSearch.ts          # Local search (GET /api/search?q=)
│   │   └── useLiveSearch.ts      # SSE connection for external scraping
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Badge.tsx
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── CouponTag.tsx
│   │   └── search/
│   │       ├── SearchBar.tsx
│   │       └── LiveSearchTrigger.tsx
│   │
│   ├── pages/
│   │   └── HomePage.tsx
│   │
│   ├── services/
│   │   ├── api.ts                # Axios/fetch wrapper + base URL
│   │   └── sse.ts                # SSE client helper
│   │
│   ├── types/
│   │   ├── product.ts            # MlProducts + Zod schemas
│   │   └── api.ts                # API response types
│   │
│   └── utils/
│       ├── format.ts             # formatPrice, calculateDiscount
│       └── constants.ts          # STORE_LABELS, etc.
```

---

## 2. Endpoints Backend Necessários

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/deals` | Retorna **ofertas do dia** do banco (ProductsMl) - ordenação/filtro feita no frontend via useState |
| `GET` | `/api/search?q={query}` | Busca local no banco por título |
| `GET` | `/api/live-search?q={query}` | **SSE** - Dispara crawlers e stream produtos em tempo real |

> **Nota**: O backend atual só tem POST para receber produtos dos crawlers. Precisaremos adicionar esses GET endpoints no `PromosController` e rotas.

---

## 3. Paleta de Cores (CSS Variables)

### Modo Claro (Base)
```css
:root {
  --app-bg: #E6E6E6;
  --card-bg: #FFFFFF;
  --card-border: #BAC8B1;
  --text-primary: #404E3B;
  --text-secondary: #6C8480;
  --brand-color: #7B9669;
  --discount-bg: #404E3B;
  --discount-text: #E6E6E6;
}
```

### Modo Escuro (`html.dark`)
```css
html.dark {
  --app-bg: #404E3B;
  --card-bg: #2F392B;
  --card-border: #7B9669;
  --text-primary: #E6E6E6;
  --text-secondary: #BAC8B1;
  --brand-color: #BAC8B1;
  --discount-bg: #E6E6E6;
  --discount-text: #404E3B;
}
```

### Classes Tailwind Mapeadas
- `bg-app-bg` → `background-color: var(--app-bg)`
- `bg-card-bg` → `background-color: var(--card-bg)`
- `border-app-border` → `border-color: var(--card-border)`
- `text-text-primary` → `color: var(--text-primary)`
- `text-text-secondary` → `color: var(--text-secondary)`
- `bg-brand` → `background-color: var(--brand-color)`
- `bg-discount-bg` / `text-discount-text` → badge de desconto

---

## 4. Contrato de Dados (Zod + TypeScript)

```typescript
// types/product.ts
export interface MlProducts {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  coupon: string | null;
  badge: string | null;
  imageUrl: string | null;
  link: string;
  store: string;
  installments: string | null;
}

// Zod schema para validação runtime
export const MlProductsSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  originalPrice: z.number().nullable(),
  coupon: z.string().nullable(),
  badge: z.string().nullable(),
  imageUrl: z.string().nullable(),
  link: z.string().url(),
  store: z.string(),
  installments: z.string().nullable(),
});
```

---

## 5. Componentização e Telas

### 5.1 Layout Base
- **Header fixo**: Logo + ThemeToggle (Sun/Moon icons Lucide)
- **ThemeToggle**: Lê `localStorage`, alterna classe `.dark` no `<html>`, transição suave

### 5.2 Estado Inicial (Deals of the Day)
- `useEffect` busca `/api/deals` no mount → armazena em `useState<MlProducts[]>`
- **Ordenação e filtros feitos no frontend** (client-side) via estado derivado:
  - Maior desconto: `((originalPrice - price) / originalPrice) * 100`
  - Menor preço, Maior preço, Por loja, Por categoria
- Skeletons animados durante loading

### 5.3 Input de Busca Integrado
- **Modo Local**: Enter → `GET /api/search?q={query}` → retorna lista filtrada do backend → substitui grid (ou pode filtrar client-side sobre o `useState` de deals)
- **Modo Externo**: Botão "Buscar em tempo real" → SSE `/api/live-search?q={query}`
- Loader descritivo: "Buscando na Amazon, Mercado Livre e Shopee..."
- **Append progressivo**: Novos cards adicionados à lista conforme chegam via SSE (merge com estado atual, deduplicação por `id`)

### 5.4 Card de Produto Premium
- Imagem aspect-square + fallback SVG
- Badge topo: marca da loja (ML/Amazon/Shopee)
- Título: `line-clamp-2`
- Preço original riscado + preço atual bold + tag % desconto (auto-calculada)
- Cupom: estilo `border-dashed` destacado
- CTA "Pegar Promoção" → `target="_blank"` + `rel="noopener noreferrer"`

---

## 6. Passos de Implementação

### Fase 1: Setup & Configuração ✅ **CONCLUÍDA**
- [x] `npm create vite@latest frontend -- --template react-ts`
- [x] Instalar deps: `tailwindcss postcss autoprefixer lucide-react zod clsx tailwind-merge`
- [x] Configurar `tailwind.config.js` com `darkMode: 'class'` + mapear CSS variables
- [x] Criar `src/index.css` com variáveis CSS exatas (Tailwind v4 `@theme`)
- [x] Setup `ThemeContext` + `localStorage` persistence + toggle no `<html>`
- [x] Configurar `@tailwindcss/postcss` para Tailwind v4
- [x] Criar `Header.tsx` + `ThemeToggle.tsx` com ícones Lucide (Sun/Moon)
- [x] Atualizar `main.tsx` com `ThemeProvider`
- [x] Atualizar `App.tsx` com Header + grid placeholder + select de ordenação

### Fase 2: Tipagem & Serviços ✅ **CONCLUÍDA**
- [x] Definir `MlProducts` + Zod schemas em `types/product.ts`
- [x] Criar `types/api.ts` com `ApiResponse`, `DealsResponse`, `SearchResponse`, `LiveSearchEvent`
- [x] Criar `services/api.ts` com `api.getDeals()`, `api.search()` + validação Zod
- [x] Criar `services/sse.ts` com `connectLiveSearch()` - EventSource + callbacks + deduplicação por ID + cleanup explícito
- [x] Criar `utils/format.ts` com `formatPrice`, `calculateDiscount`, `formatDiscount`
- [x] Criar `utils/constants.ts` com `STORE_LABELS`, `SORT_OPTIONS`

### Fase 3: Componentes Base (UI) 🔄 **EM ANDAMENTO**
- [ ] `Button`, `Input`, `Badge`, `Skeleton` (shadcn-style minimal)
- [x] `Header` + `ThemeToggle` (Lucide Sun/Moon, transition suave) - *feito na Fase 1*

### Fase 4: Product Card & Grid
- [ ] `ProductCard` - responsivo, aspect-square image, line-clamp-2 title
- [ ] `CouponTag` - estilo dashed border quando `coupon` existe
- [ ] `ProductGrid` - grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` + skeletons

> **Nota**: `DiscountBadge` removido - backend já envia `badge` com `% OFF` calculado

### Fase 5: Busca & Estado
- [ ] `useDeals` - fetch inicial `/api/deals` → `useState<MlProducts[]>` + loading skeletons
- [ ] `useDealsFiltered` - estado derivado: aplica ordenação (maior desconto, menor preço, etc.) e filtros (loja, categoria, busca textual) sobre o `useDeals`
- [ ] `useSearch` - debounced local search (300ms) → chama `/api/search?q=` OU filtra client-side sobre `useDeals`
- [ ] `SearchBar` - input + enter → dispara busca
- [ ] `LiveSearchTrigger` - botão "Buscar em tempo real" → abre SSE
- [ ] `useLiveSearch` - conecta ao endpoint SSE, implementa a lógica de **cleanup explícita** (`eventSource.close()`) no retorno do hook para evitar memory leaks, e realiza o append progressivo aplicando a **estratégia de merge** (dados em tempo real substituem dados locais correspondentes se houver duplicidade de ID/link)

### Fase 6: Página Principal & Integração
- [ ] `HomePage` - orquestra tudo: header, search, grid, live search banner
- [ ] `App.tsx` - Provider wrappers

### Fase 7: Backend - Endpoints de Leitura
- [ ] Adicionar `getDeals`, `searchLocal`, `liveSearch` no `PromosController`
- [ ] Registrar rotas GET em `OffersRoutes.ts`
- [ ] Implementar SSE no backend (Express + `res.write`)

---

## 7. Decisões Técnicas

| Decisão | Opção Escolhida | Justificativa |
|---------|-----------------|---------------|
| State Management | React Context + Hooks | Simples, zero deps, suficiente para tema + search state |
| SSE vs WebSocket | SSE | Unidirecional, nativo HTTP/2, reconexão automática do browser (backend + frontend) |
| CSS Variables | Tailwind `bg-[var(--app-bg)]` | Native, performático, funciona com dark mode class |
| Image Fallback | Placeholder SVG inline + `onError` | Sem request extra, controle total (imagens via backend) |
| Debounce Search | `useDeferredValue` + `useEffect` 300ms | Native React, sem libs extras |
| Proxy Dev | Vite `server.proxy: { '/api': 'http://localhost:3333' }` | ✅ Configurado - evita CORS em dev |

---

## 8. Perguntas de Alinhamento (Resolvidas)

1. **Proxy Vite**: ✅ Sim - Configurar `server.proxy` no `vite.config.ts` para `/api` → `http://localhost:3333`
2. **Autenticação**: ✅ Rotas de leitura (`/api/deals`, `/api/search`, `/api/live-search`) **públicas** por enquanto
3. **SSE Backend**: ✅ **Implementar no backend também** - necessário para funcionar (front + back)
4. **Imagens CORS**: ✅ **Não precisa proxy** - backend já retorna `imageUrl` acessível diretamente
5. **Deploy**: ✅ **Build em `dist`** - frontend servido pelo Express (mesmo processo do backend)

---

## 9. Estimativa de Esforço

| Fase | Arquivos | Complexidade |
|------|----------|--------------|
| Setup & Config | ~8 | Baixa |
| Tipos & Serviços | ~5 | Baixa |
| Componentes UI | ~8 | Média |
| Product Card/Grid | ~5 | Média |
| Busca & SSE | ~7 | **Alta** |
| Integração Final | ~3 | Média |
| **Backend Endpoints** | ~3 | Média |
| **Total** | **~39 arquivos** | ~2-3 dias |

---

## 10. Próximos Passos Imediatos

- [x] 1. Criar projeto Vite na pasta `frontend/`
- [x] 2. Configurar Tailwind + CSS Variables
- [x] 3. Implementar ThemeContext + Header + ThemeToggle
- [x] 4. Validar tema claro/escuro funcionando
- [x] 5. Tipagem & Servi e serviços (MlProducts, Zod, API, SSE, utils)
- [ ] 6. **Componentes UI base** (Button, Input, Badge, Skeleton)
- [ ] 7. **ProductCard + ProductGrid** com skeletons
- [ ] 8. **Hooks de estado** (useDeals, useSearch, useLiveSearch)
- [ ] 9. **SearchBar + LiveSearchTrigger** integração
- [ ] 10. **HomePage** final + integração completa

---

*Documento gerado automaticamente - Promoty Frontend Plan*