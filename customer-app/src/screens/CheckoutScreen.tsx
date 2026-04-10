// Checkout Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    TextInput,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Card } from '../components';
import { useAuthStore, useCartStore } from '../store';
import { addressService, orderService, couponService } from '../services';
import { formatPrice } from '../utils/format';
import { useSectionEntrance } from '../hooks/useScrollAnimation';
import type { RootStackParamList, Address, Coupon, AppliedCoupon } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_METHODS = [
    { id: 'cod', name: 'Cash on Delivery', icon: 'cash-outline' },
    { id: 'card', name: 'Credit/Debit Card', icon: 'card-outline' },
    { id: 'upi', name: 'UPI Payment', icon: 'phone-portrait-outline' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet-outline' },
];

export const CheckoutScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const { items, subtotal, discount, tax, shipping, total, getCart, clearCart, coupon: cartCoupon, applyCoupon: applyCartCoupon, removeCoupon: removeCartCoupon } = useCartStore();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<string>('cod');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    // Coupon state - using cart store for coupon, local state for UI only
    const [couponCode, setCouponCode] = useState('');
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [loadingCoupons, setLoadingCoupons] = useState(false);

    // Use coupon from cart store - this is the source of truth
    const appliedCoupon = cartCoupon ? {
        coupon: cartCoupon,
        discount_amount: discount
    } : null;
    const { runEntrance, sectionStyle } = useSectionEntrance(4);

    useEffect(() => {
        if (!loadingAddresses) runEntrance();
    }, [loadingAddresses]);

    useEffect(() => {
        loadAddresses();
        loadAvailableCoupons();
        
        // Add listener to reload addresses when screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            loadAddresses();
            loadAvailableCoupons();
        });

        return unsubscribe;
    }, [navigation]);

    // Reload available coupons when cart total changes
    useEffect(() => {
        if (user) {
            loadAvailableCoupons();
        }
    }, [subtotal]);

    const loadAddresses = async () => {
        if (!user) return;
        try {
            const { data } = await addressService.getAddresses(user.id);
            if (data) {
                setAddresses(data);
                const defaultAddr = data.find(a => a.is_default);
                if (defaultAddr) {
                    setSelectedAddress(defaultAddr.id);
                } else if (data.length > 0) {
                    setSelectedAddress(data[0].id);
                }
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error loading addresses:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const loadAvailableCoupons = async () => {
        if (!user) return;
        setLoadingCoupons(true);
        try {
            const { data, error } = await couponService.getAvailableCoupons(user.id, subtotal);
            if (data) {
                setAvailableCoupons(data);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error loading coupons:', err);
        } finally {
            setLoadingCoupons(false);
        }
    };

    const handleApplyCoupon = async (code?: string) => {
        if (!user) {
            console.warn('[CheckoutScreen] User not authenticated during checkout action');
            return;
        }

        const codeToApply = code || couponCode.trim();
        if (!codeToApply) {
            Toast.show({
                type: 'error',
                text1: 'Enter Coupon Code',
                text2: 'Please enter a coupon code',
            });
            return;
        }

        setApplyingCoupon(true);
        try {
            // Use cart store's applyCoupon method
            const result = await applyCartCoupon(codeToApply);

            if (!result.success) {
                Toast.show({
                    type: 'error',
                    text1: 'Invalid Coupon',
                    text2: result.error || 'This coupon cannot be applied',
                });
                return;
            }

            setCouponCode('');
            Toast.show({
                type: 'success',
                text1: 'Coupon Applied!',
                text2: `You saved ${formatPrice(discount)}`,
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Failed to apply coupon',
            });
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        // Use cart store's removeCoupon method
        removeCartCoupon();
        Toast.show({
            type: 'info',
            text1: 'Coupon Removed',
            text2: 'Coupon has been removed from your order',
        });
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleAddAddress = () => {
        navigation.navigate('AddAddress');
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            console.warn('[CheckoutScreen] User not authenticated during checkout action');
            return;
        }

        if (!selectedAddress) {
            Toast.show({
                type: 'error',
                text1: 'Select Address',
                text2: 'Please select a delivery address.',
            });
            return;
        }

        if (items.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Cart Empty',
                text2: 'Your cart is empty.',
            });
            return;
        }

        setIsLoading(true);

        try {
            const cart = getCart();
            const address = addresses.find(a => a.id === selectedAddress);

            if (!address) {
                throw new Error('Selected address not found');
            }

            // Calculate final total with coupon discount
            const finalTotal = appliedCoupon 
                ? subtotal - appliedCoupon.discount_amount + tax + shipping
                : total;

            const { data: order, error } = await orderService.createOrder({
                userId: user.id,
                cart,
                shippingAddress: address,
                paymentMethod: selectedPayment as any,
                couponCode: appliedCoupon?.coupon.code,
                discount: appliedCoupon?.discount_amount || 0,
            });

            if (error || !order) {
                throw new Error(error || 'Failed to create order');
            }

            // Track coupon usage if coupon was applied
            if (appliedCoupon) {
                const { error: trackError } = await couponService.trackUsage(
                    appliedCoupon.coupon.id,
                    user.id,
                    order.id,
                    appliedCoupon.discount_amount
                );

                if (trackError) {
                    console.error('[Checkout] Failed to track coupon usage:', trackError);
                    // Don't fail the order if tracking fails, just log it
                }
            }

            // Clear cart after successful order
            await clearCart(user.id);

            Toast.show({
                type: 'success',
                text1: 'Order Placed!',
                text2: `Order #${order.order_number} has been placed successfully.`,
            });

            // Navigate to order confirmation
            navigation.reset({
                index: 1,
                routes: [
                    { name: 'Main' },
                    { name: 'OrderDetail', params: { orderId: order.id } },
                ],
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            Toast.show({
                type: 'error',
                text1: 'Order Failed',
                text2: err.message || 'Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedAddressData = addresses.find(a => a.id === selectedAddress);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Delivery Address */}
                <Animated.View style={sectionStyle(0)}>
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                    </View>

                    {loadingAddresses ? (
                        <Text style={styles.loadingText}>Loading addresses...</Text>
                    ) : addresses.length === 0 ? (
                        <TouchableOpacity style={styles.addAddressButton} onPress={handleAddAddress}>
                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.addAddressText}>Add New Address</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {addresses.map((address) => (
                                <TouchableOpacity
                                    key={address.id}
                                    style={[
                                        styles.addressCard,
                                        selectedAddress === address.id && styles.addressCardSelected,
                                    ]}
                                    onPress={() => setSelectedAddress(address.id)}
                                >
                                    <View style={styles.addressRadio}>
                                        <View
                                            style={[
                                                styles.radioOuter,
                                                selectedAddress === address.id && styles.radioOuterSelected,
                                            ]}
                                        >
                                            {selectedAddress === address.id && <View style={styles.radioInner} />}
                                        </View>
                                    </View>
                                    <View style={styles.addressContent}>
                                        <View style={styles.addressHeader}>
                                            <Text style={styles.addressLabel}>{address.label}</Text>
                                            {address.is_default && (
                                                <View style={styles.defaultBadge}>
                                                    <Text style={styles.defaultBadgeText}>Default</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.addressName}>{address.full_name}</Text>
                                        <Text style={styles.addressText}>
                                            {address.address_line1}
                                            {address.address_line2 ? `, ${address.address_line2}` : ''}
                                        </Text>
                                        <Text style={styles.addressText}>
                                            {address.city}, {address.state} - {address.pincode}
                                        </Text>
                                        <Text style={styles.addressPhone}>{address.phone}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.addMoreButton} onPress={handleAddAddress}>
                                <Ionicons name="add" size={18} color={COLORS.primary} />
                                <Text style={styles.addMoreText}>Add New Address</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Card>
                </Animated.View>

                {/* Payment Method */}
                <Animated.View style={sectionStyle(1)}>
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="wallet-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                    </View>

                    {PAYMENT_METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.paymentOption,
                                selectedPayment === method.id && styles.paymentOptionSelected,
                            ]}
                            onPress={() => setSelectedPayment(method.id)}
                        >
                            <Ionicons
                                name={method.icon as any}
                                size={24}
                                color={selectedPayment === method.id ? COLORS.primary : COLORS.gray[500]}
                            />
                            <Text
                                style={[
                                    styles.paymentText,
                                    selectedPayment === method.id && styles.paymentTextSelected,
                                ]}
                            >
                                {method.name}
                            </Text>
                            <View
                                style={[
                                    styles.radioOuter,
                                    selectedPayment === method.id && styles.radioOuterSelected,
                                ]}
                            >
                                {selectedPayment === method.id && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </Card>
                </Animated.View>

                {/* Coupon Section */}
                <Animated.View style={sectionStyle(2)}>
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="pricetag-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Apply Coupon</Text>
                    </View>

                    {/* Coupon Input */}
                    {!appliedCoupon ? (
                        <View style={styles.couponInputContainer}>
                            <View style={styles.couponInputWrapper}>
                                <Ionicons name="ticket-outline" size={20} color={COLORS.gray[400]} />
                                <TextInput
                                    style={styles.couponInput}
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChangeText={setCouponCode}
                                    autoCapitalize="characters"
                                    editable={!applyingCoupon}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.applyButton, applyingCoupon && styles.applyButtonDisabled]}
                                onPress={() => handleApplyCoupon()}
                                disabled={applyingCoupon || !couponCode.trim()}
                            >
                                <Text style={styles.applyButtonText}>
                                    {applyingCoupon ? 'Applying...' : 'Apply'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.appliedCouponContainer}>
                            <View style={styles.appliedCouponInfo}>
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                <View style={styles.appliedCouponText}>
                                    <Text style={styles.appliedCouponCode}>{appliedCoupon.coupon.code}</Text>
                                    <Text style={styles.appliedCouponSavings}>
                                        You saved {formatPrice(appliedCoupon.discount_amount)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeButton}>
                                <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Available Coupons */}
                    {!appliedCoupon && availableCoupons.length > 0 && (
                        <View style={styles.availableCouponsContainer}>
                            <Text style={styles.availableCouponsTitle}>Available Coupons</Text>
                            {availableCoupons.map((coupon) => {
                                const isUnlocked = subtotal >= coupon.min_cart_value;
                                const amountNeeded = coupon.min_cart_value - subtotal;
                                const progress = Math.min((subtotal / coupon.min_cart_value) * 100, 100);

                                return (
                                    <View
                                        key={coupon.id}
                                        style={[
                                            styles.couponCard,
                                            !isUnlocked && styles.couponCardLocked,
                                        ]}
                                    >
                                        <View style={styles.couponCardLeft}>
                                            <View style={styles.couponIconContainer}>
                                                <Ionicons
                                                    name={isUnlocked ? 'gift' : 'lock-closed'}
                                                    size={24}
                                                    color={isUnlocked ? COLORS.primary : COLORS.gray[400]}
                                                />
                                            </View>
                                            <View style={styles.couponCardInfo}>
                                                <Text style={styles.couponCardCode}>{coupon.code}</Text>
                                                <Text style={styles.couponCardDescription}>
                                                    {coupon.description || `Save ${coupon.discount_type === 'fixed' ? formatPrice(coupon.discount_value) : `${coupon.discount_value}%`}`}
                                                </Text>
                                                {coupon.min_cart_value > 0 && (
                                                    <Text style={styles.couponCardMinValue}>
                                                        Min. cart value: {formatPrice(coupon.min_cart_value)}
                                                    </Text>
                                                )}
                                                {!isUnlocked && (
                                                    <>
                                                        <Text style={styles.couponCardProgress}>
                                                            Add {formatPrice(amountNeeded)} more to unlock
                                                        </Text>
                                                        <View style={styles.progressBarContainer}>
                                                            <View
                                                                style={[
                                                                    styles.progressBarFill,
                                                                    { width: `${progress}%` },
                                                                ]}
                                                            />
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={[
                                                styles.couponApplyButton,
                                                !isUnlocked && styles.couponApplyButtonDisabled,
                                            ]}
                                            onPress={() => handleApplyCoupon(coupon.code)}
                                            disabled={!isUnlocked || applyingCoupon}
                                        >
                                            <Text
                                                style={[
                                                    styles.couponApplyButtonText,
                                                    !isUnlocked && styles.couponApplyButtonTextDisabled,
                                                ]}
                                            >
                                                Apply
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </Card>
                </Animated.View>

                {/* Order Summary */}
                <Animated.View style={sectionStyle(3)}>
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Items ({items.length})</Text>
                        <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                    </View>
                    {appliedCoupon && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, styles.discountLabel]}>
                                Coupon ({appliedCoupon.coupon.code})
                            </Text>
                            <Text style={[styles.summaryValue, styles.discountValue]}>
                                -{formatPrice(appliedCoupon.discount_amount)}
                            </Text>
                        </View>
                    )}
                    {discount > 0 && !appliedCoupon && (
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
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>
                            {formatPrice(appliedCoupon ? subtotal - appliedCoupon.discount_amount + tax + shipping : total)}
                        </Text>
                    </View>
                </Card>
                </Animated.View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Place Order Button */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerLabel}>Total Amount</Text>
                    <Text style={styles.footerTotal}>
                        {formatPrice(appliedCoupon ? subtotal - appliedCoupon.discount_amount + tax + shipping : total)}
                    </Text>
                </View>
                <Button
                    title="Place Order"
                    onPress={handlePlaceOrder}
                    loading={isLoading}
                    size="large"
                    style={styles.placeOrderButton}
                    disabled={!selectedAddress || items.length === 0}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    placeholder: {
        width: 32,
    },
    section: {
        margin: SPACING.md,
        marginBottom: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    loadingText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        padding: SPACING.md,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
    },
    addAddressText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
        marginLeft: SPACING.sm,
    },
    addressCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    addressCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    addressRadio: {
        marginRight: SPACING.md,
        paddingTop: 2,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    addressContent: {
        flex: 1,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    addressLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    defaultBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        marginLeft: SPACING.sm,
    },
    defaultBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    addressName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: 2,
    },
    addressText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: FONT_SIZE.sm * 1.4,
    },
    addressPhone: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        marginTop: SPACING.xs,
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
    },
    addMoreText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    paymentOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    paymentText: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        marginLeft: SPACING.md,
    },
    paymentTextSelected: {
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
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
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.lg,
    },
    footerInfo: {
        marginRight: SPACING.md,
    },
    footerLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    footerTotal: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    placeOrderButton: {
        flex: 1,
    },
    // Coupon styles
    couponInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    couponInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginRight: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    couponInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        marginLeft: SPACING.sm,
        textTransform: 'uppercase',
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    applyButtonDisabled: {
        backgroundColor: COLORS.gray[300],
    },
    applyButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    appliedCouponContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${COLORS.success}15`,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.success,
        marginBottom: SPACING.md,
    },
    appliedCouponInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    appliedCouponText: {
        marginLeft: SPACING.sm,
        flex: 1,
    },
    appliedCouponCode: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.success,
        textTransform: 'uppercase',
    },
    appliedCouponSavings: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        marginTop: 2,
    },
    removeButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    removeButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.error,
    },
    availableCouponsContainer: {
        marginTop: SPACING.sm,
    },
    availableCouponsTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
    },
    couponCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    couponCardLocked: {
        opacity: 0.7,
    },
    couponCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    couponIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    couponCardInfo: {
        flex: 1,
    },
    couponCardCode: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        textTransform: 'uppercase',
    },
    couponCardDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    couponCardMinValue: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    couponCardProgress: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.warning,
        marginTop: 4,
        fontWeight: FONT_WEIGHT.semibold,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: COLORS.gray[200],
        borderRadius: 2,
        marginTop: SPACING.xs,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.warning,
        borderRadius: 2,
    },
    couponApplyButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        marginLeft: SPACING.sm,
    },
    couponApplyButtonDisabled: {
        backgroundColor: COLORS.gray[300],
    },
    couponApplyButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    couponApplyButtonTextDisabled: {
        color: COLORS.gray[500],
    },
});

export default CheckoutScreen;
