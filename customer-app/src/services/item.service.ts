// Items and Categories service
import { supabase, TABLES } from './supabase';
import type { Item, Category, Subcategory, SearchFilters, PaginatedResponse, Review } from '../types';
import { PAGINATION_CONFIG } from '../constants/config';

class ItemService {
    // Get all categories
    async getCategories(): Promise<{ data: Category[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.CATEGORIES)
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get subcategories for a category
    async getSubcategories(categoryId: string): Promise<{ data: Subcategory[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.SUBCATEGORIES)
                .select('*')
                .eq('category_id', categoryId)
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get items with pagination and filters
    async getItems(
        filters: SearchFilters = {},
        page: number = 1,
        pageSize: number = PAGINATION_CONFIG.defaultPageSize
    ): Promise<{ data: PaginatedResponse<Item> | null; error: string | null }> {
        try {
            // If filtering by category, get product IDs from junction table first
            let productIds: string[] | null = null;
            if (filters.category_id) {
                const { data: productCategories, error: pcError } = await supabase
                    .from('product_categories')
                    .select('product_id')
                    .eq('category_id', filters.category_id);

                if (pcError) {
                    return { data: null, error: pcError.message };
                }

                productIds = productCategories?.map(pc => pc.product_id) || [];

                // If no products in this category, return empty result
                if (productIds.length === 0) {
                    return {
                        data: {
                            data: [],
                            total: 0,
                            page,
                            page_size: pageSize,
                            has_more: false,
                        },
                        error: null,
                    };
                }
            }

            let query = supabase
                .from(TABLES.ITEMS)
                .select(`
          *,
          images:${TABLES.ITEM_IMAGES}(
            id,
            image_url,
            alt_text,
            display_order,
            is_primary
          )
        `, { count: 'exact' })
                .eq('is_active', true);

            // Apply category filter using product IDs from junction table
            if (productIds) {
                query = query.in('id', productIds);
            }

            // Apply other filters
            if (filters.subcategory_id) {
                query = query.eq('subcategory_id', filters.subcategory_id);
            }
            if (filters.min_price !== undefined) {
                query = query.gte('price', filters.min_price);
            }
            if (filters.max_price !== undefined) {
                query = query.lte('price', filters.max_price);
            }
            if (filters.rating !== undefined) {
                query = query.gte('rating_average', filters.rating);
            }
            if (filters.in_stock) {
                query = query.gt('stock_quantity', 0);
            }

            // Apply sorting
            switch (filters.sort_by) {
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'rating':
                    query = query.order('rating_average', { ascending: false });
                    break;
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                default:
                    query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
            }

            // Apply pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: {
                    data: data || [],
                    total: count || 0,
                    page,
                    page_size: pageSize,
                    has_more: (count || 0) > page * pageSize,
                },
                error: null,
            };
        } catch (error: any) {
            return { data: null, error: error.message };
        }

    }

    // Get all items (Admin - includes inactive)
    async getAllItems(
        page: number = 1,
        pageSize: number = PAGINATION_CONFIG.defaultPageSize
    ): Promise<{ data: PaginatedResponse<Item> | null; error: string | null }> {
        try {
            const query = supabase
                .from(TABLES.ITEMS)
                .select(`
          *,
          images:${TABLES.ITEM_IMAGES}(
            id,
            image_url,
            alt_text,
            display_order,
            is_primary
          )
        `, { count: 'exact' })
                .order('created_at', { ascending: false });

            // Apply pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            const paginatedQuery = query.range(from, to);

            const { data, error, count } = await paginatedQuery;

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: {
                    data: data || [],
                    total: count || 0,
                    page,
                    page_size: pageSize,
                    has_more: (count || 0) > page * pageSize,
                },
                error: null,
            };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get single item by ID
    async getItemById(itemId: string): Promise<{ data: Item | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ITEMS)
                .select(`
          *,
          images:${TABLES.ITEM_IMAGES}(
            id,
            image_url,
            alt_text,
            display_order,
            is_primary
          ),
          variants:${TABLES.ITEM_VARIANTS}(*)
        `)
                .eq('id', itemId)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get featured items
    async getFeaturedItems(limit: number = 10): Promise<{ data: Item[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ITEMS)
                .select(`
          *,
          images:${TABLES.ITEM_IMAGES}(
            id,
            image_url,
            alt_text,
            display_order,
            is_primary
          )
        `)
                .eq('is_active', true)
                .eq('is_featured', true)
                .limit(limit);

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Search items
    async searchItems(
        query: string,
        filters: SearchFilters = {},
        page: number = 1,
        pageSize: number = PAGINATION_CONFIG.defaultPageSize
    ): Promise<{ data: PaginatedResponse<Item> | null; error: string | null }> {
        try {
            // If filtering by category, get product IDs from junction table first
            let productIds: string[] | null = null;
            if (filters.category_id) {
                const { data: productCategories, error: pcError } = await supabase
                    .from('product_categories')
                    .select('product_id')
                    .eq('category_id', filters.category_id);

                if (pcError) {
                    return { data: null, error: pcError.message };
                }

                productIds = productCategories?.map(pc => pc.product_id) || [];

                // If no products in this category, return empty result
                if (productIds.length === 0) {
                    return {
                        data: {
                            data: [],
                            total: 0,
                            page,
                            page_size: pageSize,
                            has_more: false,
                        },
                        error: null,
                    };
                }
            }

            let dbQuery = supabase
                .from(TABLES.ITEMS)
                .select(`
          *,
          images:${TABLES.ITEM_IMAGES}(
            id,
            image_url,
            alt_text,
            display_order,
            is_primary
          )
        `, { count: 'exact' })
                .eq('is_active', true)
                .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

            // Apply category filter using product IDs from junction table
            if (productIds) {
                dbQuery = dbQuery.in('id', productIds);
            }

            // Apply other filters
            if (filters.min_price !== undefined) {
                dbQuery = dbQuery.gte('price', filters.min_price);
            }
            if (filters.max_price !== undefined) {
                dbQuery = dbQuery.lte('price', filters.max_price);
            }

            // Apply pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            dbQuery = dbQuery.range(from, to);

            const { data, error, count } = await dbQuery;

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: {
                    data: data || [],
                    total: count || 0,
                    page,
                    page_size: pageSize,
                    has_more: (count || 0) > page * pageSize,
                },
                error: null,
            };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get item reviews
    async getItemReviews(
        itemId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: PaginatedResponse<Review> | null; error: string | null }> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from(TABLES.REVIEWS)
                .select(`
          *,
          user:${TABLES.USERS}(full_name, avatar_url)
        `, { count: 'exact' })
                .eq('item_id', itemId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: {
                    data: data || [],
                    total: count || 0,
                    page,
                    page_size: pageSize,
                    has_more: (count || 0) > page * pageSize,
                },
                error: null,
            };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Subscribe to item stock changes
    subscribeToItemStock(itemId: string, callback: (item: Item) => void) {
        return supabase
            .channel(`item-${itemId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: TABLES.ITEMS,
                    filter: `id=eq.${itemId}`,
                },
                (payload) => {
                    callback(payload.new as Item);
                }
            )
            .subscribe();
    }

    // Helper to get current admin info
    private async getCurrentAdmin() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from(TABLES.USERS)
            .select('id, full_name')
            .eq('id', user.id)
            .single();

        return profile;
    }

    // Create item (Admin)
    async createItem(itemData: Partial<Item>): Promise<{ data: Item | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ITEMS)
                .insert(itemData)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            // Audit
            const admin = await this.getCurrentAdmin();
            if (admin) {
                await supabase.from('audit_logs').insert({
                    admin_id: admin.id,
                    admin_name: admin.full_name || 'Admin',
                    action: 'product_created',
                    resource_type: 'product',
                    resource_id: data.id,
                    details: { product_name: data.name },
                });
            }

            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Upload item image
    async uploadImage(uri: string, fileType: string = 'image/jpeg', productId: string = 'temp'): Promise<{ url: string | null; error: string | null }> {
        try {
            // Extract file extension
            const ext = fileType.split('/')[1] || 'jpg';
            const filename = `${productId}/${Date.now()}.${ext}`;
            
            
            // For React Native, read the file as ArrayBuffer
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            
            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('products')
                .upload(filename, uint8Array, {
                    contentType: fileType,
                    upsert: false,
                });
            
            if (uploadError) {
                console.error('Upload error:', uploadError);
                return { url: null, error: uploadError.message };
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filename);
            
            
            return { url: publicUrl, error: null };
        } catch (error: any) {
            console.error('Upload exception:', error);
            return { url: null, error: error.message || 'Failed to upload image' };
        }
    }

    // Update item (Admin)
    async updateItem(itemId: string, updates: Partial<Item>): Promise<{ data: Item | null; error: string | null }> {
        try {
            // 1. Fetch current for logic
            const { data: currentItem } = await supabase.from(TABLES.ITEMS).select('stock_quantity, name').eq('id', itemId).single();
            const previousStock = currentItem?.stock_quantity || 0;

            const { data, error } = await supabase
                .from(TABLES.ITEMS)
                .update(updates)
                .eq('id', itemId)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            const admin = await this.getCurrentAdmin();

            // 2. Notification Logic
            const newStock = updates.stock_quantity;
            if (newStock !== undefined && previousStock === 0 && newStock > 0) {
                const { data: waitlistEntries } = await supabase
                    .from('product_waitlist')
                    .select('user_id')
                    .eq('product_id', itemId)
                    .is('notified_at', null);

                if (waitlistEntries && waitlistEntries.length > 0) {
                    const notifications = waitlistEntries.map(entry => ({
                        user_id: entry.user_id,
                        type: 'back_in_stock',
                        title: 'Back in Stock!',
                        body: `Good news! ${currentItem?.name} is back in stock.`,
                        data: { productId: itemId },
                        is_read: false
                    }));
                    await supabase.from('notifications').insert(notifications);

                    // Update notified_at
                    const userIds = waitlistEntries.map(e => e.user_id);
                    await supabase.from('product_waitlist')
                        .update({ notified_at: new Date().toISOString() })
                        .eq('product_id', itemId)
                        .in('user_id', userIds);
                }
            }

            // Audit
            if (admin) {
                await supabase.from('audit_logs').insert({
                    admin_id: admin.id,
                    admin_name: admin.full_name || 'Admin',
                    action: 'product_updated',
                    resource_type: 'product',
                    resource_id: itemId,
                    details: { changes: updates },
                });
            }

            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Delete item (Admin)
    async deleteItem(itemId: string): Promise<{ error: string | null }> {
        try {
            // 1. Get product images to delete from storage
            const { data: images } = await supabase
                .from(TABLES.ITEM_IMAGES)
                .select('image_url')
                .eq('item_id', itemId);

            // 2. Delete the product (CASCADE will delete item_images, cart_items, wishlist, etc.)
            const { error } = await supabase
                .from(TABLES.ITEMS)
                .delete()
                .eq('id', itemId);

            if (error) {
                return { error: error.message };
            }

            // 3. Delete images from storage (optional cleanup)
            if (images && images.length > 0) {
                for (const img of images) {
                    if (img.image_url && img.image_url.includes('supabase')) {
                        try {
                            // Extract file path from URL
                            const urlParts = img.image_url.split('/storage/v1/object/public/products/');
                            if (urlParts.length > 1) {
                                const filePath = urlParts[1];
                                await supabase.storage.from('products').remove([filePath]);
                            }
                        } catch (storageError) {
                            console.error('Failed to delete image from storage:', storageError);
                            // Continue even if storage deletion fails
                        }
                    }
                }
            }

            // 4. Audit
            const admin = await this.getCurrentAdmin();
            if (admin) {
                await supabase.from('audit_logs').insert({
                    admin_id: admin.id,
                    admin_name: admin.full_name || 'Admin',
                    action: 'product_deleted',
                    resource_type: 'product',
                    resource_id: itemId,
                    details: { deleted_images: images?.length || 0 },
                });
            }

            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}

export const itemService = new ItemService();
export default itemService;
