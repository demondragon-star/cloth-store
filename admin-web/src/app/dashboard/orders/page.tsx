'use client'

import { useState, useEffect } from 'react'
import { getOrders } from '@/app/actions/orders'
import { ORDER_STATUSES } from '@/lib/constants'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Search, Filter, Eye, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import type { Order, OrderStatus } from '@/types'
import ScrollReveal3D from '@/components/ScrollReveal3D'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        loadOrders()
    }, [page, statusFilter])

    const loadOrders = async () => {
        setLoading(true)
        const result = await getOrders(page, 20, statusFilter || undefined, search)
        setOrders(result.data)
        setTotal(result.total)
        setLoading(false)
    }

    const handleSearch = () => {
        setPage(1)
        loadOrders()
    }

    const [sorting, setSorting] = useState<SortingState>([])

    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "order_number",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 font-bold"
                    >
                        Order
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm max-w-[150px] truncate">{order.order_number}</span>
                        <span className="text-xs text-muted-foreground">{order.items?.length || 0} items</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "user.full_name",
            header: "Customer",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{order.user?.full_name || 'Guest'}</span>
                        <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                const statusInfo = ORDER_STATUSES.find((s) => s.value === status)
                
                // Map the custom color classes to Shadcn badge variants or inline styles
                // In a true Shadcn setup we'd extend the badge variants in tailwind.config
                return (
                    <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-lg ring-1 ${statusInfo?.color}`}>
                        {statusInfo?.label}
                    </span>
                )
            },
        },
        {
            accessorKey: "total",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 font-bold"
                    >
                        Total
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const total = parseFloat(row.getValue("total") as string)
                return <div className="font-bold tabular-nums">{formatCurrency(total)}</div>
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 font-bold"
                    >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                return <div className="text-muted-foreground text-sm font-medium">{formatRelativeTime(row.getValue("created_at"))}</div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild className="h-8 group">
                            <Link href={`/dashboard/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                                View
                            </Link>
                        </Button>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display">Orders</h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and process customer orders</p>
            </div>

            {/* Filters */}
            <ScrollReveal3D>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by order number or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9"
                                suppressHydrationWarning
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                                className="flex h-10 w-full sm:w-[150px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                suppressHydrationWarning
                            >
                                <option value="">All Status</option>
                                {ORDER_STATUSES.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            <Button onClick={handleSearch} variant="secondary">Search</Button>
                        </div>
                    </div>
                </div>
            </ScrollReveal3D>

            {/* Orders Table */}
            <ScrollReveal3D delay={1}>
                {loading ? (
                    <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                        <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-muted-foreground font-medium">Loading orders...</span>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-xl border bg-card p-16 text-center shadow-sm">
                        <div className="bg-muted rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">No orders found</p>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.map((row) => {
                                    const isPending = row.original.status === 'pending'
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={isPending ? 'border-l-[3px] border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10' : ''}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        <div className="flex items-center justify-between px-4 py-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Showing <span className="font-medium text-foreground">{(page - 1) * 20 + 1}</span> to{" "}
                                <span className="font-medium text-foreground">{Math.min(page * 20, total)}</span> of{" "}
                                <span className="font-medium text-foreground">{total}</span> orders
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page * 20 >= total}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </ScrollReveal3D>
        </div>
    )
}
