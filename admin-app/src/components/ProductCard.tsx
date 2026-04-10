// Product Card component
import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Rating } from './ui/Rating';
import { formatPrice, formatPercentage } from '../utils/format';
import type { Item } from '../types';

interface ProductCardProps {
    item: Item;
    onPress: () => void;
    onWishlistPress?: () => void;
    onAddToCartPress?: () => void;
    isInWishlist?: boolean;
    variant?: 'default' | 'compact' | 'horizontal';
    style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    item,
    onPress,
    onWishlistPress,
    onAddToCartPress,
    isInWishlist = false,
    variant = 'default',
    style,
}) => {
    const imageUrl = item.images?.[0]?.image_url;
    const discount = item.compare_at_price
        ? Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)
        : 0;

    if (variant === 'horizontal') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.horizontalCard, SHADOWS.sm, style]}
            >
                <View style={styles.horizontalImageContainer}>
                    {imageUrl ? (
                        <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.horizontalImage} 
                            resizeMode="cover"
                            onError={(error) => {
                                console.warn(`Failed to load image for item ${item.id}:`, error.nativeEvent.error);
                            }}
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={32} color={COLORS.gray[400]} />
                        </View>
                    )}
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{discount}%</Text>
                        </View>
                    )}
                </View>

                <View style={styles.horizontalContent}>
                    <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

                    <Rating value={item.rating_average} count={item.rating_count} size={12} showValue />

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{formatPrice(item.price)}</Text>
                        {item.compare_at_price && (
                            <Text style={styles.comparePrice}>{formatPrice(item.compare_at_price)}</Text>
                        )}
                    </View>

                    {!item.is_in_stock && (
                        <Text style={styles.outOfStock}>Out of Stock</Text>
                    )}
                </View>

                {onWishlistPress && (
                    <TouchableOpacity onPress={onWishlistPress} style={styles.horizontalWishlistButton}>
                        <Ionicons
                            name={isInWishlist ? 'heart' : 'heart-outline'}
                            size={22}
                            color={isInWishlist ? COLORS.error : COLORS.gray[400]}
                        />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    }

    if (variant === 'compact') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.compactCard, SHADOWS.sm, style]}
            >
                <View style={styles.compactImageContainer}>
                    {imageUrl ? (
                        <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.compactImage} 
                            resizeMode="cover"
                            onError={(error) => {
                                console.warn(`Failed to load image for item ${item.id}:`, error.nativeEvent.error);
                            }}
                        />
                    ) : (
                        <View style={[styles.imagePlaceholder, styles.compactImage]}>
                            <Ionicons name="image-outline" size={24} color={COLORS.gray[400]} />
                        </View>
                    )}
                </View>
                <Text style={styles.compactName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.compactPrice}>{formatPrice(item.price)}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.card, SHADOWS.md, style]}
        >
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.image} 
                        resizeMode="cover"
                        onError={(error) => {
                            console.warn(`Failed to load image for item ${item.id}:`, error.nativeEvent.error);
                        }}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={40} color={COLORS.gray[400]} />
                    </View>
                )}

                {/* Discount Badge */}
                {discount > 0 && (
                    <LinearGradient
                        colors={[COLORS.error, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.discountBadge}
                    >
                        <Text style={styles.discountText}>-{discount}%</Text>
                    </LinearGradient>
                )}

                {/* Wishlist Button */}
                {onWishlistPress && (
                    <TouchableOpacity onPress={onWishlistPress} style={styles.wishlistButton}>
                        <View style={styles.wishlistButtonInner}>
                            <Ionicons
                                name={isInWishlist ? 'heart' : 'heart-outline'}
                                size={20}
                                color={isInWishlist ? COLORS.error : COLORS.text}
                            />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Featured Badge */}
                {item.is_featured && (
                    <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={10} color={COLORS.warning} />
                        <Text style={styles.featuredText}>Featured</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

                <Rating
                    value={item.rating_average}
                    count={item.rating_count}
                    size={14}
                    showValue
                    showCount
                    style={styles.rating}
                />

                <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{formatPrice(item.price)}</Text>
                        {item.compare_at_price && (
                            <Text style={styles.comparePrice}>{formatPrice(item.compare_at_price)}</Text>
                        )}
                    </View>

                    {/* Add to Cart Button in Price Row */}
                    {item.is_in_stock && onAddToCartPress && (
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation();
                                onAddToCartPress();
                            }} 
                            style={styles.addButtonWrapper}
                        >
                            <LinearGradient
                                colors={COLORS.primaryGradient}
                                style={styles.gradientButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={20} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {!item.is_in_stock && (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStock}>Out of Stock</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        width: 180,
    },
    imageContainer: {
        position: 'relative',
        height: 180,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    discountBadge: {
        position: 'absolute',
        top: SPACING.sm,
        left: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
    },
    discountText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.bold,
    },
    wishlistButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
    },
    wishlistButtonInner: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.full,
        padding: SPACING.sm,
        ...SHADOWS.sm,
    },
    featuredBadge: {
        position: 'absolute',
        bottom: SPACING.sm,
        left: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    gradientButton: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredText: {
        color: COLORS.warning,
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
        marginLeft: 4,
    },
    content: {
        padding: SPACING.md,
    },
    name: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        lineHeight: FONT_SIZE.md * 1.3,
    },
    rating: {
        marginTop: SPACING.xs,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    price: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
    },
    comparePrice: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.gray[400],
        textDecorationLine: 'line-through',
    },
    addButtonWrapper: {
        ...SHADOWS.sm,
    },
    outOfStockBadge: {
        marginTop: SPACING.sm,
    },
    outOfStock: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
    },
    // Horizontal variant styles
    horizontalCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    horizontalImageContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    horizontalImage: {
        width: '100%',
        height: '100%',
    },
    horizontalContent: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'center',
    },
    horizontalWishlistButton: {
        padding: SPACING.sm,
        alignSelf: 'center',
    },
    // Compact variant styles
    compactCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        width: 120,
        alignItems: 'center',
    },
    compactImageContainer: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    compactImage: {
        width: 80,
        height: 80,
    },
    compactName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    compactPrice: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
});

export default ProductCard;
