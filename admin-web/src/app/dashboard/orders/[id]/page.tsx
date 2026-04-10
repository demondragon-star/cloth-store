'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getOrderById, approveOrder, rejectOrder, addTracking } from '@/app/actions/orders'
import { getCurrentAdmin } from '@/app/actions/auth'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_STATUSES } from '@/lib/constants'
import { ArrowLeft, Check, X, Truck, Package, User, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { Order, Admin } from '@/types'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [showTrackingForm, setShowTrackingForm] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState('')
    const [trackingUrl, setTrackingUrl] = useState('')

    useEffect(() => {
        loadOrder()
    }, [id])

    const loadOrder = async () => {
        const data = await getOrderById(id)
        setOrder(data)
        setLoading(false)
    }

    const handleApprove = async () => {
        if (!confirm('Approve this order?')) return

        setProcessing(true)
        const admin = await getCurrentAdmin() as Admin | null
        if (!admin) {
            alert('Admin session not found')
            setProcessing(false)
            return
        }

        const result = await approveOrder(id, admin.id, admin.full_name)
        setProcessing(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            loadOrder()
        }
    }

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason (optional):')
        if (reason === null) return

        setProcessing(true)
        const admin = await getCurrentAdmin() as Admin | null
        if (!admin) {
            alert('Admin session not found')
            setProcessing(false)
            return
        }

        const result = await rejectOrder(id, admin.id, admin.full_name, reason)
        setProcessing(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            loadOrder()
        }
    }

    const handleAddTracking = async () => {
        if (!trackingNumber) {
            alert('Please enter tracking number')
            return
        }

        setProcessing(true)
        const admin = await getCurrentAdmin() as Admin | null
        if (!admin) {
            alert('Admin session not found')
            setProcessing(false)
            return
        }

        const result = await addTracking(
            id,
            trackingNumber,
            trackingUrl,
            admin.id,
            admin.full_name
        )
        setProcessing(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            setShowTrackingForm(false)
            loadOrder()
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="bg-dark-100 p-4 rounded-2xl mb-4"><Package className="h-8 w-8 text-dark-400" /></div>
                <p className="text-dark-500 font-medium">Order not found</p>
            </div>
        )
    }

    const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status)

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6 animate-slide-up">
                <Link
                    href="/dashboard/orders"
                    className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-600 mb-4 text-sm font-medium rounded-xl px-3 py-1.5 hover:bg-primary-50 transition-colors -ml-3"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Order {order.order_number}</h1>
                        <p className="text-dark-500 mt-1 text-sm font-medium">{formatDateTime(order.created_at)}</p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-bold rounded-2xl ring-1 ${statusInfo?.color}`}>
                        {statusInfo?.label}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            {order.status === 'pending' && (
                <div className="flex gap-3 mb-6 animate-stagger-1">
                    <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50 font-semibold transition-all"
                    >
                        <Check className="h-5 w-5" />
                        Approve Order
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={processing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 disabled:opacity-50 font-semibold transition-all"
                    >
                        <X className="h-5 w-5" />
                        Reject Order
                    </button>
                </div>
            )}

            {order.status === 'confirmed' && !order.tracking_number && (
                <div className="mb-6 animate-stagger-1">
                    <button
                        onClick={() => setShowTrackingForm(!showTrackingForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 font-semibold transition-all"
                    >
                        <Truck className="h-5 w-5" />
                        Add Tracking Information
                    </button>
                </div>
            )}

            {/* Tracking Form */}
            {showTrackingForm && (
                <div className="card p-6 mb-6 animate-slide-up">
                    <h3 className="text-lg font-bold text-dark-900 mb-4">Add Tracking Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Tracking Number *
                            </label>
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="input-field"
                                placeholder="DTDC123456789"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Tracking URL
                            </label>
                            <input
                                type="url"
                                value={trackingUrl}
                                onChange={(e) => setTrackingUrl(e.target.value)}
                                className="input-field"
                                placeholder="https://tracking.dtdc.in/..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddTracking}
                                disabled={processing}
                                className="btn-primary"
                            >
                                Save Tracking
                            </button>
                            <button
                                onClick={() => setShowTrackingForm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6 animate-stagger-2">
                        <h3 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-3">
                            <div className="bg-primary-50 p-2.5 rounded-xl ring-1 ring-primary-100">
                                <Package className="h-5 w-5 text-primary-600" />
                            </div>
                            Order Items
                        </h3>
                        <div className="space-y-4">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex gap-4 pb-4 border-b border-dark-100 last:border-0">
                                    <div className="flex-1">
                                        <p className="font-semibold text-dark-900">{item.name}</p>
                                        <p className="text-[13px] text-dark-400">SKU: {item.sku}</p>
                                        <p className="text-[13px] text-dark-400">Quantity: {item.quantity}</p>
                                        {item.removed_out_of_stock && (
                                            <span className="inline-block mt-1.5 badge-danger">
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-dark-900">{formatCurrency(item.total)}</p>
                                        <p className="text-[13px] text-dark-400">{formatCurrency(item.price)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-dark-100 space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-dark-500">Subtotal</span>
                                <span className="font-semibold text-dark-700">{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-dark-500">Discount</span>
                                        {order.coupon_code && (
                                            <span className="text-[11px] text-emerald-600 font-semibold">
                                                Code: {order.coupon_code}
                                                {order.coupon_type && (
                                                    <span className="ml-1">
                                                        ({order.coupon_type === 'first_order'
                                                            ? 'First Order'
                                                            : order.coupon_type === 'cart_value'
                                                                ? 'Cart Value'
                                                                : order.coupon_type === 'party'
                                                                    ? 'Party'
                                                                    : 'General'})
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-semibold text-emerald-600">
                                        -{formatCurrency(order.discount)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-dark-500">Tax</span>
                                <span className="font-semibold text-dark-700">{formatCurrency(order.tax)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-dark-500">Shipping</span>
                                <span className="font-semibold text-dark-700">{formatCurrency(order.shipping)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-extrabold pt-3 border-t border-dark-100 text-dark-900">
                                <span>Total</span>
                                <span>{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer & Shipping Info */}
                <div className="space-y-6">
                    {/* Customer */}
                    <div className="card p-6 animate-stagger-3">
                        <h3 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-3">
                            <div className="bg-violet-50 p-2.5 rounded-xl ring-1 ring-violet-100">
                                <User className="h-5 w-5 text-violet-600" />
                            </div>
                            Customer
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p className="font-semibold text-dark-900">{order.user?.full_name}</p>
                            <p className="text-dark-500">{order.user?.email}</p>
                            {order.user?.phone && <p className="text-dark-500">{order.user.phone}</p>}
                        </div>
                    </div>

                    {/* Coupon Applied */}
                    {order.coupon_code && (
                        <div className="card p-6 animate-stagger-4">
                            <h3 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-3">
                                <div className="bg-emerald-50 p-2.5 rounded-xl ring-1 ring-emerald-100">
                                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                Coupon Applied
                            </h3>
                            <div className="space-y-3">
                                <div className="bg-emerald-50 rounded-2xl p-4 ring-1 ring-emerald-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[13px] font-medium text-dark-600">Coupon Code</span>
                                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold rounded-xl">
                                            {order.coupon_code}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-medium text-dark-600">Discount Amount</span>
                                        <span className="text-lg font-extrabold text-emerald-600">
                                            -{formatCurrency(order.discount)}
                                        </span>
                                    </div>
                                    {order.coupon_type && (
                                        <div className="mt-2 pt-2 border-t border-emerald-200">
                                            <span className="text-[11px] text-dark-500">Type: </span>
                                            <span className="text-[11px] font-semibold text-dark-700">
                                                {order.coupon_type === 'first_order'
                                                    ? 'First Order Discount'
                                                    : order.coupon_type === 'cart_value'
                                                        ? 'Cart Value Discount'
                                                        : order.coupon_type === 'party'
                                                            ? 'Party Discount'
                                                            : 'General Discount'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shipping Address */}
                    <div className="card p-6 animate-stagger-5">
                        <h3 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-3">
                            <div className="bg-amber-50 p-2.5 rounded-xl ring-1 ring-amber-100">
                                <MapPin className="h-5 w-5 text-amber-600" />
                            </div>
                            Shipping Address
                        </h3>
                        <div className="space-y-1 text-sm text-dark-500">
                            <p className="font-semibold text-dark-900">{order.shipping_address.full_name}</p>
                            <p>{order.shipping_address.phone}</p>
                            <p>{order.shipping_address.address_line1}</p>
                            {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                            <p>
                                {order.shipping_address.city}, {order.shipping_address.state}{' '}
                                {order.shipping_address.postal_code}
                            </p>
                            <p>{order.shipping_address.country}</p>
                        </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking_number && (
                        <div className="card p-6 animate-stagger-6">
                            <h3 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-3">
                                <div className="bg-blue-50 p-2.5 rounded-xl ring-1 ring-blue-100">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                </div>
                                Tracking
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-dark-500">Tracking Number:</span>
                                    <p className="font-semibold text-dark-900">{order.tracking_number}</p>
                                </div>
                                {order.tracking_url && (
                                    <a
                                        href={order.tracking_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
                                    >
                                        Track Shipment →
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
