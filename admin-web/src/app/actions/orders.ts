'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import type { Order, PaginatedResponse, OrderStatus, ApiResponse } from '@/types'

export async function getOrders(
    page: number = 1,
    pageSize: number = 20,
    status?: OrderStatus,
    search?: string
): Promise<PaginatedResponse<Order>> {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabaseAdmin
            .from('orders')
            .select(`
        *,
        user:profiles!inner(id, email, full_name, phone),
        items:order_items(*)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        if (search) {
            // Search only in order_number field
            // Searching in nested relations requires a different approach
            query = query.ilike('order_number', `%${search}%`)
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
        console.error('Error fetching orders:', error)
        return { data: [], total: 0, page, page_size: pageSize, has_more: false }
    }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
        *,
        user:profiles!inner(*),
        items:order_items(*)
      `)
            .eq('id', orderId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching order:', error)
        return null
    }
}

export async function approveOrder(
    orderId: string,
    adminId: string,
    adminName: string
): Promise<ApiResponse<Order>> {
    try {
        // Get order with items
        const order = await getOrderById(orderId)
        if (!order) {
            return { error: 'Order not found' }
        }

        // Check stock for all items
        const stockUpdates: { productId: string; variantId?: string; quantity: number }[] = []
        const insufficientItems: string[] = []

        for (const item of order.items) {
            if (!item.removed_out_of_stock) {
                // Check stock
                // Note: database column in order_items is 'item_id', type is 'product_id'
                const productId = (item as any).item_id || item.product_id

                const { data: product } = await (supabaseAdmin as any)
                    .from('items')
                    .select('stock_quantity')
                    .eq('id', productId)
                    .single()

                if (!product) {
                    insufficientItems.push(item.name)
                } else if (product.stock_quantity < item.quantity) {
                    insufficientItems.push(item.name)
                    // Mark as removed
                    await (supabaseAdmin as any)
                        .from('order_items')
                        .update({ removed_out_of_stock: true })
                        .eq('id', item.id)
                } else {
                    stockUpdates.push({
                        productId: productId,
                        variantId: item.variant_id || undefined,
                        quantity: item.quantity,
                    })
                }
            }
        }

        // If all items are out of stock, cancel order
        const remainingItems = order.items.filter(
            item => !insufficientItems.includes(item.name) && !item.removed_out_of_stock
        )

        if (remainingItems.length === 0) {
            await (supabaseAdmin as any)
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId)

            // Create audit log
            await createAuditLog({
                admin_id: adminId,
                admin_name: adminName,
                action: 'order_cancelled_no_stock',
                resource_type: 'order',
                resource_id: orderId,
                details: { reason: 'All items out of stock' },
            })

            return { error: 'Order cancelled - all items out of stock' }
        }

        // Update stock quantities
        for (const update of stockUpdates) {
            await (supabaseAdmin as any).rpc('update_stock', {
                product_id: update.productId,
                quantity_delta: -update.quantity,
            })
        }

        // Update order status
        const { data: updatedOrder, error } = await (supabaseAdmin as any)
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', orderId)
            .select()
            .single()

        if (error) throw error

        // Create notification for user
        await (supabaseAdmin as any).from('notifications').insert({
            user_id: order.user_id,
            type: 'order_update',
            title: 'Order Confirmed',
            body: `Your order #${order.order_number} has been confirmed and is being prepared.`,
            data: { order_id: orderId },
        })

        // Send Push Notification
        await sendPushNotification(
            order.user_id,
            'Order Confirmed',
            `Your order #${order.order_number} has been confirmed and is being prepared.`,
            { order_id: orderId }
        )

        // Create audit log
        await createAuditLog({
            admin_id: adminId,
            admin_name: adminName,
            action: 'order_approved',
            resource_type: 'order',
            resource_id: orderId,
            details: { order_number: order.order_number },
        })

        revalidatePath('/dashboard/orders')
        return { data: updatedOrder, message: 'Order approved successfully' }
    } catch (error: any) {
        console.error('Error approving order:', error)
        return { error: error.message || 'Failed to approve order' }
    }
}

export async function rejectOrder(
    orderId: string,
    adminId: string,
    adminName: string,
    reason?: string
): Promise<ApiResponse<Order>> {
    try {
        const order = await getOrderById(orderId)
        if (!order) {
            return { error: 'Order not found' }
        }

        const { data, error } = await (supabaseAdmin as any)
            .from('orders')
            .update({ status: 'cancelled', notes: reason })
            .eq('id', orderId)
            .select()
            .single()

        if (error) throw error

        // Create notification
        await (supabaseAdmin as any).from('notifications').insert({
            user_id: order.user_id,
            type: 'order_update',
            title: 'Order Cancelled',
            body: `Your order #${order.order_number} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
            data: { order_id: orderId },
        })

        // Send Push Notification
        await sendPushNotification(
            order.user_id,
            'Order Cancelled',
            `Your order #${order.order_number} has been cancelled.`,
            { order_id: orderId }
        )

        // Create audit log
        await createAuditLog({
            admin_id: adminId,
            admin_name: adminName,
            action: 'order_rejected',
            resource_type: 'order',
            resource_id: orderId,
            details: { order_number: order.order_number, reason },
        })

        revalidatePath('/dashboard/orders')
        return { data, message: 'Order rejected successfully' }
    } catch (error: any) {
        return { error: error.message || 'Failed to reject order' }
    }
}

export async function addTracking(
    orderId: string,
    trackingNumber: string,
    trackingUrl: string,
    adminId: string,
    adminName: string
): Promise<ApiResponse<Order>> {
    try {
        const order = await getOrderById(orderId)
        if (!order) {
            return { error: 'Order not found' }
        }

        const { data, error } = await (supabaseAdmin as any)
            .from('orders')
            .update({
                status: 'out_for_delivery',
                tracking_number: trackingNumber,
                tracking_url: trackingUrl,
            })
            .eq('id', orderId)
            .select()
            .single()

        if (error) throw error

        // Create notification
        await (supabaseAdmin as any).from('notifications').insert({
            user_id: order.user_id,
            type: 'order_update',
            title: 'Order Shipped',
            body: `Your order #${order.order_number} is on its way! Tracking: ${trackingNumber}`,
            data: { order_id: orderId, tracking_number: trackingNumber },
        })

        // Send Push Notification
        await sendPushNotification(
            order.user_id,
            'Order Shipped',
            `Your order #${order.order_number} is on its way!`,
            { order_id: orderId, tracking_number: trackingNumber }
        )

        // Create audit log
        await createAuditLog({
            admin_id: adminId,
            admin_name: adminName,
            action: 'tracking_added',
            resource_type: 'order',
            resource_id: orderId,
            details: { tracking_number: trackingNumber },
        })

        revalidatePath('/dashboard/orders')
        revalidatePath(`/dashboard/orders/${orderId}`)
        return { data, message: 'Tracking information added successfully' }
    } catch (error: any) {
        return { error: error.message || 'Failed to add tracking' }
    }
}

async function createAuditLog(log: {
    admin_id: string
    admin_name: string
    action: string
    resource_type: string
    resource_id: string
    details: any
}) {
    await (supabaseAdmin as any).from('audit_logs').insert({
        ...log,
        created_at: new Date().toISOString(),
    })
}

async function sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: any = {}
) {
    try {
        // Fetch push tokens for user
        const { data: tokens } = await (supabaseAdmin as any)
            .from('push_tokens')
            .select('token')
            .eq('user_id', userId)

        if (!tokens || tokens.length === 0) return

        // Prepare messages
        const messages = tokens.map((t: { token: string }) => ({
            to: t.token,
            sound: 'default',
            title,
            body,
            data,
        }))

        // Send to Expo
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        })
    } catch (error) {
        console.error('Error sending push notification:', error)
    }
}
