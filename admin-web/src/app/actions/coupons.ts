// @ts-nocheck
'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface Coupon {
    id: string
    code: string
    description?: string
    discount_type: 'fixed' | 'percentage'
    discount_value: number
    coupon_type?: 'first_order' | 'cart_value' | 'party' | 'general'
    min_cart_value: number
    max_discount?: number
    usage_limit_per_user: number
    total_usage_limit?: number
    current_usage_count: number
    valid_from: string
    valid_until: string
    is_active: boolean
    created_by?: string
    created_at: string
    updated_at: string
}

export interface CouponFormData {
    code: string
    description?: string
    discount_type: 'fixed' | 'percentage'
    discount_value: number
    coupon_type: 'first_order' | 'cart_value' | 'party' | 'general'
    min_cart_value: number
    max_discount?: number
    usage_limit_per_user: number
    total_usage_limit?: number
    valid_from: string
    valid_until: string
    is_active: boolean
}

/**
 * Get all coupons with optional filters
 */
export async function getCoupons(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    status: 'all' | 'active' | 'inactive' | 'expired' = 'all'
) {
    const offset = (page - 1) * limit

    let query = supabaseAdmin
        .from('coupons')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    // Search filter
    if (search) {
        query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Status filter
    const now = new Date().toISOString()
    if (status === 'active') {
        query = query.eq('is_active', true).gte('valid_until', now)
    } else if (status === 'inactive') {
        query = query.eq('is_active', false)
    } else if (status === 'expired') {
        query = query.lt('valid_until', now)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
        return { data: [], total: 0, error: error.message }
    }

    return { data: data || [], total: count || 0, error: null }
}

/**
 * Get a single coupon by ID
 */
export async function getCouponById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

/**
 * Create a new coupon
 */
export async function createCoupon(formData: CouponFormData, adminId: string) {
    const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        current_usage_count: 0,
        created_by: adminId,
    }

    const { data, error } = await supabaseAdmin
        .from('coupons')
        .insert(couponData as any)
        .select()
        .single()

    if (error) {
        return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/coupons')
    return { data, error: null }
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(id: string, formData: CouponFormData) {
    const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
    }

    const { data, error } = await supabaseAdmin
        .from('coupons')
        .update(couponData as any)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/coupons')
    revalidatePath(`/dashboard/coupons/${id}`)
    return { data, error: null }
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(id: string) {
    const { error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/coupons')
    return { success: true, error: null }
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponStatus(id: string, isActive: boolean) {
    const { data, error } = await supabaseAdmin
        .from('coupons')
        .update({ is_active: isActive } as any)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return { data: null, error: error.message }
    }

    revalidatePath('/dashboard/coupons')
    return { data, error: null }
}

/**
 * Get coupon usage statistics
 */
export async function getCouponStatistics(id: string) {
    const { data, error } = await supabaseAdmin
        .from('coupon_usage')
        .select('discount_amount, used_at, user_id')
        .eq('coupon_id', id)

    if (error) {
        return {
            total_uses: 0,
            total_discount_given: 0,
            unique_users: 0,
            error: error.message,
        }
    }

    const total_uses = data.length
    const total_discount_given = data.reduce((sum: number, usage: any) => sum + Number(usage.discount_amount), 0)
    const unique_users = new Set(data.map((usage: any) => usage.user_id)).size

    return {
        total_uses,
        total_discount_given,
        unique_users,
        error: null,
    }
}

/**
 * Generate a random coupon code
 */
export async function generateCouponCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}
