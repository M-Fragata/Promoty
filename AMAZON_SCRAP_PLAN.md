# Plano de Implementação - Correção do Scrap Amazon

## Contexto

O bot de scraping da Amazon possui problemas críticos que precisam ser corrigidos:
1. Detecção de CAPTCHA está quebrada (nunca detecta)
2. CAPTCHA interrompe paginação (gera próxima página mesmo sem produtos)
3. Browser fica "sujo" após CAPTCHA (afeta URLs subsequentes)
4. Grupos vazios geram páginas desnecessárias

## Problemas Identificados

### 🔴 CRÍTICO 1: Detecção de CAPTCHA quebrada

**Localização:** `backend/src/Services/AcessWebService.ts:470-484`

```typescript
// Código atual - NUNCA detecta CAPTCHA
const captcha = await page.locator('img#d')
if (captcha) { // ← Locator é sempre truthy!
    console.warn("⚠️ Captcha detectado!");
    continue;
}
```

**Problema:** `page.locator()` retorna um objeto Locator, nunca verifica se o elemento existe.

**Correção:** Usar `page.locator().count()` ou `page.$()`.

---

### 🔴 CRÍTICO 2: CAPTCHA não para o grupo

Quando CAPTCHA é detectado (hipoteticamente), o `continue` pula para a próxima URL **dentro do mesmo grupo**. Mas como o browser está "sujo", todas as URLs subsequentes também falham.

```
Grupo 0: [GPU, PlacaMae, CPU, DDR5, DDR4]
├── GPU → CAPTCHA → continue
├── PlacaMae → CAPTCHA (mesmo browser) → continue
├── CPU → CAPTCHA → continue
├── DDR5 → CAPTCHA → continue
└── DDR4 → CAPTCHA → continue
└── [Grupo termina sem produtos]
└── [Gera próxima página] ← ERRADO!
```

---

### 🔴 CRÍTICO 3: Próxima página gerada mesmo sem produtos

```typescript
// Linha 592-606 - Gera próxima página SEMPRE
if (group.length > 0) {
    const firstUrl = new URL(group[0]!);
    const currentPage = parseInt(firstUrl.searchParams.get('page') || '1');
    if (currentPage < AccesWeb.MAX_AMAZON_PAGES) {
        // Gera próxima página mesmo se grupo falhou!
        this.urlsAmazon.push(nextPageGroup);
    }
}
```

---

### 🟡 MÉDIO 4: Delay insuficiente entre grupos

3-6 segundos entre URLs pode ser pouco para many URLs sequenciais.

---

## Plano de Implementação

### Mudança 1: Corrigir detecção de CAPTCHA

**Arquivo:** `backend/src/Services/AcessWebService.ts`

**Substituir:**
```typescript
const captcha = await page.locator('img#d')
if (captcha) {
```

**Por:**
```typescript
const captchaDog = await page.locator('img#d').count();
const captchaForm = await page.locator('form[action*="validateCaptcha"]').count();
const isCaptcha = captchaDog > 0 || captchaForm > 0;

if (isCaptcha) {
```

---

### Mudança 2: Parar grupo ao detectar CAPTCHA

**Adicionar propriedade na classe:**
```typescript
private captchaRetryPending = false;
private lastCaptchaGroupIndex = -1;
```

**Substituir o bloco de CAPTCHA (linhas 470-498):**
```typescript
if (isCaptcha) {
    console.warn("⚠️ [Amazon] CAPTCHA (Cachorro) detectado! Parando grupo...");

    await TakePrintScreenService({
        page: page,
        produtosLength: 0,
        store: "Amazon",
        status: "Falha - Captcha",
        tempoExecucao: duration,
        url: URLAmazon
    });

    // Marca que precisa retry neste grupo
    this.captchaRetryPending = true;
    this.lastCaptchaGroupIndex = this.contadorAmazon;

    break; // ← Para o grupo INTEIRO, não apenas esta URL
}
```

---

### Mudança 3: Não gerar próxima página se grupo falhou

**Adicionar contador de sucesso:**
```typescript
let groupSuccessCount = 0;
// ... dentro do loop, após processar produtos:
if (productsPage.length > 0) {
    groupSuccessCount++;
    onPageScraped?.(productsPage);
    // ... TakePrintScreenService
}
```

**Substituir geração de próxima página (linhas 592-606):**
```typescript
// Só gera próxima página se grupo teve sucesso
if (groupSuccessCount > 0 && group.length > 0) {
    const firstUrl = new URL(group[0]!);
    const currentPage = parseInt(firstUrl.searchParams.get('page') || '1');

    if (currentPage < AccesWeb.MAX_AMAZON_PAGES) {
        const nextPageGroup = group.map(url => {
            const obj = new URL(url);
            obj.searchParams.set('page', (currentPage + 1).toString());
            return obj.toString();
        });
        this.urlsAmazon.push(nextPageGroup);
        console.log(`📄 [Amazon] Grupo page ${currentPage + 1} adicionado à fila.`);
    }
} else if (groupSuccessCount === 0) {
    console.log(`🛑 [Amazon] Grupo sem produtos. Próxima página não gerada.`);
}
```

---

### Mudança 4: Retry de grupo com CAPTCHA

**No início de `AcessAmazon()`, verificar se precisa retry:**
```typescript
// Verifica se precisa retry de grupo com CAPTCHA
if (this.captchaRetryPending && this.lastCaptchaGroupIndex === this.contadorAmazon) {
    console.log(`🔄 [Amazon] Retry do grupo ${this.contadorAmazon} (CAPTCHA anterior)...`);
    this.captchaRetryPending = false;
    // Continua normalmente - browser novo será aberto
}
```

**No bloco de CAPTCHA, decidir se pula grupo:**
```typescript
// Se já é retry e ainda tem CAPTCHA, pula grupo
if (this.captchaRetryPending && this.lastCaptchaGroupIndex === this.contadorAmazon) {
    console.warn(`⚠️ [Amazon] CAPTCHA persistente no grupo ${this.contadorAmazon}. Pulando...`);
    this.captchaRetryPending = false;
    this.contadorAmazon++;
    break;
}
```

---

### Mudança 5: Delay entre grupos

**Antes de gerar próxima página:**
```typescript
// Delay entre grupos (apenas se não teve CAPTCHA)
if (!this.captchaRetryPending) {
    const delayBetweenGroups = 10000 + Math.random() * 10000; // 10-20s
    console.log(`⏳ [Amazon] Aguardando ${(delayBetweenGroups / 1000).toFixed(0)}s antes do próximo grupo...`);
    await new Promise(resolve => setTimeout(resolve, delayBetweenGroups));
}
```

---

## Fluxo Final com Soluções

### Cenário 1: CAPTCHA na primeira tentativa

```
Execução 1:
├── contadorAmazon = 0
├── Grupo 0: [GPU, PlacaMae, CPU, DDR5, DDR4]
│   ├── GPU → CAPTCHA detectado!
│   ├── break (para grupo)
│   ├── captchaRetryPending = true
│   ├── lastCaptchaGroupIndex = 0
│   └── NÃO gera próxima página
├── Browser fecha
├── contadorAmazon NÃO incrementa (fica em 0)
│
Execução 2 (30 min depois):
├── contadorAmazon = 0
├── Verifica: captchaRetryPending && lastCaptchaGroupIndex === 0
├── Log: "Retry do grupo 0"
├── captchaRetryPending = false
├── Grupo 0: [GPU, PlacaMae, CPU, DDR5, DDR4]
│   ├── GPU → OK ✅
│   ├── PlacaMae → OK ✅
│   ├── CPU → OK ✅
│   ├── DDR5 → OK ✅
│   └── DDR4 → OK ✅
│   ├── groupSuccessCount = 5
│   ├── Gera Grupo 1 (page=2) ✅
│   └── contadorAmazon++ → 1
```

### Cenário 2: CAPTCHA persistente

```
Execução 1:
├── Grupo 0 → CAPTCHA → retry pending
│
Execução 2 (30 min depois):
├── Retry Grupo 0 → CAPTCHA de novo!
├── Log: "CAPTCHA persistente. Pulando grupo."
├── captchaRetryPending = false
├── contadorAmazon++ → 1
├── Próxima execução processa Grupo 1
```

### Cenário 3: Grupo sem produtos

```
Execução 1:
├── Grupo 3: [Monitores]
│   ├── Monitores → 0 produtos (filtros não match)
│   ├── groupSuccessCount = 0
│   ├── NÃO gera próxima página
│   ├── Log: "Grupo sem produtos. Próxima página não gerada."
│   └── contadorAmazon++ → 4
```

---

## Arquivos Alterados

| Arquivo | Mudanças |
|---------|----------|
| `backend/src/Services/AcessWebService.ts` | Correção CAPTCHA, retry, delay, group success check |

---

## Resumo das Mudanças

| # | Mudança | Tipo |
|---|---------|------|
| 1 | Corrigir detecção de CAPTCHA (`locator().count()`) | Fix |
| 2 | Parar grupo ao detectar CAPTCHA (`break`) | Fix |
| 3 | Adicionar flag `captchaRetryPending` | Feature |
| 4 | Retry de grupo com CAPTCHA no próximo ciclo | Feature |
| 5 | Não gerar próxima página se grupo falhou | Fix |
| 6 | Delay de 10-20s entre grupos | Feature |
| 7 | Pular grupo se CAPTCHA persistir após retry | Feature |

---

## Testes

1. **Teste CAPTCHA:** Executar scraper em horário de pico, verificar se CAPTCHA é detectado
2. **Teste Retry:** Após CAPTCHA, verificar se grupo é retentado no próximo ciclo
3. **Teste Persistência:** Simular CAPTCHA persistente, verificar se grupo é pulado
4. **Teste Grupo Vazio:** Criar grupo com URLs que não retornam produtos, verificar se próxima página não é gerada
5. **Teste Delay:** Verificar delay entre grupos nos logs
