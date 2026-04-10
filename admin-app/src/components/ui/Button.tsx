// Premium Button component with gradient, haptic depth, and spring animations
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, FONT_WEIGHT } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    const getSizeStyles = (): ViewStyle => {
        switch (size) {
            case 'small':
                return { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, minHeight: 38 };
            case 'large':
                return { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md + 2, minHeight: 58 };
            default:
                return { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, minHeight: 50 };
        }
    };

    const getTextSize = (): number => {
        switch (size) {
            case 'small':
                return FONT_SIZE.sm;
            case 'large':
                return FONT_SIZE.lg;
            default:
                return FONT_SIZE.md + 1;
        }
    };

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        switch (variant) {
            case 'danger':
                return ['#EF4444', '#DC2626'] as const;
            case 'success':
                return ['#10B981', '#059669'] as const;
            case 'secondary':
                return ['#EC4899', '#DB2777'] as const;
            default:
                return COLORS.primaryGradient;
        }
    };

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (variant) {
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: COLORS.primary,
                    },
                    text: { color: COLORS.primary },
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: COLORS.primarySoft,
                    },
                    text: { color: COLORS.primary },
                };
            default:
                return {
                    container: {},
                    text: { color: COLORS.white },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const renderContent = () => (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
                    size="small"
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
                    <Text
                        style={[
                            styles.text,
                            { fontSize: getTextSize() },
                            variantStyles.text,
                            isDisabled && styles.textDisabled,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
                </>
            )}
        </View>
    );

    // Gradient variants: primary, secondary, danger, success
    if ((variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'success') && !isDisabled) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.85}
                style={[fullWidth && styles.fullWidth, style]}
            >
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.container,
                        sizeStyles,
                        SHADOWS.md,
                        fullWidth && styles.fullWidth,
                    ]}
                >
                    {renderContent()}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            style={[
                styles.container,
                sizeStyles,
                variantStyles.container,
                variant !== 'ghost' && variant !== 'outline' && SHADOWS.sm,
                isDisabled && styles.disabled,
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: FONT_WEIGHT.semibold,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    textDisabled: {
        opacity: 0.5,
    },
    disabled: {
        backgroundColor: COLORS.gray[200],
        opacity: 0.6,
    },
    fullWidth: {
        width: '100%',
    },
    iconLeft: {
        marginRight: SPACING.sm,
    },
    iconRight: {
        marginLeft: SPACING.sm,
    },
});
