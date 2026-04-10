import { format, formatDistance, formatRelative } from 'date-fns'

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

export const formatDate = (date: string | Date, formatStr: string = 'PP'): string => {
    return format(new Date(date), formatStr)
}

export const formatDateTime = (date: string | Date): string => {
    return format(new Date(date), 'PPp')
}

export const formatRelativeTime = (date: string | Date): string => {
    return formatDistance(new Date(date), new Date(), { addSuffix: true })
}

export const formatRelativeDate = (date: string | Date): string => {
    return formatRelative(new Date(date), new Date())
}

export const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_ -]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `ORD-${timestamp}-${random}`.toUpperCase()
}

export const generateSKU = (categoryCode: string, productName: string): string => {
    const namePart = productName
        .split(' ')
        .slice(0, 2)
        .join('-')
        .toUpperCase()
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${categoryCode}-${namePart}-${randomPart}`
}

export const calculateDiscount = (price: number, comparePrice?: number): number => {
    if (!comparePrice || comparePrice <= price) return 0
    return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
    return classes.filter(Boolean).join(' ')
}
