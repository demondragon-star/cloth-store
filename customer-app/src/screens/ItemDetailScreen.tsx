// Item Detail Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import {
    Badge,
    Rating,
    ImageSlider,
    Card,
    SkeletonProductCard,
} from '../components';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, useCartStore, useWishlistStore } from '../store';
import { itemService } from '../services';
import { formatPrice } from '../utils/format';
import { colorVariantService, ColorVariant } from '../services/colorVariant.service';
import { reviewService, Review } from '../services/review.service';
import type { RootStackParamList, Item } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'ItemDetail'>;

export const ItemDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteType>();
    const { itemId } = route.params;

    const { user } = useAuthStore();
    const { addToCart, itemCount } = useCartStore();
    const { isItemInWishlist, toggleWishlist } = useWishlistStore();

    const [item, setItem] = useState<Item | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
    const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);

    const isInWishlist = item ? isItemInWishlist(item.id) : false;

    const loadItem = useCallback(async () => {
        try {
            const { data, error } = await itemService.getItemById(itemId);
            if (data) {
                setItem(data);
                if (data.variants && data.variants.length > 0) {
                    setSelectedVariant(data.variants[0].id);
                }
            }
            // Load color variants
            const { data: cvData } = await colorVariantService.getVariants(itemId);
            if (cvData && cvData.length > 0) {
                setColorVariants(cvData);
                setSelectedColor(cvData[0]);
            }
            // Load reviews
            const { data: rvData, avgRating: avg } = await reviewService.getReviews(itemId);
            if (rvData) { setReviews(rvData); setAvgRating(avg); }
        } catch (error) {
            console.error('Error loading item:', error);
        } finally {
            setIsLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        loadItem();
    }, [loadItem]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleCart = () => {
        navigation.navigate('Main', { screen: 'Cart' } as any);
    };

    const handleWishlistToggle = async () => {
        if (!user || !item) {
            navigation.navigate('Auth' as any);
            return;
        }

        const { added, error } = await toggleWishlist(user.id, item.id);
        if (!error) {
            Toast.show({
                type: 'success',
                text1: added ? 'Added to Wishlist' : 'Removed from Wishlist',
            });
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            navigation.navigate('Auth' as any);
            return;
        }

        if (!item) return;

        setAddingToCart(true);
        const result = await addToCart(user.id, item.id, quantity, selectedVariant || undefined);
        setAddingToCart(false);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Added to Cart',
                text2: `${quantity} item(s) added to your cart`,
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Failed to Add',
                text2: result.error,
            });
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        navigation.navigate('Main', { screen: 'Cart' } as any);
    };

    const getCurrentPrice = () => {
        if (!item) return 0;
        if (selectedVariant) {
            const variant = item.variants?.find(v => v.id === selectedVariant);
            if (variant) return variant.price;
        }
        return item.price;
    };

    const discount = item?.compare_at_price
        ? Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)
        : 0;

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ width: '100%', height: 350, backgroundColor: COLORS.gray[200] }} />
                    <View style={styles.content}>
                        <SkeletonProductCard variant="horizontal" />
                        <View style={{ height: SPACING.md }} />
                        <SkeletonProductCard variant="horizontal" />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.errorText}>Product not found</Text>
                    <TouchableOpacity onPress={handleBack} style={{ marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}>
                        <Text style={{ color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: 14 }}>Go Back</Text>
                    </TouchableOpacity>

                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafe}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleWishlistToggle} style={styles.headerButton}>
                            <Ionicons
                                name={isInWishlist ? 'heart' : 'heart-outline'}
                                size={24}
                                color={isInWishlist ? COLORS.error : COLORS.text}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCart} style={styles.headerButton}>
                            <Badge count={itemCount} size="small">
                                <Ionicons name="cart-outline" size={24} color={COLORS.text} />
                            </Badge>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Slider */}
                <ImageSlider images={item.images || []} height={350} />

                {/* Product Info */}
                <View style={styles.content}>
                    {/* Title & Rating */}
                    <View style={styles.titleSection}>
                        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.ratingRow}>
                            <Rating
                                value={item.rating_average}
                                count={item.rating_count}
                                showValue
                                showCount
                            />
                        </View>
                    </View>

                    {/* Price */}
                    <View style={styles.priceSection}>
                        <Text style={styles.price}>{formatPrice(getCurrentPrice())}</Text>
                        {item.compare_at_price && (
                            <>
                                <Text style={styles.comparePrice}>
                                    {formatPrice(item.compare_at_price)}
                                </Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{discount}% OFF</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Stock Status */}
                    <View style={styles.stockSection}>
                        {item.is_in_stock ? (
                            <View style={styles.inStock}>
                                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                <Text style={styles.stockText}>In Stock</Text>
                            </View>
                        ) : (
                            <View style={styles.outOfStock}>
                                <Ionicons name="close-circle" size={18} color={COLORS.error} />
                                <Text style={styles.outOfStockText}>Out of Stock</Text>
                            </View>
                        )}
                    </View>

                    {/* Variants */}
                    {item.variants && item.variants.length > 0 && (
                        <Card style={styles.variantsSection}>
                            <Text style={styles.sectionTitle}>Options</Text>
                            <View style={styles.variantsList}>
                                {item.variants.map((variant) => (
                                    <TouchableOpacity
                                        key={variant.id}
                                        onPress={() => setSelectedVariant(variant.id)}
                                        style={[
                                            styles.variantButton,
                                            selectedVariant === variant.id && styles.variantButtonSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.variantText,
                                                selectedVariant === variant.id && styles.variantTextSelected,
                                            ]}
                                        >
                                            {variant.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Quantity */}
                    <Card style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.quantityControl}>
                            <TouchableOpacity
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                style={styles.quantityButton}
                                disabled={quantity <= 1}
                            >
                                <Ionicons
                                    name="remove"
                                    size={20}
                                    color={quantity <= 1 ? COLORS.gray[300] : COLORS.text}
                                />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                                onPress={() => setQuantity(quantity + 1)}
                                style={styles.quantityButton}
                            >
                                <Ionicons name="add" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Color Variants */}
                    {colorVariants.length > 0 && (
                        <Card style={styles.variantsSection}>
                            <Text style={styles.sectionTitle}>Color – <Text style={{ color: COLORS.primary }}>{selectedColor?.color}</Text></Text>
                            <View style={styles.colorList}>
                                {colorVariants.map((cv) => (
                                    <TouchableOpacity
                                        key={cv.id}
                                        onPress={() => setSelectedColor(cv)}
                                        style={[
                                            styles.colorSwatch,
                                            selectedColor?.id === cv.id && styles.colorSwatchSelected,
                                        ]}
                                    >
                                        <View style={[styles.colorDot, { backgroundColor: cv.color_hex }]} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Description */}
                    <Card style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </Card>

                    {/* Features */}
                    <Card style={styles.featuresSection}>
                        <View style={styles.featureItem}>
                            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Genuine Product</Text>
                                <Text style={styles.featureDescription}>100% authentic & verified</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="refresh-outline" size={24} color={COLORS.primary} />
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Easy Returns</Text>
                                <Text style={styles.featureDescription}>7-day return policy</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="car-outline" size={24} color={COLORS.primary} />
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Free Delivery</Text>
                                <Text style={styles.featureDescription}>On orders above ₹499</Text>
                            </View>
                        </View>
                    </Card>

                    {/* Customer Reviews */}
                    <Card style={styles.reviewsSection}>
                        <View style={styles.reviewsHeader}>
                            <Text style={styles.sectionTitle}>Customer Reviews</Text>
                            {reviews.length > 0 && (
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={14} color="#FBBF24" />
                                    <Text style={styles.ratingBadgeText}>{avgRating}</Text>
                                </View>
                            )}
                        </View>
                        {reviews.length === 0 ? (
                            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
                        ) : (
                            reviews.slice(0, 3).map((rv) => (
                                <View key={rv.id} style={styles.reviewCard}>
                                    <View style={styles.reviewMeta}>
                                        <View style={styles.reviewAvatar}>
                                            <Text style={styles.reviewAvatarText}>
                                                {rv.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewerName}>{rv.user?.full_name || 'Customer'}</Text>
                                            <View style={styles.starRow}>
                                                {[1,2,3,4,5].map(s => (
                                                    <Ionicons key={s} name={s <= rv.rating ? 'star' : 'star-outline'} size={12} color="#FBBF24" />
                                                ))}
                                            </View>
                                        </View>
                                        {rv.is_verified && (
                                            <View style={styles.verifiedBadge}>
                                                <Text style={styles.verifiedText}>✓ Verified</Text>
                                            </View>
                                        )}
                                    </View>
                                    {rv.title && <Text style={styles.reviewTitle}>{rv.title}</Text>}
                                    <Text style={styles.reviewBody}>{rv.body}</Text>
                                </View>
                            ))
                        )}
                    </Card>

                    <View style={styles.bottomPadding} />
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <SafeAreaView edges={['bottom']} style={styles.actionBarSafe}>
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[styles.addToCartBtn, !item.is_in_stock && { opacity: 0.5 }]}
                        onPress={handleAddToCart}
                        disabled={!item.is_in_stock || addingToCart}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={addingToCart ? 'hourglass-outline' : 'cart-outline'} size={18} color={COLORS.primary} />
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.buyNowBtn, !item.is_in_stock && { opacity: 0.5 }]}
                        onPress={handleBuyNow}
                        disabled={!item.is_in_stock}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED']}
                            style={styles.buyNowGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buyNowText}>Buy Now</Text>
                            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    headerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    },
    headerButton: {
        width: 40, height: 40, borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
    },
    headerRight: { flexDirection: 'row', gap: SPACING.sm },
    content: { padding: SPACING.md },
    titleSection: { marginBottom: SPACING.sm },
    name: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.black, color: '#0F172A', letterSpacing: -0.5, lineHeight: FONT_SIZE.xxl * 1.25 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
    priceSection: {
        flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md,
        flexWrap: 'wrap', gap: SPACING.sm,
    },
    price: { fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.black, color: '#4F46E5' },
    comparePrice: { fontSize: FONT_SIZE.lg, color: COLORS.gray[400], textDecorationLine: 'line-through' },
    discountBadge: {
        backgroundColor: '#DCFCE7', paddingHorizontal: SPACING.sm,
        paddingVertical: 3, borderRadius: BORDER_RADIUS.full,
    },
    discountText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: '#15803D' },
    stockSection: { marginBottom: SPACING.md },
    inStock: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    stockText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.success },
    outOfStock: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    outOfStockText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.error },
    variantsSection: { marginBottom: SPACING.md },
    sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
    variantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    variantButton: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full, borderWidth: 1.5,
        borderColor: COLORS.border, backgroundColor: COLORS.white,
    },
    variantButtonSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
    variantText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: '#64748B' },
    variantTextSelected: { color: COLORS.primary },
    quantitySection: { marginBottom: SPACING.md },
    quantityControl: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden',
    },
    quantityButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    quantityText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, minWidth: 38, textAlign: 'center' },
    descriptionSection: { marginBottom: SPACING.md },
    description: { fontSize: FONT_SIZE.md, color: '#475569', lineHeight: FONT_SIZE.md * 1.7 },
    featuresSection: { marginBottom: SPACING.md },
    featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.md },
    featureContent: { flex: 1 },
    featureTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
    featureDescription: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
    bottomPadding: { height: 120 },
    colorList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    colorSwatch: {
        width: 42, height: 42, borderRadius: 21,
        borderWidth: 2, borderColor: 'transparent',
        alignItems: 'center', justifyContent: 'center',
    },
    colorSwatchSelected: { borderColor: COLORS.primary },
    colorDot: { width: 30, height: 30, borderRadius: 15 },
    reviewsSection: { marginBottom: SPACING.md },
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
    ratingBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: '#92400E' },
    noReviews: { fontSize: FONT_SIZE.sm, color: COLORS.gray[400], textAlign: 'center', paddingVertical: SPACING.md },
    reviewCard: { paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
    reviewMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
    reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' },
    reviewAvatarText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
    reviewerName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
    starRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
    verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
    verifiedText: { fontSize: 10, color: '#15803D', fontWeight: FONT_WEIGHT.bold },
    reviewTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: 2 },
    reviewBody: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: FONT_SIZE.sm * 1.6 },
    actionBarSafe: {
        backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F1F5F9',
        shadowColor: '#6366F1', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 12,
    },
    actionBar: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
    addToCartBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: 13,
    },
    addToCartText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
    buyNowBtn: { flex: 1.4, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
    buyNowGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
    buyNowText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    loadingContainer: { flex: 1, padding: SPACING.md },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    errorText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.lg },
});

export default ItemDetailScreen;
