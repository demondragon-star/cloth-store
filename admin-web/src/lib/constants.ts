import type { OrderStatus, PaymentMethod, NotificationType } from '@/types'

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'netbanking', label: 'Net Banking' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'cod', label: 'Cash on Delivery' },
]

export const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
    { value: 'order_update', label: 'Order Update' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'new_arrival', label: 'New Arrival' },
    { value: 'price_drop', label: 'Price Drop' },
    { value: 'back_in_stock', label: 'Back in Stock' },
    { value: 'system', label: 'System' },
]

export const ADMIN_ROLES = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' },
]

export const PRODUCT_TAGS = [
    'Best Seller',
    'Flash Sale',
    'New Arrival',
    'Limited Edition',
    'Trending',
    'Sale',
    'Exclusive',
    'Featured',
]

export const STOCK_THRESHOLDS = {
    LOW_STOCK: 5,
    OUT_OF_STOCK: 0,
}

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZES: [10, 20, 50, 100],
}

export const TABLE_NAMES = {
    PROFILES: 'profiles',
    PRODUCTS: 'items',
    CATEGORIES: 'categories',
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    NOTIFICATIONS: 'notifications',
    AUDIT_LOGS: 'audit_logs',
    ADDRESSES: 'addresses',
} as const
