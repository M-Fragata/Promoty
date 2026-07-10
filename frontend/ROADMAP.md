# Smart Deals Monitor — Roadmap de Implementação

Projeto frontend para agregador de ofertas inteligente, construído com **React 19 + TypeScript + Tailwind CSS v4 + Vite 8**. Design baseado no design system **Velocity Commerce** do Stitch (fonte Hanken Grotesk, paleta cinza escuro + verde).

---

## Estrutura de Pastas

```
src/
├── components/
│   ├── layout/        # Header, Sidebar, MobileNav, PageShell
│   ├── product/       # ProductCard, ProductGrid, ProductSkeleton
│   ├── search/        # SearchBar, SearchSuggestions
│   └── ui/            # Badge, Button, PriceDisplay, StoreTag, etc.
├── pages/             # Home.tsx
├── hooks/             # useDeals, useLiveSearch, useFilters, useMediaQuery
├── contexts/          # ThemeContext (já existe)
├── services/          # api.ts, sse.ts (já existem)
├── types/             # product.ts, api.ts (já existem)
└── utils/             # format.ts, constants.ts (já existem)
```

---

## Fase 1 — UI Primitivos

**Objetivo:** Criar os componentes atômicos reutilizáveis que todo o resto vai compor.

| Arquivo | Componente | Responsabilidade |
|---|---|---|
| `ui/Badge.tsx` | `<Badge variant>` | Badge genérico: `discount` (verde), `urgency` (laranja), `store` (graphite), `coupon` (laranja claro) |
| `ui/Button.tsx` | `<Button variant size fullWidth>` | Botão: `primary` (graphite), `secondary` (outline), `ghost` (transparente). Tamanhos `sm/md/lg` |
| `ui/PriceDisplay.tsx` | `<PriceDisplay price originalPrice installments>` | Preço atual (verde, bold) + original riscado + texto de parcelamento |
| `ui/StoreTag.tsx` | `<StoreTag store>` | Tag colorida da loja com ícone emoji. Usa `getStoreInfo()` do `constants.ts` |
| `ui/CategoryChip.tsx` | `<CategoryChip label active onClick>` | Chip clicável para filtros. Fundo cinza claro, ativo = graphite |
| `ui/SortSelect.tsx` | `<SortSelect value onChange>` | Dropdown de ordenação. Usa `SORT_OPTIONS` do `constants.ts` |
| `ui/EmptyState.tsx` | `<EmptyState message icon>` | Mensagem de estado vazio com ícone centralizado |

**Dependências:** Apenas `clsx`, `lucide-react` e tokens do `index.css`.

---

## Fase 2 — Card de Produto

**Objetivo:** Montar o card de produto completo a partir dos primitivos da Fase 1.

| Arquivo | Componente | Responsabilidade |
|---|---|---|
| `product/ProductCardImage.tsx` | `<ProductCardImage>` | Container da imagem com `aspect-square`, `object-cover`, borda arredondada. Badge de desconto (%OFF) no canto superior esquerdo. Badge de urgência se aplicável |
| `product/ProductCardInfo.tsx` | `<ProductCardInfo>` | Título (máx 2 linhas com `line-clamp-2`), `<StoreTag>`, cupom se existir, texto de parcelamento |
| `product/ProductCard.tsx` | `<ProductCard product>` | Card completo: `ProductCardImage` + `ProductCardInfo` + `PriceDisplay` + `<Button>Ver Oferta</Button>`. Shadow sutil, borda `rounded-lg` |
| `product/ProductSkeleton.tsx` | `<ProductSkeleton>` | Skeleton animado (`animate-pulse`) replicando a estrutura do card para estados de loading |

**Dependências:** Fase 1 (`Badge`, `Button`, `PriceDisplay`, `StoreTag`), tipo `MlProducts`.

---

## Fase 3 — Layout & Navegação

**Objetivo:** Estruturar a shell da aplicação com suporte a responsividade (mobile/desktop).

| Arquivo | Componente | Responsabilidade |
|---|---|---|
| `layout/PageShell.tsx` | `<PageShell>` | Wrapper responsivo: flex com sidebar à esquerda (desktop) ou layout full-width (mobile) |
| `layout/Sidebar.tsx` | `<Sidebar>` | desktop-only (`hidden lg:flex`). Categorias (chips verticais), ordenação, contagem de resultados. Largura `w-64` |
| `layout/MobileNav.tsx` | `<MobileNav>` | mobile-only (`lg:hidden`). Bottom bar fixa com ícones: Home, Busca, Favoritos, Perfil |
| `layout/Header.tsx` | **Atualizar** | Logo + SearchBar + ThemeToggle. Sticky top com backdrop-blur. Adaptar para Velocity Commerce |
| `layout/ThemeToggle.tsx` | **Atualizar** | Adaptar classes para os tokens do design system |

**Dependências:** Fase 1 (`CategoryChip`, `SortSelect`), hook `useMediaQuery`.

---

## Fase 4 — Sistema de Busca

**Objetivo:** Implementar busca com input, sugestões ao vivo (SSE) e debounce.

| Arquivo | Componente | Responsabilidade |
|---|---|---|
| `search/SearchBar.tsx` | `<SearchBar onSearch>` | Input controlado com ícone `Search` (lucide). Debounce 300ms. Botão clear (`X`). Desktop: dentro do Header. Mobile: seção dedicada |
| `search/SearchSuggestions.tsx` | `<SearchSuggestions results isLoading>` | Dropdown flutuante com resultados do SSE. Cada item: thumbnail 40px + título + preço. Fecha ao clicar fora (`useRef` + `mousedown`) |

**Dependências:** Fase 1 (`Badge`, `PriceDisplay`), hook `useLiveSearch`, tipo `MlProducts`.

---

## Fase 5 — Hooks de Estado

**Objetivo:** Separar lógica de negócio dos componentes em hooks customizados.

| Arquivo | Hook | Responsabilidade |
|---|---|---|
| `hooks/useMediaQuery.ts` | `useMediaQuery(query)` | Retorna `boolean` para breakpoint. Ex: `useMediaQuery('(min-width: 1024px)')` → `isDesktop` |
| `hooks/useDeals.ts` | `useDeals()` | Chama `api.getDeals()`. Retorna `{ products, isLoading, error, refetch }` |
| `hooks/useLiveSearch.ts` | `useLiveSearch(query)` | Usa `connectLiveSearch()` do `sse.ts`. Retorna `{ results, isSearching, progress, error }` |
| `hooks/useFilters.ts` | `useFilters(products)` | Estado de filtros: `{ category, query, sortBy, filteredProducts, setCategory, setQuery, setSortBy }` |

**Dependências:** `services/api.ts`, `services/sse.ts`, tipo `MlProducts`.

---

## Fase 6 — Página Principal & Integração

**Objetivo:** Montar a página Home e integrar todos os componentes no App.tsx.

| Arquivo | Componente | Responsabilidade |
|---|---|---|
| `pages/Home.tsx` | `<Home>` | Página principal: `useDeals` + `useFilters` + `useMediaQuery`. Renderiza `SearchBar`, `CategoryChip[]`, `SortSelect`, `ProductGrid` ou `EmptyState` |
| `App.tsx` | **Atualizar** | Substituir scaffold por `<Home />`. Remover placeholder `#product-grid-placeholder` |

**Dependências:** Todas as fases anteriores.

---

## Fluxo de Dados

```
App.tsx
 └─ Home.tsx
     ├─ useDeals()           → products[], isLoading, error
     ├─ useFilters(products) → filteredProducts, category, query, sortBy
     ├─ useMediaQuery()      → isDesktop
     │
     ├─ [Header]
     │   ├─ SearchBar ───────→ useLiveSearch(query) → results
     │   │   └─ SearchSuggestions
     │   └─ ThemeToggle
     │
     ├─ [Sidebar] (desktop-only)
     │   ├─ CategoryChip[] ──→ setCategory()
     │   └─ SortSelect ──────→ setSortBy()
     │
     ├─ [MobileNav] (mobile-only)
     │
     └─ [ProductGrid]
         ├─ ProductSkeleton ──→ (enquanto isLoading)
         ├─ ProductCard[] ────→ (quando !isLoading)
         │   ├─ ProductCardImage
         │   ├─ ProductCardInfo
         │   │   └─ StoreTag
         │   ├─ PriceDisplay
         │   └─ Button "Ver Oferta"
         └─ EmptyState ──────→ (quando filteredProducts.length === 0)
```

---

## Convenções

- **Estilo:** Tailwind CSS v4 com tokens do `index.css` (`@theme` block). Usar classes utilitárias, evitar CSS customizado.
- **Ícones:** `lucide-react` para ícones de interface. Emojis apenas para tags de loja.
- **Componentes:** Function components com TypeScript. Props tipadas com `interface`. Export nomeado (não default).
- **Hooks:** Prefixo `use`. Um hook por arquivo. Retornar objetos `{ ... }` não arrays.
- **Responsividade:** Mobile-first. Breakpoint `lg` (1024px) para desktop. Usar `useMediaQuery` para lógica condicional.
- **Dark mode:** Via `html.dark` toggle. Todos os tokens já suportam ambos os modos no `index.css`.
