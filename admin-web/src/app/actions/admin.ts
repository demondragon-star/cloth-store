'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function createAdmin(
    email: string,
    password: string,
    fullName: string,
    role: 'owner' | 'admin' | 'staff'
) {
    try {
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
            },
        })

        if (authError) throw authError

        // Update profile to set as admin
        // @ts-ignore - Supabase type inference issue with React 19
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                is_admin: true,
                role: role,
                full_name: fullName,
            })
            .eq('id', authData.user.id)

        if (profileError) throw profileError

        revalidatePath('/dashboard/settings')
        return { success: true, message: 'Admin created successfully' }
    } catch (error: any) {
        console.error('Error creating admin:', error)
        return { success: false, error: error.message || 'Failed to create admin' }
    }
}
