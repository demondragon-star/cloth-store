'use client'

import { useState } from 'react'
import { sendNotification } from '@/app/actions/users'
import { getCurrentAdmin } from '@/app/actions/auth'
import { NOTIFICATION_TYPES } from '@/lib/constants'
import { Bell, Send } from 'lucide-react'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function NotificationsPage() {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [type, setType] = useState('system')
    const [sendToAll, setSendToAll] = useState(true)
    const [sending, setSending] = useState(false)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim() || !body.trim()) {
            alert('Please fill in all fields')
            return
        }

        if (!confirm(`Send this notification to ${sendToAll ? 'all users' : 'selected users'}?`)) {
            return
        }

        setSending(true)
        const admin = await getCurrentAdmin()
        if (!admin) {
            setSending(false)
            return
        }

        const result = await sendNotification(
            title,
            body,
            type,
            sendToAll ? null : [], // null means all users
            admin.id,
            admin.full_name
        )

        setSending(false)

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            // Reset form
            setTitle('')
            setBody('')
            setType('system')
        }
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Notifications</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Send push notifications to users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Send Notification Form */}
                <ScrollReveal3D>
                <div className="card p-6 animate-stagger-1 opacity-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-primary-50 p-3.5 rounded-2xl ring-1 ring-primary-100">
                            <Bell className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-dark-900">Send Notification</h2>
                            <p className="text-[13px] text-dark-400">Broadcast messages to your users</p>
                        </div>
                    </div>

                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Notification Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="input-field"
                            >
                                {NOTIFICATION_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Flash Sale Alert!"
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-dark-700 mb-2">
                                Message *
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Enter your notification message..."
                                rows={4}
                                className="input-field resize-none"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sendToAll"
                                checked={sendToAll}
                                onChange={(e) => setSendToAll(e.target.checked)}
                                className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="sendToAll" className="text-sm font-medium text-dark-700">
                                Send to all users
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Send className="h-5 w-5" />
                            {sending ? 'Sending...' : 'Send Notification'}
                        </button>
                    </form>
                </div>
                </ScrollReveal3D>

                {/* Preview */}
                <ScrollReveal3D delay={1}>
                <div className="card p-6 animate-stagger-2 opacity-0">
                    <h3 className="text-lg font-bold text-dark-900 mb-4">Preview</h3>
                    <div className="bg-dark-50/50 rounded-2xl p-5 border-2 border-dashed border-dark-200">
                        <div className="bg-white rounded-2xl shadow-card ring-1 ring-dark-100 p-4 max-w-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 bg-gradient-to-br from-primary-500 to-purple-500 p-2.5 rounded-xl">
                                    <Bell className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-dark-900 mb-1">
                                        {title || 'Notification Title'}
                                    </p>
                                    <p className="text-[13px] text-dark-500">
                                        {body || 'Your notification message will appear here...'}
                                    </p>
                                    <p className="text-xs text-dark-300 mt-2 font-medium">Just now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <h4 className="text-sm font-bold text-dark-900">Quick Templates</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setTitle('Flash Sale Alert!')
                                    setBody('🔥 50% OFF on select items! Limited time only. Shop now!')
                                    setType('promotion')
                                }}
                                className="w-full text-left px-4 py-3 border border-dark-200 rounded-xl hover:bg-dark-50 text-sm font-medium text-dark-700 transition-colors"
                            >
                                Flash Sale Template
                            </button>
                            <button
                                onClick={() => {
                                    setTitle('New Arrivals')
                                    setBody('Check out our latest collection! Fresh styles just for you.')
                                    setType('new_arrival')
                                }}
                                className="w-full text-left px-4 py-3 border border-dark-200 rounded-xl hover:bg-dark-50 text-sm font-medium text-dark-700 transition-colors"
                            >
                                New Arrivals Template
                            </button>
                            <button
                                onClick={() => {
                                    setTitle('Back in Stock')
                                    setBody('Good news! Your wishlist item is back in stock.')
                                    setType('back_in_stock')
                                }}
                                className="w-full text-left px-4 py-3 border border-dark-200 rounded-xl hover:bg-dark-50 text-sm font-medium text-dark-700 transition-colors"
                            >
                                Stock Alert Template
                            </button>
                        </div>
                    </div>
                </div>
                </ScrollReveal3D>
            </div>
        </div>
    )
}
