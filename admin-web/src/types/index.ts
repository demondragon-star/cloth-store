// Database Types
export interface Admin {
    id: string
    email: string
    full_name: string
    role: 'owner' | 'admin' | 'staff'
    is_admin: boolean
    avatar_url?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    full_name: string
    phone?: string
    avatar_url?: string
    is_blocked: boolean
    is_admin?: boolean
    notification_preferences: NotificationPreferences
    created_at: string
    updated_at: string
}

export interface NotificationPreferences {
    push_enabled: boolean
    email_enabled: boolean
    sms_enabled: boolean
    order_updates: boolean
    promotions: boolean
    new_arrivals: boolean
}

export interface Product {
    id: string
    name: string
    slug: string
    description: string
    short_description?: string
    price: number
    compare_at_price?: number
    sku: string
    category_id: string
    stock_quantity: number
    is_active: boolean
    is_featured: boolean
    rating_average: number
    rating_count: number
    tags: string[]
    sizes?: string[]
    image_urls?: string[]
    images: ProductImage[]
    variants: ProductVariant[]
    created_at: string
    updated_at: string
}

export interface ProductImage {
    id: string
    product_id: string
    image_url: string  // Database column name in item_images table
    alt_text?: string
    display_order: number
    is_primary: boolean
}

export interface ProductVariant {
    id: string
    product_id: string
    name: string
    sku: string
    price: number
    stock_quantity: number
    attributes: Record<string, string>
}

export interface Category {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
    icon?: string
    parent_id?: string
    display_order: number
    is_active: boolean
}

export interface Order {
    id: string
    order_number: string
    user_id: string
    user?: User
    status: OrderStatus
    subtotal: number
    discount: number
    tax: number
    shipping: number
    total: number
    shipping_address: Address
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    items: OrderItem[]
    tracking_number?: string
    tracking_url?: string
    tracking_qr_url?: string
    notes?: string
    coupon_code?: string
    coupon_type?: 'first_order' | 'cart_value' | 'party' | 'general'
    created_at: string
    updated_at: string
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'refunded'

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'

export interface OrderItem {
    id: string
    order_id: string
    product_id: string
    variant_id?: string
    name: string
    sku: string
    price: number
    quantity: number
    total: number
    image_url?: string
    removed_out_of_stock?: boolean
}

export interface Address {
    type: 'home' | 'work' | 'other'
    label: string
    full_name: string
    phone: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
}

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    body: string
    data?: Record<string, any>
    is_read: boolean
    created_at: string
}

export type NotificationType =
    | 'order_update'
    | 'promotion'
    | 'new_arrival'
    | 'price_drop'
    | 'back_in_stock'
    | 'system'

export interface AuditLog {
    id: string
    admin_id: string
    admin_name: string
    action: string
    resource_type: string
    resource_id: string
    details: Record<string, any>
    ip_address?: string
    created_at: string
}

export interface DashboardStats {
    total_orders: number
    pending_orders: number
    total_revenue: number
    total_products: number
    out_of_stock_products: number
    low_stock_products: number
    total_users: number
    active_users: number
}

export interface RevenueData {
    date: string
    revenue: number
    orders: number
}

export interface TopProduct {
    product_id: string
    product_name: string
    image_url?: string
    total_sold: number
    revenue: number
}

// API Response Types
export interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    page_size: number
    has_more: boolean
}

// Form Types
export interface LoginForm {
    email: string
    password: string
}

export interface ProductForm {
    name: string
    description: string
    short_description?: string
    price: number
    compare_at_price?: number
    category_id?: string // Made optional to allow products without categories
    stock_quantity: number
    sku: string
    tags: string[]
    sizes?: string[]
    image_urls?: string[]
    is_active: boolean
    is_featured: boolean
}

export interface OrderUpdateForm {
    status: OrderStatus
    tracking_number?: string
    tracking_url?: string
    notes?: string
}

export interface NotificationForm {
    title: string
    body: string
    type: NotificationType
    user_ids?: string[]
    send_to_all?: boolean
}
