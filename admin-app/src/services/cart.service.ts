// Cart service for managing shopping cart
import { supabase, TABLES } from './supabase';
import type { CartItem, Cart, Coupon } from '../types';

class CartService {
    // Get user's cart
    async getCart(userId: string): Promise<{ data: CartItem[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.CART)
                .select(`
          *,
          item:${TABLES.ITEMS}(
            *,
            images:item_images(*)
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Add item to cart
    async addToCart(
        userId: string,
        itemId: string,
        quantity: number = 1,
        variantId?: string
    ): Promise<{ data: CartItem | null; error: string | null }> {
        try {
            // Check if item already exists in cart
            const { data: existingItem } = await supabase
                .from(TABLES.CART)
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .eq('variant_id', variantId || null)
                .single();

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + quantity;
                return this.updateCartItemQuantity(existingItem.id, newQuantity);
            }

            // Add new item
            const { data, error } = await supabase
                .from(TABLES.CART)
                .insert({
                    user_id: userId,
                    item_id: itemId,
                    variant_id: variantId,
                    quantity,
                })
                .select(`
          *,
          item:${TABLES.ITEMS}(
            *,
            images:item_images(*)
          )
        `)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Update cart item quantity
    async updateCartItemQuantity(
        cartItemId: string,
        quantity: number
    ): Promise<{ data: CartItem | null; error: string | null }> {
        try {
            if (quantity <= 0) {
                return this.removeFromCart(cartItemId);
            }

            const { data, error } = await supabase
                .from(TABLES.CART)
                .update({ quantity, updated_at: new Date().toISOString() })
                .eq('id', cartItemId)
                .select(`
          *,
          item:${TABLES.ITEMS}(
            *,
            images:item_images(*)
          )
        `)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Remove item from cart
    async removeFromCart(cartItemId: string): Promise<{ data: CartItem | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.CART)
                .delete()
                .eq('id', cartItemId)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Clear cart
    async clearCart(userId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.CART)
                .delete()
                .eq('user_id', userId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // Validate coupon
    async validateCoupon(code: string, subtotal: number): Promise<{ data: Coupon | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.COUPONS)
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                return { data: null, error: 'Invalid coupon code' };
            }

            // Check validity dates
            const now = new Date();
            const validFrom = new Date(data.valid_from);
            const validUntil = new Date(data.valid_until);

            if (now < validFrom || now > validUntil) {
                return { data: null, error: 'Coupon has expired or is not yet valid' };
            }

            // Check minimum cart value
            if (data.min_cart_value && subtotal < data.min_cart_value) {
                return { data: null, error: `Minimum cart value is ₹${data.min_cart_value}` };
            }

            // Return the coupon - discount will be calculated in calculateCartTotals
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Calculate cart totals
    calculateCartTotals(items: CartItem[], coupon?: Coupon): Cart {
        const subtotal = items.reduce((sum, item) => {
            const price = item.variant?.price || item.item.price;
            return sum + price * item.quantity;
        }, 0);

        let discount = 0;
        if (coupon) {
            if (coupon.discount_type === 'percentage') {
                discount = (subtotal * coupon.discount_value) / 100;
                if (coupon.max_discount) {
                    discount = Math.min(discount, coupon.max_discount);
                }
            } else if (coupon.discount_type === 'fixed') {
                discount = coupon.discount_value;
            }
            
            // Ensure discount never exceeds subtotal
            discount = Math.min(discount, subtotal);
        }

        const tax = (subtotal - discount) * 0.18; // 18% GST
        const shipping = subtotal >= 499 ? 0 : 49; // Free shipping above ₹499

        return {
            items,
            subtotal,
            discount,
            tax,
            shipping,
            total: subtotal - discount + tax + shipping,
            appliedCoupon: coupon ? { coupon, discount_amount: discount } : undefined,
        };
    }

    // Subscribe to cart changes
    subscribeToCart(userId: string, callback: (cartItems: CartItem[]) => void) {
        return supabase
            .channel(`cart-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: TABLES.CART,
                    filter: `user_id=eq.${userId}`,
                },
                async () => {
                    // Refetch cart on any change
                    const { data } = await this.getCart(userId);
                    if (data) {
                        callback(data);
                    }
                }
            )
            .subscribe();
    }
}

export const cartService = new CartService();
export default cartService;
