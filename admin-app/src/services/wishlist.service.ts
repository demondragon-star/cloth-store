// Wishlist/Favorites service
import { supabase, TABLES } from './supabase';
import type { WishlistItem } from '../types';

class WishlistService {
    // Get user's wishlist
    async getWishlist(userId: string): Promise<{ data: WishlistItem[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.FAVORITES)
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

    // Add item to wishlist
    async addToWishlist(userId: string, itemId: string): Promise<{ data: WishlistItem | null; error: string | null }> {
        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from(TABLES.FAVORITES)
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();

            if (existing) {
                return { data: null, error: 'Item already in wishlist' };
            }

            const { data, error } = await supabase
                .from(TABLES.FAVORITES)
                .insert({
                    user_id: userId,
                    item_id: itemId,
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

    // Remove from wishlist
    async removeFromWishlist(userId: string, itemId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.FAVORITES)
                .delete()
                .eq('user_id', userId)
                .eq('item_id', itemId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // Check if item is in wishlist
    async isInWishlist(userId: string, itemId: string): Promise<boolean> {
        try {
            const { data } = await supabase
                .from(TABLES.FAVORITES)
                .select('id')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();

            return !!data;
        } catch {
            return false;
        }
    }

    // Toggle wishlist status
    async toggleWishlist(
        userId: string,
        itemId: string
    ): Promise<{ added: boolean; error: string | null }> {
        const isInList = await this.isInWishlist(userId, itemId);

        if (isInList) {
            const { error } = await this.removeFromWishlist(userId, itemId);
            return { added: false, error };
        } else {
            const { error } = await this.addToWishlist(userId, itemId);
            return { added: true, error };
        }
    }

    // Clear wishlist
    async clearWishlist(userId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.FAVORITES)
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

    // Subscribe to wishlist changes
    subscribeToWishlist(userId: string, callback: (items: WishlistItem[]) => void) {
        return supabase
            .channel(`wishlist-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: TABLES.FAVORITES,
                    filter: `user_id=eq.${userId}`,
                },
                async () => {
                    const { data } = await this.getWishlist(userId);
                    if (data) {
                        callback(data);
                    }
                }
            )
            .subscribe();
    }
}

export const wishlistService = new WishlistService();
export default wishlistService;
