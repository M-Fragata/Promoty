# Plano de Implementação - Crawler Lock com Arquivo Compartilhado

## Contexto

O Promoty possui dois crawlers que rodam em loop contínuo:
- **crawler-tech**: 5 tasks (Shopee Terabyte, ML, Shopee Keywords, Shopee Pichau, Amazon)
- **crawler-casa**: 3 tasks (Shopee Keywords, ML, Amazon)

**Problema:** Se ambos iniciam ao mesmo tempo, dois navegadores Playwright rodam simultaneamente, consumindo ~600MB-1GB de RAM e riscando detecção de bot.

**Solução:** Mecanismo de lock via arquivo compartilhado que garante que apenas um crawler executa por vez.

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
:00:00 - Tech verifica lock → LIVRE → cria lock → inicia Shopee Terabyte
:00:15 - Casa verifica lock → OCUPADO → aguarda (polling a cada 30s)
:00:35 - Tech finaliza Shopee → deleta lock
:00:35 - Casa verifica lock → LIVRE → cria lock → inicia Shopee Keywords
:01:00 - Casa finaliza Shopee → deleta lock
:01:30 - Tech verifica lock → LIVRE → cria lock → inicia ML
...
```

---

## Arquivos a Criar/Modificar

### 1. CRIAR: `src/utils/crawlerLock.ts`

Módulo responsável pelo gerenciamento do lock.

**Importante:** Utiliza `fs.openSync` com flag `wx` (exclusive create) para resolver race conditions. Esta operação é atômica no nível do sistema operacional - se dois processos tentarem criar o arquivo ao mesmo tempo, apenas um terá sucesso.

```typescript
import fs from 'fs';

const LOCK_FILE = '/tmp/crawler.lock';
const LOCK_TIMEOUT = 10 * 60 * 1000; // 10 minutos (timeout de segurança)

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
            
            // Se lock expirou (>10min), remove
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
    
    // Remove o lock
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
| Após task | Adicionar `unlock()` no bloco `finally` |

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
        // SEMPRE libera o lock, mesmo se der erro
        CrawlerLock.unlock();
    }

    console.log(`⏳ [Tech] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos...`);
    await delay(TimeBetweenRuns);
}
```

---

### 3. MODIFICAR: `src/scripts/crawler-casa.ts`

Mesmas alterações do Tech.

#### Mudanças necessárias:

| Local | Mudança |
|-------|---------|
| Imports | Adicionar `import { CrawlerLock } from '../utils/crawlerLock.js';` |
| Loop principal | Adicionar `waitForUnlock()` + `lock()` antes da task |
| Após task | Adicionar `unlock()` no bloco `finally` |

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
        // SEMPRE libera o lock
        CrawlerLock.unlock();
    }

    console.log(`⏳ [Casa] Tarefa concluída. Aguardando ${TimeBetweenRuns} minutos...`);
    await delay(TimeBetweenRuns);
}
```

---

## Mecanismos de Segurança

### 1. Lock Timeout (10 minutos)

Se um processo crashar sem liberar o lock, ele expira automaticamente após 10 minutos.

```typescript
const LOCK_TIMEOUT = 10 * 60 * 1000; // 10 minutos

if (age > LOCK_TIMEOUT) {
    console.warn(`⚠️ Lock expirado. Removendo...`);
    fs.unlinkSync(LOCK_FILE);
}
```

### 2. Try/Finally

Garante que o lock é liberado mesmo se ocorrer erro.

```typescript
CrawlerLock.lock();
try {
    await tarefa();
} finally {
    CrawlerLock.unlock(); // SEMPRE executa
}
```

### 3. Verificação de PID

Apenas o processo que criou o lock pode removê-lo.

```typescript
static unlock(): void {
    const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
    if (lockData.pid === process.pid) {
        fs.unlinkSync(LOCK_FILE);
    }
}
```

### 4. Polling Seguro

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
10:00:00 - Tech verifica lock → LIVRE → cria lock
10:00:01 - Tech executa Shopee Terabyte
10:00:35 - Casa verifica lock → OCUPADO → aguarda
10:05:00 - Tech finaliza → deleta lock
10:05:01 - Casa verifica lock → LIVRE → cria lock
10:05:02 - Casa executa Shopee Keywords
10:10:00 - Casa finaliza → deleta lock
```

### Cenário 2: Processo Crasha

```
10:00:00 - Tech cria lock
10:00:01 - Tech crasha (não deleta lock)
10:00:35 - Casa verifica lock → OCUPADO → aguarda
10:10:01 - Lock expira (>10min) → Casa pode rodar
```

### Cenário 3: Manutenção

```bash
# Parar Casa para manutenção
pm2 stop crawler-casa

# Tech continua funcionando normalmente
# Casa não tenta rodar (processo parado)
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
| `src/utils/crawlerLock.ts` | **CRIAR** | ~70 linhas |
| `src/scripts/crawler-tech.ts` | **MODIFICAR** | ~10 linhas |
| `src/scripts/crawler-casa.ts` | **MODIFICAR** | ~10 linhas |

**Total:** 1 arquivo novo + 2 arquivos modificados

---

## Checklist de Implementação

- [ ] Criar `src/utils/crawlerLock.ts`
- [ ] Modificar `src/scripts/crawler-tech.ts` (adicionar imports + lock)
- [ ] Modificar `src/scripts/crawler-casa.ts` (adicionar imports + lock)
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
| ✅ **Segurança** | Timeout evita locks para sempre |
| ✅ **Simplicidade** | Poucas mudanças no código |
| ✅ **Robustez** | Try/finally garante liberação |
| ✅ **Race condition resolvido** | Flag `wx` garante criação atômica |

---

## Desvantagens e Mitigações

| Desvantagem | Mitigação |
|-------------|-----------|
| **Complexidade adicional** | Apenas 1 arquivo novo (~70 linhas) |
| **Dependência do sistema de arquivos** | `/tmp/` é padrão em Linux/Mac; alternativa para Windows: `os.tmpdir()` |
| **Não escala para múltiplos servidores** | Para escala futura, usar Redis ou DB para lock distribuído |
| **Debug mais difícil** | Logs claros em cada operação de lock |
| **Delay de 0-30s antes de cada task** | Polling a cada 30s é aceitável para este caso |
| **Race condition** | ✅ **RESOLVIDO** com flag `wx` (operação atômica) |
