// Wishlist store using Zustand
import { create } from 'zustand';
import type { WishlistItem } from '../types';
import { wishlistService } from '../services';

interface WishlistState {
    items: WishlistItem[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchWishlist: (userId: string) => Promise<void>;
    addToWishlist: (userId: string, itemId: string) => Promise<{ success: boolean; error?: string }>;
    removeFromWishlist: (userId: string, itemId: string) => Promise<{ success: boolean; error?: string }>;
    toggleWishlist: (userId: string, itemId: string) => Promise<{ added: boolean; error?: string }>;
    isItemInWishlist: (itemId: string) => boolean;
    clearWishlist: (userId: string) => Promise<void>;
    clearError: () => void;
    subscribeToWishlist: (userId: string) => () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    fetchWishlist: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await wishlistService.getWishlist(userId);

            if (error) {
                set({ error, isLoading: false });
                return;
            }

            set({ items: data || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addToWishlist: async (userId, itemId) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await wishlistService.addToWishlist(userId, itemId);

            if (error) {
                set({ error, isLoading: false });
                return { success: false, error };
            }

            if (data) {
                set({ items: [...get().items, data], isLoading: false });
            }

            return { success: true };
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
    },

    removeFromWishlist: async (userId, itemId) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await wishlistService.removeFromWishlist(userId, itemId);

            if (error) {
                set({ error, isLoading: false });
                return { success: false, error };
            }

            const items = get().items.filter(item => item.item_id !== itemId);
            set({ items, isLoading: false });

            return { success: true };
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
        }
    },

    toggleWishlist: async (userId, itemId) => {
        const isInList = get().isItemInWishlist(itemId);

        if (isInList) {
            const result = await get().removeFromWishlist(userId, itemId);
            return { added: false, error: result.error };
        } else {
            const result = await get().addToWishlist(userId, itemId);
            return { added: true, error: result.error };
        }
    },

    isItemInWishlist: (itemId) => {
        return get().items.some(item => item.item_id === itemId);
    },

    clearWishlist: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            await wishlistService.clearWishlist(userId);
            set({ items: [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),

    subscribeToWishlist: (userId) => {
        const subscription = wishlistService.subscribeToWishlist(userId, (items) => {
            set({ items });
        });

        return () => {
            subscription.unsubscribe();
        };
    },
}));

export default useWishlistStore;
