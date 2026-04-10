// Address service
import { supabase, TABLES } from './supabase';
import type { Address } from '../types';

class AddressService {
    // Get user addresses
    async getAddresses(userId: string): Promise<{ data: Address[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ADDRESSES)
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get address by ID
    async getAddressById(addressId: string): Promise<{ data: Address | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ADDRESSES)
                .select('*')
                .eq('id', addressId)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get default address
    async getDefaultAddress(userId: string): Promise<{ data: Address | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.ADDRESSES)
                .select('*')
                .eq('user_id', userId)
                .eq('is_default', true)
                .single();

            if (error && error.code !== 'PGRST116') {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Add new address
    async addAddress(
        userId: string,
        address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ): Promise<{ data: Address | null; error: string | null }> {
        try {
            // If this is the default address, unset other defaults
            if (address.is_default) {
                await supabase
                    .from(TABLES.ADDRESSES)
                    .update({ is_default: false })
                    .eq('user_id', userId);
            }

            const { data, error } = await supabase
                .from(TABLES.ADDRESSES)
                .insert({
                    ...address,
                    user_id: userId,
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Update address
    async updateAddress(
        addressId: string,
        updates: Partial<Omit<Address, 'id' | 'user_id' | 'created_at'>>
    ): Promise<{ data: Address | null; error: string | null }> {
        try {
            // If setting as default, unset other defaults first
            if (updates.is_default) {
                const { data: currentAddress } = await this.getAddressById(addressId);
                if (currentAddress) {
                    await supabase
                        .from(TABLES.ADDRESSES)
                        .update({ is_default: false })
                        .eq('user_id', currentAddress.user_id);
                }
            }

            const { data, error } = await supabase
                .from(TABLES.ADDRESSES)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', addressId)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Delete address
    async deleteAddress(addressId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.ADDRESSES)
                .delete()
                .eq('id', addressId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    // Set default address
    async setDefaultAddress(userId: string, addressId: string): Promise<{ error: string | null }> {
        try {
            // Unset all defaults
            await supabase
                .from(TABLES.ADDRESSES)
                .update({ is_default: false })
                .eq('user_id', userId);

            // Set new default
            const { error } = await supabase
                .from(TABLES.ADDRESSES)
                .update({ is_default: true })
                .eq('id', addressId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}

export const addressService = new AddressService();
export default addressService;
