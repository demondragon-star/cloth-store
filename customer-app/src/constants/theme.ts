// Theme configuration for the Customer Mobile App
// Premium design system with 8px grid, glassmorphism, and depth tokens

export const COLORS = {
    // Primary colors - Premium Indigo palette
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryDeep: '#3730A3',
    primarySoft: '#EEF2FF',
    primaryGradient: ['#6366F1', '#8B5CF6'] as const,

    // Secondary colors (Rose/Pink)
    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',
    secondarySoft: '#FDF2F8',
    secondaryGradient: ['#EC4899', '#DB2777'] as const,

    // Accent colors (Emerald for success/positive)
    accent: '#10B981',
    accentLight: '#34D399',
    accentDark: '#059669',
    accentSoft: '#ECFDF5',

    // Violet accent
    violet: '#8B5CF6',
    violetLight: '#A78BFA',
    violetDark: '#7C3AED',
    violetSoft: '#F5F3FF',

    // Amber accent
    amber: '#F59E0B',
    amberLight: '#FBBF24',
    amberDark: '#D97706',
    amberSoft: '#FFFBEB',

    // Neutral colors (Cool Slate)
    white: '#FFFFFF',
    black: '#000000',
    gray: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },

    // Status colors
    success: '#10B981',
    successLight: '#34D399',
    successSoft: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningSoft: '#FFFBEB',
    error: '#EF4444',
    errorLight: '#F87171',
    errorSoft: '#FEF2F2',
    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoSoft: '#EFF6FF',

    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#F1F5F9',
    backgroundDark: '#0F172A',

    // Surface colors (card/modal backgrounds)
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    surfaceDark: '#1E293B',

    // Text colors
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textLight: '#94A3B8',
    textInverse: '#FFFFFF',

    // Border colors
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderFocus: '#6366F1',
    borderDark: '#334155',

    // Overlay
    overlay: 'rgba(15, 23, 42, 0.6)',
    overlayLight: 'rgba(15, 23, 42, 0.3)',
    overlayHeavy: 'rgba(15, 23, 42, 0.8)',
};

export const GRADIENTS = {
    primary: ['#6366F1', '#8B5CF6'] as const,
    primaryDeep: ['#4F46E5', '#7C3AED'] as const,
    secondary: ['#EC4899', '#BE185D'] as const,
    success: ['#10B981', '#059669'] as const,
    warning: ['#F59E0B', '#D97706'] as const,
    error: ['#EF4444', '#DC2626'] as const,
    dark: ['#1E293B', '#0F172A'] as const,
    premium: ['#6366F1', '#EC4899'] as const,
    sunset: ['#F59E0B', '#EF4444'] as const,
    ocean: ['#3B82F6', '#6366F1'] as const,
    glass: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.5)'] as const,
    glassDark: ['rgba(30,41,59,0.9)', 'rgba(30,41,59,0.5)'] as const,
    shimmer: ['transparent', 'rgba(255,255,255,0.3)', 'transparent'] as const,
};

export const GLASS = {
    default: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        blur: 12,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
    },
    heavy: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        blur: 20,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
    },
    dark: {
        backgroundColor: 'rgba(30, 41, 59, 0.75)',
        blur: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
    },
    subtle: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        blur: 8,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 0.5,
    },
};

export const SPACING = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const FONT_SIZE = {
    xxs: 9,
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    hero: 40,
    display: 48,
};

export const FONT_WEIGHT = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
};

export const LINE_HEIGHT = {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.75,
};

export const BORDER_RADIUS = {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    full: 9999,
};

export const SHADOWS = {
    xs: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    sm: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    xl: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 12,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    }),
};

export const ANIMATION = {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
    },
    springBouncy: {
        damping: 10,
        stiffness: 200,
        mass: 0.6,
    },
    springGentle: {
        damping: 20,
        stiffness: 100,
        mass: 1,
    },
};

export const Z_INDEX = {
    base: 0,
    card: 10,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    overlay: 400,
    toast: 500,
    max: 999,
};

export const ICON_SIZE = {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 28,
    xl: 36,
    xxl: 48,
};

export default {
    COLORS,
    GRADIENTS,
    GLASS,
    SPACING,
    FONT_SIZE,
    FONT_WEIGHT,
    LINE_HEIGHT,
    BORDER_RADIUS,
    SHADOWS,
    ANIMATION,
    Z_INDEX,
};
