// Cart store using Zustand
import { create } from 'zustand';
import type { CartItem, Cart, Coupon, Item, ItemVariant } from '../types';
import { cartService } from '../services';

interface CartState {
    items: CartItem[];
    coupon: Coupon | null;
    isLoading: boolean;
    error: string | null;

    // Computed values
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    itemCount: number;

    // Actions
    fetchCart: (userId: string) => Promise<void>;
    addToCart: (userId: string, itemId: string, quantity?: number, variantId?: string) => Promise<{ success: boolean; error?: string }>;
    updateQuantity: (cartItemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
    removeFromCart: (cartItemId: string) => Promise<{ success: boolean; error?: string }>;
    clearCart: (userId: string) => Promise<void>;
    applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
    removeCoupon: () => void;
    calculateTotals: () => void;
    clearError: () => void;
    subscribeToCart: (userId: string) => () => void;
    getCart: () => Cart;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    coupon: null,
    isLoading: false,
    error: null,
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,

    fetchCart: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await cartService.getCart(userId);

            if (error) {
                set({ error, isLoading: false });
                return;
            }

            set({ items: data || [], isLoading: false });
            get().calculateTotals();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            set({ error: err.message, isLoading: false });
        }
    },

    addToCart: async (userId, itemId, quantity = 1, variantId) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await cartService.addToCart(userId, itemId, quantity, variantId);

            if (error) {
                set({ error, isLoading: false });
                return { success: false, error };
            }

            // Refetch cart to get updated items with full item data
            await get().fetchCart(userId);
            return { success: true };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            set({ error: err.message, isLoading: false });
            return { success: false, error: err.message };
        }
    },

    updateQuantity: async (cartItemId, quantity) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await cartService.updateCartItemQuantity(cartItemId, quantity);

            if (error) {
                set({ error, isLoading: false });
                return { success: false, error };
            }

            // Update local state
            const items = get().items.map(item =>
                item.id === cartItemId ? { ...item, quantity } : item
            ).filter(item => item.quantity > 0);

            set({ items, isLoading: false });
            get().calculateTotals();
            return { success: true };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            set({ error: err.message, isLoading: false });
            return { success: false, error: err.message };
        }
    },

    removeFromCart: async (cartItemId) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await cartService.removeFromCart(cartItemId);

            if (error) {
                set({ error, isLoading: false });
                return { success: false, error };
            }

            // Update local state
            const items = get().items.filter(item => item.id !== cartItemId);
            set({ items, isLoading: false });
            get().calculateTotals();
            return { success: true };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            set({ error: err.message, isLoading: false });
            return { success: false, error: err.message };
        }
    },

    clearCart: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            await cartService.clearCart(userId);
            set({
                items: [],
                coupon: null,
                subtotal: 0,
                discount: 0,
                tax: 0,
                shipping: 0,
                total: 0,
                itemCount: 0,
                isLoading: false
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            set({ error: err.message, isLoading: false });
        }
    },

    applyCoupon: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const { subtotal } = get();
            const { data, error } = await cartService.validateCoupon(code, subtotal);

            if (error || !data) {
                set({ error: error || 'Invalid coupon', isLoading: false });
                return { success: false, error: error || 'Invalid coupon' };
            }

            set({ coupon: data, isLoading: false });
            get().calculateTotals();
            return { success: true };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            set({ error: err.message, isLoading: false });
            return { success: false, error: err.message };
        }
    },

    removeCoupon: () => {
        set({ coupon: null });
        get().calculateTotals();
    },

    calculateTotals: () => {
        const { items, coupon } = get();
        const cartTotals = cartService.calculateCartTotals(items, coupon || undefined);

        set({
            subtotal: cartTotals.subtotal,
            discount: cartTotals.discount,
            tax: cartTotals.tax,
            shipping: cartTotals.shipping,
            total: cartTotals.total,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        });
    },

    clearError: () => set({ error: null }),

    subscribeToCart: (userId) => {
        const subscription = cartService.subscribeToCart(userId, (cartItems) => {
            set({ items: cartItems });
            get().calculateTotals();
        });

        return () => {
            subscription.unsubscribe();
        };
    },

    getCart: () => {
        const state = get();
        return {
            items: state.items,
            subtotal: state.subtotal,
            discount: state.discount,
            tax: state.tax,
            shipping: state.shipping,
            total: state.total,
            coupon: state.coupon || undefined,
        };
    },
}));

export default useCartStore;
