// Review Service - manage product reviews
import { supabase, TABLES } from './supabase';

export interface Review {
    id: string;
    item_id: string;
    user_id: string;
    order_id?: string;
    rating: number;           // 1-5
    title?: string;
    body: string;
    images?: string[];
    is_verified: boolean;
    created_at: string;
    // joined
    user?: { full_name: string; avatar_url?: string };
}

class ReviewService {
    // Get reviews for a product
    async getReviews(itemId: string): Promise<{ data: Review[] | null; avgRating: number; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.REVIEWS)
                .select('*, user:user_id(full_name, avatar_url)')
                .eq('item_id', itemId)
                .order('created_at', { ascending: false });

            if (error) return { data: null, avgRating: 0, error: error.message };

            const avgRating = data && data.length > 0
                ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 10) / 10
                : 0;

            return { data, avgRating, error: null };
        } catch (error: any) {
            return { data: null, avgRating: 0, error: error.message };
        }
    }

    // Get user's review for a specific order item
    async getUserReview(userId: string, itemId: string, orderId?: string): Promise<{ data: Review | null; error: string | null }> {
        try {
            let query = supabase
                .from(TABLES.REVIEWS)
                .select('*')
                .eq('user_id', userId)
                .eq('item_id', itemId);

            if (orderId) query = query.eq('order_id', orderId);

            const { data, error } = await query.maybeSingle();

            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Submit or update a review
    async submitReview(review: {
        item_id: string;
        user_id: string;
        order_id?: string;
        rating: number;
        title?: string;
        body: string;
    }): Promise<{ data: Review | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.REVIEWS)
                .insert({
                    ...review,
                    is_verified: true, // Since they're from a delivered order
                })
                .select()
                .single();

            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Delete a review
    async deleteReview(reviewId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.REVIEWS)
                .delete()
                .eq('id', reviewId);

            if (error) return { error: error.message };
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}

export const reviewService = new ReviewService();
export default reviewService;
