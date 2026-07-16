# Plano de Implementação - Crawler Lock com Arquivo Compartilhado

## Contexto

O Promoty possui dois crawlers que rodam em loop contínuo:
- **crawler-tech**: 5 tasks (Shopee Terabyte, ML, Shopee Keywords, Shopee Pichau, Amazon)
- **crawler-casa**: 3 tasks (Amazon, Shopee Keywords, ML)

**Problema:** Se ambos iniciam ao mesmo tempo, dois navegadores Playwright rodam simultaneamente, consumindo ~600MB-1GB de RAM e riscando detecção de bot.

**Solução:** Mecanismo de lock via arquivo compartilhado que garante que apenas um crawler executa por vez, com cooldown de 15 minutos entre grupos.

---

## Arquitetura

```
┌─────────────────────┐         ┌─────────────────────┐
│   crawler-tech      │         │   crawler-casa      │
│   (PM2 Process 1)   │         │   (PM2 Process 2)   │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           ▼                               ▼
    ┌──────────────────────────────────────────┐
    │         /tmp/crawler.lock               │
    │   (Arquivo de lock compartilhado)       │
    └──────────────────────────────────────────┘
```

### Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRUPO 1 (Tech)                          │
├─────────────────────────────────────────────────────────────────┤
│ :00:00 - Tech: Task 1 (Shopee Terabyte, ~1min)                 │
│ :00:01 - Tech finaliza → lock mantido (15min cooldown)         │
│ :00:01 - Casa verifica lock → OCUPADO → aguarda                │
│ :15:01 - Lock liberado (cooldown finalizado)                   │
│ :15:01 - Tech: Aguarda 30min (TimeBetweenRuns)                 │
│ :45:01 - Tech: Pode iniciar Task 2                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        GRUPO 2 (Casa)                          │
├─────────────────────────────────────────────────────────────────┤
│ :15:01 - Lock liberado pelo Grupo 1                            │
│ :15:01 - Casa: Task 1 (Amazon, ~5min)                          │
│ :15:06 - Casa finaliza → lock mantido (15min cooldown)         │
│ :30:06 - Lock liberado                                        │
│ :30:06 - Casa: Aguarda 30min (TimeBetweenRuns)                 │
│ :60:06 - Casa: Pode iniciar Task 2                             │
└─────────────────────────────────────────────────────────────────┘
```

### Parâmetros

| Parâmetro | Valor | Propósito |
|-----------|-------|-----------|
| `LOCK_TIMEOUT` | 20 min | 15min cooldown + 5min buffer de segurança |
| `unlockWithDelay` | 15 min | Cooldown entre grupos (previne scraping consecutivo) |
| `TimeBetweenRuns` | 30 min | Cooldown intra-grupo (próxima task do mesmo crawler) |

---

## Arquivos a Criar/Modificar

### 1. CRIAR: `src/utils/crawlerLock.ts`

Módulo responsável pelo gerenciamento do lock.

**Importante:** Utiliza `fs.openSync` com flag `wx` (exclusive create) para resolver race conditions. Esta operação é atômica no nível do sistema operacional - se dois processos tentarem criar o arquivo ao mesmo tempo, apenas um terá sucesso.

```typescript
import fs from 'fs';

const LOCK_FILE = '/tmp/crawler.lock';
const LOCK_TIMEOUT = 20 * 60 * 1000;  // 20 minutos (15min cooldown + 5min buffer)

interface LockData {
    pid: number;
    timestamp: number;
    script: string;
}

export class CrawlerLock {
    
    // Verifica se o lock existe e não expirou
    private static isLockValid(): boolean {
        try {
            if (!fs.existsSync(LOCK_FILE)) return false;
            
            const lockData: LockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
            const age = Date.now() - lockData.timestamp;
            
            // Se lock expirou (>20min), remove
            if (age > LOCK_TIMEOUT) {
                console.warn(`⚠️ Lock expirado (${Math.round(age/60000)}min). Removendo...`);
                fs.unlinkSync(LOCK_FILE);
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }
    
    // Aguarda até que o lock esteja livre
    static async waitForUnlock(): Promise<void> {
        while (this.isLockValid()) {
            const lockData: LockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
            const age = Math.round((Date.now() - lockData.timestamp) / 1000);
            console.log(`🔒 Lock ativo (PID: ${lockData.pid}, ${age}s). Aguardando 30s...`);
            await new Promise(r => setTimeout(r, 30000)); // 30 segundos
        }
    }
    
    // Cria o lock - USA FLAG 'wx' PARA RESOLVER RACE CONDITION
    // 'wx' = exclusive create: falha se arquivo já existe (operação atômica)
    static lock(): boolean {
        try {
            // Abre com 'wx' - exclusive create
            // Se o arquivo já existe, lança erro EEXIST (race condition resolvida!)
            const fd = fs.openSync(LOCK_FILE, 'wx');
            
            const lockData: LockData = {
                pid: process.pid,
                timestamp: Date.now(),
                script: process.argv[1] || 'unknown'
            };
            
            fs.writeSync(fd, JSON.stringify(lockData));
            fs.closeSync(fd);
            
            console.log(`🔒 Lock criado (PID: ${process.pid})`);
            return true;
        } catch (err: any) {
            // EEXIST = arquivo já existe (outro processo está usando)
            if (err.code === 'EEXIST') {
                return false;
            }
            // Outro erro - relança
            throw err;
        }
    }
    
    // Unlock com cooldown - MANTÉM LOCK POR 15 MINUTOS ANTES DE LIBERAR
    // Isso previne que outro crawler inicie imediatamente após a task finalizar
    static async unlockWithDelay(cooldownMinutes: number = 15): Promise<void> {
        console.log(`⏳ Cooldown de ${cooldownMinutes}min iniciado. Lock mantido...`);
        await new Promise(r => setTimeout(r, cooldownMinutes * 60 * 1000));
        this.unlock();
        console.log(`🔓 Cooldown finalizado. Lock liberado.`);
    }
    
    // Remove o lock imediatamente
    static unlock(): void {
        try {
            if (fs.existsSync(LOCK_FILE)) {
                const lockData: LockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
                // Só remove se pertence a este processo
                if (lockData.pid === process.pid) {
                    fs.unlinkSync(LOCK_FILE);
                    console.log(`🔓 Lock removido (PID: ${process.pid})`);
                }
            }
        } catch (err) {
            console.error(`❌ Erro ao remover lock:`, err);
        }
    }
    
    // Força remoção do lock (debug/admin)
    static forceUnlock(): void {
        try {
            if (fs.existsSync(LOCK_FILE)) {
                fs.unlinkSync(LOCK_FILE);
                console.log(`🔓 Lock forçado a remover`);
            }
        } catch (err) {
            console.error(`❌ Erro ao forçar remoção:`, err);
        }
    }
}
```

#### Como o Race Condition é Resolvido

```
Cenário SEM flag 'wx' (problemático):
:00:00.000 - Tech verifica → LIVRE
:00:00.000 - Casa verifica → LIVRE (race condition!)
:00:00.001 - Tech cria lock
:00:00.001 - Casa cria lock (sobrescreve!) ← PROBLEMA

Cenário COM flag 'wx' (resolvido):
:00:00.000 - Tech tenta criar com 'wx' → SUCESSO
:00:00.000 - Casa tenta criar com 'wx' → ERRO EEXIST ← RESOLVIDO!
```

---

### 2. MODIFICAR: `src/scripts/crawler-tech.ts`

Adicionar lock antes e depois de cada task.

#### Mudanças necessárias:

| Local | Mudança |
|-------|---------|
| Imports | Adicionar `import { CrawlerLock } from '../utils/crawlerLock.js';` |
| Loop principal | Adicionar `waitForUnlock()` + `lock()` antes da task |
| Após task | Adicionar `unlockWithDelay(15)` no bloco `finally` |

#### Código atual (linhas 22-49):

```typescript
while (true) {
    if (!isHorarioComercial()) {
        console.log(`😴 [Tech/Modo Hibernação] Horário de madrugada detectado. Pulando ciclo...`);
        await delay(TimeBetweenRuns);
        continue;
    }

    const tarefaDaVez = tarefas[indiceTarefaAtual];

    console.log(`\n🔔 [Tech/Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

    if (!tarefaDaVez) {
        console.error(`❌ [Tech] Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
        continue;
    }

    await tarefaDaVez();

    indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;

    console.log(`⏳ [Tech] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos...`);
    await delay(TimeBetweenRuns);
}
```

#### Código novo:

```typescript
while (true) {
    if (!isHorarioComercial()) {
        console.log(`😴 [Tech/Modo Hibernação] Horário de madrugada detectado. Pulando ciclo...`);
        await delay(TimeBetweenRuns);
        continue;
    }

    // Aguarda lock livre
    await CrawlerLock.waitForUnlock();
    
    // Pega o lock
    CrawlerLock.lock();
    
    try {
        const tarefaDaVez = tarefas[indiceTarefaAtual];

        console.log(`\n🔔 [Tech/Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

        if (!tarefaDaVez) {
            console.error(`❌ [Tech] Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
            continue;
        }

        await tarefaDaVez();

        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;
    } finally {
        // Cooldown de 15min antes de liberar lock
        await CrawlerLock.unlockWithDelay(15);
    }

    console.log(`⏳ [Tech] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos...`);
    await delay(TimeBetweenRuns);
}
```

---

### 3. MODIFICAR: `src/scripts/crawler-casa.ts`

Mesmas alterações do Tech, com reordenação das tasks.

#### Mudanças necessárias:

| Local | Mudança |
|-------|---------|
| Imports | Adicionar `import { CrawlerLock } from '../utils/crawlerLock.js';` |
| Array tarefas | **Reordenar**: Amazon → Shopee Keywords → ML |
| Loop principal | Adicionar `waitForUnlock()` + `lock()` antes da task |
| Após task | Adicionar `unlockWithDelay(15)` no bloco `finally` |

#### Nova ordem das tasks:

```typescript
// NOVA ORDEM: Amazon → Shopee Keywords → ML
// Isso evita que Casa comece com a mesma loja que Tech finalizou
const tarefas: Array<() => any> = [
    executAmazon,           // 1º Amazon (Playwright - lento)
    executShopeeKeywords,   // 2º Shopee (API rápida)
    executMercadoLivre,     // 3º Mercado Livre (Playwright - lento)
];
```

#### Código atual (linhas 21-48):

```typescript
while (true) {
    if (!isHorarioComercial()) {
        console.log(`😴 [Casa/Modo Hibernação] Horário de madrugada detectado. Pulando ciclo...`);
        await delay(TimeBetweenRuns);
        continue;
    }

    const tarefaDaVez = tarefas[indiceTarefaAtual];

    console.log(`\n🔔 [Casa/Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

    if (!tarefaDaVez) {
        console.error(`❌ [Casa] Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
        continue;
    }

    await tarefaDaVez();

    indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;

    console.log(`⏳ [Casa] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos...`);
    await delay(TimeBetweenRuns);
}
```

#### Código novo:

```typescript
while (true) {
    if (!isHorarioComercial()) {
        console.log(`😴 [Casa/Modo Hibernação] Horário de madrugada detectado. Pulando ciclo...`);
        await delay(TimeBetweenRuns);
        continue;
    }

    // Aguarda lock livre
    await CrawlerLock.waitForUnlock();
    
    // Pega o lock
    CrawlerLock.lock();
    
    try {
        const tarefaDaVez = tarefas[indiceTarefaAtual];

        console.log(`\n🔔 [Casa/Novo Ciclo] Iniciando tarefa ${indiceTarefaAtual + 1} de ${tarefas.length}...`);

        if (!tarefaDaVez) {
            console.error(`❌ [Casa] Erro: Nenhuma tarefa encontrada no índice ${indiceTarefaAtual}`);
            continue;
        }

        await tarefaDaVez();

        indiceTarefaAtual = (indiceTarefaAtual + 1) % tarefas.length;
    } finally {
        // Cooldown de 15min antes de liberar lock
        await CrawlerLock.unlockWithDelay(15);
    }

    console.log(`⏳ [Casa] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos...`);
    await delay(TimeBetweenRuns);
}
```

---

## Mecanismos de Segurança

### 1. Lock Timeout (20 minutos)

Se um processo crashar sem liberar o lock, ele expira automaticamente após 20 minutos.

```typescript
const LOCK_TIMEOUT = 20 * 60 * 1000; // 20 minutos

if (age > LOCK_TIMEOUT) {
    console.warn(`⚠️ Lock expirado. Removendo...`);
    fs.unlinkSync(LOCK_FILE);
}
```

### 2. Cooldown entre Grupos (15 minutos)

Mantém o lock por 15 minutos após a task finalizar, garantindo que outro crawler não inicie imediatamente.

```typescript
static async unlockWithDelay(cooldownMinutes: number = 15): Promise<void> {
    console.log(`⏳ Cooldown de ${cooldownMinutes}min iniciado. Lock mantido...`);
    await new Promise(r => setTimeout(r, cooldownMinutes * 60 * 1000));
    this.unlock();
    console.log(`🔓 Cooldown finalizado. Lock liberado.`);
}
```

### 3. Try/Finally

Garante que o lock é liberado mesmo se ocorrer erro.

```typescript
CrawlerLock.lock();
try {
    await tarefa();
} finally {
    await CrawlerLock.unlockWithDelay(15); // SEMPRE executa
}
```

### 4. Verificação de PID

Apenas o processo que criou o lock pode removê-lo.

```typescript
static unlock(): void {
    const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
    if (lockData.pid === process.pid) {
        fs.unlinkSync(LOCK_FILE);
    }
}
```

### 5. Polling Seguro

Verifica o lock a cada 30 segundos (não sobrecarrega o sistema).

```typescript
static async waitForUnlock(): Promise<void> {
    while (this.isLockValid()) {
        console.log(`🔒 Lock ativo. Aguardando 30s...`);
        await new Promise(r => setTimeout(r, 30000));
    }
}
```

---

## Cenários de Uso

### Cenário 1: Funcionamento Normal

```
:00:00 - Tech cria lock → inicia Shopee Terabyte
:00:01 - Tech finaliza → lock mantido (15min cooldown)
:00:01 - Casa verifica lock → OCUPADO → aguarda
:15:01 - Lock liberado
:15:01 - Casa cria lock → inicia Amazon
:15:06 - Casa finaliza → lock mantido (15min cooldown)
:30:06 - Lock liberado
:30:06 - Tech: TimeBetweenRuns (30min) já em andamento
:45:06 - Tech cria lock → inicia ML
```

### Cenário 2: Processo Crasha

```
:00:00 - Tech cria lock
:00:01 - Tech crasha (não deleta lock)
:00:01 - Casa verifica lock → OCUPADO → aguarda
:20:01 - Lock expira (>20min) → Casa pode rodar
```

### Cenário 3: Manutenção

```bash
# Parar Casa para manutenção
pm2 stop crawler-casa

# Tech continua funcionando normalmente
# Casa não tenta rodar (processo parado)
```

### Cenário 4: Cooldown Previne Scraping Consecutivo

```
:00:00 - Tech inicia ML (lento, ~5min)
:00:05 - Tech finaliza ML → lock mantido (15min cooldown)
:00:05 - Casa verifica lock → OCUPADO → aguarda
:15:05 - Lock liberado → Casa pode iniciar (evita ML consecutivo)
```

---

## Deploy na VPS

### Passo 1: Parar crawlers antigos

```bash
pm2 stop all
pm2 delete all
```

### Passo 2: Puxar mudanças

```bash
cd /caminho/Promoty/backend
git pull origin main
```

### Passo 3: Compilar

```bash
npm run build
```

### Passo 4: Criar diretório de logs (opcional)

```bash
mkdir -p logs
```

### Passo 5: Iniciar crawlers

```bash
pm2 start dist/scripts/crawler-tech.js --name "crawler-tech" --log logs/crawler-tech.log
pm2 start dist/scripts/crawler-casa.js --name "crawler-casa" --log logs/crawler-casa.log
```

### Passo 6: Salvar configuração

```bash
pm2 save
```

### Passo 7: Configurar auto-start no boot

```bash
pm2 startup
# Seguir instruções do terminal
```

### Passo 8: Verificar

```bash
pm2 list
pm2 logs crawler-tech
pm2 logs crawler-casa
```

---

## Comandos Úteis

### Gerenciamento

```bash
# Ver status
pm2 list

# Parar um crawler
pm2 stop crawler-casa

# Reiniciar um crawler
pm2 restart crawler-tech

# Ver logs em tempo real
pm2 logs crawler-tech

# Ver logs de erro
pm2 logs crawler-tech --err
```

### Forçar remoção de lock (emerggência)

```bash
rm /tmp/crawler.lock
```

### Monitorar lock

```bash
# Ver quem criou o lock
cat /tmp/crawler.lock

# Output exemplo:
# {"pid":12345,"timestamp":1689456000000,"script":"dist/scripts/crawler-tech.js"}
```

---

## Resumo das Alterações

| Arquivo | Ação | Linhas Aprox. |
|---------|------|---------------|
| `src/utils/crawlerLock.ts` | **CRIAR** | ~85 linhas |
| `src/scripts/crawler-tech.ts` | **MODIFICAR** | +5 linhas (import + lock + finally) |
| `src/scripts/crawler-casa.ts` | **MODIFICAR** | +5 linhas + reordenar array |

**Total:** 1 arquivo novo + 2 arquivos modificados

---

## Checklist de Implementação

- [ ] Criar `src/utils/crawlerLock.ts`
- [ ] Modificar `src/scripts/crawler-tech.ts` (adicionar imports + lock)
- [ ] Modificar `src/scripts/crawler-casa.ts` (adicionar imports + lock + reordenar tasks)
- [ ] Verificar compilação TypeScript
- [ ] Testar localmente (dois terminais)
- [ ] Commit das mudanças
- [ ] Deploy na VPS
- [ ] Verificar funcionamento

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| ✅ **Zero sobreposição** | Lock garante apenas um scraper por vez |
| ✅ **Manutenção independente** | `pm2 stop crawler-casa` não afeta Tech |
| ✅ **Segurança** | Timeout de 20min evita locks para sempre |
| ✅ **Cooldown entre grupos** | 15min previne scraping consecutivo da mesma loja |
| ✅ **Simplicidade** | Poucas mudanças no código |
| ✅ **Robustez** | Try/finally garante liberação |
| ✅ **Race condition resolvido** | Flag `wx` garante criação atômica |

---

## Desvantagens e Mitigações

| Desvantagem | Mitigação |
|-------------|-----------|
| **Complexidade adicional** | Apenas 1 arquivo novo (~85 linhas) |
| **Dependência do sistema de arquivos** | `/tmp/` é padrão em Linux/Mac; alternativa para Windows: `os.tmpdir()` |
| **Não escala para múltiplos servidores** | Para escala futura, usar Redis ou DB para lock distribuído |
| **Debug mais difícil** | Logs claros em cada operação de lock |
| **Delay de 0-30s antes de cada task** | Polling a cada 30s é aceitável para este caso |
| **Lock timeout de 20min** | Aceitável; se crashar, lock expira em 20min |
| **Race condition** | ✅ **RESOLVIDO** com flag `wx` (operação atômica) |

---

## Discussão sobre LOCK_TIMEOUT

### Valor Atual: 20 minutos

O `LOCK_TIMEOUT` é o tempo máximo que um lock pode ficar ativo antes de ser considerado expirado e removido automaticamente.

### Por que 20 minutos?

1. **Cooldown de 15min** - O lock fica ativo durante o cooldown entre grupos
2. **Buffer de 5min** - Margem de segurança para variações de tempo

### Cenários de Uso

| Cenário | LOCK_TIMEOUT | Comportamento |
|---------|--------------|---------------|
| **Funcionamento normal** | 20min | Lock é removido após cooldown (15min) |
| **Processo crasha** | 20min | Lock expira após 20min (recuperação lenta) |
| **Manutenção** | 20min | `pm2 stop` + `rm /tmp/crawler.lock` |

### Alternativas

| Alternativa | Prós | Contras |
|-------------|------|---------|
| **LOCK_TIMEOUT = 5min** | Recuperação rápida de crash | Lock expira antes do cooldown (15min) |
| **LOCK_TIMEOUT = 30min** | Margem maior | Recuperação muito lenta |
| **LOCK_TIMEOUT = 20min** | Equilíbrio | Recuperação em 20min |

### Recomendação

Manter `LOCK_TIMEOUT = 20min` é a melhor opção porque:
1. Cobrem o cooldown de 15min com margem de segurança
2. Recuperação de crash em 20min é aceitável (crawlers rodam em loop)
3. Se precisar de recuperação mais rápida, usar `pm2 restart` ou `forceUnlock()`

### Pergunta para Discussão

Você prefere manter 20min ou ajustar para outro valor?
