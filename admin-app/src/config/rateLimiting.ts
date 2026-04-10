/**
 * Rate Limiting Configuration
 * Centralized configuration to prevent hitting Supabase rate limits
 */

export const RATE_LIMIT_CONFIG = {
    // Polling intervals (in milliseconds)
    POLLING: {
        PENDING_ORDERS: 120000,      // 2 minutes - check for new orders
        NOTIFICATIONS: 180000,        // 3 minutes - check for notifications
        DASHBOARD_STATS: 300000,      // 5 minutes - refresh dashboard stats
        INVENTORY_ALERTS: 600000,     // 10 minutes - check low stock
    },
    
    // Cache TTL (Time To Live in milliseconds)
    CACHE_TTL: {
        PRODUCTS: 300000,             // 5 minutes - product list
        PRODUCT_DETAILS: 180000,      // 3 minutes - single product
        CATEGORIES: 600000,           // 10 minutes - categories rarely change
        ORDERS: 60000,                // 1 minute - orders need to be fresh
        ORDER_DETAILS: 120000,        // 2 minutes - order details
        USER_PROFILE: 300000,         // 5 minutes - user profile
        COUPONS: 300000,              // 5 minutes - coupon list
        DASHBOARD_STATS: 180000,      // 3 minutes - dashboard statistics
    },
    
    // Debounce delays (in milliseconds)
    DEBOUNCE: {
        SEARCH: 500,                  // 500ms - search input
        FILTER: 300,                  // 300ms - filter changes
        AUTO_SAVE: 2000,              // 2 seconds - auto-save drafts
    },
    
    // Throttle delays (in milliseconds)
    THROTTLE: {
        SCROLL_LOAD: 1000,            // 1 second - infinite scroll
        BUTTON_CLICK: 1000,           // 1 second - prevent double clicks
        API_CALL: 500,                // 500ms - general API calls
    },
    
    // Retry configuration
    RETRY: {
        MAX_ATTEMPTS: 3,              // Maximum retry attempts
        BASE_DELAY: 3000,             // 3 seconds - initial retry delay
        MAX_DELAY: 30000,             // 30 seconds - maximum retry delay
        BACKOFF_MULTIPLIER: 2,        // Exponential backoff multiplier
    },
    
    // Realtime subscription limits
    REALTIME: {
        MAX_SUBSCRIPTIONS: 5,         // Maximum concurrent subscriptions per user
        RECONNECT_DELAY: 5000,        // 5 seconds - delay before reconnecting
        HEARTBEAT_INTERVAL: 30000,    // 30 seconds - keep-alive ping
    },
    
    // Batch operation limits
    BATCH: {
        MAX_ITEMS: 50,                // Maximum items per batch operation
        DELAY_BETWEEN_BATCHES: 1000,  // 1 second - delay between batch operations
    },
};

/**
 * Helper to check if we should skip a request based on last request time
 */
export function shouldSkipRequest(
    lastRequestTime: number | null,
    minInterval: number
): boolean {
    if (!lastRequestTime) return false;
    return Date.now() - lastRequestTime < minInterval;
}

/**
 * Helper to calculate next retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number): number {
    const delay = RATE_LIMIT_CONFIG.RETRY.BASE_DELAY * 
                  Math.pow(RATE_LIMIT_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt);
    return Math.min(delay, RATE_LIMIT_CONFIG.RETRY.MAX_DELAY);
}

/**
 * Helper to check if error is rate limit related
 */
export function isRateLimitError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.statusCode;
    
    return (
        status === 429 ||
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('quota exceeded')
    );
}

/**
 * Helper to format time remaining until next allowed request
 */
export function getTimeUntilNextRequest(
    lastRequestTime: number,
    minInterval: number
): number {
    const elapsed = Date.now() - lastRequestTime;
    return Math.max(0, minInterval - elapsed);
}

