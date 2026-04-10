// Premium Badge component with soft backgrounds and refined styling
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, SHADOWS } from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
    count?: number;
    maxCount?: number;
    showZero?: boolean;
    dot?: boolean;
    color?: string;
    variant?: BadgeVariant;
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
    children?: React.ReactNode;
    label?: string;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    primary: { bg: COLORS.primarySoft, text: COLORS.primary, border: '#C7D2FE' },
    success: { bg: COLORS.successSoft, text: COLORS.success, border: '#A7F3D0' },
    warning: { bg: COLORS.warningSoft, text: COLORS.amberDark, border: '#FDE68A' },
    error: { bg: COLORS.errorSoft, text: COLORS.error, border: '#FECACA' },
    info: { bg: COLORS.infoSoft, text: COLORS.info, border: '#BFDBFE' },
    default: { bg: COLORS.gray[100], text: COLORS.gray[600], border: COLORS.gray[200] },
};

export const Badge: React.FC<BadgeProps> = ({
    count = 0,
    maxCount = 99,
    showZero = false,
    dot = false,
    color,
    variant = 'error',
    size = 'medium',
    style,
    children,
    label,
}) => {
    const shouldShow = dot || count > 0 || showZero || label;

    if (!shouldShow && !children) return null;

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    minWidth: 18,
                    height: 18,
                    fontSize: FONT_SIZE.xs,
                    dotSize: 8,
                    paddingH: SPACING.xs + 1,
                };
            case 'large':
                return {
                    minWidth: 26,
                    height: 26,
                    fontSize: FONT_SIZE.md,
                    dotSize: 12,
                    paddingH: SPACING.sm,
                };
            default:
                return {
                    minWidth: 22,
                    height: 22,
                    fontSize: FONT_SIZE.sm,
                    dotSize: 10,
                    paddingH: SPACING.xs + 2,
                };
        }
    };

    const sizeStyles = getSizeStyles();
    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
    const badgeColor = color || COLORS.error;
    const colors = label ? variantColors[variant] : null;

    // Label badge (pill-shaped status badge)
    if (label) {
        return (
            <View
                style={[
                    styles.labelBadge,
                    {
                        backgroundColor: colors!.bg,
                        borderColor: colors!.border,
                    },
                    style,
                ]}
            >
                <Text style={[styles.labelText, { color: colors!.text }]}>
                    {label}
                </Text>
            </View>
        );
    }

    const badgeElement = shouldShow && (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: badgeColor,
                    minWidth: dot ? sizeStyles.dotSize : sizeStyles.minWidth,
                    height: dot ? sizeStyles.dotSize : sizeStyles.height,
                    borderRadius: dot ? sizeStyles.dotSize / 2 : sizeStyles.height / 2,
                    paddingHorizontal: dot ? 0 : sizeStyles.paddingH,
                },
                children ? styles.badgePositioned : undefined,
                style,
            ]}
        >
            {!dot && (
                <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
                    {displayCount}
                </Text>
            )}
        </View>
    );

    if (children) {
        return (
            <View style={styles.container}>
                {children}
                {badgeElement}
            </View>
        );
    }

    return badgeElement;
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    badge: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgePositioned: {
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 1,
    },
    text: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.bold,
        textAlign: 'center',
    },
    labelBadge: {
        paddingHorizontal: SPACING.sm + 4,
        paddingVertical: SPACING.xs + 1,
        borderRadius: 9999,
        borderWidth: 1,
    },
    labelText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        letterSpacing: 0.2,
    },
});
