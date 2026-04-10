// Premium Skeleton Loader with smooth 60fps shimmer animation using Reanimated
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = BORDER_RADIUS.md,
    style,
}) => {
    const shimmerValue = useSharedValue(-1);

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(2, {
                duration: 1500,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: shimmerValue.value * SCREEN_WIDTH }],
        };
    });

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                },
                style,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, width: '100%' }}
                />
            </Animated.View>
        </View>
    );
};

// Pre-built skeleton variants
export const SkeletonText: React.FC<{ lines?: number; style?: ViewStyle }> = ({
    lines = 3,
    style,
}) => (
    <View style={style}>
        {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
                key={index}
                width={index === lines - 1 ? '60%' : '100%'}
                height={14}
                style={{ marginBottom: index < lines - 1 ? SPACING.sm : 0 }}
            />
        ))}
    </View>
);

export const SkeletonProductCard: React.FC<{ variant?: 'default' | 'compact' | 'horizontal'; style?: ViewStyle }> = ({
    variant = 'default',
    style,
}) => {
    if (variant === 'compact') {
        return (
            <View style={[styles.compactProductCard, style]}>
                <Skeleton width={80} height={80} borderRadius={BORDER_RADIUS.md} />
                <Skeleton width="80%" height={12} style={{ marginTop: SPACING.sm }} />
                <Skeleton width="60%" height={14} style={{ marginTop: SPACING.xs }} />
            </View>
        );
    }
    
    if (variant === 'horizontal') {
        return (
            <View style={[styles.horizontalProductCard, style]}>
                <Skeleton width={100} height={100} borderRadius={BORDER_RADIUS.md} />
                <View style={styles.horizontalContent}>
                    <Skeleton width="90%" height={14} />
                    <Skeleton width="50%" height={12} style={{ marginTop: SPACING.xs }} />
                    <Skeleton width={60} height={16} style={{ marginTop: SPACING.md }} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.productCard, style]}>
            <Skeleton width="100%" height={180} borderRadius={0} />
            <View style={styles.productCardContent}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="70%" height={14} style={{ marginTop: SPACING.xs }} />
                <View style={styles.priceRow}>
                    <Skeleton width={60} height={20} />
                    <Skeleton width={32} height={32} borderRadius={16} />
                </View>
            </View>
        </View>
    );
};

export const SkeletonCategoryCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
    <View style={[styles.categoryCard, style]}>
        <Skeleton width={72} height={72} borderRadius={BORDER_RADIUS.lg} />
        <Skeleton width="80%" height={12} style={{ marginTop: SPACING.sm }} />
    </View>
);

export const SkeletonAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({
    size = 48,
    style,
}) => <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;

// Generic list-item skeleton — used by OrderHistory, Addresses, etc.
export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => (
    <View style={[styles.listItem, style]}>
        <Skeleton width={48} height={48} borderRadius={BORDER_RADIUS.md} />
        <View style={styles.listItemContent}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="50%" height={12} style={{ marginTop: SPACING.xs }} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.gray[200],
        overflow: 'hidden',
    },
    productCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        width: 180,
        ...SHADOWS.md,
    },
    productCardContent: {
        padding: SPACING.md,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    compactProductCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        width: 120,
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    horizontalProductCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    horizontalContent: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'center',
    },
    categoryCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        width: 100,
        alignItems: 'center',
        padding: SPACING.sm,
        ...SHADOWS.sm,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    listItemContent: {
        flex: 1,
        marginLeft: SPACING.md,
    },
});

export default Skeleton;
