// Rate Limiting Service - API istek limitleme

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
  blocked: boolean;
  blockedUntil?: number;
}

// Varsayilan konfigurasyonlar
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  analysis: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 dakika
  },
  upload: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 dakika
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 dakika
  },
  wardrobe: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 dakika
  },
};

class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Her 5 dakikada eski kayitlari temizle
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Limit kontrolu
  checkLimit(
    key: string,
    configName: string = 'api'
  ): { allowed: boolean; remaining: number; resetIn: number } {
    const config = DEFAULT_CONFIGS[configName] || DEFAULT_CONFIGS.api;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Mevcut kaydi al veya olustur
    let entry = this.entries.get(key);

    if (!entry) {
      entry = { timestamps: [], blocked: false };
      this.entries.set(key, entry);
    }

    // Engellenme durumunu kontrol et
    if (entry.blocked && entry.blockedUntil) {
      if (now < entry.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: entry.blockedUntil - now,
        };
      }
      // Engel kaldirildi
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.timestamps = [];
    }

    // Pencere disindaki istekleri temizle
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    // Limit kontrolu
    if (entry.timestamps.length >= config.maxRequests) {
      // Cok fazla istek - engelle
      entry.blocked = true;
      entry.blockedUntil = now + config.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetIn: config.windowMs,
      };
    }

    // Yeni istegi kaydet
    entry.timestamps.push(now);

    const remaining = config.maxRequests - entry.timestamps.length;
    const oldestTimestamp = entry.timestamps[0];
    const resetIn = oldestTimestamp ? oldestTimestamp + config.windowMs - now : config.windowMs;

    return {
      allowed: true,
      remaining,
      resetIn: Math.max(0, resetIn),
    };
  }

  // Kalan istek sayisi
  getRemainingRequests(key: string, configName: string = 'api'): number {
    const config = DEFAULT_CONFIGS[configName] || DEFAULT_CONFIGS.api;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const entry = this.entries.get(key);
    if (!entry) {
      return config.maxRequests;
    }

    const validTimestamps = entry.timestamps.filter(t => t > windowStart);
    return Math.max(0, config.maxRequests - validTimestamps.length);
  }

  // Engelleme durumunu kontrol et
  isBlocked(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;

    if (entry.blocked && entry.blockedUntil) {
      if (Date.now() < entry.blockedUntil) {
        return true;
      }
      // Engel kaldirildi
      entry.blocked = false;
      entry.blockedUntil = undefined;
    }

    return false;
  }

  // Engeli kaldir
  unblock(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.timestamps = [];
    }
  }

  // Tum kayitlari sifirla
  reset(): void {
    this.entries.clear();
  }

  // Belirli bir key'i sifirla
  resetKey(key: string): void {
    this.entries.delete(key);
  }

  // Eski kayitlari temizle
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 dakika

    for (const [key, entry] of this.entries.entries()) {
      // Engelsiz ve tum timestampler eskiyse sil
      if (!entry.blocked) {
        const hasRecentActivity = entry.timestamps.some(t => now - t < maxAge);
        if (!hasRecentActivity) {
          this.entries.delete(key);
        }
      }

      // Engelleme suresi gecmisse engeli kaldir
      if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
        entry.blocked = false;
        entry.blockedUntil = undefined;
        entry.timestamps = [];
      }
    }
  }

  // Servisi durdur
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.entries.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Kullanim kolayligi icin yardimci fonksiyonlar
export function checkRateLimit(
  userId: string,
  action: string = 'api'
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${userId}:${action}`;
  return rateLimiter.checkLimit(key, action);
}

export function getRemainingRequests(userId: string, action: string = 'api'): number {
  const key = `${userId}:${action}`;
  return rateLimiter.getRemainingRequests(key, action);
}

export function isUserBlocked(userId: string, action: string = 'api'): boolean {
  const key = `${userId}:${action}`;
  return rateLimiter.isBlocked(key);
}

export function resetUserLimit(userId: string, action: string = 'api'): void {
  const key = `${userId}:${action}`;
  rateLimiter.resetKey(key);
}

export default rateLimiter;
