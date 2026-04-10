// Type definitions for the User Mobile App

// User Types
export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    is_admin?: boolean;
    role?: string;
    created_at: string;
    updated_at: string;
}

export interface UserProfile extends User {
    addresses: Address[];
    notification_preferences: NotificationPreferences;
}

export interface Address {
    id: string;
    user_id: string;
    type: 'home' | 'work' | 'other';
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    pincode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferences {
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
    order_updates: boolean;
    promotions: boolean;
    new_arrivals: boolean;
}

// Category Types
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    icon?: string;
    parent_id?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Subcategory extends Category {
    category_id: string;
}

// Item Types
export interface Item {
    id: string;
    name: string;
    slug: string;
    description: string;
    short_description?: string;
    price: number;
    compare_at_price?: number;
    sku: string;
    barcode?: string;
    category_id: string;
    subcategory_id?: string;
    images: ItemImage[];
    variants: ItemVariant[];
    stock_quantity: number;
    is_in_stock: boolean;
    is_active: boolean;
    is_featured: boolean;
    rating_average: number;
    rating_count: number;
    dimensions?: ItemDimensions;
    weight?: number;
    tags: string[];
    sizes?: string[];
    image_urls?: string[];
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

/**
 * ItemImage represents a product image stored in the item_images table.
 * Images are stored separately from items to support multiple images per product.
 * The 'image_url' property contains the image URL from Supabase storage or external sources.
 */
export interface ItemImage {
    id: string;
    item_id?: string;
    image_url: string;  // Database column name in item_images table
    alt_text?: string;
    display_order: number;  // Order in which images should be displayed (0 = first/primary)
    is_primary: boolean;  // Whether this is the primary/featured image
    created_at?: string;
    updated_at?: string;
}

export interface ItemVariant {
    id: string;
    item_id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    attributes: Record<string, string>;
}

export interface ItemDimensions {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
}

// Cart Types
export interface CartItem {
    id: string;
    user_id: string;
    item_id: string;
    variant_id?: string;
    quantity: number;
    item: Item;
    variant?: ItemVariant;
    created_at: string;
    updated_at: string;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    appliedCoupon?: AppliedCoupon;
}

// Coupon Types
export interface Coupon {
    id: string;
    code: string;
    description?: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    coupon_type?: 'first_order' | 'cart_value' | 'party' | 'general';
    min_cart_value: number;
    max_discount?: number;
    usage_limit_per_user: number;
    total_usage_limit?: number;
    current_usage_count: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface CouponUsage {
    id: string;
    coupon_id: string;
    user_id: string;
    order_id: string;
    discount_amount: number;
    used_at: string;
}

export interface CouponValidationResult {
    valid: boolean;
    error?: string;
    discount_amount?: number;
    coupon?: Coupon;
}

export interface AppliedCoupon {
    coupon: Coupon;
    discount_amount: number;
}

export interface CouponStatistics {
    total_uses: number;
    total_discount_given: number;
    unique_users: number;
    revenue_impact: number;
}

// Order Types
export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    total_amount: number;
    shipping_address: Address;
    billing_address?: Address;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    coupon_code?: string;
    coupon_type?: 'first_order' | 'cart_value' | 'party' | 'general';
    notes?: string;
    delivery_date?: string;
    delivery_time_slot?: string;
    tracking_number?: string;
    tracking_url?: string;
    courier_name?: string;
    cancel_reason?: string;
    cancelled_at?: string;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    item_id: string;
    variant_id?: string;
    name: string;
    item_name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    image_url?: string;
    item?: Item;
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface OrderTimeline {
    status: OrderStatus;
    timestamp: string;
    message: string;
}

// Wishlist Types
export interface WishlistItem {
    id: string;
    user_id: string;
    item_id: string;
    item: Item;
    created_at: string;
}

// Review Types
export interface Review {
    id: string;
    user_id: string;
    item_id: string;
    order_id?: string;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
    is_verified_purchase: boolean;
    helpful_count: number;
    created_at: string;
    updated_at: string;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

// Notification Types
export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

export type NotificationType =
    | 'order_update'
    | 'promotion'
    | 'new_arrival'
    | 'price_drop'
    | 'back_in_stock'
    | 'system';

// Payment Types
export interface Payment {
    id: string;
    order_id: string;
    user_id: string;
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
    payment_gateway: 'razorpay' | 'stripe';
    gateway_payment_id?: string;
    gateway_order_id?: string;
    status: PaymentStatus;
    receipt_url?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Search Types
export interface SearchResult {
    items: Item[];
    categories: Category[];
    total: number;
    page: number;
    page_size: number;
}

export interface SearchFilters {
    category_id?: string;
    subcategory_id?: string;
    min_price?: number;
    max_price?: number;
    rating?: number;
    in_stock?: boolean;
    tags?: string[];
    sort_by?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

// Alias for backward compatibility
export type ItemFilters = SearchFilters;

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
}

// Navigation Types
export type RootStackParamList = {
    Onboarding: undefined;
    Auth: undefined;
    Admin: undefined;
    Main: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: { token: string };
    ItemDetail: { itemId: string };
    CategoryItems: { categoryId: string; categoryName: string };
    SubcategoryItems: { subcategoryId: string; subcategoryName: string };
    Cart: undefined;
    Checkout: undefined;
    Payment: { orderId: string; amount: number; orderNumber: string };
    OrderSuccess: { orderId: string };
    OrderTracking: { orderId: string };
    OrderHistory: undefined;
    OrderDetail: { orderId: string };
    Profile: undefined;
    EditProfile: undefined;
    Addresses: undefined;
    AddAddress: undefined;
    EditAddress: { addressId: string };
    Notifications: undefined;
    Search: undefined;
    Wishlist: undefined;
    Settings: undefined;
    Help: undefined;
};

export type BottomTabParamList = {
    Home: undefined;
    Categories: undefined;
    Cart: undefined;
    Orders: undefined;
    Profile: undefined;
};
