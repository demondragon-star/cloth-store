// Cart Screen
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    TextInput,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { CartItem, Button, EmptyState, Card, CouponModal } from '../../components';
import { useAuthStore, useCartStore } from '../../store';
import { useEntranceAnimation } from '../../hooks/useScrollAnimation';
import { formatPrice } from '../../utils/format';
import type { RootStackParamList, CartItem as CartItemType } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CartScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const {
        items,
        subtotal,
        discount,
        tax,
        shipping,
        total,
        coupon,
        isLoading,
        fetchCart,
        updateQuantity,
        removeFromCart,
        applyCoupon,
        removeCoupon,
        clearCart,
    } = useCartStore();

    const [couponCode, setCouponCode] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(items.length);

    useEffect(() => {
        if (!isLoading && items.length > 0) triggerEntrance();
    }, [isLoading]);

    useEffect(() => {
        if (user) {
            fetchCart(user.id);
        }
    }, [user, fetchCart]);

    const handleQuantityChange = async (cartItemId: string, quantity: number) => {
        if (quantity === 0) {
            handleRemoveItem(cartItemId);
            return;
        }
        await updateQuantity(cartItemId, quantity);
    };

    const handleRemoveItem = (cartItemId: string) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeFromCart(cartItemId);
                        Toast.show({
                            type: 'success',
                            text1: 'Item Removed',
                            text2: 'Item has been removed from your cart.',
                        });
                    },
                },
            ]
        );
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Enter Coupon Code',
                text2: 'Please enter a valid coupon code.',
            });
            return;
        }

        setApplyingCoupon(true);
        const result = await applyCoupon(couponCode.trim());
        setApplyingCoupon(false);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Coupon Applied',
                text2: 'Discount has been applied to your order.',
            });
            setCouponCode('');
        } else {
            Toast.show({
                type: 'error',
                text1: 'Invalid Coupon',
                text2: result.error || 'This coupon code is not valid.',
            });
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        Toast.show({
            type: 'info',
            text1: 'Coupon Removed',
            text2: 'Discount has been removed from your order.',
        });
    };

    const handleCouponModalSelect = async (selectedCoupon: any) => {
        setApplyingCoupon(true);
        const result = await applyCoupon(selectedCoupon.code);
        setApplyingCoupon(false);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Coupon Applied',
                text2: 'Discount has been applied to your order.',
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Invalid Coupon',
                text2: result.error || 'This coupon code is not valid.',
            });
        }
    };

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        if (user) {
                            await clearCart(user.id);
                            Toast.show({
                                type: 'success',
                                text1: 'Cart Cleared',
                                text2: 'All items have been removed from your cart.',
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleCheckout = () => {
        if (!user) {
            navigation.navigate('Auth' as any);
            return;
        }
        navigation.navigate('Checkout');
    };

    const handleContinueShopping = () => {
        navigation.goBack();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Shopping Cart</Text>
                <Text style={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
            </View>
            {items.length > 0 && (
                <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderCartItem = ({ item, index }: { item: CartItemType; index: number }) => (
        <Animated.View style={getEntranceStyle(index)}>
        <CartItem
            item={item}
            onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
            onRemove={() => handleRemoveItem(item.id)}
        />
        </Animated.View>
    );

    const renderCouponSection = () => (
        <Card style={styles.couponSection}>
            <Text style={styles.sectionLabel}>Have a coupon code?</Text>
            {coupon ? (
                <View style={styles.appliedCoupon}>
                    <View style={styles.couponInfo}>
                        <Ionicons name="ticket-outline" size={20} color={COLORS.success} />
                        <Text style={styles.couponCodeApplied}>{coupon.code}</Text>
                        <Text style={styles.couponDiscount}>
                            -{formatPrice(discount)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleRemoveCoupon}>
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.couponInput}>
                        <TextInput
                            value={couponCode}
                            onChangeText={setCouponCode}
                            placeholder="Enter coupon code"
                            placeholderTextColor={COLORS.gray[400]}
                            style={styles.couponTextInput}
                            autoCapitalize="characters"
                            onFocus={() => setShowCouponModal(true)}
                        />
                        <Button
                            title="Apply"
                            onPress={handleApplyCoupon}
                            loading={applyingCoupon}
                            size="small"
                            variant="outline"
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowCouponModal(true)}
                        style={styles.viewCouponsButton}
                    >
                        <Ionicons name="ticket-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.viewCouponsText}>View all available coupons</Text>
                    </TouchableOpacity>
                </>
            )}
        </Card>
    );

    const renderOrderSummary = () => (
        <Card style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>

            {discount > 0 && (
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountValue]}>
                        -{formatPrice(discount)}
                    </Text>
                </View>
            )}

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (18% GST)</Text>
                <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
            </View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </Text>
            </View>

            {shipping === 0 && (
                <View style={styles.freeShippingBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.freeShippingText}>You got free shipping!</Text>
                </View>
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
        </Card>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name="cart-outline" size={52} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>Add some items to your cart to get started</Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleContinueShopping}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#7C3AED'] as const}
                    style={styles.emptyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.emptyButtonText}>Start Shopping</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
                {renderHeader()}
                {renderEmpty()}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <FlatList
                data={items}
                ListHeaderComponent={renderHeader}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ListFooterComponent={
                    <>
                        {renderCouponSection()}
                        {renderOrderSummary()}
                        <View style={styles.bottomPadding} />
                    </>
                }
            />

            {/* Checkout Button */}
            <View style={styles.checkoutContainer}>
                <View style={styles.checkoutInfo}>
                    <Text style={styles.checkoutLabel}>Total</Text>
                    <Text style={styles.checkoutTotal}>{formatPrice(total)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[COLORS.primary, '#7C3AED'] as const}
                        style={styles.checkoutGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Coupon Modal */}
            {user && (
                <CouponModal
                    visible={showCouponModal}
                    onClose={() => setShowCouponModal(false)}
                    onSelectCoupon={handleCouponModalSelect}
                    userId={user.id}
                    cartTotal={subtotal}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.black, color: COLORS.text },
    itemCount: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
    clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
    clearText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.error },
    list: { padding: SPACING.md },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxl * 2 },
    emptyIconBg: { width: 100, height: 100, backgroundColor: COLORS.primary + '12', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
    emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.black, color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
    emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    emptyButton: { borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
    emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
    emptyButtonText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    couponSection: {
        marginTop: SPACING.md,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    couponInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    couponTextInput: {
        flex: 1,
        backgroundColor: COLORS.gray[50],
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    appliedCoupon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECFDF5',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
    },
    couponInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    couponCodeApplied: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.success,
    },
    couponDiscount: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.success,
    },
    viewCouponsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.sm,
        paddingVertical: SPACING.sm,
        gap: SPACING.xs,
    },
    viewCouponsText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
    },
    summarySection: {
        marginTop: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    summaryLabel: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    discountLabel: {
        color: COLORS.success,
    },
    discountValue: {
        color: COLORS.success,
    },
    freeShippingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        marginVertical: SPACING.sm,
    },
    freeShippingText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.success,
        marginLeft: SPACING.xs,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },
    totalLabel: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    totalValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
    },
    bottomPadding: {
        height: 120,
    },
    checkoutContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.white, paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.lg,
        borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', alignItems: 'center', ...SHADOWS.lg,
    },
    checkoutInfo: { marginRight: SPACING.md },
    checkoutLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
    checkoutTotal: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.black, color: COLORS.text },
    checkoutButton: { flex: 1, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
    checkoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
    checkoutBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
});

export default CartScreen;
