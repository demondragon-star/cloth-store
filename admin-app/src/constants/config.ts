// Application configuration constants

export const APP_CONFIG = {
    name: 'ShopEase',
    version: '1.0.0',
    description: 'Your one-stop shopping destination',
    supportEmail: 'support@shopease.com',
    privacyPolicyUrl: 'https://shopease.com/privacy',
    termsOfServiceUrl: 'https://shopease.com/terms',
};

// API Configuration
export const API_CONFIG = {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
    url: 'https://nitagdeebdaoiejakeld.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGFnZGVlYmRhb2llamFrZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDMyOTcsImV4cCI6MjA4MDc3OTI5N30.6055pH8W1di7gN8Zf3dA7JGvFIQM9u-ORXT8T7ZpByg',
};

// Payment Configuration
export const PAYMENT_CONFIG = {
    razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    currency: 'INR',
    currencySymbol: '₹',
};

// Map Configuration
export const MAP_CONFIG = {
    defaultLatitude: 28.6139,
    defaultLongitude: 77.2090,
    defaultZoom: 14,
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
    defaultPageSize: 20,
    maxPageSize: 50,
};

// Cache Configuration
export const CACHE_CONFIG = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
    androidChannelId: 'shopease-notifications',
    androidChannelName: 'ShopEase Notifications',
};

// Image Configuration
export const IMAGE_CONFIG = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
};

// Validation Configuration
export const VALIDATION_CONFIG = {
    minPasswordLength: 8,
    maxPasswordLength: 128,
    minNameLength: 2,
    maxNameLength: 50,
    phoneRegex: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Search Configuration
export const SEARCH_CONFIG = {
    debounceDelay: 300,
    minSearchLength: 2,
    maxSearchHistory: 10,
};

// Order Status
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
} as const;

export const ORDER_STATUS_LABELS = {
    [ORDER_STATUS.PENDING]: 'Order Placed',
    [ORDER_STATUS.CONFIRMED]: 'Confirmed',
    [ORDER_STATUS.PREPARING]: 'Preparing',
    [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [ORDER_STATUS.DELIVERED]: 'Delivered',
    [ORDER_STATUS.CANCELLED]: 'Cancelled',
    [ORDER_STATUS.REFUNDED]: 'Refunded',
};

export default {
    APP_CONFIG,
    API_CONFIG,
    SUPABASE_CONFIG,
    PAYMENT_CONFIG,
    MAP_CONFIG,
    PAGINATION_CONFIG,
    CACHE_CONFIG,
    NOTIFICATION_CONFIG,
    IMAGE_CONFIG,
    VALIDATION_CONFIG,
    SEARCH_CONFIG,
    ORDER_STATUS,
    ORDER_STATUS_LABELS,
};
