/**
 * Rate Limiter Utility
 * Helps prevent hitting API rate limits by throttling requests
 */

import { RATE_LIMIT_CONFIG, isRateLimitError, calculateRetryDelay } from '../config/rateLimiting';

interface RateLimiterConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    onRetry?: (attempt: number, delay: number) => void;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
    maxRetries: RATE_LIMIT_CONFIG.RETRY.MAX_ATTEMPTS,
    baseDelay: RATE_LIMIT_CONFIG.RETRY.BASE_DELAY,
    maxDelay: RATE_LIMIT_CONFIG.RETRY.MAX_DELAY,
};

/**
 * Executes a function with exponential backoff retry logic
 * @param fn - The async function to execute
 * @param config - Rate limiter configuration
 * @returns The result of the function or null if all retries fail
 */
export async function withRateLimit<T>(
    fn: () => Promise<T>,
    config: Partial<RateLimiterConfig> = {}
): Promise<T | null> {
    const { maxRetries, baseDelay, maxDelay, onRetry } = { ...DEFAULT_CONFIG, ...config };
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Check if it's a rate limit error
            if (!isRateLimitError(error) || attempt === maxRetries) {
                // Not a rate limit error or out of retries
                throw error;
            }
            
            // Calculate delay with exponential backoff
            const delay = calculateRetryDelay(attempt);
            
            console.warn(
                `Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
            );
            
            // Call onRetry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, delay);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // If we get here, all retries failed
    if (lastError) {
        throw lastError;
    }
    
    return null;
}

/**
 * Simple throttle function to limit how often a function can be called
 * @param fn - The function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = RATE_LIMIT_CONFIG.THROTTLE.API_CALL
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    return function throttled(...args: Parameters<T>) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;
        
        if (timeSinceLastCall >= delay) {
            lastCall = now;
            fn(...args);
        } else {
            // Schedule for later
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                fn(...args);
                timeoutId = null;
            }, delay - timeSinceLastCall);
        }
    };
}

/**
 * Debounce function to delay execution until after a period of inactivity
 * @param fn - The function to debounce
 * @param delay - Time to wait in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = RATE_LIMIT_CONFIG.DEBOUNCE.SEARCH
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return function debounced(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * Batch multiple requests to reduce API calls
 * @param items - Array of items to process
 * @param batchSize - Number of items per batch
 * @param processor - Function to process each batch
 * @param delayBetweenBatches - Delay between batches in ms
 * @returns Array of results
 */
export async function batchProcess<T, R>(
    items: T[],
    batchSize: number = RATE_LIMIT_CONFIG.BATCH.MAX_ITEMS,
    processor: (batch: T[]) => Promise<R>,
    delayBetweenBatches: number = RATE_LIMIT_CONFIG.BATCH.DELAY_BETWEEN_BATCHES
): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const result = await processor(batch);
        results.push(result);
        
        // Add delay between batches (except for the last batch)
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }
    
    return results;
}

