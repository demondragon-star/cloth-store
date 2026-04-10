'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { FileText, Filter } from 'lucide-react'
import type { AuditLog } from '@/types'
import ScrollReveal3D from '@/components/ScrollReveal3D'

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [actionFilter, setActionFilter] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 50

    useEffect(() => {
        loadLogs()
    }, [page, actionFilter])

    const loadLogs = async () => {
        setLoading(true)
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to)

        if (actionFilter) {
            query = query.eq('action', actionFilter)
        }

        const { data } = await query
        setLogs(data || [])
        setLoading(false)
    }

    const actions = Array.from(new Set(logs.map((log) => log.action)))

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">Audit Logs</h1>
                <p className="text-dark-500 mt-1 text-sm font-medium">Track all admin actions and changes</p>
            </div>

            {/* Filter */}
            <ScrollReveal3D>
            <div className="card p-4">
                <div className="flex items-center gap-3">
                    <div className="bg-dark-50 p-2.5 rounded-xl ring-1 ring-dark-100">
                        <Filter className="h-4 w-4 text-dark-400" />
                    </div>
                    <select
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value)
                            setPage(1)
                        }}
                        className="input-field w-auto"
                    >
                        <option value="">All Actions</option>
                        {actions.map((action) => (
                            <option key={action} value={action}>
                                {action.replace(/_/g, ' ').toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            </ScrollReveal3D>

            {/* Logs Table */}
            <ScrollReveal3D delay={1}>
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-dark-500 font-medium">Loading logs...</span>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="bg-dark-100/50 rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-dark-300" />
                        </div>
                        <p className="text-dark-400 text-sm font-medium">No audit logs found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="table-header">
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Admin</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Action</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Resource</th>
                                        <th className="px-5 py-3.5 text-left text-[11px] font-bold text-dark-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-100/60">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="table-row">
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-dark-400 font-medium">
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap font-semibold text-dark-900 text-sm">
                                                {log.admin_name}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="badge-primary">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-dark-500 font-medium">
                                                {log.resource_type}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-dark-400">
                                                <code className="text-xs bg-dark-50 px-2.5 py-1 rounded-lg ring-1 ring-dark-100 font-medium">
                                                    {JSON.stringify(log.details).slice(0, 50)}...
                                                </code>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-4 border-t border-dark-100 flex justify-end gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="px-4 py-2 border border-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-50 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={logs.length < pageSize}
                                className="px-4 py-2 border border-dark-200 rounded-xl text-sm font-semibold hover:bg-dark-50 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
            </ScrollReveal3D>
        </div>
    )
}
