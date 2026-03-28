import { logger } from '../utils/logger';
interface KeyStatus { key: string; failures: number; lastUsed: number; cooldownUntil: number; totalRequests: number; }
class KeyRotator {
  private keys: KeyStatus[] = [];
  private currentIndex = 0;
  private readonly MAX_FAILURES = 3;
  private readonly COOLDOWN_MS = 60_000;
  constructor() {
    const rawKeys = [process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3, process.env.GROQ_API_KEY_4, process.env.GROQ_API_KEY_5].filter(Boolean) as string[];
    if (rawKeys.length === 0) { logger.error('❌ No GROQ API keys found'); process.exit(1); }
    this.keys = rawKeys.map(key => ({ key, failures: 0, lastUsed: 0, cooldownUntil: 0, totalRequests: 0 }));
    logger.info(`✅ KeyRotator loaded ${this.keys.length} Groq key(s)`);
  }
  getKey(): string {
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const k = this.keys[idx];
      if (k.cooldownUntil > now) continue;
      if (k.failures >= this.MAX_FAILURES) { if (now > k.cooldownUntil + this.COOLDOWN_MS) { k.failures = 0; k.cooldownUntil = 0; } else continue; }
      this.currentIndex = (idx + 1) % this.keys.length;
      k.lastUsed = now; k.totalRequests++;
      return k.key;
    }
    this.keys.forEach(k => { k.failures = 0; k.cooldownUntil = 0; });
    return this.keys[0].key;
  }
  reportFailure(key: string): void { const k = this.keys.find(x => x.key === key); if (!k) return; k.failures++; if (k.failures >= this.MAX_FAILURES) k.cooldownUntil = Date.now() + this.COOLDOWN_MS; }
  reportSuccess(key: string): void { const k = this.keys.find(x => x.key === key); if (k && k.failures > 0) k.failures--; }
  getStats() { const now = Date.now(); return this.keys.map(k => ({ keyHint: `...${k.key.slice(-6)}`, failures: k.failures, totalRequests: k.totalRequests, inCooldown: k.cooldownUntil > now })); }
}
export const keyRotator = new KeyRotator();
