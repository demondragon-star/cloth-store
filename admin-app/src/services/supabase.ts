// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_CONFIG } from '../constants/config';

// Custom storage adapter using SecureStore for secure token storage
// Handles large values by chunking them into smaller pieces
const CHUNK_SIZE = 2000; // Safe size under 2048 byte limit
const CHUNK_KEY_SUFFIX = '_chunk_';

const ExpoSecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            // Try to get the main item first
            const value = await SecureStore.getItemAsync(key);
            if (value) return value;

            // If not found, try to get chunked items
            const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunk_count`);
            if (!chunkCountStr) return null;

            const chunkCount = parseInt(chunkCountStr, 10);
            const chunks: string[] = [];

            for (let i = 0; i < chunkCount; i++) {
                const chunk = await SecureStore.getItemAsync(`${key}${CHUNK_KEY_SUFFIX}${i}`);
                if (chunk) chunks.push(chunk);
            }

            return chunks.length > 0 ? chunks.join('') : null;
        } catch (error) {
            console.error('Error getting item from SecureStore:', error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            // If value is small enough, store directly
            if (value.length < CHUNK_SIZE) {
                await SecureStore.setItemAsync(key, value);
                // Clean up any old chunks
                const oldChunkCountStr = await SecureStore.getItemAsync(`${key}_chunk_count`);
                if (oldChunkCountStr) {
                    const oldChunkCount = parseInt(oldChunkCountStr, 10);
                    for (let i = 0; i < oldChunkCount; i++) {
                        await SecureStore.deleteItemAsync(`${key}${CHUNK_KEY_SUFFIX}${i}`);
                    }
                    await SecureStore.deleteItemAsync(`${key}_chunk_count`);
                }
                return;
            }

            // For large values, chunk them
            const chunks: string[] = [];
            for (let i = 0; i < value.length; i += CHUNK_SIZE) {
                chunks.push(value.substring(i, i + CHUNK_SIZE));
            }

            // Store each chunk
            for (let i = 0; i < chunks.length; i++) {
                await SecureStore.setItemAsync(`${key}${CHUNK_KEY_SUFFIX}${i}`, chunks[i]);
            }

            // Store chunk count
            await SecureStore.setItemAsync(`${key}_chunk_count`, chunks.length.toString());

            // Remove the main key if it exists
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (e) {
                // Ignore if key doesn't exist
            }
        } catch (error) {
            console.error('Error setting item in SecureStore:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            // Remove main item
            await SecureStore.deleteItemAsync(key);

            // Remove chunks if they exist
            const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunk_count`);
            if (chunkCountStr) {
                const chunkCount = parseInt(chunkCountStr, 10);
                for (let i = 0; i < chunkCount; i++) {
                    await SecureStore.deleteItemAsync(`${key}${CHUNK_KEY_SUFFIX}${i}`);
                }
                await SecureStore.deleteItemAsync(`${key}_chunk_count`);
            }
        } catch (error) {
            console.error('Error removing item from SecureStore:', error);
        }
    },
};

// Create Supabase client with secure storage
export const supabase = createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    {
        auth: {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    }
);

// Database table names - UPDATED to match supabase_schema.sql
export const TABLES = {
    USERS: 'profiles', // Changed from 'users' to 'profiles'
    CATEGORIES: 'categories',
    SUBCATEGORIES: 'subcategories',
    ITEMS: 'items',
    ITEM_IMAGES: 'item_images',
    ITEM_VARIANTS: 'item_variants',
    CART: 'cart_items', // Changed from 'cart' to 'cart_items'
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    FAVORITES: 'wishlist_items', // Changed from 'favorites' to 'wishlist_items'
    NOTIFICATIONS: 'notifications',
    ADDRESSES: 'addresses',
    PAYMENTS: 'payments',
    REVIEWS: 'reviews',
    COUPONS: 'coupons',
    COUPON_USAGE: 'coupon_usage',
    SEARCH_HISTORY: 'search_history',
    SUPPORT_CHATS: 'support_chats',
    SUPPORT_MESSAGES: 'support_messages',
    COLOR_VARIANTS: 'item_color_variants',
} as const;

// Storage bucket names
export const BUCKETS = {
    AVATARS: 'avatars',
    ITEM_IMAGES: 'item-images',
    REVIEW_IMAGES: 'review-images',
} as const;

export default supabase;
