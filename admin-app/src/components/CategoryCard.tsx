// Category Card component
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getCategoryImage } from '../constants/categoryAssets';
import type { Category } from '../types';

interface CategoryCardProps {
    category: Category;
    onPress: () => void;
    variant?: 'default' | 'large' | 'compact';
    style?: ViewStyle;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
    category,
    onPress,
    variant = 'default',
    style,
}) => {
    const [imageError, setImageError] = useState(false);

    /**
     * Resolve image source with priority:
     * 1. Local asset based on category name
     * 2. Remote image_url if provided
     * 3. null (will show fallback)
     */
    const resolveImageSource = (): ImageSourcePropType | null => {
        // Try local asset first
        const localAsset = getCategoryImage(category.name);
        if (localAsset) {
            return localAsset;
        }

        // Fall back to remote URL if available
        if (category.image_url && !imageError) {
            return { uri: category.image_url };
        }

        return null;
    };

    const imageSource = resolveImageSource();

    const handleImageError = (error: any) => {
        console.error('Category image load error:', error.nativeEvent?.error || error);
        setImageError(true);
    };

    if (variant === 'large') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[styles.largeCard, style]}
            >
                {imageSource ? (
                    <Image
                        source={imageSource}
                        style={styles.largeImage}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.largeImage, styles.imagePlaceholder]}>
                        <Ionicons name="grid-outline" size={40} color={COLORS.white} />
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.largeOverlay}
                >
                    <Text style={styles.largeName}>{category.name}</Text>
                    {category.description && (
                        <Text style={styles.largeDescription} numberOfLines={2}>
                            {category.description}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'compact') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.compactCard, style]}
            >
                <View style={styles.compactIconContainer}>
                    {category.icon ? (
                        <Ionicons name={category.icon as any} size={24} color={COLORS.primary} />
                    ) : (
                        <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
                    )}
                </View>
                <Text style={styles.compactName} numberOfLines={1}>{category.name}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.card, SHADOWS.sm, style]}
        >
            <View style={styles.imageContainer}>
                {imageSource ? (
                    <Image
                        source={imageSource}
                        style={styles.image}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <LinearGradient
                        colors={COLORS.primaryGradient}
                        style={[styles.image, styles.gradientBackground]}
                    >
                        <Ionicons name="grid-outline" size={32} color={COLORS.white} />
                    </LinearGradient>
                )}
            </View>
            <Text style={styles.name} numberOfLines={2}>{category.name}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        width: 100,
        alignItems: 'center',
        padding: SPACING.sm,
    },
    imageContainer: {
        width: 72,
        height: 72,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradientBackground: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    imagePlaceholder: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Large variant
    largeCard: {
        width: '100%',
        height: 180,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    largeImage: {
        width: '100%',
        height: '100%',
    },
    largeOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: SPACING.lg,
    },
    largeName: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    largeDescription: {
        fontSize: FONT_SIZE.md,
        color: COLORS.gray[200],
        marginTop: SPACING.xs,
    },
    // Compact variant
    compactCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        width: 80,
        ...SHADOWS.sm,
    },
    compactIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray[50],
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactName: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
});

export default CategoryCard;
