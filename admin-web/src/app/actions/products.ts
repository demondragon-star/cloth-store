// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import type { Product, PaginatedResponse, ProductForm, ApiResponse } from '@/types'

export async function getProducts(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    categoryId?: string,
    stockFilter?: 'all' | 'low' | 'out'
): Promise<PaginatedResponse<Product>> {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabaseAdmin
            .from('items')
            .select(`
        *,
        images:item_images(*),
        variants:item_variants(*)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (search) {
            query = query.ilike('name', `%${search}%`)
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        if (stockFilter === 'out') {
            query = query.eq('stock_quantity', 0)
        } else if (stockFilter === 'low') {
            query = query.gt('stock_quantity', 0).lte('stock_quantity', 5)
        }

        const { data, error, count } = await query.range(from, to)

        if (error) throw error

        return {
            data: data || [],
            total: count || 0,
            page,
            page_size: pageSize,
            has_more: count ? (page * pageSize) < count : false,
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching products:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: pageSize,
            has_more: false,
        }
    }
}

export async function getProductById(productId: string): Promise<Product | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('items')
            .select(`
        *,
        images:item_images(*),
        variants:item_variants(*)
      `)
            .eq('id', productId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching product:', err);
        return null
    }
}

export async function createProduct(
    productData: ProductForm & { imageUrl?: string },
    adminId: string,
    adminName: string
): Promise<ApiResponse<Product>> {
    try {
        const { imageUrl, ...productFields } = productData as any

        // Ensure image_urls includes the legacy imageUrl if present
        const finalImageUrls = productData.image_urls || [];
        if (imageUrl && !finalImageUrls.includes(imageUrl)) {
            finalImageUrls.unshift(imageUrl);
        }

        // Update productFields to include the consolidated list
        productFields.image_urls = finalImageUrls;

        const { data, error } = await supabaseAdmin
            .from('items')
            .insert({
                ...productFields,
                slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) throw error

        // Batch insert images into item_images table for normalization/legacy support
        if (finalImageUrls.length > 0) {
            const imageRecords = finalImageUrls.map((url: string, index: number) => ({
                item_id: data.id,
                image_url: url,  // Use 'image_url' field - actual database column name
                display_order: index,
                is_primary: index === 0,
            }));

            const { error: imageError } = await supabaseAdmin.from('item_images').insert(imageRecords);

            if (imageError) {
                console.error('Error saving item_images:', imageError);
            }
        }

        // Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'product_created',
            resource_type: 'product',
            resource_id: data.id,
            details: { product_name: productData.name },
        })

        revalidatePath('/dashboard/products')
        return { data, message: 'Product created successfully' }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return { error: err.message || 'Failed to create product' }
    }
}

export async function updateProduct(
    productId: string,
    productData: Partial<ProductForm> & { imageUrl?: string; image_urls?: string[] },
    adminId: string,
    adminName: string
): Promise<ApiResponse<Product>> {
    try {
        const { imageUrl, ...productFields } = productData as any

        // Handle image URLs
        let finalImageUrls = productData.image_urls;

        // Backward compatibility: if no list but single url provided
        if ((!finalImageUrls || finalImageUrls.length === 0) && imageUrl) {
            finalImageUrls = [imageUrl];
        }

        // If we have a definitive list of images, sync it
        if (finalImageUrls) {
            productFields.image_urls = finalImageUrls;

            // 1. Delete existing item_images mapping (simple approach: replace all)
            await supabaseAdmin.from('item_images').delete().eq('item_id', productId);

            // 2. Insert new mapping
            if (finalImageUrls.length > 0) {
                const imageRecords = finalImageUrls.map((url: string, index: number) => ({
                    item_id: productId,
                    image_url: url,  // Use 'image_url' field - actual database column name
                    display_order: index,
                    is_primary: index === 0,
                }));
                await supabaseAdmin.from('item_images').insert(imageRecords);
            }
        }

        const { data, error } = await supabaseAdmin
            .from('items')
            .update({
                ...productFields,
                updated_at: new Date().toISOString(),
            })
            .eq('id', productId)
            .select()
            .single()

        if (error) throw error

        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'product_updated',
            resource_type: 'product',
            resource_id: productId,
            details: { changes: productData },
        })

        revalidatePath('/dashboard/products')
        revalidatePath(`/dashboard/products/${productId}`)
        return { data, message: 'Product updated successfully' }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return { error: err.message || 'Failed to update product' }
    }
}

export async function deleteProduct(
    productId: string,
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        // 1. Get product details for logging
        const { data: product } = await supabaseAdmin
            .from('items')
            .select('name')
            .eq('id', productId)
            .single();

        // 2. Get product images to delete from storage
        const { data: images } = await supabaseAdmin
            .from('item_images')
            .select('image_url')
            .eq('item_id', productId);

        // 3. Check for orders with this product
        const { data: orderItems, count: orderCount } = await supabaseAdmin
            .from('order_items')
            .select('id', { count: 'exact', head: true })
            .eq('item_id', productId);

        // 4. Notify users who have ACTIVE orders with this item (pending/confirmed/preparing)
        const { data: activeOrders } = await supabaseAdmin
            .from('orders')
            .select(`
                id, 
                user_id, 
                status,
                items:order_items!inner(item_id)
            `)
            .in('status', ['pending', 'confirmed', 'preparing'])
            .eq('items.item_id', productId);

        if (activeOrders && activeOrders.length > 0) {
            const userIds = Array.from(new Set(activeOrders.map((o: any) => o.user_id)));
            const notifications = userIds.map(userId => ({
                user_id: userId,
                type: 'system',
                title: 'Product Discontinued',
                message: `${product?.name || 'A product'} in your active order has been discontinued. Your order details are preserved.`,
                data: { productId },
                is_read: false
            }));

            if (notifications.length > 0) {
                await supabaseAdmin.from('notifications').insert(notifications);
            }
        }

        // 5. Manually delete related records first to ensure no orphans if CASCADE fails or isn't set
        await Promise.all([
            supabaseAdmin.from('item_variants').delete().eq('product_id', productId),
            supabaseAdmin.from('product_categories').delete().eq('product_id', productId),
            supabaseAdmin.from('cart_items').delete().eq('item_id', productId),
            supabaseAdmin.from('wishlist').delete().eq('item_id', productId),
            supabaseAdmin.from('product_waitlist').delete().eq('product_id', productId),
            supabaseAdmin.from('reviews').delete().eq('item_id', productId),
            supabaseAdmin.from('item_images').delete().eq('item_id', productId)
        ]);

        // 6. Delete the product
        // SET NULL will preserve: order_items (historical data preserved) natively via DB constraint or lack thereof
        const { error } = await supabaseAdmin
            .from('items')
            .delete()
            .eq('id', productId)

        if (error) {
            throw error
        }

        // 6. Delete images from storage (optional cleanup)
        if (images && images.length > 0) {
            for (const img of images) {
                if (img.image_url && img.image_url.includes('supabase')) {
                    try {
                        // Extract file path from URL
                        const urlParts = img.image_url.split('/storage/v1/object/public/products/');
                        if (urlParts.length > 1) {
                            const filePath = urlParts[1];
                            await supabaseAdmin.storage.from('products').remove([filePath]);
                        }
                    } catch (storageError) {
                        console.error('Failed to delete image from storage:', storageError);
                        // Continue even if storage deletion fails
                    }
                }
            }
        }

        // 7. Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'product_deleted',
            resource_type: 'product',
            resource_id: productId,
            details: { 
                product_name: product?.name,
                deleted_images: images?.length || 0,
                affected_orders: orderCount || 0,
                affected_active_orders: activeOrders?.length || 0
            },
        })

        revalidatePath('/dashboard/products')
        
        const message = orderCount && orderCount > 0
            ? `Product deleted successfully. ${orderCount} historical order(s) preserved.`
            : 'Product and all related data deleted successfully';
            
        return { message }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return { error: err.message || 'Failed to delete product' }
    }
}

export async function updateStock(
    productId: string,
    newStock: number,
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        // 1. Get current stock to check for 0 -> >0 transition
        const { data: currentItem, error: fetchError } = await supabaseAdmin
            .from('items')
            .select('stock_quantity, name')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        const previousStock = currentItem.stock_quantity;

        // 2. Update stock
        const { error } = await supabaseAdmin
            .from('items')
            .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
            .eq('id', productId)

        if (error) throw error

        // 3. Trigger "Back in Stock" notifications
        if (previousStock === 0 && newStock > 0) {
            // Fetch users waiting for this product who haven't been notified yet
            const { data: waitlistEntries, error: waitlistError } = await supabaseAdmin
                .from('product_waitlist')
                .select('user_id')
                .eq('product_id', productId)
                .is('notified_at', null);

            if (!waitlistError && waitlistEntries && waitlistEntries.length > 0) {
                const notifications = waitlistEntries.map(entry => ({
                    user_id: entry.user_id,
                    type: 'back_in_stock',
                    title: 'Back in Stock!',
                    body: `Good news! ${currentItem.name} is back in stock. keys`,
                    data: { productId },
                    is_read: false
                }));

                const { error: notifyError } = await supabaseAdmin.from('notifications').insert(notifications);

                if (!notifyError) {
                    // Mark waitlist entries as notified
                    const userIds = waitlistEntries.map(e => e.user_id);
                    await supabaseAdmin
                        .from('product_waitlist')
                        .update({ notified_at: new Date().toISOString() })
                        .eq('product_id', productId)
                        .in('user_id', userIds);
                }
            }
        }

        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'stock_updated',
            resource_type: 'product',
            resource_id: productId,
            details: { new_stock: newStock, previous_stock: previousStock },
        })

        revalidatePath('/dashboard/products')
        revalidatePath('/dashboard/inventory')
        return { message: 'Stock updated successfully' }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return { error: err.message || 'Failed to update stock' }
    }
}

export async function getCategories() {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching categories:', err);
        return []
    }
}

// ============================================
// MULTI-CATEGORY MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get all categories assigned to a product
 * @param productId - The product ID
 * @returns Array of category objects with their details
 */
export async function getProductCategories(productId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('product_categories')
            .select(`
                category_id,
                categories:category_id (
                    id,
                    name,
                    slug,
                    icon,
                    display_order
                )
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: true })

        if (error) throw error

        // Flatten the structure for easier use
        const categories = data?.map((item: any) => item.categories).filter(Boolean) || []
        return categories
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching product categories:', err);
        return []
    }
}

/**
 * Get category IDs for a product (lightweight version)
 * @param productId - The product ID
 * @returns Array of category IDs
 */
export async function getProductCategoryIds(productId: string): Promise<string[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('product_categories')
            .select('category_id')
            .eq('product_id', productId)

        if (error) throw error
        return data?.map((item: any) => item.category_id) || []
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching product category IDs:', err);
        return []
    }
}

/**
 * Update product categories (replaces all existing categories)
 * @param productId - The product ID
 * @param categoryIds - Array of category IDs to assign
 * @param adminId - Admin user ID for audit log
 * @param adminName - Admin user name for audit log
 * @returns Success or error response
 */
export async function updateProductCategories(
    productId: string,
    categoryIds: string[],
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        // Validation: At least one category required
        if (!categoryIds || categoryIds.length === 0) {
            return { error: 'At least one category is required. Products must belong to at least one category.' }
        }

        // Validation: Remove duplicates
        const uniqueCategoryIds = Array.from(new Set(categoryIds))

        // Get current categories for audit log
        const currentCategories = await getProductCategoryIds(productId)

        // Step 1: Delete all existing category assignments
        const { error: deleteError } = await supabaseAdmin
            .from('product_categories')
            .delete()
            .eq('product_id', productId)

        if (deleteError) throw deleteError

        // Step 2: Insert new category assignments
        const categoryRecords = uniqueCategoryIds.map(categoryId => ({
            product_id: productId,
            category_id: categoryId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabaseAdmin
            .from('product_categories')
            .insert(categoryRecords)

        if (insertError) throw insertError

        // Step 3: Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'product_categories_updated',
            resource_type: 'product',
            resource_id: productId,
            details: {
                previous_categories: currentCategories,
                new_categories: uniqueCategoryIds,
                added: uniqueCategoryIds.filter(id => !currentCategories.includes(id)),
                removed: currentCategories.filter(id => !uniqueCategoryIds.includes(id)),
            },
        })

        // Step 4: Revalidate cache
        revalidatePath('/dashboard/products')
        revalidatePath(`/dashboard/products/${productId}`)

        return { message: 'Product categories updated successfully' }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error updating product categories:', err);
        return { error: err.message || 'Failed to update product categories' }
    }
}

/**
 * Add a single category to a product (without removing existing ones)
 * @param productId - The product ID
 * @param categoryId - Category ID to add
 * @param adminId - Admin user ID for audit log
 * @param adminName - Admin user name for audit log
 * @returns Success or error response
 */
export async function addProductCategory(
    productId: string,
    categoryId: string,
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        // Check if already exists
        const { data: existing } = await supabaseAdmin
            .from('product_categories')
            .select('id')
            .eq('product_id', productId)
            .eq('category_id', categoryId)
            .single()

        if (existing) {
            return { message: 'Category already assigned to this product' }
        }

        // Insert new category assignment
        const { error } = await supabaseAdmin
            .from('product_categories')
            .insert({
                product_id: productId,
                category_id: categoryId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

        if (error) throw error

        // Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'product_category_added',
            resource_type: 'product',
            resource_id: productId,
            details: { category_id: categoryId },
        })

        revalidatePath('/dashboard/products')
        revalidatePath(`/dashboard/products/${productId}`)

        return { message: 'Category added successfully' }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error adding product category:', err);
        return { error: err.message || 'Failed to add category' }
    }
}

/**
 * Remove a single category from a product
 * Note: Will fail if trying to remove the last category (enforced by database trigger)
 * @param productId - The product ID
 * @param categoryId - Category ID to remove
 * @param adminId - Admin user ID for audit log
 * @param adminName - Admin user name for audit log
 * @returns Success or error response
 */
export async function removeProductCategory(
    productId: string,
    categoryId: string,
    adminId: string,
    adminName: string
): Promise<ApiResponse<void>> {
    try {
        // The database trigger will prevent deletion if this is the last category
        const { error } = await supabaseAdmin
            .from('product_categories')
            .delete()
            .eq('product_id', productId)
            .eq('category_id', categoryId)

        if (error) {
            // Check if it's the "last category" error from our trigger
            if (error.message.includes('last category')) {
                return { error: 'Cannot remove the last category. Each product must have at least one category.' }
            }
            throw error
        }

        // Create audit log
        await supabaseAdmin.from('audit_logs').insert({
            admin_id: adminId,
            admin_name: adminName,
            action: 'product_category_removed',
            resource_type: 'product',
            resource_id: productId,
            details: { category_id: categoryId },
        })

        revalidatePath('/dashboard/products')
        revalidatePath(`/dashboard/products/${productId}`)

        return { message: 'Category removed successfully' }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error removing product category:', err);
        return { error: err.message || 'Failed to remove category' }
    }
}

/**
 * Get products by category (supports multi-category filtering)
 * @param categoryId - Category ID to filter by
 * @param page - Page number
 * @param pageSize - Items per page
 * @returns Paginated product list
 */
export async function getProductsByCategory(
    categoryId: string,
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResponse<Product>> {
    try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        // Get product IDs for this category
        const { data: productCategories, error: pcError } = await supabaseAdmin
            .from('product_categories')
            .select('product_id')
            .eq('category_id', categoryId)

        if (pcError) throw pcError

        const productIds = productCategories?.map((pc: any) => pc.product_id) || []

        if (productIds.length === 0) {
            return {
                data: [],
                total: 0,
                page,
                page_size: pageSize,
                has_more: false,
            }
        }

        // Get products
        const { data, error, count } = await supabaseAdmin
            .from('items')
            .select(`
                *,
                images:item_images(*),
                variants:item_variants(*)
            `, { count: 'exact' })
            .in('id', productIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) throw error

        return {
            data: data || [],
            total: count || 0,
            page,
            page_size: pageSize,
            has_more: count ? (page * pageSize) < count : false,
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error fetching products by category:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: pageSize,
            has_more: false,
        }
    }
}

