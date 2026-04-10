import { getDashboardStats, getRevenueData, getNewlyArrivedProducts } from '../actions/dashboard'
import {
    TrendingUp,
    ShoppingCart,
    Package,
    AlertTriangle,
    Users,
    DollarSign,
    ArrowRight,
    ArrowUpRight,
    Plus,
    Bell,
    BarChart2,
    Sparkles,
    Zap,
    Activity,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import ScrollReveal3D from '@/components/ScrollReveal3D'
import RevenueChart from '@/components/RevenueChart'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
    const [stats, revenueData, newProducts] = await Promise.all([
        getDashboardStats(),
        getRevenueData(7),
        getNewlyArrivedProducts(5),
    ])

    const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1)

    const statCards = [
        {
            name: 'Total Revenue',
            value: formatCurrency(stats.total_revenue),
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            ringColor: 'ring-emerald-100',
            trend: '+12.5%',
            trendUp: true,
            delay: 'animate-stagger-1',
        },
        {
            name: 'Pending Orders',
            value: stats.pending_orders.toString(),
            icon: ShoppingCart,
            gradient: 'from-amber-500 to-orange-500',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            ringColor: 'ring-amber-100',
            link: '/dashboard/orders?status=pending',
            delay: 'animate-stagger-2',
        },
        {
            name: 'Total Products',
            value: stats.total_products.toString(),
            icon: Package,
            gradient: 'from-blue-500 to-indigo-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            ringColor: 'ring-blue-100',
            link: '/dashboard/products',
            delay: 'animate-stagger-3',
        },
        {
            name: 'Low Stock',
            value: stats.low_stock_products.toString(),
            icon: AlertTriangle,
            gradient: 'from-orange-500 to-red-400',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            ringColor: 'ring-orange-100',
            link: '/dashboard/inventory?filter=low',
            delay: 'animate-stagger-4',
        },
        {
            name: 'Out of Stock',
            value: stats.out_of_stock_products.toString(),
            icon: AlertTriangle,
            gradient: 'from-red-500 to-rose-500',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            ringColor: 'ring-red-100',
            link: '/dashboard/inventory?filter=out',
            delay: 'animate-stagger-5',
        },
        {
            name: 'Active Users',
            value: `${stats.active_users}/${stats.total_users}`,
            icon: Users,
            gradient: 'from-violet-500 to-purple-600',
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            ringColor: 'ring-violet-100',
            link: '/dashboard/users',
            delay: 'animate-stagger-6',
        },
    ]



    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            {/* Page Header */}
            <div className="animate-slide-up">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 font-display">
                                Dashboard
                            </h1>
                            <span className="badge-primary flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                Live
                            </span>
                        </div>
                        <p className="text-dark-500 text-sm font-medium">
                            Welcome back! Here&apos;s what&apos;s happening with your store today.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/products/new"
                        className="btn-primary flex items-center gap-2 text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Product
                    </Link>
                </div>

                {/* KPI Summary Strip - Premium Glass Design */}
                <div className="mt-6 relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700 animated-gradient" />
                    <div className="absolute inset-0 bg-noise opacity-[0.03]" />
                    <div className="relative p-6 text-white flex items-center justify-between flex-wrap gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Revenue This Week</p>
                                <p className="text-2xl font-extrabold font-display">{formatCurrency(revenueData.reduce((s, d) => s + d.revenue, 0))}</p>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-white/15 hidden sm:block" />
                        <div>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Orders This Week</p>
                            <p className="text-2xl font-extrabold font-display">{revenueData.reduce((s, d) => s + d.orders, 0)}</p>
                        </div>
                        <div className="h-10 w-px bg-white/15 hidden sm:block" />
                        <div>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Avg. Order Value</p>
                            <p className="text-2xl font-extrabold font-display">
                                {formatCurrency(
                                    revenueData.reduce((s, d) => s + d.revenue, 0) /
                                    Math.max(revenueData.reduce((s, d) => s + d.orders, 0), 1)
                                )}
                            </p>
                        </div>
                        <Link href="/dashboard/orders" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors ml-auto bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm font-medium">
                            View all orders <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <ScrollReveal3D>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    const card = (
                        <div className={`stat-card group ${stat.delay} opacity-0`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-1">
                                    <p className="text-[13px] font-semibold text-dark-400 uppercase tracking-wider">{stat.name}</p>
                                    <p className="text-3xl font-extrabold text-dark-900 tracking-tight font-display number-animate">{stat.value}</p>
                                    {stat.trend && (
                                        <div className="flex items-center gap-1.5 mt-2.5">
                                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">
                                                <TrendingUp className="h-3 w-3" />
                                                <span className="text-xs font-bold">{stat.trend}</span>
                                            </div>
                                            <span className="text-xs text-dark-400 font-medium">vs last week</span>
                                        </div>
                                    )}
                                    {stat.link && (
                                        <p className="text-xs text-primary-500 mt-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300 font-semibold">
                                            View details <ArrowUpRight className="h-3 w-3" />
                                        </p>
                                    )}
                                </div>
                                <div className={`${stat.iconBg} p-3.5 rounded-2xl ring-1 ${stat.ringColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    )

                    if (stat.link) {
                        return <Link key={stat.name} href={stat.link}>{card}</Link>
                    }
                    return <div key={stat.name}>{card}</div>
                })}
            </div>
            </ScrollReveal3D>

            {/* Charts Row */}
            <ScrollReveal3D delay={2}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Bar Chart */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>Last 7 days performance</CardDescription>
                        </div>
                        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                            <BarChart2 className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 h-[300px]">
                        <RevenueChart data={revenueData} />
                    </CardContent>
                </Card>

                {/* Newly Arrived Products */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>New Arrivals</CardTitle>
                            <CardDescription>Recently added to catalog</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/90 hidden sm:flex">
                            <Link href="/dashboard/products">
                                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {newProducts.map((product, index) => (
                                <Link
                                    key={product.product_id}
                                    href={`/dashboard/products/${product.product_id}`}
                                    className="flex items-center gap-4 rounded-xl hover:bg-muted/50 p-2 -mx-2 transition-all duration-200 group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200 text-primary font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                            {product.product_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                            Just arrived
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(product.revenue)}</p>
                                    </div>
                                </Link>
                            ))}
                            {newProducts.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="bg-muted rounded-2xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center text-muted-foreground">
                                        <Package className="h-8 w-8" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">No products yet</p>
                                    <Link href="/dashboard/products/new" className="text-xs text-primary font-semibold mt-1 inline-block hover:underline">
                                        Add your first product &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            </ScrollReveal3D>


        </div>
    )
}
