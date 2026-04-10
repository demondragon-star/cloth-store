// Premium Skeleton Loader with smooth shimmer animation
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = BORDER_RADIUS.md,
    style,
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        animation.start();

        return () => animation.stop();
    }, [animatedValue]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height,
                    borderRadius,
                },
                style,
            ] as any}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
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

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
    <View style={[styles.skeletonCard, style]}>
        <Skeleton width="100%" height={160} borderRadius={BORDER_RADIUS.xl} />
        <View style={styles.skeletonCardContent}>
            <Skeleton width="70%" height={18} style={{ marginBottom: SPACING.sm }} />
            <Skeleton width="40%" height={14} style={{ marginBottom: SPACING.sm }} />
            <Skeleton width="30%" height={16} />
        </View>
    </View>
);

export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => (
    <View style={[styles.skeletonListItem, style]}>
        <Skeleton width={60} height={60} borderRadius={BORDER_RADIUS.xl} />
        <View style={styles.skeletonListItemContent}>
            <Skeleton width="80%" height={16} style={{ marginBottom: SPACING.sm }} />
            <Skeleton width="50%" height={14} />
        </View>
    </View>
);

export const SkeletonAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({
    size = 48,
    style,
}) => <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.gray[100],
        overflow: 'hidden',
    },
    skeletonCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.xs,
    },
    skeletonCardContent: {
        padding: SPACING.md,
    },
    skeletonListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    skeletonListItemContent: {
        flex: 1,
        marginLeft: SPACING.md,
    },
});
