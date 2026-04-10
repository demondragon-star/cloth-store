'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    getCouponById,
    createCoupon,
    updateCoupon,
    generateCouponCode,
    getCouponStatistics,
    type CouponFormData,
} from '@/app/actions/coupons'
import { getCurrentAdmin } from '@/app/actions/auth'
import { ArrowLeft, Save, RefreshCw, TrendingUp, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function CouponFormPage() {
    const router = useRouter()
    const params = useParams()
    const couponId = params.id as string
    const isNew = couponId === 'new'

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Statistics (for edit mode)
    const [stats, setStats] = useState({
        total_uses: 0,
        total_discount_given: 0,
        unique_users: 0,
    })

    // Form state
    const [formData, setFormData] = useState<CouponFormData>({
        code: '',
        description: '',
        discount_type: 'fixed',
        discount_value: 0,
        coupon_type: 'general',
        min_cart_value: 0,
        max_discount: undefined,
        usage_limit_per_user: 1,
        total_usage_limit: undefined,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
    })

    useEffect(() => {
        if (!isNew) {
            loadCoupon()
            loadStatistics()
        }
    }, [couponId])

    const loadCoupon = async () => {
        const result = await getCouponById(couponId)
        // @ts-ignore
        if (result.error || !result.data) {
            alert('Error loading coupon')
            router.push('/dashboard/coupons')
            return
        }

        // @ts-ignore
        const coupon = result.data
        setFormData({
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            coupon_type: coupon.coupon_type,
            min_cart_value: coupon.min_cart_value,
            max_discount: coupon.max_discount,
            usage_limit_per_user: coupon.usage_limit_per_user,
            total_usage_limit: coupon.total_usage_limit,
            valid_from: coupon.valid_from.split('T')[0],
            valid_until: coupon.valid_until.split('T')[0],
            is_active: coupon.is_active,
        })
        setLoading(false)
    }

    const loadStatistics = async () => {
        const result = await getCouponStatistics(couponId)
        if (!result.error) {
            setStats(result)
        }
    }

    const handleGenerateCode = async () => {
        const code = await generateCouponCode()
        setFormData({ ...formData, code })
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.code || formData.code.length < 6 || formData.code.length > 12) {
            newErrors.code = 'Code must be 6-12 characters'
        }

        if (!/^[A-Z0-9]+$/.test(formData.code)) {
            newErrors.code = 'Code must be alphanumeric (uppercase)'
        }

        if (!formData.discount_value || formData.discount_value <= 0) {
            newErrors.discount_value = 'Discount value must be greater than 0'
        }

        if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
            newErrors.discount_value = 'Percentage cannot exceed 100%'
        }

        if (formData.min_cart_value < 0) {
            newErrors.min_cart_value = 'Min cart value cannot be negative'
        }

        if (formData.max_discount && formData.max_discount <= 0) {
            newErrors.max_discount = 'Max discount must be greater than 0'
        }

        if (formData.usage_limit_per_user <= 0) {
            newErrors.usage_limit_per_user = 'Usage limit per user must be greater than 0'
        }

        if (formData.total_usage_limit && formData.total_usage_limit <= 0) {
            newErrors.total_usage_limit = 'Total usage limit must be greater than 0'
        }

        if (new Date(formData.valid_until) <= new Date(formData.valid_from)) {
            newErrors.valid_until = 'Valid until must be after valid from'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            alert('Please fix the errors in the form')
            return
        }

        setSaving(true)

        try {
            if (isNew) {
                const admin = await getCurrentAdmin()
                if (!admin) {
                    alert('You must be logged in as an admin')
                    return
                }

                const adminId = (admin as any).id as string
                const result = await createCoupon(formData, adminId)
                if (result.error) {
                    alert(`Error: ${result.error}`)
                } else {
                    alert('Coupon created successfully')
                    router.push('/dashboard/coupons')
                }
            } else {
                const result = await updateCoupon(couponId, formData)
                if (result.error) {
                    alert(`Error: ${result.error}`)
                } else {
                    alert('Coupon updated successfully')
                    router.push('/dashboard/coupons')
                }
            }
        } catch (error) {
            console.error('Error saving coupon:', error)
            alert('An error occurred while saving the coupon')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 animate-slide-up">
                <Link
                    href="/dashboard/coupons"
                    className="p-2.5 hover:bg-primary-50 rounded-xl transition-colors text-dark-500 hover:text-primary-600"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">
                        {isNew ? 'Create Coupon' : 'Edit Coupon'}
                    </h1>
                    <p className="text-dark-500 mt-1 text-sm font-medium">
                        {isNew ? 'Create a new discount coupon' : 'Update coupon details'}
                    </p>
                </div>
            </div>

            {/* Statistics (Edit mode only) */}
            {!isNew && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 animate-stagger-1">
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[13px] text-dark-400 font-medium">Total Uses</p>
                                <p className="text-2xl font-extrabold text-dark-900 mt-1">{stats.total_uses}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-2xl ring-1 ring-blue-100">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[13px] text-dark-400 font-medium">Total Discount Given</p>
                                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                                    {formatCurrency(stats.total_discount_given)}
                                </p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-2xl ring-1 ring-emerald-100">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[13px] text-dark-400 font-medium">Unique Users</p>
                                <p className="text-2xl font-extrabold text-violet-600 mt-1">{stats.unique_users}</p>
                            </div>
                            <div className="bg-violet-50 p-3 rounded-2xl ring-1 ring-violet-100">
                                <Users className="h-6 w-6 text-violet-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="card p-6 animate-stagger-2">
                    <h2 className="text-lg font-bold text-dark-900 mb-4">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Coupon Code */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Coupon Code <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                                    }
                                    maxLength={12}
                                    className={`input-field flex-1 ${errors.code ? '!border-red-400 !ring-red-100' : ''}`}
                                    placeholder="SAVE50"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateCode}
                                    className="px-4 py-2 bg-dark-50 text-dark-700 rounded-xl hover:bg-dark-100 transition-colors flex items-center gap-2 ring-1 ring-dark-200 font-medium text-sm"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Generate
                                </button>
                            </div>
                            {errors.code && <p className="text-red-500 text-[13px] mt-1.5 font-medium">{errors.code}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input-field"
                                placeholder="Save ₹50 on your first order"
                            />
                        </div>
                    </div>
                </div>

                {/* Discount Configuration */}
                <div className="card p-6 animate-stagger-3">
                    <h2 className="text-lg font-bold text-dark-900 mb-4">Discount Configuration</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Discount Type */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Discount Type <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-dark-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="fixed"
                                        checked={formData.discount_type === 'fixed'}
                                        onChange={(e) =>
                                            setFormData({ ...formData, discount_type: 'fixed' })
                                        }
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    Fixed Amount (₹)
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-dark-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="percentage"
                                        checked={formData.discount_type === 'percentage'}
                                        onChange={(e) =>
                                            setFormData({ ...formData, discount_type: 'percentage' })
                                        }
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    Percentage (%)
                                </label>
                            </div>
                        </div>

                        {/* Discount Value */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Discount Value <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.discount_value || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                                }
                                className={`input-field ${errors.discount_value ? '!border-red-400 !ring-red-100' : ''}`}
                                placeholder={formData.discount_type === 'fixed' ? '50' : '10'}
                            />
                            {errors.discount_value && (
                                <p className="text-red-500 text-[13px] mt-1.5 font-medium">{errors.discount_value}</p>
                            )}
                        </div>

                        {/* Max Discount (for percentage) */}
                        {formData.discount_type === 'percentage' && (
                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">
                                    Maximum Discount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.max_discount || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            max_discount: e.target.value ? parseFloat(e.target.value) : undefined,
                                        })
                                    }
                                    className="input-field"
                                    placeholder="500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Coupon Type */}
                <div className="card p-6 animate-stagger-4">
                    <h2 className="text-lg font-bold text-dark-900 mb-4">
                        Coupon Type <span className="text-red-500">*</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { value: 'first_order', label: 'First Order', icon: '🎉' },
                            { value: 'cart_value', label: 'Cart Value', icon: '🛒' },
                            { value: 'party', label: 'Party/Event', icon: '🎊' },
                            { value: 'general', label: 'General', icon: '🎁' },
                        ].map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, coupon_type: type.value as any })
                                }
                                className={`p-4 rounded-2xl text-center transition-all ${
                                    formData.coupon_type === type.value
                                        ? 'ring-2 ring-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                                        : 'ring-1 ring-dark-200 hover:ring-dark-300 hover:bg-dark-50'
                                }`}
                            >
                                <div className="text-3xl mb-2">{type.icon}</div>
                                <div className="text-sm font-semibold text-dark-700">{type.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Requirements & Limits */}
                <div className="card p-6 animate-stagger-5">
                    <h2 className="text-lg font-bold text-dark-900 mb-4">Requirements & Limits</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Min Cart Value */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Minimum Cart Value (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.min_cart_value || 0}
                                onChange={(e) =>
                                    setFormData({ ...formData, min_cart_value: parseFloat(e.target.value) || 0 })
                                }
                                className="input-field"
                                placeholder="0"
                            />
                        </div>

                        {/* Usage Limit Per User */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Usage Limit Per User <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.usage_limit_per_user || 1}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        usage_limit_per_user: parseInt(e.target.value) || 1,
                                    })
                                }
                                className="input-field"
                                placeholder="1"
                            />
                        </div>

                        {/* Total Usage Limit */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Total Usage Limit (Optional)
                            </label>
                            <input
                                type="number"
                                value={formData.total_usage_limit || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        total_usage_limit: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="input-field"
                                placeholder="100"
                            />
                        </div>
                    </div>
                </div>

                {/* Validity Period */}
                <div className="card p-6 animate-stagger-6">
                    <h2 className="text-lg font-bold text-dark-900 mb-4">Validity Period</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Valid From */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Valid From <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.valid_from}
                                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                className="input-field"
                            />
                        </div>

                        {/* Valid Until */}
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Valid Until <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                className={`input-field ${errors.valid_until ? '!border-red-400 !ring-red-100' : ''}`}
                            />
                            {errors.valid_until && (
                                <p className="text-red-500 text-[13px] mt-1.5 font-medium">{errors.valid_until}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-dark-900 mb-4">Status</h2>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-300 rounded"
                        />
                        <span className="text-sm font-medium text-dark-700">Active</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/dashboard/coupons"
                        className="btn-secondary"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                {isNew ? 'Create Coupon' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
