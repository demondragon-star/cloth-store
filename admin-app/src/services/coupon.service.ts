// Coupon service for managing discount coupons
import { supabase, TABLES } from './supabase';
import type {
    Coupon,
    CouponUsage,
    CouponValidationResult,
    AppliedCoupon,
    CouponStatistics,
} from '../types';

// Error messages for validation failures
const ERROR_MESSAGES = {
    INVALID_CODE: 'Invalid coupon code',
    EXPIRED: 'This coupon has expired',
    NOT_YET_ACTIVE: 'This coupon is not yet active',
    FIRST_ORDER_ONLY: 'This coupon is only for first-time customers',
    MIN_CART_VALUE: (amount: number) => `Add ₹${amount} more to your cart to use this coupon`,
    ALREADY_USED: 'You have reached the usage limit for this coupon',
    INACTIVE: 'This coupon is no longer available',
    USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit',
    ONE_COUPON_ONLY: 'Only one coupon can be applied per order',
    CART_TOO_LOW: 'Cart value is below the minimum required for this coupon',
};

class CouponService {
    // ============================================
    // User-facing methods
    // ============================================

    /**
     * Validate a coupon code for a specific user and cart total
     */
    async validateCoupon(
        code: string,
        userId: string,
        cartTotal: number
    ): Promise<CouponValidationResult> {
        try {
            // 1. Check if coupon exists
            const { data: coupon, error: fetchError } = await supabase
                .from(TABLES.COUPONS)
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (fetchError || !coupon) {
                return { valid: false, error: ERROR_MESSAGES.INVALID_CODE };
            }

            // 2. Check if coupon is active
            if (!coupon.is_active) {
                return { valid: false, error: ERROR_MESSAGES.INACTIVE };
            }

            // 3. Check date validity
            const now = new Date();
            const validFrom = new Date(coupon.valid_from);
            const validUntil = new Date(coupon.valid_until);

            if (now < validFrom) {
                return { valid: false, error: ERROR_MESSAGES.NOT_YET_ACTIVE };
            }

            if (now > validUntil) {
                return { valid: false, error: ERROR_MESSAGES.EXPIRED };
            }

            // 4. Check first order requirement
            if (coupon.coupon_type === 'first_order') {
                const isFirstOrder = await this.checkFirstOrder(userId);
                if (!isFirstOrder) {
                    return { valid: false, error: ERROR_MESSAGES.FIRST_ORDER_ONLY };
                }
            }

            // 5. Check cart value requirement
            if (cartTotal < coupon.min_cart_value) {
                const amountNeeded = coupon.min_cart_value - cartTotal;
                return {
                    valid: false,
                    error: ERROR_MESSAGES.MIN_CART_VALUE(Math.ceil(amountNeeded)),
                };
            }

            // 6. Check if user has already used this coupon beyond their limit
            const hasReachedUserLimit = await this.checkUserUsage(coupon.id, userId);
            if (hasReachedUserLimit) {
                return { valid: false, error: ERROR_MESSAGES.ALREADY_USED };
            }

            // 7. Check total usage limit
            if (
                coupon.total_usage_limit &&
                coupon.current_usage_count >= coupon.total_usage_limit
            ) {
                return { valid: false, error: ERROR_MESSAGES.USAGE_LIMIT_REACHED };
            }

            // All validations passed - calculate discount
            const discountAmount = this.calculateDiscount(coupon, cartTotal);

            return {
                valid: true,
                discount_amount: discountAmount,
                coupon: coupon,
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('[Coupon Validation] Exception during validation:', err);
            return { valid: false, error: err.message || 'Failed to validate coupon' };
        }
    }

    /**
     * Get available coupons for a user based on cart total
     */
    async getAvailableCoupons(
        userId: string,
        cartTotal: number
    ): Promise<{ data: Coupon[] | null; error: string | null }> {
        try {
            const now = new Date().toISOString();

            // Get all active coupons within valid date range
            const { data: coupons, error: fetchError } = await supabase
                .from(TABLES.COUPONS)
                .select('*')
                .eq('is_active', true)
                .lte('valid_from', now)
                .gte('valid_until', now)
                .order('discount_value', { ascending: false });

            if (fetchError) {
                return { data: null, error: fetchError.message };
            }

            if (!coupons || coupons.length === 0) {
                return { data: [], error: null };
            }

            // Filter coupons based on user eligibility
            const availableCoupons: Coupon[] = [];

            for (const coupon of coupons) {
                // Check first order requirement
                if (coupon.coupon_type === 'first_order') {
                    const isFirstOrder = await this.checkFirstOrder(userId);
                    if (!isFirstOrder) {
                        continue; // Skip this coupon
                    }
                }

                // Check if user has already used this coupon
                const hasUsed = await this.checkUserUsage(coupon.id, userId);
                if (hasUsed) {
                    continue; // Skip this coupon
                }

                // Check total usage limit
                if (
                    coupon.total_usage_limit &&
                    coupon.current_usage_count >= coupon.total_usage_limit
                ) {
                    continue; // Skip this coupon
                }

                // Include coupon (even if cart value is below minimum)
                // UI will show locked/unlocked status
                availableCoupons.push(coupon);
            }

            return { data: availableCoupons, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to get available coupons' };
        }
    }

    /**
     * Get coupons available for display in modal with eligibility info
     * Filters based on user eligibility and cart value
     */
    async getAvailableCouponsForModal(
        userId: string,
        cartTotal: number
    ): Promise<{
        eligible: Coupon[];
        locked: Array<Coupon & { amountNeeded: number }>;
        error: string | null;
    }> {
        try {
            const now = new Date().toISOString();

            // Get all active coupons within valid date range
            const { data: coupons, error: fetchError } = await supabase
                .from(TABLES.COUPONS)
                .select('*')
                .eq('is_active', true)
                .lte('valid_from', now)
                .gte('valid_until', now)
                .order('discount_value', { ascending: false });

            if (fetchError) {
                return { eligible: [], locked: [], error: fetchError.message };
            }

            if (!coupons || coupons.length === 0) {
                return { eligible: [], locked: [], error: null };
            }

            const eligible: Coupon[] = [];
            const locked: Array<Coupon & { amountNeeded: number }> = [];

            for (const coupon of coupons) {
                // Check first order requirement
                if (coupon.coupon_type === 'first_order') {
                    const isFirstOrder = await this.checkFirstOrder(userId);
                    if (!isFirstOrder) {
                        continue; // Skip this coupon
                    }
                }

                // Check if user has already used this coupon
                const hasUsed = await this.checkUserUsage(coupon.id, userId);
                if (hasUsed) {
                    continue; // Skip this coupon
                }

                // Check total usage limit
                if (
                    coupon.total_usage_limit &&
                    coupon.current_usage_count >= coupon.total_usage_limit
                ) {
                    continue; // Skip this coupon
                }

                // Check cart value requirement
                if (cartTotal < coupon.min_cart_value) {
                    // Add to locked list with amount needed
                    const amountNeeded = coupon.min_cart_value - cartTotal;
                    locked.push({ ...coupon, amountNeeded });
                } else {
                    // Add to eligible list
                    eligible.push(coupon);
                }
            }

            return { eligible, locked, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { eligible: [], locked: [], error: err.message || 'Failed to get available coupons' };
        }
    }

    /**
     * Get active coupons for banner display
     * Returns only active coupons within validity period
     */
    async getActiveCouponsForBanners(): Promise<{
        data: Coupon[] | null;
        error: string | null;
    }> {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from(TABLES.COUPONS)
                .select('*')
                .eq('is_active', true)
                .lte('valid_from', now)
                .gte('valid_until', now)
                .order('created_at', { ascending: false })
                .limit(10); // Limit to 10 most recent active coupons

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data || [], error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to fetch active coupons' };
        }
    }

    /**
     * Calculate remaining amount needed to unlock a cart-value coupon
     */
    calculateRemainingAmount(coupon: Coupon, currentCartTotal: number): number {
        if (currentCartTotal >= coupon.min_cart_value) {
            return 0;
        }
        return Math.ceil(coupon.min_cart_value - currentCartTotal);
    }

    /**
     * Check if user has placed any successful orders
     * Used for first-order coupon filtering
     */
    async hasUserPlacedOrders(userId: string): Promise<boolean> {
        return !(await this.checkFirstOrder(userId));
    }

    /**
     * Apply a coupon to the cart
     */
    async applyCoupon(
        code: string,
        userId: string,
        cartTotal: number
    ): Promise<{ data: AppliedCoupon | null; error: string | null }> {
        try {
            // Validate the coupon first
            const validationResult = await this.validateCoupon(code, userId, cartTotal);

            if (!validationResult.valid) {
                return { data: null, error: validationResult.error || 'Invalid coupon' };
            }

            if (!validationResult.coupon || validationResult.discount_amount === undefined) {
                return { data: null, error: 'Failed to apply coupon' };
            }

            // Return the applied coupon with discount amount
            return {
                data: {
                    coupon: validationResult.coupon,
                    discount_amount: validationResult.discount_amount,
                },
                error: null,
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to apply coupon' };
        }
    }

    /**
     * Track coupon usage when order is placed
     */
    async trackUsage(
        couponId: string,
        userId: string,
        orderId: string,
        discountAmount: number
    ): Promise<{ error: string | null }> {
        try {
            // Use a transaction-like approach by doing both operations
            // 1. Create usage record
            const { data: insertData, error: usageError } = await supabase
                .from(TABLES.COUPON_USAGE)
                .insert({
                    coupon_id: couponId,
                    user_id: userId,
                    order_id: orderId,
                    discount_amount: discountAmount,
                })
                .select();

            if (usageError) {
                console.error('[CouponService] Error creating usage record:', usageError);
                return { error: usageError.message };
            }

            // 2. Increment usage count
            const { error: updateError } = await supabase.rpc('increment_coupon_usage', {
                coupon_id: couponId,
            });

            if (updateError) {
                // If increment fails, try manual increment as fallback
                const { data: coupon } = await supabase
                    .from(TABLES.COUPONS)
                    .select('current_usage_count')
                    .eq('id', couponId)
                    .single();

                if (coupon) {
                    await supabase
                        .from(TABLES.COUPONS)
                        .update({ current_usage_count: coupon.current_usage_count + 1 })
                        .eq('id', couponId);
                }
            }

            return { error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('[CouponService] Exception in trackUsage:', err);
            return { error: err.message || 'Failed to track coupon usage' };
        }
    }

    // ============================================
    // Admin methods
    // ============================================

    /**
     * Create a new coupon
     */
    async createCoupon(
        couponData: Partial<Coupon>
    ): Promise<{ data: Coupon | null; error: string | null }> {
        try {
            // Generate code if not provided
            if (!couponData.code) {
                couponData.code = await this.generateCouponCode();
            } else {
                couponData.code = couponData.code.toUpperCase();
            }

            // Set defaults
            const couponToCreate = {
                ...couponData,
                current_usage_count: 0,
                is_active: couponData.is_active !== undefined ? couponData.is_active : true,
            };

            const { data, error } = await supabase
                .from(TABLES.COUPONS)
                .insert(couponToCreate)
                .select()
                .single();

            if (error) {
                console.error('Error creating coupon:', error);
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to create coupon' };
        }
    }

    /**
     * Update an existing coupon
     */
    async updateCoupon(
        couponId: string,
        updates: Partial<Coupon>
    ): Promise<{ data: Coupon | null; error: string | null }> {
        try {
            // Uppercase code if provided
            if (updates.code) {
                updates.code = updates.code.toUpperCase();
            }

            const { data, error } = await supabase
                .from(TABLES.COUPONS)
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', couponId)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to update coupon' };
        }
    }

    /**
     * Delete a coupon
     */
    async deleteCoupon(couponId: string): Promise<{ error: string | null }> {
        try {
            // Soft delete by setting is_active to false
            const { error } = await supabase
                .from(TABLES.COUPONS)
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', couponId);

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { error: err.message || 'Failed to delete coupon' };
        }
    }

    /**
     * Get all coupons (optionally include inactive)
     */
    async getCoupons(
        includeInactive: boolean = false
    ): Promise<{ data: Coupon[] | null; error: string | null }> {
        try {
            let query = supabase.from(TABLES.COUPONS).select('*');

            if (!includeInactive) {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to fetch coupons' };
        }
    }

    /**
     * Get a single coupon by ID
     */
    async getCouponById(
        couponId: string
    ): Promise<{ data: Coupon | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.COUPONS)
                .select('*')
                .eq('id', couponId)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to fetch coupon' };
        }
    }

    /**
     * Get statistics for a specific coupon
     */
    async getCouponStatistics(
        couponId: string
    ): Promise<{ data: CouponStatistics | null; error: string | null }> {
        try {
            // Get usage data
            const { data: usageData, error: usageError } = await supabase
                .from(TABLES.COUPON_USAGE)
                .select('discount_amount, user_id')
                .eq('coupon_id', couponId);

            if (usageError) {
                return { data: null, error: usageError.message };
            }

            if (!usageData) {
                return {
                    data: {
                        total_uses: 0,
                        total_discount_given: 0,
                        unique_users: 0,
                        revenue_impact: 0,
                    },
                    error: null,
                };
            }

            // Calculate statistics
            const totalUses = usageData.length;
            const totalDiscountGiven = usageData.reduce(
                (sum, usage) => sum + usage.discount_amount,
                0
            );
            const uniqueUsers = new Set(usageData.map((usage) => usage.user_id)).size;

            return {
                data: {
                    total_uses: totalUses,
                    total_discount_given: Math.round(totalDiscountGiven * 100) / 100,
                    unique_users: uniqueUsers,
                    revenue_impact: Math.round(totalDiscountGiven * 100) / 100, // Negative impact
                },
                error: null,
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to fetch statistics' };
        }
    }

    /**
     * Generate a unique random coupon code
     */
    async generateCouponCode(): Promise<string> {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const length = 8; // Generate 8-character codes

        let code = '';
        let isUnique = false;

        while (!isUnique) {
            // Generate random code
            code = '';
            for (let i = 0; i < length; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            // Check if code already exists
            const { data } = await supabase
                .from(TABLES.COUPONS)
                .select('id')
                .eq('code', code)
                .single();

            if (!data) {
                isUnique = true;
            }
        }

        return code;
    }

    // ============================================
    // Helper methods
    // ============================================

    /**
     * Check if user has any previous orders (for first order validation)
     * Counts ALL orders except cancelled and refunded
     * This ensures first-order coupons can only be used on the very first order
     */
    private async checkFirstOrder(userId: string): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from(TABLES.ORDERS)
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .not('status', 'in', '(cancelled,refunded)');

            if (error) {
                return false;
            }

            return count === 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Calculate discount amount based on coupon and cart total
     */
    private calculateDiscount(coupon: Coupon, cartTotal: number): number {
        let discount = 0;

        if (coupon.discount_type === 'fixed') {
            // Fixed amount discount
            discount = coupon.discount_value;
        } else if (coupon.discount_type === 'percentage') {
            // Percentage discount
            discount = (cartTotal * coupon.discount_value) / 100;

            // Apply max discount cap if specified
            if (coupon.max_discount && discount > coupon.max_discount) {
                discount = coupon.max_discount;
            }
        }

        // Ensure discount never exceeds cart total
        if (discount > cartTotal) {
            discount = cartTotal;
        }

        // Round to 2 decimal places
        return Math.round(discount * 100) / 100;
    }

    /**
     * Check if user has already used a specific coupon beyond their limit
     * Returns true if user has reached or exceeded their usage limit
     */
    private async checkUserUsage(couponId: string, userId: string): Promise<boolean> {
        try {
            // Get the coupon to check usage_limit_per_user
            const { data: coupon, error: couponError } = await supabase
                .from(TABLES.COUPONS)
                .select('usage_limit_per_user, code')
                .eq('id', couponId)
                .single();

            if (couponError || !coupon) {
                return true; // Fail safe - if we can't check, don't allow usage
            }

            // If no limit is set (null or 0), user can use it unlimited times
            if (!coupon.usage_limit_per_user || coupon.usage_limit_per_user === 0) {
                return false;
            }

            // Count how many times user has used this coupon
            const { count, error } = await supabase
                .from(TABLES.COUPON_USAGE)
                .select('id', { count: 'exact', head: true })
                .eq('coupon_id', couponId)
                .eq('user_id', userId);

            if (error) {
                return true; // Fail safe - if we can't check, don't allow usage
            }

            const usageCount = count || 0;
            const hasReachedLimit = usageCount >= coupon.usage_limit_per_user;

            // Return true if user has reached or exceeded their limit
            return hasReachedLimit;
        } catch (error) {
            return true; // Fail safe - if we can't check, don't allow usage
        }
    }

    /**
     * Get user's coupon usage history
     */
    async getUserCouponHistory(
        userId: string
    ): Promise<{ data: any[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.COUPON_USAGE)
                .select(`
                    id,
                    discount_amount,
                    used_at,
                    coupon:${TABLES.COUPONS}(
                        code,
                        coupon_type,
                        discount_type,
                        discount_value,
                        valid_from,
                        valid_until,
                        is_active
                    ),
                    order:${TABLES.ORDERS}(
                        order_number,
                        status
                    )
                `)
                .eq('user_id', userId)
                .order('used_at', { ascending: false });

            if (error) {
                console.error('Error fetching user coupon history:', error);
                return { data: null, error: error.message };
            }

            // Transform data to include validity status
            const transformedData = data?.map((usage: any) => {
                const now = new Date();
                const validFrom = new Date(usage.coupon.valid_from);
                const validUntil = new Date(usage.coupon.valid_until);

                let validityStatus = 'active';
                if (!usage.coupon.is_active) {
                    validityStatus = 'inactive';
                } else if (now > validUntil) {
                    validityStatus = 'expired';
                } else if (now < validFrom) {
                    validityStatus = 'not_yet_active';
                }

                return {
                    usage_id: usage.id,
                    coupon_code: usage.coupon.code,
                    coupon_type: usage.coupon.coupon_type,
                    discount_type: usage.coupon.discount_type,
                    discount_value: usage.coupon.discount_value,
                    discount_amount: usage.discount_amount,
                    used_date: usage.used_at,
                    order_number: usage.order?.order_number,
                    order_status: usage.order?.status,
                    validity_status: validityStatus,
                    valid_from: usage.coupon.valid_from,
                    valid_until: usage.coupon.valid_until,
                };
            });

            return { data: transformedData || [], error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, error: err.message || 'Failed to fetch coupon history' };
        }
    }

    /**
     * Get all coupon usage records (Admin)
     */
    async getAllCouponUsage(
        page: number = 1,
        pageSize: number = 50
    ): Promise<{ data: any[] | null; total: number; error: string | null }> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from(TABLES.COUPON_USAGE)
                .select(`
                    id,
                    discount_amount,
                    used_at,
                    user_id,
                    coupon:${TABLES.COUPONS}(
                        code,
                        coupon_type,
                        discount_type,
                        discount_value,
                        valid_from,
                        valid_until,
                        is_active
                    ),
                    order:${TABLES.ORDERS}(
                        order_number,
                        status
                    )
                `, { count: 'exact' })
                .order('used_at', { ascending: false })
                .range(from, to);

            if (error) {
                return { data: null, total: 0, error: error.message };
            }

            return { data: data || [], total: count || 0, error: null };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { data: null, total: 0, error: err.message || 'Failed to fetch coupon usage' };
        }
    }
}

export const couponService = new CouponService();
export default couponService;
