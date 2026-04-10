'use client'

import { useState, useEffect } from 'react'
import { getOrders } from '@/app/actions/orders'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Truck, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Order } from '@/types'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function ShippingPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        setLoading(true)
        const result = await getOrders(1, 50, 'confirmed')
        setOrders(result.data.filter((o) => !o.tracking_number))
        setLoading(false)
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Shipping & DTDC</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Manage shipping and tracking information</p>
            </div>

            {/* Stats */}
            <ScrollReveal3D>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="stat-card animate-stagger-1 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Pending Shipping</p>
                            <p className="text-3xl font-extrabold text-amber-600 tracking-tight font-display">{orders.length}</p>
                        </div>
                        <div className="bg-amber-50 p-3.5 rounded-2xl ring-1 ring-amber-100">
                            <Package className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-2 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">In Transit</p>
                            <p className="text-3xl font-extrabold text-blue-600 tracking-tight font-display">0</p>
                        </div>
                        <div className="bg-blue-50 p-3.5 rounded-2xl ring-1 ring-blue-100">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-3 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Delivered</p>
                            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight font-display">0</p>
                        </div>
                        <div className="bg-emerald-50 p-3.5 rounded-2xl ring-1 ring-emerald-100">
                            <Package className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
            </div>
            </ScrollReveal3D>

            {/* Orders Pending Tracking */}
            <ScrollReveal3D delay={2}>
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-100">
                    <h2 className="text-lg font-bold text-dark-900">
                        Orders Pending Tracking Information
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-dark-500 font-medium">Loading orders...</span>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-dark-100/50 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <Truck className="h-8 w-8 text-dark-300" />
                        </div>
                        <p className="text-dark-400 text-sm font-medium">No orders pending tracking information</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Order Number</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Items</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Total</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Confirmed</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-100/60">
                                {orders.map((order) => (
                                    <tr key={order.id} className="table-row">
                                        <td className="px-5 py-4 whitespace-nowrap font-bold text-dark-900 text-sm">
                                            {order.order_number}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-sm">
                                                <p className="font-semibold text-dark-900">{order.user?.full_name}</p>
                                                <p className="text-dark-400 text-[13px]">{order.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-dark-500 font-medium">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-dark-900 tabular-nums">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-dark-400 font-medium">
                                            {formatDateTime(order.updated_at)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/dashboard/orders/${order.id}`}
                                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-semibold bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                                            >
                                                Add Tracking
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </ScrollReveal3D>
        </div>
    )
}
