'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import type { User, PaginatedResponse, ApiResponse, Notification } from '@/types'

export async function getUsers(
    page: number = 1,
    pageSize: number = 20,
    search?: string
): Promise<PaginatedResponse<User>> {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        }

        const { data, error, count } = await query.range(from, to)

        if (error) throw error

        return {
            data: data || [],
            total: count || 0,
            page,
            page_size: pageSize,
            has_more: (count || 0) > to + 1,
        }
    } catch (error) {
        console.error('Error fetching users:', error)
        return { data: [], total: 0, page, page_size: pageSize, has_more: false }
    }
}

export async function getUserById(userId: string) {
    try {
        const [user, orders] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
            supabaseAdmin
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10),
        ])

        if (user.error) throw user.error

        return {
            user: user.data,
            orders: orders.data || [],
        }
    } catch (error) {
        console.error('Error fetching user:', error)
        return null
    }
}

export async function toggleUserBlock(
    userId: string,
    block: boolean,
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_blocked: block })
            .eq('id', userId)

        if (error) throw error

        // Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: block ? 'user_blocked' : 'user_unblocked',
            resource_type: 'user',
            resource_id: userId,
            details: {},
        })

        revalidatePath('/dashboard/users')
        return { message: `User ${block ? 'blocked' : 'unblocked'} successfully` }
    } catch (error: any) {
        return { error: error.message || 'Failed to update user' }
    }
}

export async function sendNotification(
    title: string,
    body: string,
    type: string,
    userIds: string[] | null,
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        let targetUserIds: string[] = userIds || []

        // If userIds is null, send to all users
        if (!userIds) {
            const { data: users } = await supabaseAdmin.from('profiles').select('id')
            targetUserIds = users?.map((u) => u.id) || []
        }

        // Create notification for each user
        const notifications = targetUserIds.map((userId) => ({
            user_id: userId,
            type,
            title,
            body,
            is_read: false,
            created_at: new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin.from('notifications').insert(notifications)

        if (error) throw error

        // Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'notification_sent',
            resource_type: 'notification',
            resource_id: adminId,
            details: { title, recipient_count: targetUserIds.length },
        })

        revalidatePath('/dashboard/notifications')
        return { message: `Notification sent to ${targetUserIds.length} users` }
    } catch (error: any) {
        return { error: error.message || 'Failed to send notification' }
    }
}

export async function getNotificationHistory(
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResponse<any>> {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        return {
            data: data || [],
            total: count || 0,
            page,
            page_size: pageSize,
            has_more: (count || 0) > to + 1,
        }
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return { data: [], total: 0, page, page_size: pageSize, has_more: false }
    }
}
