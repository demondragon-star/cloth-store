'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Store, User, Bell, Shield } from 'lucide-react'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function SettingsPage() {
    const [storeName, setStoreName] = useState('Clothes Store')
    const [storeEmail, setStoreEmail] = useState('support@clothesstore.com')
    const [storePhone, setStorePhone] = useState('+91 1234567890')
    const [saving, setSaving] = useState(false)

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        // Simulate save
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Settings saved successfully!')
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Settings</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Manage your store configuration</p>
            </div>

            <ScrollReveal3D>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                    <div className="card p-4">
                        <nav className="space-y-1">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-100" suppressHydrationWarning>
                                <Store className="h-5 w-5" />
                                Store Information
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-600 hover:bg-dark-50 font-medium transition-colors" suppressHydrationWarning>
                                <User className="h-5 w-5" />
                                Admin Accounts
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-600 hover:bg-dark-50 font-medium transition-colors" suppressHydrationWarning>
                                <Bell className="h-5 w-5" />
                                Notifications
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-600 hover:bg-dark-50 font-medium transition-colors" suppressHydrationWarning>
                                <Shield className="h-5 w-5" />
                                Security
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2">
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary-50 p-3.5 rounded-2xl ring-1 ring-primary-100">
                                <Store className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-dark-900">Store Information</h2>
                                <p className="text-[13px] text-dark-400">Manage your store details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="input-field"
                                    suppressHydrationWarning
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">
                                    Support Email
                                </label>
                                <input
                                    type="email"
                                    value={storeEmail}
                                    onChange={(e) => setStoreEmail(e.target.value)}
                                    className="input-field"
                                    suppressHydrationWarning
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-dark-700 mb-2">
                                    Support Phone
                                </label>
                                <input
                                    type="tel"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                    className="input-field"
                                    suppressHydrationWarning
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary"
                                    suppressHydrationWarning
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    suppressHydrationWarning
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Additional Settings Cards */}
                    <ScrollReveal3D delay={1}>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="card p-6">
                            <h3 className="font-bold text-dark-900 mb-2">Auto-Approve Orders</h3>
                            <p className="text-[13px] text-dark-400 mb-4">
                                Automatically approve orders when payment is confirmed
                            </p>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500"
                                    suppressHydrationWarning
                                />
                                <span className="text-sm font-medium text-dark-700">Enable auto-approve</span>
                            </label>
                        </div>

                        <div className="card p-6">
                            <h3 className="font-bold text-dark-900 mb-2">Low Stock Alert</h3>
                            <p className="text-[13px] text-dark-400 mb-4">
                                Get notified when products are running low on stock
                            </p>
                            <input
                                type="number"
                                defaultValue={5}
                                min={1}
                                className="input-field"
                                placeholder="Threshold quantity"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>
                    </ScrollReveal3D>
                </div>
            </div>
            </ScrollReveal3D>
        </div>
    )
}
