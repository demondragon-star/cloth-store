// Coupon Banner Carousel Component - Auto-sliding coupon banners for home screen
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Clipboard } from 'react-native';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { couponService } from '../services';
import type { Coupon } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - SPACING.md * 2;

interface CouponBannerCarouselProps {
    onBannerPress?: (coupon: Coupon) => void;
    autoSlideInterval?: number;
}

export const CouponBannerCarousel: React.FC<CouponBannerCarouselProps> = ({
    onBannerPress,
    autoSlideInterval = 3000,
}) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadActiveCoupons();
    }, []);

    useEffect(() => {
        // Start auto-slide if there are multiple coupons
        if (coupons.length > 1) {
            startAutoSlide();
        }

        return () => {
            stopAutoSlide();
        };
    }, [coupons.length, currentIndex]);

    const loadActiveCoupons = async () => {
        setLoading(true);
        const result = await couponService.getActiveCouponsForBanners();

        if (result.data) {
            setCoupons(result.data);
        }

        setLoading(false);
    };

    const startAutoSlide = () => {
        stopAutoSlide(); // Clear any existing timer

        autoSlideTimerRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % coupons.length;
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
                return nextIndex;
            });
        }, autoSlideInterval);
    };

    const stopAutoSlide = () => {
        if (autoSlideTimerRef.current) {
            clearInterval(autoSlideTimerRef.current);
            autoSlideTimerRef.current = null;
        }
    };

    const handleManualSwipe = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / BANNER_WIDTH);
        setCurrentIndex(index);
    };

    const handleBannerPress = async (coupon: Coupon) => {
        if (onBannerPress) {
            onBannerPress(coupon);
        } else {
            // Default action: copy coupon code to clipboard
            Clipboard.setString(coupon.code);
            Toast.show({
                type: 'success',
                text1: 'Coupon Copied!',
                text2: `${coupon.code} copied to clipboard`,
            });
        }
    };

    const renderBanner = ({ item: coupon }: { item: Coupon }) => {
        const discountText =
            coupon.discount_type === 'percentage'
                ? `${coupon.discount_value}% OFF`
                : `₹${coupon.discount_value} OFF`;

        const gradientColors: [string, string] =
            coupon.coupon_type === 'first_order'
                ? ['#FF6B9D', '#C06C84']
                : coupon.coupon_type === 'cart_value'
                    ? ['#4A90E2', '#357ABD']
                    : ['#F093FB', '#F5576C'];

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleBannerPress(coupon)}
                style={styles.bannerContainer}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.banner}
                >
                    <View style={styles.bannerContent}>
                        <View style={styles.bannerLeft}>
                            <Text style={styles.bannerLabel}>
                                {coupon.coupon_type === 'first_order'
                                    ? 'First Order Special'
                                    : coupon.coupon_type === 'cart_value'
                                        ? 'Limited Time Offer'
                                        : 'Special Offer'}
                            </Text>
                            <Text style={styles.bannerTitle}>{discountText}</Text>
                            <Text style={styles.bannerDescription} numberOfLines={1}>
                                {coupon.description || 'Use code at checkout'}
                            </Text>
                            <View style={styles.couponCodeContainer}>
                                <Ionicons name="ticket" size={16} color={COLORS.white} />
                                <Text style={styles.couponCodeText}>{coupon.code}</Text>
                            </View>
                        </View>
                        <Ionicons
                            name="gift-outline"
                            size={100}
                            color="rgba(255,255,255,0.2)"
                            style={styles.bannerIcon}
                        />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderPaginationDots = () => {
        if (coupons.length <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                {coupons.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === currentIndex && styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
        );
    }

    if (coupons.length === 0) {
        return null; // Hide carousel if no coupons
    }

    if (coupons.length === 1) {
        // Single banner - no carousel
        return (
            <View style={styles.container}>
                {renderBanner({ item: coupons[0] })}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={coupons}
                renderItem={renderBanner}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleManualSwipe}
                snapToInterval={BANNER_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={styles.flatListContent}
                getItemLayout={(data, index) => ({
                    length: BANNER_WIDTH,
                    offset: BANNER_WIDTH * index,
                    index,
                })}
            />
            {renderPaginationDots()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.xs,
    },
    loadingContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flatListContent: {
        paddingHorizontal: SPACING.md,
    },
    bannerContainer: {
        width: BANNER_WIDTH,
        marginRight: 0,
    },
    banner: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerLeft: {
        flex: 1,
        maxWidth: '70%',
    },
    bannerLabel: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: SPACING.xs,
        fontWeight: FONT_WEIGHT.medium,
    },
    bannerTitle: {
        fontSize: FONT_SIZE.xxxl,
        fontWeight: FONT_WEIGHT.black,
        color: COLORS.white,
        marginBottom: SPACING.xs,
    },
    bannerDescription: {
        fontSize: FONT_SIZE.md,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: SPACING.md,
    },
    couponCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    couponCodeText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
        marginLeft: SPACING.xs,
        letterSpacing: 1,
    },
    bannerIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        opacity: 0.8,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: SPACING.xs,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray[300],
    },
    paginationDotActive: {
        width: 24,
        backgroundColor: COLORS.primary,
    },
});

export default CouponBannerCarousel;
