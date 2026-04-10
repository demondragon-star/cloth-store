'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getOrders } from '@/app/actions/orders'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Bell,
    Truck,
    FileText,
    Settings,
    LogOut,
    Boxes,
    Tag,
    ChevronRight,
    Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/app/actions/auth'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'from-indigo-500 to-purple-500' },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, showBadge: true, color: 'from-amber-500 to-orange-500' },
    { name: 'Products', href: '/dashboard/products', icon: Package, color: 'from-blue-500 to-cyan-500' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Boxes, color: 'from-emerald-500 to-teal-500' },
    { name: 'Coupons', href: '/dashboard/coupons', icon: Tag, color: 'from-pink-500 to-rose-500' },
    { name: 'Users', href: '/dashboard/users', icon: Users, color: 'from-violet-500 to-purple-500' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, color: 'from-cyan-500 to-blue-500' },
    { name: 'Shipping', href: '/dashboard/shipping', icon: Truck, color: 'from-green-500 to-emerald-500' },
    { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, color: 'from-slate-500 to-gray-500' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'from-gray-500 to-slate-500' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const [newOrdersCount, setNewOrdersCount] = useState(0)

    useEffect(() => {
        const fetchNewOrders = async () => {
            try {
                const result = await getOrders(1, 100, 'pending')
                setNewOrdersCount(result.total)
            } catch (error) {
                console.error('Error fetching new orders:', error)
            }
        }

        fetchNewOrders()
        const interval = setInterval(fetchNewOrders, 120000)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = async () => {
        await logout()
    }

    return (
        <div className="flex flex-col w-[280px] bg-white/95 backdrop-blur-2xl h-screen fixed left-0 top-0 z-50 border-r border-dark-100/40 shadow-elevated">
            {/* Logo Section */}
            <div className="px-6 py-7 border-b border-dark-100/40">
                <div className="flex items-center gap-3.5">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 p-3 rounded-2xl shadow-lg shadow-primary-200/60 flex-shrink-0">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold text-dark-900 tracking-tight truncate font-display">Clothes Store</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Sparkles className="h-3 w-3 text-primary-500" />
                            <p className="text-xs text-dark-400 font-medium truncate">Admin Workspace</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-5 px-3.5 space-y-0.5 scrollbar-thin">
                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-[0.12em] px-3 mb-3">Main Menu</p>
                {navigation.slice(0, 6).map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const showBadge = item.showBadge && newOrdersCount > 0

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                                isActive
                                    ? 'bg-primary-50/80 text-primary-700 shadow-sm shadow-primary-100/60'
                                    : 'text-dark-500 hover:bg-dark-50/80 hover:text-dark-800'
                            }`}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full shadow-sm shadow-primary-300" />
                            )}

                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                                isActive
                                    ? `bg-gradient-to-br ${item.color} shadow-sm`
                                    : 'bg-dark-100/50 group-hover:bg-dark-100'
                            }`}>
                                <item.icon
                                    className={`h-4 w-4 transition-colors ${
                                        isActive ? 'text-white' : 'text-dark-400 group-hover:text-dark-600'
                                    }`}
                                    size={16}
                                />
                            </div>
                            <span className={`text-[13px] font-medium flex-1 transition-colors ${isActive ? 'font-semibold' : ''}`}>
                                {item.name}
                            </span>
                            {showBadge && (
                                <Badge variant="destructive" className="ml-auto font-bold px-2 py-0.5 min-w-[20px] justify-center">
                                    {newOrdersCount > 99 ? '99+' : newOrdersCount}
                                </Badge>
                            )}
                            {isActive && !showBadge && (
                                <ChevronRight className="h-3.5 w-3.5 text-primary-400 ml-auto" />
                            )}
                        </Link>
                    )
                })}

                <div className="h-px bg-dark-100/60 mx-3 my-4" />
                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-[0.12em] px-3 mb-3">System</p>
                {navigation.slice(6).map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                                isActive
                                    ? 'bg-primary-50/80 text-primary-700 shadow-sm shadow-primary-100/60'
                                    : 'text-dark-500 hover:bg-dark-50/80 hover:text-dark-800'
                            }`}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full shadow-sm shadow-primary-300" />
                            )}

                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                                isActive
                                    ? `bg-gradient-to-br ${item.color} shadow-sm`
                                    : 'bg-dark-100/50 group-hover:bg-dark-100'
                            }`}>
                                <item.icon
                                    className={`h-4 w-4 transition-colors ${
                                        isActive ? 'text-white' : 'text-dark-400 group-hover:text-dark-600'
                                    }`}
                                    size={16}
                                />
                            </div>
                            <span className={`text-[13px] font-medium flex-1 ${isActive ? 'font-semibold' : ''}`}>
                                {item.name}
                            </span>
                            {isActive && (
                                <ChevronRight className="h-3.5 w-3.5 text-primary-400 ml-auto" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-dark-100/40 p-3.5 space-y-2">
                {/* Quick Status */}
                <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100/50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[11px] font-semibold text-primary-700">System Online</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-dark-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                    suppressHydrationWarning
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-dark-100/50 group-hover:bg-red-100 transition-all">
                        <LogOut className="h-4 w-4 text-dark-400 group-hover:text-red-500 transition-colors flex-shrink-0" size={16} />
                    </div>
                    <span className="text-[13px] font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    )
}
