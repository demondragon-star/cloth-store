'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, getCategories, updateProductCategories } from '@/app/actions/products'
import { getCurrentAdmin } from '@/app/actions/auth'
import { ArrowLeft, Upload, X, Plus, Wand2, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export default function NewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        compareAtPrice: '',
        sku: '',
        stockQuantity: '',
        tags: '',
        imageUrl: '', // Legacy single URL input (optional fallback)
    })

    const [selectedSizes, setSelectedSizes] = useState<string[]>([])
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [autoRemoveBg, setAutoRemoveBg] = useState(false)
    const [processingBg, setProcessingBg] = useState<Record<number, boolean>>({})

    // Load categories on mount
    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        const cats = await getCategories()
        setCategories(cats)
    }

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            
            if (autoRemoveBg) {
                // If auto remove is enabled, we process them individually and add them
                for (const file of newFiles) {
                    const tempPreview = URL.createObjectURL(file)
                    setImageFiles(prev => [...prev, file])
                    setPreviewUrls(prev => [...prev, tempPreview])
                    const idx = previewUrls.length + newFiles.indexOf(file) // approximate index
                    handleRemoveBg(idx, file)
                }
            } else {
                setImageFiles(prev => [...prev, ...newFiles])
                const newPreviews = newFiles.map(file => URL.createObjectURL(file))
                setPreviewUrls(prev => [...prev, ...newPreviews])
            }
        }
    }

    const handleRemoveBg = async (index: number, specificFile?: File) => {
        setProcessingBg(prev => ({ ...prev, [index]: true }))
        try {
            const file = specificFile || imageFiles[index]
            const formData = new FormData()
            formData.append('file', file)
            
            const res = await fetch('http://localhost:8000/remove-background?max_size=1200&quality=85', {
                method: 'POST',
                body: formData
            })
            
            if (!res.ok) throw new Error('Background removal failed')
            
            const blob = await res.blob()
            const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' })
            
            setImageFiles(prev => {
                const updated = [...prev]
                updated[index] = processedFile
                return updated
            })
            setPreviewUrls(prev => {
                const updated = [...prev]
                updated[index] = URL.createObjectURL(blob)
                return updated
            })
        } catch (err: any) {
            setError('Failed to remove background on one or more images.')
            console.error(err)
        } finally {
            setProcessingBg(prev => ({ ...prev, [index]: false }))
        }
    }

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index))
        setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size)
                ? prev.filter(s => s !== size)
                : [...prev, size]
        )
    }

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = []
        setUploading(true)

        try {
            for (const file of imageFiles) {
                const ext = file.name.split('.').pop()
                const filename = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

                const { data, error } = await supabase.storage
                    .from('products')
                    .upload(filename, file)

                if (error) throw error

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filename)

                uploadedUrls.push(publicUrl)
            }
        } catch (err) {
            console.error('Upload failed:', err)
            setError('Failed to upload images')
        } finally {
            setUploading(false)
        }

        return uploadedUrls
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validate categories
        if (selectedCategories.length === 0) {
            setError('Please select at least one category')
            return
        }

        setLoading(true)

        const admin = await getCurrentAdmin()
        if (!admin) {
            setError('Authentication required')
            setLoading(false)
            return
        }

        try {
            // Upload images first
            let uploadedImageUrls: string[] = []
            if (imageFiles.length > 0) {
                uploadedImageUrls = await uploadImages()
            }

            // Combine with manual URL if provided
            const allImageUrls = [...uploadedImageUrls]
            if (formData.imageUrl) allImageUrls.push(formData.imageUrl)

            // @ts-ignore - Category is optional
            const result = await createProduct({
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                compare_at_price: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                category_id: undefined,
                sku: formData.sku,
                stock_quantity: parseInt(formData.stockQuantity),
                is_active: true,
                is_featured: false,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                sizes: selectedSizes,
                image_urls: allImageUrls,
                imageUrl: allImageUrls[0], // For legacy compatibility
            }, (admin as any).id, (admin as any).full_name)

            if (result.error) {
                setError(result.error)
            } else if (result.data) {
                // Step 2: Assign categories to the newly created product
                const categoryResult = await updateProductCategories(
                    result.data.id,
                    selectedCategories,
                    (admin as any).id,
                    (admin as any).full_name
                )

                if (categoryResult.error) {
                    setError(`Product created but failed to assign categories: ${categoryResult.error}`)
                } else {
                    router.push('/dashboard/products')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create product')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="mb-6 animate-slide-up">
                <Link href="/dashboard/products" className="inline-flex items-center gap-2 text-dark-500 hover:text-primary-600 mb-4 text-sm font-medium rounded-xl px-3 py-1.5 hover:bg-primary-50 transition-colors -ml-3">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Products
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Add New Product</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Create a new product for your store</p>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl ring-1 ring-red-100 text-sm font-medium animate-slide-up">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6 space-y-5 animate-stagger-1">
                            <h2 className="text-lg font-bold text-dark-900">Basic Information</h2>
                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Classic White T-Shirt"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">Description *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field resize-none"
                                    placeholder="Describe your product..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-2">Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="input-field"
                                        placeholder="99.99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-2">Compare at Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.compareAtPrice}
                                        onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                                        className="input-field"
                                        placeholder="149.99"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-2">SKU *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="input-field"
                                        placeholder="TSH-WHT-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-2">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stockQuantity}
                                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                        className="input-field"
                                        placeholder="100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="card p-6 animate-stagger-2">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-dark-900">Product Images</h2>
                                <label className="flex items-center gap-2 text-sm font-semibold text-dark-700 bg-primary-50 px-3 py-1.5 rounded-full ring-1 ring-primary-200 cursor-pointer hover:bg-primary-100 transition-colors">
                                    <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                                    <span>AI Remove BG on Upload</span>
                                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${autoRemoveBg ? 'bg-primary-500' : 'bg-dark-300'}`}>
                                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${autoRemoveBg ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={autoRemoveBg} 
                                        onChange={(e) => setAutoRemoveBg(e.target.checked)} 
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-dark-100 group">
                                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg hover:bg-red-50 text-dark-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBg(index)}
                                            disabled={processingBg[index]}
                                            className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm py-1.5 px-2 rounded-xl shadow-lg hover:bg-primary-50 text-dark-700 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-100 z-10"
                                        >
                                            {processingBg[index] ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" /> : <Wand2 className="h-3.5 w-3.5 text-primary-600" />}
                                            {processingBg[index] ? 'Processing...' : 'Remove BG'}
                                        </button>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed border-dark-200 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all group">
                                    <div className="bg-dark-100 p-3 rounded-xl group-hover:bg-primary-100 transition-colors mb-2">
                                        <Upload className="h-5 w-5 text-dark-400 group-hover:text-primary-600 transition-colors" />
                                    </div>
                                    <span className="text-xs text-dark-500 font-semibold">Upload Image</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">Or Add Image URL</label>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="input-field"
                                    placeholder="https://example.com/product-image.jpg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Organization */}
                    <div className="space-y-6">
                        {/* Categories Section */}
                        <div className="card p-6 animate-stagger-3">
                            <h2 className="text-lg font-bold text-dark-900 mb-1">Categories *</h2>
                            <p className="text-[13px] text-dark-400 mb-4">Select at least one category</p>

                            {categories.length === 0 ? (
                                <p className="text-sm text-dark-400">Loading categories...</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                                    {categories.map((category) => (
                                        <label
                                            key={category.id}
                                            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${
                                                selectedCategories.includes(category.id)
                                                    ? 'bg-primary-50 ring-1 ring-primary-200'
                                                    : 'ring-1 ring-dark-100 hover:bg-dark-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.id)}
                                                onChange={() => toggleCategory(category.id)}
                                                className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500"
                                            />
                                            <span className="text-sm font-medium text-dark-800">
                                                {category.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {selectedCategories.length === 0 && (
                                <p className="text-[13px] text-red-500 mt-3 font-medium">
                                    Please select at least one category
                                </p>
                            )}
                            {selectedCategories.length > 0 && (
                                <p className="text-[13px] text-emerald-600 mt-3 font-medium">
                                    {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
                                </p>
                            )}
                        </div>

                        <div className="card p-6 animate-stagger-4">
                            <h2 className="text-lg font-bold text-dark-900 mb-4">Additional Options</h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-2">Sizes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_SIZES.map(size => (
                                            <button
                                                type="button"
                                                key={size}
                                                onClick={() => toggleSize(size)}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedSizes.includes(size)
                                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-200'
                                                    : 'bg-dark-50 text-dark-600 ring-1 ring-dark-200 hover:ring-primary-300 hover:text-primary-600'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-2">Tags</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="input-field"
                                        placeholder="summer, cotton"
                                    />
                                    <p className="text-[11px] text-dark-400 mt-1.5">Comma separated</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 animate-stagger-5">
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="btn-primary w-full py-3"
                            >
                                {loading || uploading ? 'Saving...' : 'Create Product'}
                            </button>
                            <Link href="/dashboard/products" className="btn-secondary w-full py-3 text-center">
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
