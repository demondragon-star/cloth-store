'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function login(email: string, password: string) {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { success: false, error: error.message }
    }

    // Verify user is admin using Service Role (Bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('is_admin, role')
        .eq('id', data.user.id)
        .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError)
        await supabase.auth.signOut()
        return { success: false, error: 'Error verifying admin status' }
    }

    if (!(profile as any)?.is_admin) {
        await supabase.auth.signOut()
        return { success: false, error: 'You do not have admin access' }
    }
    revalidatePath('/dashboard')
    return { success: true }
}

export async function logout() {
    const supabase = createServerActionClient({ cookies })
    await supabase.auth.signOut()
    revalidatePath('/login')
    return { success: true }
}

export async function getCurrentAdmin(): Promise<any> {
    const supabase = createServerActionClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return null

    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

    if (error) {
        console.error('Error fetching admin profile:', error)
        return null
    }

    return profile
}
