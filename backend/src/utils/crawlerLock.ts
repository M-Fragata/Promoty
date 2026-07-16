import fs from 'fs';
import path from 'path';

// Em ESM, __dirname não existe - usar import.meta.dirname (Node.js 21+)
const LOCK_FILE = path.join(import.meta.dirname, '..', '..', 'tmp', 'crawler.lock');
const LOCK_TIMEOUT = 20 * 60 * 1000;  // 20 minutos (15min cooldown + 5min buffer)

interface LockData {
    pid: number;
    timestamp: number;
    script: string;
}

export class CrawlerLock {

    private static isLockValid(): boolean {
        try {
            if (!fs.existsSync(LOCK_FILE)) return false;

            const lockData: LockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
            const age = Date.now() - lockData.timestamp;

            if (age > LOCK_TIMEOUT) {
                console.warn(`⚠️ Lock expirado (${Math.round(age / 60000)}min). Removendo...`);
                fs.unlinkSync(LOCK_FILE);
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    static async waitForUnlock(): Promise<void> {
        while (this.isLockValid()) {
            const lockData: LockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
            const age = Math.round((Date.now() - lockData.timestamp) / 1000);
            console.log(`🔒 Lock ativo (PID: ${lockData.pid}, ${age}s). Aguardando 30s...`);
            await new Promise(r => setTimeout(r, 30000));
        }
    }

    static lock(): boolean {
        try {
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
            if (err.code === 'EEXIST') {
                return false;
            }
            throw err;
        }
    }

    static async unlockWithDelay(cooldownMinutes: number = 15): Promise<void> {
        console.log(`⏳ Cooldown de ${cooldownMinutes}min iniciado. Lock mantido...`);
        await new Promise(r => setTimeout(r, cooldownMinutes * 60 * 1000));
        this.unlock();
        console.log(`🔓 Cooldown finalizado. Lock liberado.`);
    }

    static unlock(): void {
        try {
            if (fs.existsSync(LOCK_FILE)) {
                const lockData: LockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
                if (lockData.pid === process.pid) {
                    fs.unlinkSync(LOCK_FILE);
                    console.log(`🔓 Lock removido (PID: ${process.pid})`);
                }
            }
        } catch (err) {
            console.error(`❌ Erro ao remover lock:`, err);
        }
    }

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
