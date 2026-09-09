# Plano de Separação de Crawlers por Nicho

## Visão Geral

O projeto Promoty utiliza um sistema de scraping de ofertas de3 lojas (Mercado Livre, Amazon, Shopee) que são enviadas para grupos de WhatsApp por nicho. Atualmente, **um único crawler** (`crawler.ts`) processa todos os nichos (Tech + Casa/Moda Feminina) em ciclos entrelaçados, consumindo muita RAM e dificultando manutenção.

Este plano separa a operação em **dois crawlers independentes**, cada um responsável por um nicho, com agendamento offset para evitar sobreposição de instâncias Playwright.

---

## Problema Atual

### Consumo de Recursos
- Playwright consome ~300-500MB RAM por instância de navegador
- O crawler atual roda **ML + Amazon** (ambos Playwright) no mesmo ciclo
- Na VPS de 4GB RAM, isso causa pressão na memória

### Mistura de Categorias
- URLs do ML estão entrelaçadas nos "Lotes" (2 Tech + 2 Casa por lote)
- Keywords da Shopee são misturadas via `getAllShopeeKeywordGroups()`
- Dificulta adicionar novas categorias ou ajustar frequência por nicho

### Acoplamento
- Mudança em URLs de Tech pode quebrar Casa
- Não é possível rodar só um nicho sem o outro
- Dificulta debug (não saber se problema é Tech ou Casa)

---

## Arquitetura Proposta

### Diagrama

```
┌─────────────────────────────────────────────────────────┐
│              API Server (port 3333)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Promos       │  │ Shopee       │  │ Niche         │ │
│  │ Controller   │  │ Controller   │  │ Dispatcher    │ │
│  │ (ML/Amazon)  │  │ (?niche=)    │  │ (filtra)      │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘ │
│         └─────────────────┴───────────────────┘         │
│                         │                                │
│                 WhatsAppService                          │
│            (envia para grupo correto)                    │
└─────────────────────────────────────────────────────────┘
           ▲                              ▲
           │ POST /ofertas/*              │ GET /ofertas/shopee/*
           │                              │ ?niche=tech|casa
           │                              │
┌──────────┴───────────┐    ┌─────────────┴────────────┐
│    crawler-tech      │    │     crawler-casa         │
│    ──────────────    │    │     ──────────────       │
│  ML: Tech URLs       │    │  ML: Casa URLs           │
│  Amazon: Tech        │    │  Shopee: Casa keywords   │
│  Shopee: Tech kw     │    │  (sem Amazon)            │
│  Shopee: Pichau      │    │                          │
│  Shopee: Terabyte    │    │                          │
│  ──────────────      │    │  ──────────────          │
│  Ciclo: :00 e :30    │    │  Ciclo: :15 e :45       │
└──────────────────────┘    └──────────────────────────┘
```

### Fluxo de Dados

1. **Crawler** raspa URLs/keywords do seu nicho
2. **Crawler** envia batch de produtos via HTTP para a API server
3. **API Server** recebe em `/ofertas/mercadolivre`, `/ofertas/amazon` ou `/ofertas/shopee/*`
4. **PromosController** salva no DB, verifica se é novo/preço menor/repost
5. **NicheDispatcher** verifica quais nichos o produto atende
6. **WhatsAppService** envia para o grupo do nicho correspondente

---

## Detalhes de Implementação

### 1. Configuração de URLs por Nicho (ML)

**Problema**: As URLs do ML estão misturadas em um único array `AccesWeb.URLs`.

**Solução**: Criar arrays separados por nicho.

#### `src/config/tech.ml.ts` (Novo)

```typescript
// URLs do Mercado Livre APENAS para o nicho Tech
// Cada "Lote" contém 2 URLs de categorias Tech
export const techMlUrls: string[][] = [
  // Lote 0: Informática (p1, p2)
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=1&promotion_type=lightning",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=2&promotion_type=lightning",
  ],
  // Lote 1: Informática (p3) + Celulares (p1)
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=3&promotion_type=lightning",
    "https://www.mercadolivre.com.br/ofertas?container_id=MLB779535-1&page=1",
  ],
  // Lote 2: Celulares (p2) + TVs (p1)
  [
    "https://www.mercadolivre.com.br/ofertas?container_id=MLB779535-1&page=2",
    "https://www.mercadolivre.com.br/ofertas?container_id=MLB779539-1&page=1",
  ],
  // Lote 3: TVs (p2) + Informática (p4)
  [
    "https://www.mercadolivre.com.br/ofertas?container_id=MLB779539-1&page=2",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1648&page=4&promotion_type=lightning",
  ],
  // Lote 4: Ofertas do Dia
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1648&container_id=MLB779362-1&promotion_type=deal_of_the_day",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1051&container_id=MLB779362-1&promotion_type=deal_of_the_day",
  ],
];
```

#### `src/config/casa.ml.ts` (Novo)

```typescript
// URLs do Mercado Livre APENAS para o nicho Casa & Moda Feminina
export const casaMlUrls: string[][] = [
  // Lote 0: Casa, Móveis e Decoração (p1, p2)
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1579&page=1&promotion_type=lightning",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1579&page=2&promotion_type=lightning",
  ],
  // Lote 1: Moda Feminina (p1, p2)
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1430&page=1&promotion_type=lightning",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1430&page=2&promotion_type=lightning",
  ],
  // Lote 2: Moda Feminina (p3) + Eletrodomésticos (p1)
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1430&page=3&promotion_type=lightning",
    "https://www.mercadolivre.com.br/ofertas?category=MLB5726&page=1&promotion_type=lightning",
  ],
  // Lote 3: Eletrodomésticos (p2) + Beleza (p1)
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB5726&page=2&promotion_type=lightning",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1246&page=1&promotion_type=lightning",
  ],
  // Lote 4: Ofertas do Dia
  [
    "https://www.mercadolivre.com.br/ofertas?category=MLB1579&container_id=MLB779362-1&promotion_type=deal_of_the_day",
    "https://www.mercadolivre.com.br/ofertas?category=MLB1430&container_id=MLB779362-1&promotion_type=deal_of_the_day",
  ],
];
```

---

### 2. Modificação do `AcessWebService.ts`

**Problema**: A classe `AccesWeb` tem URLs hardcoded em `static URLs`.

**Solução**: Aceitar parâmetro `nicheFilter` no construtor para selecionar URLs corretas.

```typescript
// ANTES:
export class AccesWeb {
  private static URLs: string[][] = [ /* URLs misturadas */ ];
  
  async AcessMercadoLivre(...) { /* usa AccesWeb.URLs */ }
}

// DEPOIS:
export class AccesWeb {
  private nicheFilter: 'tech' | 'casa' | null;
  
  constructor(nicheFilter?: 'tech' | 'casa') {
    this.nicheFilter = nicheFilter ?? null;
  }
  
  private getMlUrls(): string[][] {
    if (this.nicheFilter === 'tech') return techMlUrls;
    if (this.nicheFilter === 'casa') return casaMlUrls;
    // Fallback: todas (para crawler antigo)
    return [...techMlUrls, ...casaMlUrls];
  }
  
  async AcessMercadoLivre(...) {
    const urls = this.getMlUrls();
    // ... resto do código usa 'urls' em vez de 'AccesWeb.URLs'
  }
}
```

**Observação**: A lógica de Pichau (URLs dinâmicas) continua funcionando — ela usa `this.MUrls` que agora é retornado por `getMlUrls()`.

---

### 3. Modificação do `ShopeePromosController.ts`

**Problema**: `getAllShopeeKeywordGroups()` sempre mistura todas as keywords.

**Solução**: Aceitar query param `?niche=tech|casa` nos endpoints.

```typescript
// ANTES:
async GetProducts(req: Request, res: Response) {
  const keywords = ShopeePromosController.getAllShopeeKeywordGroups();
  // ...
}

// DEPOIS:
async GetProducts(req: Request, res: Response) {
  const niche = req.query.niche as 'tech' | 'casa' | undefined;
  const keywords = ShopeePromosController.getAllShopeeKeywordGroups(niche);
  // ...
}

// Modificar getAllShopeeKeywordGroups:
private static getAllShopeeKeywordGroups(niche?: 'tech' | 'casa'): string[][] {
  const niches = getActiveNiches();
  
  if (niche === 'tech') {
    return niches.find(n => n.id === "tech")?.shopeeKeywordGroups ?? [];
  }
  if (niche === 'casa') {
    return niches.find(n => n.id === "casa-moda-feminina")?.shopeeKeywordGroups ?? [];
  }
  
  // Fallback: mistura todas (crawler antigo)
  const techGroups = niches.find(n => n.id === "tech")?.shopeeKeywordGroups ?? [];
  const casaGroups = niches.find(n => n.id === "casa-moda-feminina")?.shopeeKeywordGroups ?? [];
  // ... lógica atual de interleave
}
```

**Observação**: Pichau e Terabyte são lojas **Tech** — sempre usam `?niche=tech` (ou sem param, pois são sempre tech).

---

### 4. Crawler Tech (`src/scripts/crawler-tech.ts`)

```typescript
import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000));
const TimeBetweenRuns = 30;
const scraper = new AccesWeb('tech'); // ← Filtro Tech

async function executarRobo() {
    console.log("🤖 [Tech] Motor de monitoramento iniciado...\n");

    const tarefas: Array<() => Promise<void>> = [
        executShopeeTerabyte,    // Shopee Loja Oficial Terabyte (Tech)
        executMercadoLivre,      // ML - Categorias Tech
        executShopeeKeywords,    // Shopee Keywords Tech
        executShopeePichau,      // Shopee Loja Oficial Pichau (Tech)
        executAmazon,            // Amazon - Categorias Tech
    ];

    let indiceTarefaAtual = 0;

    while (true) {
        if (!isHorarioComercial()) {
            console.log(`😴 [Tech] Hibernação... [${new Date().toLocaleTimeString('pt-BR')}]`);
            await delay(TimeBetweenRuns);
            continue;
        }

        const tarefaDaVez = tarefas[indiceTarefaAtual];
        console.log(`\n🔔 [Tech] Tarefa ${indiceTarefaAtual + 1}/${tarefas.length}...`);
        
        await tarefaDaVez();
        
        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;
        console.log(`⏳ [Tech] Aguardando ${TimeBetweenRuns}min...`);
        await delay(TimeBetweenRuns);
    }
}

async function executShopeeKeywords() {
    try {
        console.log("🔍 [Tech/Shopee] Keywords...");
        const response = await fetch("http://localhost:3333/ofertas/shopee/products?niche=tech", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Tech/Shopee] Erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Tech/Shopee] Processado com sucesso!");
        }
    } catch (error: any) {
        console.error("❌ [Tech/Shopee] Falha:", error.message);
    }
}

async function executAmazon() {
    try {
        console.log("🌐 [Tech/Amazon] Iniciando varredura...");
        const tempoInicio = Date.now();

        await scraper.AcessAmazon((produtosParciais) => {
            console.log(`⚡ [Tech/Amazon] Lote de ${produtosParciais.length} recebido!`);
            fetch("http://localhost:3333/ofertas/amazon", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosParciais)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                    console.log(`✅ [Tech/Amazon] Lote processado!`);
                })
                .catch((err) => {
                    console.error("❌ [Tech/Amazon] Erro ao enviar:", err.message);
                });
        });

        const tempoTotal = ((Date.now() - tempoInicio) / 1000).toFixed(2);
        console.log(`⏱️ [Tech/Amazon] Finalizado em ${tempoTotal}s!`);
    } catch (error: any) {
        console.error("❌ [Tech/Amazon] Falha:", error.message);
    }
}

async function executShopeePichau() {
    try {
        console.log("🔍 [Tech/Shopee] Pichau...");
        const response = await fetch("http://localhost:3333/ofertas/shopee/pichau", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Tech/Shopee-Pichau] Erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Tech/Shopee-Pichau] Processado!");
        }
    } catch (error: any) {
        console.error("❌ [Tech/Shopee-Pichau] Falha:", error.message);
    }
}

async function executMercadoLivre() {
    try {
        console.log("🌐 [Tech/ML] Iniciando varredura...");
        const tempoInicio = Date.now();

        await scraper.AcessMercadoLivre((produtosParciais) => {
            console.log(`⚡ [Tech/ML] Lote de ${produtosParciais.length} recebido!`);
            fetch("http://localhost:3333/ofertas/mercadolivre", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosParciais)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                    console.log(`✅ [Tech/ML] Lote processado!`);
                })
                .catch((err) => {
                    console.error("❌ [Tech/ML] Erro ao enviar:", err.message);
                });
        });

        const tempoTotal = ((Date.now() - tempoInicio) / 1000).toFixed(2);
        console.log(`⏱️ [Tech/ML] Finalizado em ${tempoTotal}s!`);
    } catch (error) {
        console.error("❌ [Tech/ML] Falha:", error);
    }
}

async function executShopeeTerabyte() {
    try {
        console.log("🔍 [Tech/Shopee] Terabyte...");
        const response = await fetch("http://localhost:3333/ofertas/shopee/terabyte", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Tech/Shopee-Terabyte] Erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Tech/Shopee-Terabyte] Processado!");
        }
    } catch (error: any) {
        console.error("❌ [Tech/Shopee-Terabyte] Falha:", error.message);
    }
}

function isHorarioComercial(): boolean {
    const hours = new Date().getHours();
    return hours >= 7;
}

executarRobo();
```

---

### 5. Crawler Casa (`src/scripts/crawler-casa.ts`)

```typescript
import { AccesWeb } from '../Services/AcessWebService.js';

const delay = (minutos: number) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000));
const TimeBetweenRuns = 30;
const scraper = new AccesWeb('casa'); // ← Filtro Casa

async function executarRobo() {
    console.log("🏠 [Casa] Motor de monitoramento iniciado...\n");

    const tarefas: Array<() => Promise<void>> = [
        executShopeeKeywords,    // Shopee Keywords Casa/Moda
        executMercadoLivre,      // ML - Categorias Casa/Moda
        // NOTA: Pichau e Terabyte são lojas Tech, NÃO usar aqui
        // NOTA: Amazon não tem categorias de Casa ainda
    ];

    let indiceTarefaAtual = 0;

    while (true) {
        if (!isHorarioComercial()) {
            console.log(`😴 [Casa] Hibernação... [${new Date().toLocaleTimeString('pt-BR')}]`);
            await delay(TimeBetweenRuns);
            continue;
        }

        const tarefaDaVez = tarefas[indiceTarefaAtual];
        console.log(`\n🔔 [Casa] Tarefa ${indiceTarefaAtual + 1}/${tarefas.length}...`);
        
        await tarefaDaVez();
        
        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;
        console.log(`⏳ [Casa] Aguardando ${TimeBetweenRuns}min...`);
        await delay(TimeBetweenRuns);
    }
}

async function executShopeeKeywords() {
    try {
        console.log("🔍 [Casa/Shopee] Keywords...");
        const response = await fetch("http://localhost:3333/ofertas/shopee/products?niche=casa", {
            method: "GET",
            headers: { "Content-type": "application/json" }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`⚠️ [Casa/Shopee] Erro: ${response.status}`, errorData);
        } else {
            console.log("✨ [Casa/Shopee] Processado com sucesso!");
        }
    } catch (error: any) {
        console.error("❌ [Casa/Shopee] Falha:", error.message);
    }
}

async function executMercadoLivre() {
    try {
        console.log("🌐 [Casa/ML] Iniciando varredura...");
        const tempoInicio = Date.now();

        await scraper.AcessMercadoLivre((produtosParciais) => {
            console.log(`⚡ [Casa/ML] Lote de ${produtosParciais.length} recebido!`);
            fetch("http://localhost:3333/ofertas/mercadolivre", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(produtosParciais)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
                    console.log(`✅ [Casa/ML] Lote processado!`);
                })
                .catch((err) => {
                    console.error("❌ [Casa/ML] Erro ao enviar:", err.message);
                });
        });

        const tempoTotal = ((Date.now() - tempoInicio) / 1000).toFixed(2);
        console.log(`⏱️ [Casa/ML] Finalizado em ${tempoTotal}s!`);
    } catch (error) {
        console.error("❌ [Casa/ML] Falha:", error);
    }
}

function isHorarioComercial(): boolean {
    const hours = new Date().getHours();
    return hours >= 7;
}

executarRobo();
```

---

### 6. Atualização do `package.json`

```json
{
  "scripts": {
    "dev": "tsx src/server.ts",
    "crawler": "tsx src/scripts/crawler.ts",
    "crawler:tech": "tsx src/scripts/crawler-tech.ts",
    "crawler:casa": "tsx src/scripts/crawler-casa.ts",
    "mercadolivre": "tsx src/scripts/mercadolivre.ts",
    "amazon": "tsx src/scripts/amazon.ts",
    "shopee": "tsx src/scripts/shopee.ts",
    "list-groups": "tsx src/scripts/list-groups.ts",
    "build": "tsc"
  }
}
```

---

## Agendamento na VPS

### Com PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar processos
pm2 start "npm run crawler:tech" --name "crawler-tech"
pm2 start "npm run crawler:casa" --name "crawler-casa"
pm2 start "npm run dev" --name "api-server"

# Salvar e configurar auto-start
pm2 save
pm2 startup
```

### Offset de 15 Minutos

| Processo | Início | Ciclo |
|----------|--------|-------|
| `crawler-tech` | :00, :30 | ML(Tech) → Amazon → Shopee(Tech) → espera 30min |
| `crawler-casa` | :15, :45 | ML(Casa) → Shopee(Casa) → espera 30min |

**Resultado**: Nunca há 2 instâncias Playwright rodando simultaneamente.

### Estimativa de Consumo de RAM

| Componente | RAM Estimada |
|------------|--------------|
| API Server (Express) | ~50MB |
| WhatsAppService (Baileys) | ~80MB |
| 1 Playwright (ML ou Amazon) | ~300-500MB |
| **Total por vez** | **~430-630MB** |
| **Pico (se sobrepor)** | **~800MB-1GB** |

Com offset de 15min, o pico é evitado.

---

## Checklist de Implementação

- [ ] Criar `src/config/tech.ml.ts`
- [ ] Criar `src/config/casa.ml.ts`
- [ ] Modificar `src/Services/AcessWebService.ts` (adicionar `nicheFilter`)
- [ ] Modificar `src/Controller/ShopeePromosController.ts` (aceitar `?niche=`)
- [ ] Criar `src/scripts/crawler-tech.ts`
- [ ] Criar `src/scripts/crawler-casa.ts`
- [ ] Atualizar `package.json` (adicionar scripts)
- [ ] Build + teste local
- [ ] Commit
- [ ] Deploy na VPS (PM2)

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Playwright crashes | Cada crawler é independente; um crash não afeta o outro |
| Shopee API rate limit | Delay de 2s entre keywords já existe; não muda |
| ML bloqueia IP | User agents rotativos já implementados |
| Amazon captcha | Detecção de captcha já existe no código |
| Memória insuficiente | Offset de 15min evita sobreposição |
| Produtos duplicados no DB | Lógica de dedup no PromosController já existe |

---

## Benefícios Esperados

1. **Memora**: Uso de ~500MB em vez de ~1GB (sem sobreposição)
2. **Manutenção**: Cada nicho independente — mudar um não afeta o outro
3. **Escalabilidade**: Fácil adicionar nicho 3 (ex: "Esportes")
4. **Debug**: Logs separados por nicho facilitam identificar problemas
5. **Flexibilidade**: Pode pausar um nicho sem parar o outro (`pm2 stop crawler-casa`)

---

## Futuras Melhorias

1. **Amazon para Casa**: Adicionar categorias de Casa/Moda no `AcessAmazon` quando disponíveis
2. **Shopee Lojas Oficiais Casa**: Criar endpoints para lojas como Electrolux, Mondial, Nike, Adidas (IDs listados em `moda-feminina.niche.ts`)
3. **Frequência configurável**: Permitir configurar `TimeBetweenRuns` por nicho via env var
4. **Dashboard de monitoramento**: Painel web mostrando status dos crawlers (running/stopped/error)
5. **Rate limiting por nicho**: Configurar delays diferentes baseado no consumo da API

---

## Análise de Redundâncias e Código Morto

Durante a revisão do código, foram identificadas **~450+ linhas** de código duplicado ou morto que podem ser limpas durante (ou após) esta implementação.

### 1. Funções Duplicadas de Filtro de Nicho (HIGH)

`productMatchesAnyNiche()` e `titleMatchesAnyNiche()` existem em **3 arquivos diferentes**:

| Local | Linhas | Descrição |
|-------|--------|-----------|
| `AcessWebService.ts` | 24-39 | Funções standalone no módulo |
| `ShopeePromosController.ts` | 57-66 | Método estático da classe |
| `NicheDispatcher.ts` | 6-19 | Implementação canônica (`dispatchProductToNiches`) |

Todas fazem a mesma coisa: verificar keywords, banwords, limitedWords, desconto e preço máximo.

**Recomendação**: Usar `NicheDispatcher.dispatchProductToNiches()` em todos os locais, verificando se o array retornado é não-vazio.

### 2. Código Morto em `SecondaryFunction.ts` (MEDIUM)

| Método | Linhas | Status |
|--------|--------|--------|
| `matchesAnyNiche()` | 51-56 | **Nunca chamado** — deletar |
| `verifyOriginalPrice()` | 57-72 | **Nunca chamado** — deletar |
| Constantes hardcoded (`keywords`, `banwords`, etc.) | 108-114 | **Nunca acessadas** — o fallback `??` nunca é alcançado porque todo caller passa `niche` |

**Recomendação**: Remover os 2 métodos mortos e as 5 constantes hardcoded (~30 linhas).

### 3. Modelo `Ofertas` no Prisma (HIGH)

```prisma
model Ofertas {
  id            String   @id @default(uuid())
  source_id     String
  title         String
  original_url  String
  converted_url String
  posted_at     DateTime @default(now())
  status        Status   @default(Pending)
}

enum Status { Pending, Posted, Failed }
```

`prisma.ofertas` é **nunca referenciado** em nenhum arquivo TypeScript.

**Recomendação**: Remover o modelo e o enum do schema, criar migration para dropar a tabela.

### 4. Métodos Duplicados no `PromosController.ts` (HIGH)

Três métodos com ~300 linhas de código quase idêntico:

| Método | Linhas | Cooldown | HTTP Response |
|--------|--------|----------|---------------|
| `processProductsML` | 84-185 | 5 dias | Sim |
| `processProductsAmazon` | 187-290 | 5 dias | Sim |
| `processProductsShopee` | 292-389 | 3 dias | Não |

A única diferença real é o nome da loja nos logs, o cooldown (3 vs 5 dias), e se retorna resposta HTTP.

**Recomendação**: Unificar em um único método privado `processProducts(products, storeName, cooldownDays, res?)`.

### 5. Métodos Duplicados no `ShopeePromosController.ts` (HIGH)

`GetPichauShop` e `GetTerabyteShop` são **95% idênticos** (~180 linhas copy-paste). A única diferença é o `shopID`.

A lógica de reduce/mapping de produtos também é duplicada 3 vezes no mesmo arquivo.

**Recomendação**: Extrair um método privado `GetShopProducts(shopID: number, page: number)`.

### 6. Utilitário `sleep` Duplicado (LOW)

| Local | Função |
|-------|--------|
| `AcessWebService.ts:19` | `HUMAN_DELAY(min, max)` |
| `ShopeePromosController.ts:406` | `sleep(ms)` |

**Recomendação**: Criar `utils/sleep.ts` compartilhado.

### 7. `getActiveNiches()` Chamado em Excesso (LOW)

Em `AcessWebService.ts`, `getActiveNiches()` é chamado dentro de `titleMatchesAnyNiche()` (linha 25) E dentro de `productMatchesAnyNiche()` (linha 33) — duas vezes por produto. Embora o resultado seja cacheado, é redundante.

**Recomendação**: Consolidar com `NicheDispatcher` (item #1) elimina esta chamada extra.

### Resumo da Limpeza

| # | Arquivo | Ação | Linhas Economizadas |
|---|---------|------|---------------------|
| 1 | `AcessWebService.ts` | Remover `titleMatchesAnyNiche` e `productMatchesAnyNiche` | ~20 |
| 2 | `secondaryFunction.ts` | Remover `matchesAnyNiche`, `verifyOriginalPrice`, constantes hardcoded | ~30 |
| 3 | `schema.prisma` | Remover modelo `Ofertas` e enum `Status` | ~15 |
| 4 | `PromosController.ts` | Unificar 3 métodos em 1 | ~200 |
| 5 | `ShopeePromosController.ts` | Unificar 2 métodos de shop em 1 + centralizar mapping | ~120 |
| 6 | `AcessWebService.ts` + `ShopeePromosController.ts` | Mover `sleep`/`HUMAN_DELAY` para `utils/` | ~5 |
| **Total** | | | **~390 linhas** |
