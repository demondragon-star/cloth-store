'use server'

import { supabaseAdmin } from '@/lib/supabase'
import type { DashboardStats, RevenueData, TopProduct } from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        // Get total orders
        const { count: totalOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })

        // Get pending orders
        const { count: pendingOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')

        // Get total revenue
        const { data: revenueData } = await supabaseAdmin
            .from('orders')
            .select('total')
            .in('status', ['delivered', 'out_for_delivery', 'preparing', 'confirmed'])

        const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0

        // Get total products
        const { count: totalProducts } = await supabaseAdmin
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)

        // Get out of stock products
        const { count: outOfStockProducts } = await supabaseAdmin
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('stock_quantity', 0)

        // Get low stock products
        const { count: lowStockProducts } = await supabaseAdmin
            .from('items')
            .select('*', { count: 'exact', head: true })
            .gt('stock_quantity', 0)
            .lte('stock_quantity', 5)

        // Get total users
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        // Get active users (users who placed orders in last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: activeUserIds } = await supabaseAdmin
            .from('orders')
            .select('user_id')
            .gte('created_at', thirtyDaysAgo.toISOString())

        const activeUsers = new Set(activeUserIds?.map(o => o.user_id)).size

        return {
            total_orders: totalOrders || 0,
            pending_orders: pendingOrders || 0,
            total_revenue: totalRevenue,
            total_products: totalProducts || 0,
            out_of_stock_products: outOfStockProducts || 0,
            low_stock_products: lowStockProducts || 0,
            total_users: totalUsers || 0,
            active_users: activeUsers,
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        throw error
    }
}

export async function getRevenueData(days: number = 7): Promise<RevenueData[]> {
    try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('created_at, total, status')
            .gte('created_at', startDate.toISOString())
            .in('status', ['delivered', 'out_for_delivery', 'preparing', 'confirmed'])
            .order('created_at', { ascending: true })

        // Group by date
        const revenueByDate: Record<string, { revenue: number; orders: number }> = {}

        orders?.forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0]
            if (!revenueByDate[date]) {
                revenueByDate[date] = { revenue: 0, orders: 0 }
            }
            revenueByDate[date].revenue += order.total
            revenueByDate[date].orders += 1
        })

        return Object.entries(revenueByDate).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            orders: data.orders,
        }))
    } catch (error) {
        console.error('Error fetching revenue data:', error)
        return []
    }
}

export async function getNewlyArrivedProducts(limit: number = 5): Promise<TopProduct[]> {
    try {
        const { data: products } = await supabaseAdmin
            .from('items')
            .select('id, name, price, stock_quantity, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (!products) return []

        return products.map(product => ({
            product_id: product.id,
            product_name: product.name,
            image_url: undefined,
            total_sold: 0,
            revenue: product.price,
        }))
    } catch (error) {
        console.error('Error fetching newly arrived products:', error)
        return []
    }
}
