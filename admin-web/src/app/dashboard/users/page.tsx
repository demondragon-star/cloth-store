'use client'

import { useState, useEffect } from 'react'
import { getUsers, toggleUserBlock } from '@/app/actions/users'
import { getCurrentAdmin } from '@/app/actions/auth'
import { formatRelativeTime } from '@/lib/utils'
import { Search, User, Ban, CheckCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import type { User as UserType } from '@/types'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function UsersPage() {
    const [users, setUsers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        loadUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    const loadUsers = async () => {
        setLoading(true)
        const result = await getUsers(page, 20, search)
        setUsers(result.data)
        setTotal(result.total)
        setLoading(false)
    }

    const handleSearch = () => {
        setPage(1)
        loadUsers()
    }

    const handleToggleBlock = async (userId: string, currentlyBlocked: boolean) => {
        const action = currentlyBlocked ? 'unblock' : 'block'
        if (!confirm(`Are you sure you want to ${action} this user?`)) return

        setProcessing(userId)
        const admin = await getCurrentAdmin()
        if (!admin) return

        const result = await toggleUserBlock(userId, !currentlyBlocked, admin.id, admin.full_name)
        setProcessing(null)

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            loadUsers()
        }
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Users</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Manage customer accounts and access</p>
            </div>

            {/* Search */}
            <ScrollReveal3D>
            <div className="card p-5">
                <div className="flex gap-3">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="input-field pl-11"
                            suppressHydrationWarning
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="btn-primary text-sm px-6"
                        suppressHydrationWarning
                    >
                        Search
                    </button>
                </div>
            </div>
            </ScrollReveal3D>

            {/* Users Table */}
            <ScrollReveal3D delay={1}>
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-dark-500 font-medium">Loading users...</span>
                        </div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-dark-100/50 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <User className="h-8 w-8 text-dark-300" />
                        </div>
                        <p className="text-sm text-dark-400 font-medium">No users found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="table-header">
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Joined</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-100/60">
                                    {users.map((user) => (
                                        <tr key={user.id} className="table-row">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl flex items-center justify-center ring-1 ring-primary-100">
                                                        {user.avatar_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={user.avatar_url}
                                                                alt={user.full_name}
                                                                className="w-10 h-10 rounded-xl object-cover"
                                                            />
                                                        ) : (
                                                            <User className="h-5 w-5 text-primary-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-dark-900">{user.full_name}</p>
                                                        {user.is_admin && (
                                                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-violet-50 text-violet-600 rounded-md ring-1 ring-violet-100 mt-0.5">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-dark-900 font-medium">{user.email}</p>
                                                {user.phone && <p className="text-xs text-dark-400 mt-0.5">{user.phone}</p>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-lg ring-1 ${user.is_blocked
                                                            ? 'bg-red-50 text-red-600 ring-red-100'
                                                            : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                                                        }`}
                                                >
                                                    {user.is_blocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-dark-400 font-medium">
                                                {formatRelativeTime(user.created_at)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Link
                                                        href={`/dashboard/users/${user.id}`}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                                                        disabled={processing === user.id}
                                                        className={`p-2 rounded-xl transition-colors ${user.is_blocked
                                                                ? 'text-emerald-600 hover:bg-emerald-50'
                                                                : 'text-red-500 hover:bg-red-50'
                                                            } disabled:opacity-40`}
                                                        title={user.is_blocked ? 'Unblock' : 'Block'}
                                                    >
                                                        {user.is_blocked ? (
                                                            <CheckCircle className="h-4 w-4" />
                                                        ) : (
                                                            <Ban className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-4 border-t border-dark-100/60 flex items-center justify-between">
                            <p className="text-sm text-dark-500 font-medium">
                                Showing <span className="font-bold text-dark-700">{(page - 1) * 20 + 1}</span> to <span className="font-bold text-dark-700">{Math.min(page * 20, total)}</span> of <span className="font-bold text-dark-700">{total}</span> users
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-dark-200 rounded-xl hover:bg-dark-50 text-sm font-medium text-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page * 20 >= total}
                                    className="px-4 py-2 border border-dark-200 rounded-xl hover:bg-dark-50 text-sm font-medium text-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            </ScrollReveal3D>
        </div>
    )
}
