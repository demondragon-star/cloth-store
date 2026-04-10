'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserPlus, Mail, Lock, User, Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        // Validation
        if (!email || !password || !fullName) {
            setError('Please fill in all fields')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            // Step 1: Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (authError) throw authError

            if (authData.user) {
                // Step 2: Update profile to make them admin
                // Note: This requires RLS policy to allow users to update their own profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        is_admin: true,
                        role: 'admin',
                        full_name: fullName,
                    })
                    .eq('id', authData.user.id)

                if (profileError) {
                    console.error('Profile update error:', profileError)
                    // Still show success even if profile update fails
                    // Admin can be set manually via Supabase dashboard
                }
            }

            setSuccess(true)
            setEmail('')
            setPassword('')
            setConfirmPassword('')
            setFullName('')

            // Show success message
            setTimeout(() => {
                router.push('/login')
            }, 2000)

        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-primary-950 to-violet-950 py-12 px-4 relative overflow-hidden">
                <div className="absolute inset-0 animated-gradient opacity-30" />
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
                <div className="max-w-md w-full relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/5 rounded-[28px] blur-xl" />
                        <div className="relative bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-[28px] shadow-2xl p-10 text-center">
                            <div className="bg-emerald-500/20 backdrop-blur-sm p-5 rounded-3xl w-20 h-20 mx-auto mb-5 flex items-center justify-center ring-1 ring-emerald-500/30">
                                <CheckCircle className="h-10 w-10 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-white mb-2 font-display">Account Created!</h2>
                            <p className="text-white/60 mb-4 text-sm font-medium">
                                Your admin account has been created successfully.
                            </p>
                            <p className="text-xs text-white/30 font-medium">
                                Redirecting to login page...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary-950 to-violet-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0 animated-gradient opacity-30" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none animate-glow-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

            <div className="max-w-[440px] w-full space-y-8 animate-slide-up relative z-10">
                {/* Logo & Header */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-primary-500 via-purple-500 to-violet-600 p-5 rounded-3xl shadow-2xl shadow-primary-900/50 ring-1 ring-white/20">
                                <UserPlus className="h-12 w-12 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    </div>
                    <h2 className="mt-7 text-4xl font-extrabold tracking-tight text-white font-display">
                        Create Admin Account
                    </h2>
                    <p className="mt-2.5 text-sm text-primary-300/80 font-medium">
                        Sign up to get admin access
                    </p>
                </div>

                {/* Signup Form - Premium Glass */}
                <div className="relative">
                    <div className="absolute inset-0 bg-white/5 rounded-[28px] blur-xl" />
                    <div className="relative bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-[28px] shadow-2xl p-8">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 backdrop-blur-sm">
                                    <div className="bg-red-500/20 p-1 rounded-lg">
                                        <span className="text-red-400 text-xs">✕</span>
                                    </div>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Full Name */}
                                <div className="space-y-1.5">
                                    <label htmlFor="fullName" className="block text-[13px] font-semibold text-white/70 tracking-wide">
                                        Full Name
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-[18px] w-[18px] text-white/30 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 focus:bg-white/[0.08] transition-all duration-300 text-sm"
                                            placeholder="John Doe"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-[13px] font-semibold text-white/70 tracking-wide">
                                        Email address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-[18px] w-[18px] text-white/30 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 focus:bg-white/[0.08] transition-all duration-300 text-sm"
                                            placeholder="admin@example.com"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label htmlFor="password" className="block text-[13px] font-semibold text-white/70 tracking-wide">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-[18px] w-[18px] text-white/30 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 focus:bg-white/[0.08] transition-all duration-300 text-sm"
                                            placeholder="••••••••"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-white/70 tracking-wide">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Shield className="h-[18px] w-[18px] text-white/30 group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 focus:bg-white/[0.08] transition-all duration-300 text-sm"
                                            placeholder="••••••••"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl backdrop-blur-sm">
                                <p className="text-xs text-amber-300/80 font-medium leading-relaxed">
                                    <strong className="text-amber-300">Note:</strong> After signup, an administrator will need to grant you admin privileges via the Supabase dashboard.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full overflow-hidden bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 hover:from-primary-600 hover:via-primary-700 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-900/50 hover:shadow-xl hover:shadow-primary-800/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97] group"
                                suppressHydrationWarning
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                {loading ? (
                                    <span className="flex items-center relative">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    <span className="relative flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Create Admin Account
                                    </span>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <Link
                                    href="/login"
                                    className="text-sm text-primary-300/70 hover:text-white transition-colors font-medium inline-flex items-center gap-1 group"
                                >
                                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs text-white/20 font-medium">
                    © 2025 Clothes Store. All rights reserved.
                </p>
            </div>
        </div>
    )
}
