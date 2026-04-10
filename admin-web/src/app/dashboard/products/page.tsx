'use client'

import { useState, useEffect } from 'react'
import { getProducts, getCategories, deleteProduct } from '@/app/actions/products'
import { getCurrentAdmin } from '@/app/actions/auth'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, ArrowUpDown, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { Product, Category } from '@/types'
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
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, categoryFilter, stockFilter])

    const loadData = async () => {
        setLoading(true)
        const [productsResult, categoriesData] = await Promise.all([
            getProducts(page, 20, search, categoryFilter || undefined, stockFilter),
            getCategories(),
        ])
        setProducts(productsResult.data)
        setTotal(productsResult.total)
        setCategories(categoriesData)
        setLoading(false)
    }

    const handleSearch = () => {
        setPage(1)
        loadData()
    }

    const handleDelete = async (productId: string, productName: string) => {
        if (!confirm(`Delete "${productName}"? This will PERMANENTLY delete the product from the user app and database. If it has orders, it cannot be deleted.`)) return

        const admin = await getCurrentAdmin()
        if (!admin) return

        const result = await deleteProduct(productId, admin.id, admin.full_name)
        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
            loadData()
        }
    }

    const [sorting, setSorting] = useState<SortingState>([])

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 font-bold"
                    >
                        Product
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const product = row.original;
                const firstImage = product.image_urls?.[0] || product.images?.[0]?.image_url || '';
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg shrink-0">
                            <AvatarImage src={firstImage} alt={product.name} className="object-cover" />
                            <AvatarFallback className="rounded-lg bg-muted"><Package className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm max-w-[200px] truncate" title={product.name}>{product.name}</span>
                            <span className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "price",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 font-bold"
                    >
                        Price
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("price") as string)
                return <div className="font-medium tabular-nums">{formatCurrency(price)}</div>
            },
        },
        {
            accessorKey: "stock_quantity",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 font-bold"
                    >
                        Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const stock = parseInt(row.getValue("stock_quantity") as string)
                if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>
                if (stock <= 5) return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Low Stock ({stock})</Badge>
                return <span className="text-sm font-medium">{stock}</span>
            },
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active")
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const product = row.original
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="icon" asChild className="h-8 w-8">
                            <Link href={`/dashboard/products/${product.id}`}>
                                <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(product.id, product.name)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: products,
        columns,
        getCoreRowModel: getCoreRowModel(),
        // Client-side pagination and sorting disabled since we do it server-side in this architecture, 
        // but TanStack table still needs these for internal state management if we wanted to shift it fully.
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display">Products</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your product catalog</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/products/new" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Product
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <ScrollReveal3D>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="flex h-10 w-full md:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                suppressHydrationWarning
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value as any)}
                                className="flex h-10 w-[140px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                suppressHydrationWarning
                            >
                                <option value="all">All Stock</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                            <Button onClick={handleSearch} variant="secondary">Search</Button>
                        </div>
                    </div>
                </div>
            </ScrollReveal3D>

            {/* Table */}
            <ScrollReveal3D delay={1}>
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
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse">
                                            <Package className="h-4 w-4" />
                                            Loading products...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{(page - 1) * 20 + 1}</span> to{" "}
                        <span className="font-medium text-foreground">{Math.min(page * 20, total)}</span> of{" "}
                        <span className="font-medium text-foreground">{total}</span> products
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
            </ScrollReveal3D>
        </div>
    )
}
