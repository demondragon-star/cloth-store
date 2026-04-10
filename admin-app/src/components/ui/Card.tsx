// Premium Card component with glass, elevated, and interactive variants
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
    padding?: 'none' | 'small' | 'medium' | 'large';
    onPress?: () => void;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'medium',
    onPress,
    style,
}) => {
    const getPaddingStyle = (): ViewStyle => {
        switch (padding) {
            case 'none':
                return { padding: 0 };
            case 'small':
                return { padding: SPACING.sm + 4 };
            case 'large':
                return { padding: SPACING.lg };
            default:
                return { padding: SPACING.md };
        }
    };

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: COLORS.white,
                    ...SHADOWS.lg,
                };
            case 'outlined':
                return {
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                };
            case 'filled':
                return {
                    backgroundColor: COLORS.gray[50],
                };
            case 'glass':
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                };
            default:
                return {
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    ...SHADOWS.sm,
                };
        }
    };

    const cardStyle = [styles.card, getVariantStyle(), getPaddingStyle(), style];

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
});
