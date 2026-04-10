// Order service for managing orders
import { supabase, TABLES } from './supabase';
import type { Order, OrderItem, OrderStatus, Address, PaymentMethod, Cart, OrderTimeline } from '../types';

interface CreateOrderParams {
    userId: string;
    cart: Cart;
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod: PaymentMethod;
    deliveryDate?: string;
    deliveryTimeSlot?: string;
    notes?: string;
    couponCode?: string;
    discount?: number;
}

class OrderService {
    // Create new order
    async createOrder(params: CreateOrderParams): Promise<{ data: Order | null; error: string | null }> {
        try {
            const { userId, cart, shippingAddress, billingAddress, paymentMethod, deliveryDate, deliveryTimeSlot, notes, couponCode, discount } = params;

            // Generate order number
            const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const orderData = {
                order_number: orderNumber,
                user_id: userId,
                status: 'pending' as OrderStatus,
                subtotal: cart.subtotal,
                discount: discount || cart.discount,
                tax: cart.tax,
                shipping: cart.shipping,
                total: discount ? cart.subtotal - discount + cart.tax + cart.shipping : cart.total,
                shipping_address: shippingAddress,
                billing_address: billingAddress || shippingAddress,
                payment_method: paymentMethod,
                payment_status: 'pending',
                coupon_code: couponCode,
                notes,
                delivery_date: deliveryDate,
                delivery_time_slot: deliveryTimeSlot,
            };

            // Create order
            const { data: order, error: orderError } = await supabase
                .from(TABLES.ORDERS)
                .insert(orderData)
                .select()
                .single();

            if (orderError) {
                return { data: null, error: orderError.message };
            }

            // Create order items
            const orderItems = cart.items.map((item) => ({
                order_id: order.id,
                item_id: item.item_id,
                variant_id: item.variant_id,
                name: item.item.name,
                item_name: item.item.name, // Required by DB schema
                sku: item.variant?.sku || item.item.sku,
                price: item.variant?.price || item.item.price,
                quantity: item.quantity,
                total: (item.variant?.price || item.item.price) * item.quantity,
                image_url: item.item.images?.[0]?.image_url,
            }));

            const { error: itemsError } = await supabase
                .from(TABLES.ORDER_ITEMS)
                .insert(orderItems);

            if (itemsError) {
                // Rollback order if items fail
                await supabase.from(TABLES.ORDERS).delete().eq('id', order.id);
                return { data: null, error: itemsError.message };
            }

            return { data: order, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get user orders
    async getUserOrders(
        userId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: Order[] | null; total: number; error: string | null }> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from(TABLES.ORDERS)
                .select(`
          *,
          items:${TABLES.ORDER_ITEMS}(*)
        `, { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                return { data: null, total: 0, error: error.message };
            }
            return { data, total: count || 0, error: null };
        } catch (error: any) {
            return { data: null, total: 0, error: error.message };
        }


    }

    // Get all orders (Admin)
    async getAllOrders(
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: Order[] | null; total: number; error: string | null }> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from(TABLES.ORDERS)
                .select(`
          *,
          items:${TABLES.ORDER_ITEMS}(*)
        `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                return { data: null, total: 0, error: error.message };
            }
            return { data, total: count || 0, error: null };
        } catch (error: any) {
            return { data: null, total: 0, error: error.message };
        }
    }

    // Get order by ID
    async getOrderById(orderId: string): Promise<{ data: Order | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ORDERS)
                .select(`
          *,
          items:${TABLES.ORDER_ITEMS}(*)
        `)
                .eq('id', orderId)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get order by order number
    async getOrderByNumber(orderNumber: string): Promise<{ data: Order | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ORDERS)
                .select(`
          *,
          items:${TABLES.ORDER_ITEMS}(*)
        `)
                .eq('order_number', orderNumber)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Update order status
    async updateOrderStatus(
        orderId: string,
        status: OrderStatus,
        trackingNumber?: string,
        trackingUrl?: string,
        courierName?: string
    ): Promise<{ error: string | null }> {
        try {
            const updates: Record<string, any> = {
                status,
                updated_at: new Date().toISOString(),
            };

            if (trackingNumber) updates.tracking_number = trackingNumber;
            if (trackingUrl) updates.tracking_url = trackingUrl;
            if (courierName) updates.courier_name = courierName;

            const { error } = await supabase
                .from(TABLES.ORDERS)
                .update(updates)
                .eq('id', orderId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // Cancel order
    async cancelOrder(orderId: string, reason?: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.ORDERS)
                .update({
                    status: 'cancelled' as OrderStatus,
                    cancel_reason: reason || null,
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // Get order timeline
    getOrderTimeline(order: Order): OrderTimeline[] {
        const timeline: OrderTimeline[] = [];
        const statuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
        const statusLabels = {
            pending: 'Order Placed',
            confirmed: 'Order Confirmed',
            preparing: 'Preparing Your Order',
            out_for_delivery: 'Out for Delivery',
            delivered: 'Delivered',
            cancelled: 'Order Cancelled',
            refunded: 'Refunded',
        };

        const currentIndex = statuses.indexOf(order.status);

        statuses.forEach((status, index) => {
            if (index <= currentIndex) {
                timeline.push({
                    status,
                    timestamp: index === currentIndex ? order.updated_at : order.created_at,
                    message: statusLabels[status],
                });
            }
        });

        return timeline;
    }

    // Subscribe to order status changes
    subscribeToOrder(orderId: string, callback: (order: Order) => void) {
        return supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: TABLES.ORDERS,
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    callback(payload.new as Order);
                }
            )
            .subscribe();
    }

    // Subscribe to user orders
    subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
        return supabase
            .channel(`user-orders-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: TABLES.ORDERS,
                    filter: `user_id=eq.${userId}`,
                },
                async () => {
                    const { data } = await this.getUserOrders(userId);
                    if (data) {
                        callback(data);
                    }
                }
            )
            .subscribe();
    }
}

export const orderService = new OrderService();
export default orderService;
