import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client with cookie handling
export const supabase = createClientComponentClient<any, 'public', any>()

// Admin client with service role (server-side only)
// Use a function to ensure env vars are loaded
let adminClientInstance: ReturnType<typeof createClient<any, 'public', any>> | null = null

export const supabaseAdmin = (() => {
    // Prevent execution on client side
    if (typeof window !== 'undefined') {
        return null as unknown as ReturnType<typeof createClient<any, 'public', any>>
    }

    if (!adminClientInstance) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!serviceRoleKey) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables')
        }

        adminClientInstance = createClient<any, 'public', any>(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
    }
    return adminClientInstance
})()
