import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Cache admin status to reduce database calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute cache

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    
    try {
        // Skip middleware for server actions (POST requests to dashboard routes)
        // These are already protected by the page-level auth
        if (req.method === 'POST' && req.nextUrl.pathname.startsWith('/dashboard')) {
            return res
        }

        const supabase = createMiddlewareClient({ req, res })

        const {
            data: { session },
        } = await supabase.auth.getSession()

        // Public routes that don't require authentication
        const publicRoutes = ['/login', '/signup', '/unauthorized']
        const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

        // Check if user is authenticated
        if (!session) {
            if (!isPublicRoute) {
                return NextResponse.redirect(new URL('/login', req.url))
            }
        } else {
            // User IS authenticated

            // Redirect to dashboard if trying to access auth pages
            if (['/login', '/signup'].some(route => req.nextUrl.pathname.startsWith(route))) {
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }

            // Check Admin Status (only for protected routes and page loads, not server actions)
            if (!isPublicRoute && req.method === 'GET') {
                // Bypass for owner email to prevent lockout
                if (session.user.email === 'krishnateja0442@gmail.com') {
                    return res
                }

                // Check cache first
                const cached = adminCache.get(session.user.id)
                const now = Date.now()
                
                let isAdmin = false
                
                if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                    isAdmin = cached.isAdmin
                } else {
                    // Fetch from database
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('is_admin')
                        .eq('id', session.user.id)
                        .single()

                    isAdmin = profile?.is_admin || false
                    
                    // Update cache
                    adminCache.set(session.user.id, { isAdmin, timestamp: now })
                }

                if (!isAdmin) {
                    // Avoid redirect loop if already on unauthorized
                    if (req.nextUrl.pathname !== '/unauthorized') {
                        return NextResponse.redirect(new URL('/unauthorized', req.url))
                    }
                }
            }
        }

        return res
    } catch (error) {
        // If there's an error (e.g., Supabase connection issue), allow access to public routes
        const publicRoutes = ['/login', '/signup', '/unauthorized']
        const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))
        
        if (isPublicRoute) {
            return res
        }
        
        // For protected routes, redirect to login on error
        return NextResponse.redirect(new URL('/login', req.url))
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
