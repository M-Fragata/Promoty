# Amazon - Niche-Aware URLs para Casa/Moda Feminina

## Visão Geral

O crawler da Amazon atualmente possui URLs hardcoded para o nicho Tech (Computers/Electronics). Esta funcionalidade estende o suporte para o nicho **Casa/Moda Feminina**, centralizando todas as URLs (ML e Amazon) nos arquivos de configuração de nicho.

## Problema Atual

- `URLsAmazon` está hardcoded em `AcessWebService.ts:415-418` — sempre Tech
- `amazonCategoryNodes` em `moda-feminina.niche.ts` usa os mesmos nós tech — incorreto
- `crawler-casa.ts` não inclui Amazon
- `nicheFilter` do `AccesWeb` só funciona para ML, não para Amazon
- URLs de ML estão em arquivos separados (`tech.ml.ts`, `casa.ml.ts`) em vez de centralizadas

## Solução: Centralização nos Nichos

Todas as URLs (ML e Amazon) serão movidas para os arquivos de nicho:
- `tech.niche.ts` — contém keywords, banwords, ML URLs, Amazon URLs
- `moda-feminina.niche.ts` — contém keywords, banwords, ML URLs, Amazon URLs

Arquivos separados `tech.ml.ts` e `casa.ml.ts` serão **deletados**.

## Category Nodes Descobertos

### Departamentos Amazon

| Departamento | `i=` | Node Principal | Deal Type |
|---|---|---|---|
| Casa | `home` | `16191000011` | `23565493011` |
| Moda | `fashion` | `17365811011` | `23565493011` |
| Beleza | `beauty` | `16194414011` | `23565493011` |
| Eletrodomésticos | `appliances` | `16522082011` | `23565493011` |

### Subcategorias

**Casa** (`i=home`, `n:16191000011`):
- Cozinha: `23783015011`
- Móveis: `17100530011`
- Decoração para Casa: `17100531011`
- Organização e Armazenamento: `17100533011`
- Iluminação: `17406462011`

**Moda** (`i=fashion`, `n:17365811011`):
- Feminino: `17681969011`
- Acessórios: `17681966011`
- Bolsas: `17681967011`

**Beleza** (`i=beauty`, `n:16194414011`):
- Perfumes: `16754347011`
- Maquiagem: `16754350011`
- Pele: `16754345011`
- Cabelo: `16754346011`

**Eletrodomésticos** (`i=appliances`, `n:16522082011`):
- Fogões, Fornos, Cooktops
- Geladeiras, Freezers
- Máquinas de Lavar

## Padrão de URL Amazon

```
https://www.amazon.com.br/s?i={department}&rh=n%3A{node}%2Cp_n_deal_type%3A23565493011&dc&page={page}
```

## Alterações no Tipo NicheConfig

```typescript
// backend/src/types/niche.ts
export interface NicheConfig {
  // ... campos existentes ...
  mlUrls: string[][]           // NOVO: URLs do ML por lote
  amazonUrls: string[][]       // NOVO: URLs da Amazon por lote
  mlCategoryIds: string[]      // EXISTENTE (manter para compatibilidade)
  amazonCategoryNodes: string[] // EXISTENTE (corrigir valores)
}
```

## Arquitetura

### Antes (分散)
```
config/
├── tech.niche.ts          # Config do nicho
├── tech.ml.ts             # URLs ML Tech (ARQUIVO SEPARADO)
├── moda-feminina.niche.ts # Config do nicho
└── casa.ml.ts             # URLs ML Casa (ARQUIVO SEPARADO)
```

### Depois (Centralizado)
```
config/
├── tech.niche.ts          # Config + ML URLs + Amazon URLs
└── moda-feminina.niche.ts # Config + ML URLs + Amazon URLs
```

## Arquivos a Modificar

### 1. `backend/src/types/niche.ts`

Adicionar campos `mlUrls` e `amazonUrls`:
```typescript
export interface NicheConfig {
  // ... campos existentes ...
  mlUrls: string[][]
  amazonUrls: string[][]
}
```

### 2. `backend/src/config/tech.niche.ts`

Adicionar URLs de ML e Amazon (migradas de `tech.ml.ts`):
```typescript
export const techNiche: NicheConfig = {
  // ... campos existentes ...
  mlUrls: [
    // Lote 0: Informática (p1, p2)
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=1&promotion_type=lightning",
      "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=2&promotion_type=lightning",
    ],
    // ... lotes 1-4 ...
  ],
  amazonUrls: [
    // Lote 0: Computers (p1, p2)
    [
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339927011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=computers&rh=n%3A16339927011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
    // Lote 1: Electronics (p1, p2)
    [
      "https://www.amazon.com.br/s?i=electronics&rh=n%3A16209063011%2Cp_n_deal_type%3A23565492011&dc&page=1",
      "https://www.amazon.com.br/s?i=electronics&rh=n%3A16209063011%2Cp_n_deal_type%3A23565492011&dc&page=2",
    ],
  ],
  amazonCategoryNodes: ["n:16339927011", "n:16209063011"],
}
```

### 3. `backend/src/config/moda-feminina.niche.ts`

Adicionar URLs de ML e Amazon, corrigir `amazonCategoryNodes`:
```typescript
export const modaFeminina: NicheConfig = {
  // ... campos existentes ...
  mlUrls: [
    // Lote 0: Casa, Móveis e Decoração (p1, p2)
    [
      "https://www.mercadolivre.com.br/ofertas?category=MLB1579&page=1&promotion_type=lightning",
      "https://www.mercadolivre.com.br/ofertas?category=MLB1579&page=2&promotion_type=lightning",
    ],
    // ... lotes 1-4 ...
  ],
  amazonUrls: [
    // Lote 0: Casa - Móveis (p1, p2)
    [
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A17100530011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A17100530011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
    // Lote 1: Casa - Cozinha + Decoração
    [
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A23783015011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011%2Cn%3A17100531011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Lote 2: Moda Feminina (p1, p2)
    [
      "https://www.amazon.com.br/s?i=fashion&rh=n%3A17365811011%2Cn%3A17681969011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=fashion&rh=n%3A17365811011%2Cn%3A17681969011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
    // Lote 3: Beleza - Perfumes + Maquiagem
    [
      "https://www.amazon.com.br/s?i=beauty&rh=n%3A16194414011%2Cn%3A16754347011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=beauty&rh=n%3A16194414011%2Cn%3A16754350011%2Cp_n_deal_type%3A23565493011&dc&page=1",
    ],
    // Lote 4: Eletrodomésticos (p1, p2)
    [
      "https://www.amazon.com.br/s?i=appliances&rh=n%3A16522082011%2Cp_n_deal_type%3A23565493011&dc&page=1",
      "https://www.amazon.com.br/s?i=appliances&rh=n%3A16522082011%2Cp_n_deal_type%3A23565493011&dc&page=2",
    ],
  ],
  amazonCategoryNodes: ["n:16191000011", "n:17365811011", "n:16194414011", "n:16522082011"],
}
```

### 4. `backend/src/Services/AcessWebService.ts`

Remover imports de `tech.ml.ts` e `casa.ml.ts`. Ler URLs do nicho ativo:

```typescript
// ANTES:
import { techMlUrls } from "../config/tech.ml.js"
import { casaMlUrls } from "../config/casa.ml.js"

// DEPOIS:
import { getActiveNiches } from "../config/index.js"
```

Atualizar constructor:
```typescript
constructor(nicheFilter?: 'tech' | 'casa') {
    const niches = getActiveNiches();
    const niche = niches.find(n =>
        nicheFilter === 'tech' ? n.id === 'tech' :
        nicheFilter === 'casa' ? n.id === 'casa-moda-feminina' :
        true
    );

    if (niche) {
        this.urlsMl = niche.mlUrls;
        this.urlsAmazon = niche.amazonUrls;
    } else {
        // Fallback: todas as URLs
        this.urlsMl = niches.flatMap(n => n.mlUrls);
        this.urlsAmazon = niches.flatMap(n => n.amazonUrls);
    }
}
```

### 5. `backend/src/scripts/crawler-casa.ts`

Adicionar tarefa Amazon:
```typescript
import { executAmazon } from './amazon.js'

const tarefas: Array<() => any> = [
    executShopeeKeywords,
    executMercadoLivre,
    executAmazon,  // ← NOVO
];
```

### 6. `backend/src/scripts/amazon.ts`

Aceitar parâmetro NICHE via env:
```typescript
const NICHE = (process.env.AMAZON_NICHE as 'tech' | 'casa') || 'tech';

async function executarRobo() {
    const scraper = new AccesWeb(NICHE);
    // ...
}
```

### 7. Deletar arquivos

- `backend/src/config/tech.ml.ts` — URLs migradas para `tech.niche.ts`
- `backend/src/config/casa.ml.ts` — URLs migradas para `moda-feminina.niche.ts`

## Fluxo de Execução

```
crawler-casa.ts
  └─→ AccesWeb('casa')
        ├─→ niche.mlUrls (lê de moda-feminina.niche.ts)
        ├─→ niche.amazonUrls (lê de moda-feminina.niche.ts)
        └─→ AcessAmazon()
              └─→ Usa niche.amazonUrls dinamicamente
```

## Ordem de Implementação

1. Atualizar `NicheConfig` — adicionar `mlUrls` e `amazonUrls`
2. Atualizar `tech.niche.ts` — adicionar URLs de ML e Amazon
3. Atualizar `moda-feminina.niche.ts` — adicionar URLs de ML e Amazon, corrigir `amazonCategoryNodes`
4. Atualizar `AcessWebService.ts` — ler URLs do nicho em vez de imports separados
5. Atualizar `crawler-casa.ts` — adicionar tarefa Amazon
6. Atualizar `amazon.ts` — aceitar parâmetro NICHE
7. Deletar `tech.ml.ts` e `casa.ml.ts`
8. Atualizar `AMAZON.md`

## URLs Tech (Referência)

**ML Tech:**
```
https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=1&promotion_type=lightning
https://www.mercadolivre.com.br/ofertas?container_id=MLB779535-1&page=1
https://www.mercadolivre.com.br/ofertas?container_id=MLB779539-1&page=1
```

**Amazon Tech:**
```
i=computers → deal type 23565493011, node 16339927011
i=electronics → deal type 23565492011, node 16209063011
```

Nota: Electronics usa deal type diferente (`23565492011`).
