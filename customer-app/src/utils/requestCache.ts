/**
 * Request Cache Utility
 * Prevents excessive API calls by caching responses and implementing smart refresh strategies
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheConfig {
    ttl: number; // Time to live in milliseconds
    staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

class RequestCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private pendingRequests: Map<string, Promise<any>> = new Map();
    
    /**
     * Get cached data or fetch if not available/expired
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        config: CacheConfig = { ttl: 60000 } // Default 1 minute
    ): Promise<T> {
        const now = Date.now();
        const cached = this.cache.get(key);
        
        // Return cached data if still valid
        if (cached && cached.expiresAt > now) {
            return cached.data;
        }
        
        // Return stale data while revalidating in background
        if (config.staleWhileRevalidate && cached) {
            this.revalidate(key, fetcher, config);
            return cached.data;
        }
        
        // Check if there's already a pending request for this key
        const pending = this.pendingRequests.get(key);
        if (pending) {
            return pending;
        }
        
        // Fetch fresh data
        const promise = fetcher()
            .then(data => {
                this.set(key, data, config.ttl);
                this.pendingRequests.delete(key);
                return data;
            })
            .catch(error => {
                this.pendingRequests.delete(key);
                // Return stale data if available on error
                if (cached) {
                    console.warn(`Request failed, returning stale data for ${key}`);
                    return cached.data;
                }
                throw error;
            });
        
        this.pendingRequests.set(key, promise);
        return promise;
    }
    
    /**
     * Set cache entry
     */
    private set<T>(key: string, data: T, ttl: number): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        });
    }
    
    /**
     * Revalidate in background
     */
    private async revalidate<T>(
        key: string,
        fetcher: () => Promise<T>,
        config: CacheConfig
    ): Promise<void> {
        try {
            const data = await fetcher();
            this.set(key, data, config.ttl);
        } catch (error) {
            console.warn(`Background revalidation failed for ${key}:`, error);
        }
    }
    
    /**
     * Invalidate cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
    }
    
    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: RegExp): void {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.invalidate(key);
            }
        }
    }
    
    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.pendingRequests.clear();
    }
    
    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt < now) {
                this.cache.delete(key);
            }
        }
    }
}

// Singleton instance
export const requestCache = new RequestCache();

// Auto cleanup every 5 minutes
setInterval(() => {
    requestCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Hook-friendly wrapper for request caching
 */
export function useCachedRequest<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: CacheConfig
): () => Promise<T> {
    return () => requestCache.get(key, fetcher, config);
}

