'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight, Search, Bell, Command, Settings, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/app/actions/auth'

const breadcrumbMap: Record<string, string> = {
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    inventory: 'Inventory',
    coupons: 'Coupons',
    users: 'Users',
    notifications: 'Notifications',
    shipping: 'Shipping',
    'audit-logs': 'Audit Logs',
    settings: 'Settings',
    new: 'New',
}

export default function TopBar() {
    const pathname = usePathname()

    const segments = pathname
        ?.split('/')
        .filter(Boolean)
        .map((seg) => ({
            label: breadcrumbMap[seg] ?? seg,
            href: '/' + pathname.split('/').filter(Boolean).slice(0, pathname.split('/').filter(Boolean).indexOf(seg) + 1).join('/'),
        }))

    return (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-dark-100/40 px-8 h-[72px] flex items-center justify-between">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
                {segments?.map((seg, i) => (
                    <div key={seg.href} className="flex items-center gap-2">
                        {i > 0 && (
                            <ChevronRight className="h-3.5 w-3.5 text-dark-300" />
                        )}
                        {i === segments.length - 1 ? (
                            <span className="font-bold text-dark-900 font-display">{seg.label}</span>
                        ) : (
                            <Link href={seg.href} className="text-dark-400 hover:text-dark-700 transition-colors duration-200 font-medium">
                                {seg.label}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:flex items-center">
                    <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-[200px] lg:w-[300px] pl-9 bg-muted/50 border-none focus-visible:ring-1"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
                </Button>

                <div className="h-6 w-px bg-border mx-1" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9 border shadow-sm">
                                <AvatarImage src="" alt="Admin" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">A</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Super Admin</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    admin@clothes.store
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
