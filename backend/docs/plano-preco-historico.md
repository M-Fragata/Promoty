# Sistema de Preço Histórico — Promoty

## Visão Geral

Sistema de rastreamento de preços históricos para produtos de afiliados AWIN (Kabum, Dafiti, C&A). Em vez de depender do campo `product_price_old` do feed CSV (que lojistas como a Kabum não preenchem), o sistema mantém seu próprio histórico de preços no banco de dados e usa a **mediana dos últimos 60 dias** como preço de referência para calcular descontos reais.

---

## Por que existe esse sistema?

### O problema

O feed CSV da AWIN possui a coluna `product_price_old` (preço de tabela/original). Alguns lojistas a preenchem (Dafiti), outros não (Kabum). Quando o campo está vazio, não é possível calcular o desconto real do produto.

### A solução

Em vez de confiar no dado do lojista, coletamos os preços de todos os produtos a cada download do CSV e armazenamos no banco de dados. Com 30-60 dias de histórico, calculamos a **mediana** (preço mais frequente) e a usamos como referência para determinar se o preço atual é realmente uma promoção.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  Endpoint API                        │
│            GET /awin/kabum                           │
│            GET /awin/dafiti                          │
│            GET /awin/cea                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Service (ex: KabumService)              │
│                                                     │
│  1. Baixa CSV da AWIN (gzip)                        │
│  2. Parse com csv-parse + decode Latin1→UTF-8       │
│  3. Para cada lote de 500 produtos:                  │
│     a. Coleta IDs do lote                           │
│     b. Query batch: mediana de preços (60 dias)     │
│     c. Calcula badge (feed %, mediana %, ou menor)  │
│     d. Batch insert: salva preços no banco          │
│  4. Retorna lote com badges                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            PostgreSQL (Neon)                         │
│                                                     │
│  product_price_history                              │
│  ┌────┬──────────┬──────┬───────┬─────────────┐     │
│  │ id │productId │store │ price │ collectedAt │     │
│  ├────┼──────────┼──────┼───────┼─────────────┤     │
│  │ .. │ 363584.. │Kabum │ 279.99│ 2026-07-21  │     │
│  │ .. │ 363584.. │Kabum │ 349.99│ 2026-07-15  │     │
│  │ .. │ 363584.. │Kabum │ 399.99│ 2026-06-20  │     │
│  └────┴──────────┴──────┴───────┴─────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Tabela `product_price_history`

```prisma
model ProductPriceHistory {
  id          String   @id @default(uuid())
  productId   String   // aw_product_id do CSV AWIN
  store       String   // "Kabum" | "Dafiti" | "C&A"
  price       Float    // preço no momento da coleta
  collectedAt DateTime @default(now())

  @@index([productId, store, collectedAt])
  @@map("product_price_history")
}
```

**Campos:** Apenas o estritamente necessário para a série temporal. Título, imagem e link ficam apenas em memória durante o processamento.

**Índice composto:** `(productId, store, collectedAt)` permite buscas rápidas por produto+loja+período.
Fa
**Retenção:** 90 dias. Cron job mensal remove registros antigos.

---

## Lógica de Badges

### Hierarquia de decisão

```
1. Tem preço antigo confiável do feed CSV? (product_price_old)
   → SIM: calcula % OFF → badge percentual
   → NÃO: vai para 2

2. Tem preço de referência histórico? (mediana 60 dias)
   → DESCONTO ≥ 30%: badge percentual baseado na mediana
   → DESCONTO < 30% E precoAtual < precoRef: badge "Menor preço recente"
   → NENHUM: sem badge (produto descartado)
```

### Código de referência

```typescript
function calcularBadge(
    precoAtual: number,
    precoAntigoFeed: number,
    precoRefHistorico: number | null
): string {
    const descontoFeed = precoAntigoFeed > precoAtual
        ? Math.round(((precoAntigoFeed - precoAtual) / precoAntigoFeed) * 100)
        : 0;

    const descontoRef = precoRefHistorico && precoRefHistorico > precoAtual
        ? Math.round(((precoRefHistorico - precoAtual) / precoRefHistorico) * 100)
        : 0;

    if (descontoFeed >= 30) {
        return `${descontoFeed}% OFF`;           // Feed confiável (ex: Dafiti)
    }
    if (descontoRef >= 30) {
        return `${descontoRef}% OFF`;            // Mediana confiável
    }
    if (precoRefHistorico && precoAtual < precoRefHistorico) {
        return 'Menor preço recente';            // Queda sutil mas real
    }
    return '';                                   // Sem badge → produto descartado
}
```

### Exemplos

| Cenário | precoAtual | precoAntigoFeed | precoRef (mediana) | Badge |
|---|---|---|---|---|
| Dafiti com desconto | R$ 100 | R$ 200 | — | `50% OFF` |
| Kabum com histórico | R$ 250 | — (vazio) | R$ 350 | `29% OFF` |
| Kabum queda sutil | R$ 280 | — (vazio) | R$ 300 | `Menor preço recente` |
| Sem desconto | R$ 300 | R$ 300 | R$ 290 | *(descartado)* |

---

## Eliminação do Problema N+1

### O problema

Se chamarmos `obterPrecoReferencia(id)` dentro do loop de cada produto, teremos N queries ao banco. Com 20.000 produtos válidos = 20.000 queries sequenciais = timeout.

### A solução: Batch Query

```typescript
// ❌ ANTES: N+1 (um query por produto)
for (const row of parser) {
    const precoRef = await obterPrecoReferencia(row.aw_product_id, store);
    // ... calcula badge
}

// ✅ DEPOIS: 1 query por lote de 500
const idsDoLote = rowsDoLote.map(r => r.aw_product_id);
const mapaReferencias = await obterPrecosReferenciaEmLote(idsDoLote, store, 60);

for (const row of rowsDoLote) {
    const precoRef = mapaReferencias.get(row.aw_product_id) ?? null;
    // ... calcula badge (sync, sem await)
}
```

### Query de referência em lote

```sql
SELECT 
    product_id, 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS preco_ref
FROM product_price_history
WHERE store = $1
  AND product_id = ANY($2)
  AND collected_at > NOW() - INTERVAL '60 days'
GROUP BY product_id
```

**Resultado:** `Map<string, number>` → `{"36358441427": 350.00, "123456": 120.50, ...}`

### Batch insert de preços

```typescript
// Salva todos os preços do lote de uma vez
await prisma.productPriceHistory.createMany({
    data: rowsDoLote.map(row => ({
        productId: row.aw_product_id,
        store: 'Kabum',
        price: limparPreco(row.search_price)
    }))
});
```

**Performance total:** 1 query de referência + 1 batch insert por lote de 500, em vez de 500+500 queries sequenciais.

---

## Arquivos do Projeto

### Arquivos a criar

| Arquivo | Responsabilidade |
|---|---|
| `src/Services/PriceHistoryService.ts` | Coleta (`registrarPrecoEmLote`) e referência (`obterPrecosReferenciaEmLote`) |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `prisma/schema.prisma` | Adicionar model `ProductPriceHistory` |
| `src/Services/DafitiAwinService.ts` | Integrar coleta + batch reference + badges |
| `src/Services/KabumAwinService.ts` | Integrar coleta + batch reference + badges |
| `src/Services/CeaVtexService.ts` | Integrar coleta + batch reference + badges |

### Fluxo de execução por service

```
baixarEProcessarFeed()
  │
  ├── 1. Baixa CSV (fetch + gunzip + decode Latin1)
  │
  ├── 2. Parse com csv-parse (streaming)
  │
  ├── 3. Para cada lote de 500 rows:
  │     ├── 3a. Coleta aw_product_id de todos os rows
  │     ├── 3b. obterPrecosReferenciaEmLote(ids, store, 60) → Map
  │     ├── 3c. Para cada row:
  │     │     ├── Tenta product_price_old (precoAntigoFeed)
  │     │     ├── Busca precoRef no Map (sync)
  │     │     ├── calcularBadge(precoAtual, precoAntigoFeed, precoRef)
  │     │     └── Se tem badge: adiciona ao array de produtos
  │     └── 3d. registrarPrecoEmLote(todosOsRows) → salva no banco
  │
  └── 4. Retorna array de produtos com badges
```

---

## Comandos de Deploy

```bash
# 1. Gerar migration
npx prisma migrate dev --name add_price_history

# 2. Gerar cliente Prisma
npx prisma generate

# 3. Testar
npx tsx src/server.ts

# 4. Chamar endpoint
curl http://localhost:3333/awin/kabum
```

---

## Retenção de Dados

### Cron job de limpeza (mensal)

```sql
DELETE FROM product_price_history 
WHERE collected_at < NOW() - INTERVAL '90 days';
```

Pode ser implementado como:
- Script standalone (`src/scripts/limpar-historico.ts`)
- Ou integrado ao `server.ts` com `setInterval`

---

## Métricas de Performance

| Métrica | Antes (N+1) | Depois (Batch) |
|---|---|---|
| Queries de referência por lote | 500 | **1** |
| Inserts por lote | 500 | **1 (createMany)** |
| Tempo estimado por lote | ~5s (500 queries × 10ms) | **~50ms** (2 queries) |
| Total para 20k produtos | ~200s | **~2s** |

---

## Decisões de Design

| Decisão | Motivo |
|---|---|
| Mediana (percentil 0.5) em vez de média | Resistente a outliers (picos de preço inflados) |
| 60 dias de janela | Equilíbrio entre dados suficientes e relevância |
| Sem title/imageUrl/link na tabela | Economiza espaço (séries temporais puras) |
| Batch insert com createMany | Uma operação por lote, não por produto |
| Badge "Menor preço recente" para queda < 30% | Honestidade: não inventa % de desconto incerto |
| Filtro ≥ 30% para badge percentual | Só mostra desconto quando é significativo |
