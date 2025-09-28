interface CachedCustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceProvider: string;
  serviceType: string;
  accountValue: number;
  riskCategory: string;
  riskSeverity?: string;
  lastPaymentDate: string;
  nextBillingDate: string;
  paymentMethod: {
    id: string;
    cardType: string;
    lastFourDigits: string;
    expiryMonth: number;
    expiryYear: number;
    status: string;
    failureCount: number;
    lastFailureDate?: string;
    lastSuccessDate?: string;
  };
  timestamp: number;
}

interface CacheEntry {
  data: CachedCustomerData;
  expiry: number;
}

export class CustomerCacheService {
  private cache = new Map<string, CacheEntry>();
  private cacheExpiryMs: number;

  constructor(cacheExpiryMs: number = 5 * 60 * 1000) { // 5 minutes default
    this.cacheExpiryMs = cacheExpiryMs;

    // Clean expired entries every minute
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 60 * 1000);
  }

  // Get customer data from cache
  get(customerId: string): CachedCustomerData | null {
    const entry = this.cache.get(customerId);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(customerId);
      return null;
    }

    return entry.data;
  }

  // Set customer data in cache
  set(customerId: string, data: CachedCustomerData): void {
    const entry: CacheEntry = {
      data: {
        ...data,
        timestamp: Date.now()
      },
      expiry: Date.now() + this.cacheExpiryMs
    };

    this.cache.set(customerId, entry);
    console.log(`Customer ${customerId} cached for ${this.cacheExpiryMs / 1000}s`);
  }

  // Invalidate specific customer cache
  invalidate(customerId: string): void {
    if (this.cache.has(customerId)) {
      this.cache.delete(customerId);
      console.log(`Cache invalidated for customer ${customerId}`);
    }
  }

  // Invalidate all cache entries
  invalidateAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`All cache entries invalidated (${size} entries removed)`);
  }

  // Clean expired entries
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [customerId, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(customerId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned ${removedCount} expired cache entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiry) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      cacheExpiryMs: this.cacheExpiryMs
    };
  }

  // Check if customer data is cached and fresh
  isCached(customerId: string): boolean {
    const entry = this.cache.get(customerId);
    return entry !== undefined && Date.now() <= entry.expiry;
  }

  // Get cached data age in milliseconds
  getAge(customerId: string): number | null {
    const entry = this.cache.get(customerId);
    if (!entry) {
      return null;
    }

    return Date.now() - entry.data.timestamp;
  }
}

// Export singleton instance
export const customerCache = new CustomerCacheService();