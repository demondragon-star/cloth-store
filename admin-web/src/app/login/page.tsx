'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '../actions/auth'
import { Lock, Mail, ShoppingBag, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(email, password)

            if (result.success) {
                window.location.href = '/dashboard'
            } else {
                setError(result.error || 'Login failed')
                setLoading(false)
            }
        } catch (err) {
            setError('An error occurred during login')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-primary-950 to-violet-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0 animated-gradient opacity-30" />
            
            {/* Decorative blobs with enhanced effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-[100px] -translate-x-1/3 -translate-y-1/3 pointer-events-none animate-glow-pulse" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-500/15 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

            <div className="max-w-[440px] w-full space-y-8 animate-slide-up relative z-10">
                {/* Logo & Header */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-primary-500 via-purple-500 to-secondary-500 p-5 rounded-3xl shadow-2xl shadow-primary-900/50 ring-1 ring-white/20">
                                <ShoppingBag className="h-12 w-12 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    </div>
                    <h2 className="mt-7 text-4xl font-extrabold tracking-tight text-white font-display">
                        Admin Panel
                    </h2>
                    <p className="mt-2.5 text-sm text-primary-300/80 font-medium">
                        Sign in to manage your store
                    </p>
                </div>

                {/* Login Form - Premium Glass */}
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
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 focus:bg-white/[0.08] transition-all duration-300 text-sm"
                                        placeholder="••••••••"
                                        suppressHydrationWarning
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
                                        suppressHydrationWarning
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full overflow-hidden bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 hover:from-primary-600 hover:via-primary-700 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-900/50 hover:shadow-xl hover:shadow-primary-800/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97] group"
                                suppressHydrationWarning
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="relative">Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 relative" />
                                        <span className="relative">Sign in</span>
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <Link
                                    href="/signup"
                                    className="text-sm text-primary-300/70 hover:text-white transition-colors font-medium inline-flex items-center gap-1 group"
                                >
                                    Create new admin account 
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
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
