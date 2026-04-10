// Color Variant Service - manage product color variants
import { supabase, TABLES } from './supabase';

export interface ColorVariant {
    id: string;
    item_id: string;
    color: string;        // e.g. 'Red', 'Navy Blue'
    color_hex: string;    // e.g. '#FF0000'
    image_url: string;    // main image for this color
    stock: number;
    created_at: string;
    updated_at: string;
}

class ColorVariantService {
    // Get all color variants for an item
    async getVariants(itemId: string): Promise<{ data: ColorVariant[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.COLOR_VARIANTS)
                .select('*')
                .eq('item_id', itemId)
                .order('created_at', { ascending: true });

            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Upsert a color variant (create or update)
    async upsertVariant(variant: Partial<ColorVariant> & { item_id: string }): Promise<{ data: ColorVariant | null; error: string | null }> {
        try {
            const payload = {
                ...variant,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from(TABLES.COLOR_VARIANTS)
                .upsert(payload, { onConflict: 'id' })
                .select()
                .single();

            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Delete a color variant
    async deleteVariant(variantId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.COLOR_VARIANTS)
                .delete()
                .eq('id', variantId);

            if (error) return { error: error.message };
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}

export const colorVariantService = new ColorVariantService();
export default colorVariantService;
