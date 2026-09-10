# Guia da Aplicação Promoty (AGENTS.md)

> **Instrução Obrigatória para LLMs / Agentes de IA:**
> 1. **Leia este documento atentamente** antes de propor ou realizar qualquer alteração no código.
> 2. **Mantenha este documento atualizado**: sempre que adicionar novas lojas, rotas, tabelas no banco de dados, variáveis de ambiente ou refatorar fluxos, você **DEVE** atualizar esta documentação no mesmo turno de trabalho.

---

## 1. Visão Geral do Projeto

O **Promoty** é uma plataforma completa de agregação, curadoria e distribuição de ofertas de e-commerce, focada no mercado brasileiro. A aplicação opera com:

- **Agregação e Scraping**: Crawlers automatizados (Playwright/Stealth) que monitoram e coletam promoções de marketplaces (Mercado Livre, Amazon, Shopee) e redes varejistas (Awin: KaBuM, Dafiti, C&A, Riachuelo, AliExpress, Lojas Torra).
- **Monetização via Afiliados**: Injeção automática de tags/parâmetros de afiliado e encurtamento de URLs via API Kutt (`fragata.me`).
- **Distribuição Automatizada**: Bot de WhatsApp (via Baileys) e Telegram que disparam ofertas para grupos temáticos segmentados (Gamers, Estilo & Lar, Moda Feminina).
- **Portal Web (Frontend)**: Interface moderna em React 19 para visualização de ofertas, busca, filtros por loja e categoria, sistema de favoritos, gerador de links afiliados para usuários e painel administrativo.

---

## 2. Ambiente de Desenvolvimento e Comandos

> [!IMPORTANT]
> **Configuração do Node.js na máquina local (Windows):**
> - O binário do Node.js está instalado em `D:\Node`.
> - Sempre execute comandos via `cmd` adicionando `D:\Node` ao `PATH`:
>   ```cmd
>   cmd /c "set PATH=D:\Node;%PATH% & <comando>"
>   ```

### Backend (`/backend`)
- **Porta padrão**: `3333`
- **Stack**: Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL, Playwright, Baileys.
- **Scripts**:
  - `npm run dev`: Inicia o servidor com `tsx src/server.ts`.
  - `npm run build`: Compila TypeScript (`tsc`).
  - `npm run crawler`: Executa crawler geral.
  - `npm run crawler:tech`: Crawler segmentado para tecnologia.
  - `npm run crawler:casa`: Crawler segmentado para casa e decoração.
  - `npm run mercadolivre` / `npm run amazon` / `npm run shopee` / `npm run riachuelo` / `npm run torra`: Crawlers individuais por loja.
  - `npm run list-groups`: Lista os grupos do WhatsApp conectados via Baileys.

### Frontend (`/frontend`)
- **Porta padrão**: `5173` (dev) ou `5172` (preview).
- **Stack**: React 19, Vite 8, TailwindCSS v4 (`@tailwindcss/postcss`), React Router DOM 7, Lucide React, Zod.
- **Scripts**:
  - `npm run dev`: Inicia servidor Vite.
  - `npm run build`: Compilação e verificação de tipos (`tsc -b && vite build`).
  - `npm run preview`: Executa preview do bundle de produção.

---

## 3. Arquitetura do Backend

### 3.1. Estrutura de Pastas (`/backend/src`)
```
backend/src/
├── Controller/          # Controladores HTTP (Auth, Deals, Favorites, CreatedLinks, Admin, Promos)
├── Database/            # Instância do Prisma Client (Prisma.ts)
├── Middleware/          # authMiddleware.ts (validação de JWT e role admin)
├── Routes/              # Definições de rotas organizadas por domínio (index.ts)
├── Services/            # Lógicas complexas (WhatsAppService, TelegramService, AcessWebService, VTEX)
├── scripts/             # Scripts executáveis de crawlers e utilitários CLI
├── utils/               # Utilitários puros (affiliateUtils, expandUrl, encurtador, Envirolment)
├── app.ts               # Configuração do Express, CORS e rotas públicas/protegidas
└── server.ts            # Ponto de entrada que escuta na porta configurada
```

### 3.2. Banco de Dados (Prisma Schema - `backend/prisma/schema.prisma`)
- **`User`**: Usuários da plataforma (id, email, name, password hash, avatar, provider local/google, timestamps).
- **`ProductsMl`**: Tabela principal de ofertas exibidas no feed (id, title, price, originalPrice, coupon, badge, imageUrl, link, installments, store, category, timestamps).
- **`Favorite`**: Relação N:N entre `User` e `ProductsMl`.
- **`CreatedLink`**: Links criados por usuários na ferramenta de afiliação (id, userId, originalUrl, affiliateUrl, shortUrl, store, clickCount, createdAt).
- **`Ofertas`**: Histórico/fila de ofertas coletadas e status de postagem (`Pending`, `Posted`, `Failed`).

### 3.3. Sistema de Afiliados (`/backend/src/utils/affiliateUtils.ts`)
O Promoty suporta múltiplas lojas e redes de afiliação:

| Loja | Identificador (`StoreType`) | Mecanismo de Afiliação |
|---|---|---|
| **Mercado Livre** | `mercadolivre` | Query params: `matt_tool`, `matt_word`, `forceInApp=true` |
| **Amazon** | `amazon` | Extração de ASIN (`/dp/ASIN`) + tag `promocenter0b-20` |
| **Shopee** | `shopee` | Query params: `mmp_pid`, `utm_source`, `utm_medium` |
| **C&A** | `cea` | Rede Awin (`cread.php` com `AWIN_CEA_MERCHANT_ID`) |
| **Riachuelo** | `riachuelo` | Rede Awin (`cread.php` com `AWIN_RIACHUELO_MERCHANT_ID`) |
| **Dafiti** | `dafiti` | Rede Awin (`cread.php` com `AWIN_DAFITI_MERCHANT_ID`) |
| **KaBuM** | `kabum` | Rede Awin (`cread.php` com `AWIN_KABUM_MERCHANT_ID`) |
| **AliExpress** | `aliexpress` | Rede Awin (`cread.php` com `AWIN_ALIEXPRESS_MERCHANT_ID`) |
| **Lojas Torra** | `lojastorra` | Rede Awin (`cread.php` com `AWIN_LOJASTORRA_MERCHANT_ID`) |
| **Outro** | `other` | Mantém URL sem alteração caso não reconhecida |

### 3.4. Resolução de URLs Encurtadas (`expandUrl.ts`)
Antes de detectar a loja ou aplicar afiliação, o backend verifica se a URL provém de encurtadores conhecidos (`amzn`, `a.co`, `s.shopee`, `shope.ee`, `shp.ee`, `meli`, `a.aliexpress.com`). A função `expandUrl` segue os redirects HTTP até a URL de destino final.

### 3.5. Encurtador de Links (`encurtador.ts`)
Integração com a API Kutt (`https://fragata.me/api/v2/links`) usando a chave `KUTT_API_KEY`. Transforma URLs longas com afiliado em links curtos de alta conversão.

### 3.6. Redirecionamento e Contagem de Cliques (`/r/:id`)
A rota pública `GET /r/:id` consulta o link no banco, incrementa o `clickCount` e faz redirect HTTP 302 para a `affiliateUrl`.

---

## 4. Arquitetura do Frontend

### 4.1. Estrutura de Pastas (`/frontend/src`)
```
frontend/src/
├── assets/              # Imagens e logotipos (fragatalogo.png)
├── components/          # Componentes reutilizáveis
│   ├── layout/          # PageShell, Header, Sidebar, MobileNav, Footer, ThemeToggle
│   ├── product/         # ProductCard, ProductAdminCard, FavoriteButton, ShareButton, RelatedProducts
│   ├── search/          # SearchBar, SearchFilters
│   └── ui/              # StoreTag, WhatsAppFloat, Pagination, FilterDrawer, EmptyState
├── contexts/            # AuthContext.tsx (autenticação global, token JWT, dados do usuário)
├── hooks/               # Custom hooks (useTheme, useMediaQuery)
├── pages/               # Telas da aplicação (Home, Search, ProductDetail, CreatedLinks, Profile, Login, etc.)
├── services/            # api.ts (cliente HTTP fetch tipado para todas as rotas do backend)
├── types/               # Tipagens TypeScript e schemas Zod (product.ts, api.ts)
├── utils/               # constants.ts (STORE_LABELS, categorias, grupos WhatsApp), auth.ts
├── index.css            # Design tokens, variáveis CSS, classes utilitárias e Tailwind
└── App.tsx              # Configuração de rotas e providers
```

### 4.2. Mapeamento de Lojas no Frontend (`/frontend/src/utils/constants.ts`)
Centraliza as informações visuais das lojas (labels, cores de badges para Tailwind):
```typescript
export const STORE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'Mercado Livre': { label: 'Mercado Livre', color: 'bg-[#F7E000] text-[#2C3E79]', icon: '' },
  'Amazon': { label: 'Amazon', color: 'bg-[#F75F01] text-[#06070C]', icon: '' },
  'Shopee': { label: 'Shopee', color: 'bg-[#E74B2C] text-[#F7F7F7]', icon: '' },
  'C&A': { label: 'C&A', color: 'bg-[#F7F7F7] text-[#1F398D]', icon: '' },
  'Dafiti': { label: 'Dafiti', color: 'bg-[#F7F7F7] text-[#0D0D0D]', icon: '' },
  'Riachuelo': { label: 'Riachuelo', color: 'bg-[#0C2D2C] text-[#D0C9B3]', icon: '' },
  'KaBuM': { label: 'KaBuM', color: 'bg-[#F6611B] text-[#005BB2]', icon: '' },
  'Lojas Torra': { label: 'Lojas Torra', color: 'bg-[#F26522] text-[#FFFFFF]', icon: '' },
  'AliExpress': { label: 'AliExpress', color: 'bg-[#FF4747] text-[#FFFFFF]', icon: '' },
};
```
A função `getStoreInfo(store)` inclui busca insensível a maiúsculas/minúsculas para garantir consistência.

---

## 5. Checklist Mandatório: Como Adicionar uma Nova Loja

Ao adicionar suporte a uma nova loja na aplicação (ex.: Magalu, Casas Bahia, Shein), **TODOS** os passos abaixo devem ser seguidos rigorosamente:

### No Backend:
1. **Variáveis de Ambiente (`Envirolment.ts` e `.env`)**:
   - Adicionar o Merchant ID ou IDs da nova loja (ex.: `AWIN_NOVALOJA_MERCHANT_ID`).
2. **Tipagem e Utilitários (`affiliateUtils.ts`)**:
   - Incluir a chave no tipo `StoreType`.
   - Adicionar a condição de domínio/URL na função `detectStore(url: string)`.
   - Adicionar o case correspondente em `appendAffiliateParams(url: string, store: StoreType)`.
3. **Encurtadores (`expandUrl.ts`)**:
   - Se a loja tiver encurtador próprio ou links de aplicativo mobile (como `a.aliexpress.com` ou `shp.ee`), adicionar ao array `SHORTENER_DOMAINS`.
4. **Controlador de Links (`CreatedLinksController.ts`)**:
   - Adicionar a chave e nome amigável em `STORE_LABELS`.

### No Frontend:
1. **Constantes Visuais (`constants.ts`)**:
   - Adicionar a loja no objeto `STORE_LABELS` com suas cores oficiais de marca.
2. **Página de Links Criados (`CreatedLinks.tsx`)**:
   - Importar ícone adequado do `lucide-react`.
   - Mapear em `STORE_ICONS` e em `STORE_COLORS`.
   - Atualizar a frase de lojas suportadas abaixo do input.
3. **Atualização da Documentação**:
   - Atualizar este arquivo (`AGENTS.md`) com a nova loja na tabela de afiliados.

---

## 6. Boas Práticas e Regras de Manutenção

- **Compatibilidade de Node / Windows**: Lembre-se sempre de que o Node.js reside em `D:\Node` e comandos devem ser disparados via `cmd`.
- **Playwright & Crawlers**: Scrapers de Playwright (Mercado Livre, Amazon, Riachuelo, Torra) devem priorizar `channel: 'chrome'` com fallback para `chromium.launch` padrão. Isso garante funcionamento local no Windows sem exigir `playwright install`, e compatibilidade contínua em servidores Linux.
- **Variáveis de Ambiente & Resiliência**: Variáveis de lojas e grupos no schema do `Envirolment.ts` devem possuir `.default('')` para não interromper a inicialização do backend caso alguma credencial de afiliado ainda não esteja preenchida.
- **Disparo no WhatsApp**: O envio para grupos depende do preenchimento dos JIDs no `.env` (`WHATSAPP_GROUP_JID_GAMERS` para o nicho de tecnologia e `WHATSAPP_GROUP_JID_MODA_FEMININA` para o nicho de casa e moda). Se o JID estiver vazio, o dispatcher apenas salva no banco e silencia o WhatsApp.
- **Validação com Zod**: Sempre use Zod para validar payloads em novos endpoints e respostas do cliente HTTP.
- **Segurança de Links**: Nunca monte URLs de afiliados concatenando strings sem `encodeURIComponent` para destinos externos (`ued`).
- **Autenticação**: Rotas administrativas devem utilizar `authMiddleware` com validação de email administrativo (`ADMIN_EMAILS`).
- **Estilos no Frontend**: O projeto usa Tailwind v4. Respeite as variáveis CSS em `index.css` (`--color-surface-container-...`, `--color-brand`, etc.) e utilize `clsx` / `tailwind-merge` para classes dinâmicas.
