'use client'

import { useState, useEffect } from 'react'
import { getCoupons, deleteCoupon, toggleCouponStatus, type Coupon } from '@/app/actions/coupons'
import { Search, Plus, Edit, Trash2, Tag, Calendar, TrendingUp, Power, PowerOff } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        loadCoupons()
    }, [page, statusFilter])

    const loadCoupons = async () => {
        setLoading(true)
        const result = await getCoupons(page, 20, search, statusFilter)
        setCoupons(result.data)
        setTotal(result.total)
        setLoading(false)
    }

    const handleSearch = () => {
        setPage(1)
        loadCoupons()
    }

    const handleDelete = async (couponId: string, couponCode: string) => {
        if (!confirm(`Delete coupon "${couponCode}"? This action cannot be undone.`)) return

        const result = await deleteCoupon(couponId)
        if (result.error) {
            alert(`Error: ${result.error}`)
        } else {
            alert('Coupon deleted successfully')
            loadCoupons()
        }
    }

    const handleToggleStatus = async (couponId: string, currentStatus: boolean) => {
        const result = await toggleCouponStatus(couponId, !currentStatus)
        if (result.error) {
            alert(`Error: ${result.error}`)
        } else {
            loadCoupons()
        }
    }

    const getCouponTypeIcon = (type: string | undefined) => {
        if (!type) return '🎁'
        
        switch (type) {
            case 'first_order':
                return '🎉'
            case 'cart_value':
                return '🛒'
            case 'party':
                return '🎊'
            default:
                return '🎁'
        }
    }

    const getCouponTypeLabel = (type: string | undefined) => {
        if (!type) return 'GENERAL'
        return type.replace('_', ' ').toUpperCase()
    }

    const isExpired = (validUntil: string) => {
        return new Date(validUntil) < new Date()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Coupons</h1>
                    <p className="text-dark-500 mt-1 text-sm font-medium">Manage discount coupons and promotions</p>
                </div>
                <Link href="/dashboard/coupons/new" className="btn-primary flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Coupon
                </Link>
            </div>

            {/* Stats */}
            <ScrollReveal3D>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="stat-card animate-stagger-1 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Total Coupons</p>
                            <p className="text-3xl font-extrabold text-dark-900 tracking-tight font-display">{total}</p>
                        </div>
                        <div className="bg-blue-50 p-3.5 rounded-2xl ring-1 ring-blue-100">
                            <Tag className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-2 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Active</p>
                            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight font-display">
                                {coupons.filter((c) => c.is_active && !isExpired(c.valid_until)).length}
                            </p>
                        </div>
                        <div className="bg-emerald-50 p-3.5 rounded-2xl ring-1 ring-emerald-100">
                            <Power className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-3 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Inactive</p>
                            <p className="text-3xl font-extrabold text-dark-400 tracking-tight font-display">
                                {coupons.filter((c) => !c.is_active).length}
                            </p>
                        </div>
                        <div className="bg-dark-50 p-3.5 rounded-2xl ring-1 ring-dark-100">
                            <PowerOff className="h-6 w-6 text-dark-400" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-4 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Expired</p>
                            <p className="text-3xl font-extrabold text-red-600 tracking-tight font-display">
                                {coupons.filter((c) => isExpired(c.valid_until)).length}
                            </p>
                        </div>
                        <div className="bg-red-50 p-3.5 rounded-2xl ring-1 ring-red-100">
                            <Calendar className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>
            </ScrollReveal3D>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300 group-focus-within:text-primary-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search coupons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="input-field pl-11"
                            />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="input-field w-auto"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                    </select>
                    <button onClick={handleSearch} className="btn-primary">Search</button>
                </div>
            </div>

            {/* Coupons List */}
            <ScrollReveal3D delay={2}>
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-dark-500 font-medium">Loading coupons...</span>
                        </div>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-dark-100/50 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <Tag className="h-8 w-8 text-dark-300" />
                        </div>
                        <p className="text-dark-600 font-semibold">No coupons found</p>
                        <p className="text-dark-400 text-sm mt-1">Create your first coupon to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Coupon</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Discount</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Min Cart</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Usage</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Valid Until</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-dark-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-100/60">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="table-row">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3">{getCouponTypeIcon(coupon.coupon_type)}</span>
                                                <div>
                                                    <div className="text-sm font-bold text-dark-900">{coupon.code}</div>
                                                    <div className="text-[13px] text-dark-400">{coupon.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-primary-50 text-primary-700 rounded-lg ring-1 ring-primary-100">
                                                {getCouponTypeLabel(coupon.coupon_type)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-dark-900">
                                                {coupon.discount_type === 'fixed'
                                                    ? formatCurrency(coupon.discount_value)
                                                    : `${coupon.discount_value}%`}
                                            </div>
                                            {coupon.max_discount && (
                                                <div className="text-xs text-dark-400">
                                                    Max: {formatCurrency(coupon.max_discount)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-dark-900">
                                            {formatCurrency(coupon.min_cart_value)}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-dark-900">
                                                {coupon.current_usage_count}
                                                {coupon.total_usage_limit && ` / ${coupon.total_usage_limit}`}
                                            </div>
                                            {coupon.total_usage_limit && (
                                                <div className="w-full bg-dark-100 rounded-full h-1.5 mt-1.5">
                                                    <div
                                                        className="bg-gradient-to-r from-primary-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                (coupon.current_usage_count / coupon.total_usage_limit) * 100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-dark-900">{formatDate(coupon.valid_until)}</div>
                                            {isExpired(coupon.valid_until) && (
                                                <span className="text-xs text-red-600 font-semibold">Expired</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ring-1 transition-colors ${
                                                    coupon.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100'
                                                        : 'bg-dark-50 text-dark-600 ring-dark-100 hover:bg-dark-100'
                                                }`}
                                            >
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/dashboard/coupons/${coupon.id}`}
                                                    className="p-2 rounded-xl hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(coupon.id, coupon.code)}
                                                    className="p-2 rounded-xl hover:bg-red-50 text-dark-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </ScrollReveal3D>

            {/* Pagination */}
            {total > 20 && (
                <div className="card p-4 flex items-center justify-between">
                    <p className="text-sm text-dark-500 font-medium">
                        Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} coupons
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="px-4 py-2 border border-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page * 20 >= total}
                            className="px-4 py-2 border border-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
