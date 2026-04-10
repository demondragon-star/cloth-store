'use client'

import { useEffect, useRef, ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right'

interface ScrollReveal3DProps {
    children: ReactNode
    direction?: Direction
    delay?: number
    className?: string
    threshold?: number
}

const directionClass: Record<Direction, string> = {
    up: 'scroll-reveal-3d',
    left: 'scroll-reveal-3d-left',
    right: 'scroll-reveal-3d-right',
}

export default function ScrollReveal3D({
    children,
    direction = 'up',
    delay = 0,
    className = '',
    threshold = 0.15,
}: ScrollReveal3DProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('revealed')
                    observer.unobserve(el)
                }
            },
            { threshold, rootMargin: '0px 0px -40px 0px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [threshold])

    const delayClass = delay > 0 ? `scroll-delay-${delay}` : ''

    return (
        <div
            ref={ref}
            className={`${directionClass[direction]} ${delayClass} ${className}`}
        >
            {children}
        </div>
    )
}
