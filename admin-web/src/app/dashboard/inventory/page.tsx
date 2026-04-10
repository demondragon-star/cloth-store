'use client'

import { useState, useEffect } from 'react'
import { getProducts, updateStock } from '@/app/actions/products'
import { getCurrentAdmin } from '@/app/actions/auth'
import { formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, TrendingUp } from 'lucide-react'
import type { Product } from '@/types'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        loadProducts()
    }, [filter])

    const loadProducts = async () => {
        setLoading(true)
        const result = await getProducts(1, 100, undefined, undefined, filter)
        setProducts(result.data)
        setLoading(false)
    }

    const handleUpdateStock = async (productId: string, newStock: number) => {
        if (newStock < 0) {
            alert('Stock cannot be negative')
            return
        }

        setUpdating(productId)
        const admin = await getCurrentAdmin()
        if (!admin) return

        const result = await updateStock(productId, newStock, admin.id, admin.full_name)
        setUpdating(null)

        if (result.error) {
            alert(result.error)
        } else {
            loadProducts()
        }
    }

    const outOfStockCount = products.filter(p => p.stock_quantity === 0).length
    const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length
    const normalStockCount = products.filter(p => p.stock_quantity > 5).length

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Inventory Management</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Monitor and manage product stock levels</p>
            </div>

            {/* Stats */}
            <ScrollReveal3D>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="stat-card animate-stagger-1 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Out of Stock</p>
                            <p className="text-3xl font-extrabold text-red-600 tracking-tight font-display">{outOfStockCount}</p>
                        </div>
                        <div className="bg-red-50 p-3.5 rounded-2xl ring-1 ring-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-2 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Low Stock (&le;5)</p>
                            <p className="text-3xl font-extrabold text-amber-600 tracking-tight font-display">{lowStockCount}</p>
                        </div>
                        <div className="bg-amber-50 p-3.5 rounded-2xl ring-1 ring-amber-100">
                            <TrendingUp className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </div>
                <div className="stat-card animate-stagger-3 opacity-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">Normal Stock</p>
                            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight font-display">{normalStockCount}</p>
                        </div>
                        <div className="bg-emerald-50 p-3.5 rounded-2xl ring-1 ring-emerald-100">
                            <Package className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
            </div>
            </ScrollReveal3D>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${filter === 'all'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200/50'
                            : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                            }`}
                    >
                        All Products
                    </button>
                    <button
                        onClick={() => setFilter('out')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${filter === 'out'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-200/50'
                            : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                            }`}
                    >
                        Out of Stock ({outOfStockCount})
                    </button>
                    <button
                        onClick={() => setFilter('low')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${filter === 'low'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200/50'
                            : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                            }`}
                    >
                        Low Stock ({lowStockCount})
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <ScrollReveal3D delay={2}>
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-dark-500 font-medium">Loading inventory...</span>
                        </div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-dark-100/50 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <Package className="h-8 w-8 text-dark-300" />
                        </div>
                        <p className="text-sm text-dark-400 font-medium">No products found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Product</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">SKU</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Price</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Current Stock</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Update Stock</th>
                                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-100/60">
                                {products.map((product) => (
                                    <tr key={product.id} className="table-row">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.images?.[0]?.image_url ? (
                                                    <img
                                                        src={product.images[0].image_url}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-dark-100"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-dark-50 rounded-xl flex items-center justify-center ring-1 ring-dark-100">
                                                        <Package className="h-5 w-5 text-dark-300" />
                                                    </div>
                                                )}
                                                <p className="text-sm font-semibold text-dark-900">{product.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-dark-400 font-medium">{product.sku}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-dark-900 tabular-nums">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`text-lg font-extrabold tabular-nums ${product.stock_quantity === 0
                                                    ? 'text-red-600'
                                                    : product.stock_quantity <= 5
                                                        ? 'text-amber-600'
                                                        : 'text-emerald-600'
                                                    }`}
                                            >
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    defaultValue={product.stock_quantity}
                                                    onBlur={(e) => {
                                                        const newValue = parseInt(e.target.value)
                                                        if (newValue !== product.stock_quantity) {
                                                            handleUpdateStock(product.id, newValue)
                                                        }
                                                    }}
                                                    disabled={updating === product.id}
                                                    className="w-24 px-3 py-2 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-sm font-medium transition-all"
                                                />
                                                {updating === product.id && (
                                                    <span className="text-xs text-primary-500 font-medium">Saving...</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {product.stock_quantity === 0 ? (
                                                <span className="badge-danger">Out of Stock</span>
                                            ) : product.stock_quantity <= 5 ? (
                                                <span className="badge-warning">Low Stock</span>
                                            ) : (
                                                <span className="badge-success">In Stock</span>
                                            )}
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
