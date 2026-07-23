# Plano: Reformular URLs da Amazon para `/deals` + Reduzir CAPTCHA

## Contexto

O scraper da Amazon (`AcessWebService.ts`) usa Playwright com stealth plugin para raspar ofertas. Atualmente, a maioria das requisições está sendo bloqueada pelo CAPTCHA da Amazon na VPS.

**Problema:** ~208 URLs/dia (10 URLs × ~11 ciclos) geram CAPTCHA frequente.

**Solução proposta:** Trocar as URLs de busca (`/s?`) pelas páginas de ofertas do dia (`/deals`) com filtro de desconto embutido na URL, reduzindo drasticamente o número de requests.

**PA-API (API oficial):** Requer 10 vendas qualificadas nos últimos 30 dias para manter acesso. Não é viável no momento.

---

## 1. Comparativo: URLs Atuais vs Propostas

| Aspecto | Atual (`/s?` search) | Proposto (`/deals`) |
|---|---|---|
| URLs por ciclo (Casa) | 10 (5 grupos × 2) | 4 (1 por categoria) |
| URLs por ciclo (Tech) | 14 (5 grupos) | 4 (1 por subcategoria) |
| Filtro de desconto | No código (`minDiscount: 35-40%`) | Na URL (`percentOff min=40 max=70`) |
| Produtos por página | ~40-60 | ~90 (`PageSize=90`) |
| Páginas | page=1, page=2 (expansão até 4) | Apenas page=1 |
| Seletores DOM | `.s-result-item[data-asin]` | **DIFERENTE** — precisa adaptar |

### Redução de requests/dia

```
ANTES:   10 URLs × ~11 ciclos = ~110 URLs/dia (Casa)
         14 URLs × ~7 ciclos  = ~98 URLs/dia (Tech)
         TOTAL: ~208 URLs/dia

DEPOIS:  4 URLs × ~11 ciclos = ~44 URLs/dia (Casa)
         4 URLs × ~7 ciclos  = ~28 URLs/dia (Tech)
         TOTAL: ~72 URLs/dia

REDUÇÃO: ~65% menos requests
```

---

## 2. URLs Propostas

### 2.1 Nicho Casa e Moda Feminina (`moda-feminina.niche.ts`)

**Lote 0 — Cozinha (desconto 40-70%)**
```
https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216957126011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A70%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522
```

**Lote 1 — Casa / Móveis / Decoração (desconto 40-80%)**
```
https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216191001011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A80%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522
```

**Lote 2 — Beleza / Perfumes / Maquiagem (desconto 40-70%)**
```
https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216194415011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A70%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522
```

**Lote 3 — Moda Feminina (desconto 40-70%)**
```
https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252217365812011%252F17681969011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A70%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522
```

### Estrutura da URL `/deals` (decodificada)

A URL original é duplamente codificada (`%2522` = `%22` = `"`). Decodificando:

```json
{
  "state": {
    "refinementFilters": {
      "departments": ["16957126011"],
      "rangeRefinementFilters": {
        "percentOff": {
          "min": 40,
          "max": 70
        }
      }
    },
    "version": 1
  }
}
```

| Parâmetro | Função |
|---|---|
| `departments` | ID da categoria Amazon |
| `percentOff.min` | Desconto mínimo (%) |
| `percentOff.max` | Desconto máximo (%) |
| `version` | Versão do widget de filtros |

### Mapeamento de departments (nodes)

| Categoria | Department ID | Desconto |
|---|---|---|
| Cozinha | `16957126011` | 40-70% |
| Casa / Móveis / Decoração | `16191001011` | 40-80% |
| Beleza / Perfumes / Maquiagem | `16194415011` | 40-70% |
| Moda Feminina | `17365812011/17681969011` | 40-70% |

---

## 3. Adaptar o Scraper (`AcessWebService.ts`)

### 3.1 Problema: Seletores DOM diferentes

A página `/deals` usa uma estrutura DOM diferente de `/s?`. Os seletores atuais **não funcionam**:

| Dado | Seletor atual (`/s?`) | Funciona em `/deals`? |
|---|---|---|
| Card | `.s-result-item[data-asin]` | ❌ Não |
| ASIN | `card.getAttribute('data-asin')` | ❌ Não |
| Título | `card.$('h2')` | ❌ Não |
| Preço | `card.$$('.a-price .a-offscreen')` | ❓ Precisa testar |
| Imagem | `card.$('img.s-image')` | ❌ Não |
| Link | `card.$('a.a-link-normal')` | ❌ Não |

### 3.2 Solução: Scraper dual (recomendada)

Adicionar lógica de detecção de formato da página e usar seletores apropriados:

```typescript
// Detecta se é página /deals ou /s?
const isDealsPage = URLAmazon.includes('/deals');

// Seleção de cards
let cards: ElementHandle[];
if (isDealsPage) {
    // Seletores para /deals — testar na prática
    cards = await page.$$('[data-testid="deal-card"], .deal-card, .a-section.a-spacing-none.a-spacing-top-micro');
} else {
    // Seletores originais para /s?
    cards = await page.$$('.s-result-item[data-asin]');
}
```

### 3.3 Extração de dados adaptada

```typescript
for (const card of cards) {
    let id: string | null;
    let title: string;
    let cleanPrice: number;
    let originalPrice: number | null;
    let imageUrl: string | null;
    let link: string | null;

    if (isDealsPage) {
        // === FORMATO /deals ===
        id = await card.getAttribute('data-deal-id') 
          ?? await card.getAttribute('data-asin');

        const titleEl = await card.$('.a-text-normal, h2, .deal-title');
        title = (await titleEl?.innerText()) ?? '';

        const priceEl = await card.$('.a-price .a-offscreen, .deal-price .a-offscreen');
        const rawPrice = priceEl ? await priceEl.innerText() : '0';
        cleanPrice = formatPrice(rawPrice);

        const origEl = await card.$('.a-price.a-text-price .a-offscreen');
        const rawOrig = origEl ? await origEl.innerText() : null;
        originalPrice = rawOrig ? formatPrice(rawOrig) : null;

        const imgEl = await card.$('img');
        imageUrl = await imgEl?.getAttribute('src') ?? null;

        const linkEl = await card.$('a[href*="/dp/"], a[href*="/deal/"]');
        const href = await linkEl?.getAttribute('href') ?? '';
        link = href.startsWith('http') ? href : 'https://www.amazon.com.br' + href;

    } else {
        // === FORMATO /s? (código atual) ===
        id = await card.getAttribute('data-asin');
        const titleEl = await card.$('h2');
        title = (await titleEl?.innerText()) ?? '';
        // ... resto do código atual
    }

    // ... filtros de nicho (permanecem iguais)
}
```

### 3.4 Paginação

As URLs `/deals` propostas **não têm parâmetro `page=`**. A expansão dinâmica (`AcessWebService.ts:645-661`) precisa ser desabilitada para `/deals`:

```typescript
// Só gera próxima página se NÃO for /deals
if (!URLAmazon.includes('/deals')) {
    if (groupSuccessCount > 0 && currentPage < AccesWeb.MAX_AMAZON_PAGES) {
        // ... lógica atual de paginação
    }
}
```

---

## 4. Alterações nos Arquivos

### 4.1 `backend/src/config/moda-feminina.niche.ts`

Substituir o array `amazonUrls` (linhas 209-235):

```typescript
amazonUrls: [
    // Lote 0: Cozinha (desconto 40-70%)
    [
      "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216957126011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A70%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
    ],
    // Lote 1: Casa / Móveis / Decoração (desconto 40-80%)
    [
      "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216191001011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A80%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
    ],
    // Lote 2: Beleza / Perfumes / Maquiagem (desconto 40-70%)
    [
      "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216194415011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A70%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
    ],
    // Lote 3: Moda Feminina (desconto 40-70%)
    [
      "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252217365812011%252F17681969011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A40%252C%255C%2522max%255C%2522%253A70%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
    ],
],
```

### 4.2 `backend/src/config/tech.niche.ts`

Criar URLs equivalentes para o nicho Tech. As categorias da Amazon para Tech são:

| Subcategoria | Department ID | Desconto sugerido |
|---|---|---|
| Computers & Accessories | `16339926011` | 30-60% |
| Electronics | `16209063011` | 30-60% |

Urls propostas para Tech:

```typescript
amazonUrls: [
    // Lote 0: Computadores & Acessórios (desconto 30-60%)
    [
      "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216339926011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A30%252C%255C%2522max%255C%2522%253A60%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
    ],
    // Lote 1: Eletrônicos (desconto 30-60%)
    [
      "https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252216209063011%255C%2522%255D%257D%252C%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A30%252C%255C%2522max%255C%2522%253A60%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
    ],
],
```

### 4.3 `backend/src/Services/AcessWebService.ts`

Mudanças necessárias:

1. **Detectar formato da página** e usar seletores adequados
2. **Desabilitar paginação** para URLs `/deals`
3. **Manter bloqueio de tracking** (já implementado)

### 4.4 Campo `amazonCategoryNodes`

Este campo (`moda-feminina.niche.ts:208`, `tech.niche.ts:73`) **não é utilizado** em nenhum código. Pode ser removido ou ignorado.

---

## 5. Ordem de Implementação

| # | Tarefa | Arquivo | Depende de |
|---|---|---|---|
| 1 | **Testar DOM da página `/deals`** — rodar Chromium e inspecionar seletores | N/A (teste manual ou script) | Nada |
| 2 | Adaptar `AcessWebService.ts` — seletores duais para `/deals` | `AcessWebService.ts` | Etapa 1 |
| 3 | Desabilitar paginação para `/deals` | `AcessWebService.ts` | Etapa 2 |
| 4 | Atualizar `amazonUrls` em `moda-feminina.niche.ts` | `moda-feminina.niche.ts` | Nada |
| 5 | Atualizar `amazonUrls` em `tech.niche.ts` | `tech.niche.ts` | Nada |
| 6 | Testar extração completa (Casa + Tech) | N/A | Etapas 2-5 |
| 7 | Deploy na VPS e monitorar por 24-48h | N/A | Etapa 6 |
| 8 | (Opcional) Remover campo `amazonCategoryNodes` | `moda-feminina.niche.ts`, `tech.niche.ts`, `types/niche.ts` | Etapa 7 |

---

## 6. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Seletores `/deals` instáveis | Alto | Testar em produção antes de commitar; usar seletores robustos (data-testid, classes estáveis) |
| Amazon bloqueia `/deals` mais que `/s?` | Médio | Manter 8-12s delay; distribuir requests ao longo do dia |
| Perda de cobertura (só page 1) | Baixo | Cada página `/deals` tem ~90 produtos vs ~50 de `/s?` |
| URLs muito longas | Baixo | URLs de deals são aceitas normalmente pelo Playwright |
| CAPTCHA persistente mesmo com menos requests | Médio | Considerar CAPTCHA solver como plano B (~US$ 6-18/mês) |

---

## 7. Projeção de Custo

| Cenário | URLs/dia | GB/mês (proxy) | Custo/mês |
|---|---|---|---|
| **Atual** (10 URLs, `/s?`) | ~208 | ~52 GB | US$ 209 |
| **Proposto** (4 URLs, `/deals`) | ~72 | ~18 GB | US$ 72 |
| **Proposto** + otimização tracking | ~72 | ~3,6 GB | US$ 14 |
| **Proposto** + proxy fixo ilimitado | ~72 | Ilimitado | US$ 15-25 |

**Redução de custo: ~65-93%** dependendo da estratégia de proxy.

---

## 8. Notas sobre PA-API

A Amazon Product Advertising API (PA-API) seria a solução ideal (gratuita, sem CAPTCHA), mas requer:

1. Conta de Colaborador aprovada na Amazon Associates
2. **10 vendas qualificadas nos últimos 30 dias** para manter acesso
3. Credenciais AWS (Access Key + Secret Key)

**Plano para ativar PA-API futuramente:**
1. Garantir que o programa de afiliados está gerando vendas
2. Após atingir 10 vendas/30 dias, solicitar acesso à API
3. Migrar o scraper para usar PA-API como fonte primária
4. Manter scraping como fallback para detecção de deals especiais
