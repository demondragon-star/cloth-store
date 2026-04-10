'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserById, toggleUserBlock } from '@/app/actions/users'
import { getCurrentAdmin } from '@/app/actions/auth'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, Ban, CheckCircle, MapPin } from 'lucide-react'
import type { User as UserType, Admin } from '@/types'

interface Order {
    id: string
    order_number: string
    status: string
    total: number
    created_at: string
}

interface UserWithAdmin extends UserType {
    is_admin?: boolean
}

export default function UserDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    const [user, setUser] = useState<UserWithAdmin | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        loadUserDetails()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    const loadUserDetails = async () => {
        setLoading(true)
        const result = await getUserById(userId)
        if (result) {
            setUser(result.user)
            setOrders(result.orders)
        }
        setLoading(false)
    }

    const handleToggleBlock = async () => {
        if (!user) return
        
        const action = user.is_blocked ? 'unblock' : 'block'
        if (!confirm(`Are you sure you want to ${action} this user?`)) return

        setProcessing(true)
        const admin = await getCurrentAdmin()
        if (!admin) {
            setProcessing(false)
            return
        }

        const result = await toggleUserBlock(
            userId, 
            !user.is_blocked, 
            admin.id as string, 
            (admin.full_name as string) || 'Admin'
        )
        setProcessing(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            loadUserDetails()
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="bg-dark-100 p-4 rounded-2xl mb-4"><User className="h-8 w-8 text-dark-400" /></div>
                <p className="text-dark-500 font-medium">User not found</p>
            </div>
        )
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4 animate-slide-up">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 hover:bg-primary-50 rounded-xl transition-colors text-dark-500 hover:text-primary-600"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">User Details</h1>
                    <p className="text-dark-500 mt-1 text-sm font-medium">View and manage user information</p>
                </div>
                <button
                    onClick={handleToggleBlock}
                    disabled={processing}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                        user.is_blocked
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-200'
                            : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-200'
                    } disabled:opacity-50`}
                >
                    {user.is_blocked ? (
                        <>
                            <CheckCircle className="h-4 w-4" />
                            Unblock User
                        </>
                    ) : (
                        <>
                            <Ban className="h-4 w-4" />
                            Block User
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="lg:col-span-1">
                    <div className="card p-6 animate-stagger-1">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-200 ring-4 ring-white">
                                {user.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.avatar_url}
                                        alt={user.full_name}
                                        className="w-24 h-24 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <User className="h-12 w-12 text-white" />
                                )}
                            </div>
                            <h2 className="text-xl font-extrabold text-dark-900 mb-1">{user.full_name}</h2>
                            <div className="flex gap-2 mb-4">
                                <span
                                    className={`inline-flex px-3 py-1 text-xs font-bold rounded-xl ring-1 ${
                                        user.is_blocked
                                            ? 'bg-red-50 text-red-700 ring-red-200'
                                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                    }`}
                                >
                                    {user.is_blocked ? 'Blocked' : 'Active'}
                                </span>
                                {user.is_admin && (
                                    <span className="inline-flex px-3 py-1 text-xs font-bold bg-violet-50 text-violet-700 rounded-xl ring-1 ring-violet-200">
                                        Admin
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 mt-6">
                            <div className="flex items-start gap-3">
                                <div className="bg-primary-50 p-2 rounded-xl ring-1 ring-primary-100 mt-0.5">
                                    <Mail className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">Email</p>
                                    <p className="text-dark-800 text-sm font-medium">{user.email}</p>
                                </div>
                            </div>

                            {user.phone && (
                                <div className="flex items-start gap-3">
                                    <div className="bg-emerald-50 p-2 rounded-xl ring-1 ring-emerald-100 mt-0.5">
                                        <Phone className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">Phone</p>
                                        <p className="text-dark-800 text-sm font-medium">{user.phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className="bg-amber-50 p-2 rounded-xl ring-1 ring-amber-100 mt-0.5">
                                    <Calendar className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">Member Since</p>
                                    <p className="text-dark-800 text-sm font-medium">{formatRelativeTime(user.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="card p-6 mt-6 animate-stagger-2">
                        <h3 className="text-lg font-bold text-dark-900 mb-4">Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-xl ring-1 ring-blue-100">
                                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-dark-600 text-sm font-medium">Total Orders</span>
                                </div>
                                <span className="text-xl font-extrabold text-dark-900">{orders.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-50 p-2 rounded-xl ring-1 ring-emerald-100">
                                        <span className="text-sm w-4 h-4 flex items-center justify-center text-emerald-600 font-bold">$</span>
                                    </div>
                                    <span className="text-dark-600 text-sm font-medium">Total Spent</span>
                                </div>
                                <span className="text-xl font-extrabold text-dark-900">
                                    ${totalSpent.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders History */}
                <div className="lg:col-span-2">
                    <div className="card animate-stagger-3">
                        <div className="p-6 border-b border-dark-100">
                            <h3 className="text-lg font-bold text-dark-900">Recent Orders</h3>
                        </div>
                        {orders.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="bg-dark-100 p-4 rounded-2xl inline-block mb-3">
                                    <ShoppingBag className="h-8 w-8 text-dark-300" />
                                </div>
                                <p className="text-dark-400 font-medium">No orders yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-dark-100">
                                {orders.map((order) => (
                                    <div key={order.id} className="p-6 hover:bg-dark-50/50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-semibold text-dark-900">
                                                    Order #{order.order_number}
                                                </p>
                                                <p className="text-[13px] text-dark-400">
                                                    {formatRelativeTime(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-dark-900">
                                                    ${order.total.toFixed(2)}
                                                </p>
                                                <span
                                                    className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-xl ring-1 ${
                                                        order.status === 'delivered'
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                            : order.status === 'cancelled'
                                                            ? 'bg-red-50 text-red-700 ring-red-200'
                                                            : 'bg-blue-50 text-blue-700 ring-blue-200'
                                                    }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
