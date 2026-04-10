// Order Detail Screen
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button, OrderTimeline, SkeletonListItem } from '../components';
import { orderService } from '../services';
import { formatPrice, formatDate } from '../utils/format';
import { ORDER_STATUS_LABELS } from '../constants/config';
import type { RootStackParamList, Order, OrderStatus } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: COLORS.warning,
    confirmed: COLORS.info,
    preparing: COLORS.accent,
    out_for_delivery: COLORS.secondary,
    delivered: COLORS.success,
    cancelled: COLORS.error,
    refunded: COLORS.gray[500],
};

export const OrderDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp<{ params: { orderId: string } }, 'params'>>();
    const { orderId } = route.params;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrder();

        // Subscribe to order updates
        const subscription = orderService.subscribeToOrder(orderId, (updatedOrder) => {
            setOrder(updatedOrder);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const { data, error } = await orderService.getOrderById(orderId);
            if (data) {
                setOrder(data);
            } else if (error) {
                throw new Error(error);
            }
        } catch (error) {
            console.error('Error loading order:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load order details.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleCancelOrder = () => {
        if (!order) return;

        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await orderService.cancelOrder(order.id);
                            if (error) throw new Error(error);

                            setOrder({ ...order, status: 'cancelled' });

                            Toast.show({
                                type: 'success',
                                text1: 'Order Cancelled',
                                text2: 'Your order has been cancelled.',
                            });
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: error.message || 'Failed to cancel order.',
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleReorder = () => {
        Toast.show({
            type: 'info',
            text1: 'Reorder',
            text2: 'Adding items to cart...',
        });
        // In production, add items to cart and navigate
    };

    const handleTrackOrder = async () => {
        if (order?.tracking_url) {
            try {
                const supported = await Linking.canOpenURL(order.tracking_url);
                if (supported) {
                    await Linking.openURL(order.tracking_url);
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Cannot Open Link',
                        text2: 'The tracking URL is invalid.',
                    });
                }
            } catch (error) {
                console.error('An error occurred', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not open tracking link.',
                });
            }
        }
    };

    const handleContactSupport = () => {
        navigation.navigate('Help');
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    {[1, 2, 3].map((i) => (
                        <SkeletonListItem key={i} style={styles.skeletonItem} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray[400]} />
                    <Text style={styles.errorText}>Order not found</Text>
                    <Button title="Go Back" variant="outline" onPress={handleBack} />
                </View>
            </SafeAreaView>
        );
    }

    const statusColor = STATUS_COLORS[order.status];
    const statusLabel = ORDER_STATUS_LABELS[order.status];
    const timeline = orderService.getOrderTimeline(order);
    const canCancel = ['pending', 'confirmed'].includes(order.status);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <TouchableOpacity onPress={handleContactSupport} style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Order Status Card */}
                <Card style={styles.statusCard}>
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
                            <Text style={styles.orderDate}>
                                Placed on {formatDate(order.created_at)}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {statusLabel}
                            </Text>
                        </View>
                    </View>

                    {order.status === 'out_for_delivery' && order.tracking_number && (
                        <TouchableOpacity style={styles.trackingButton} onPress={handleTrackOrder}>
                            <Ionicons name="locate-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.trackingText}>Track Order</Text>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </Card>

                {/* Order Timeline */}
                {!['cancelled', 'refunded'].includes(order.status) && (
                    <Card style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Timeline</Text>
                        <OrderTimeline timeline={timeline} currentStatus={order.status} />
                    </Card>
                )}

                {/* Order Items */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Items ({order.items?.length || 0})
                    </Text>
                    {order.items?.map((item, index) => (
                        <View
                            key={item.id}
                            style={[
                                styles.itemRow,
                                index < (order.items?.length || 0) - 1 && styles.itemBorder,
                            ]}
                        >
                            {item.image_url ? (
                                <Image
                                    source={{ uri: item.image_url }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.itemImage, styles.imagePlaceholder]}>
                                    <Ionicons name="image-outline" size={24} color={COLORS.gray[400]} />
                                </View>
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item.name || item.item_name}
                                </Text>
                                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>{formatPrice(item.total)}</Text>
                        </View>
                    ))}
                </Card>

                {/* Price Breakdown */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Price Details</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Subtotal</Text>
                        <Text style={styles.priceValue}>{formatPrice(order.subtotal)}</Text>
                    </View>
                    {order.discount > 0 && (
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, styles.discountLabel]}>Discount</Text>
                            <Text style={[styles.priceValue, styles.discountValue]}>
                                -{formatPrice(order.discount)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Tax</Text>
                        <Text style={styles.priceValue}>{formatPrice(order.tax)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Shipping</Text>
                        <Text style={styles.priceValue}>
                            {order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
                    </View>
                </Card>

                {/* Delivery Address */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <View style={styles.addressContent}>
                        <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                        <View style={styles.addressText}>
                            <Text style={styles.addressName}>
                                {order.shipping_address?.full_name || 'N/A'}
                            </Text>
                            <Text style={styles.addressLine}>
                                {order.shipping_address?.address_line1}
                            </Text>
                            {order.shipping_address?.address_line2 && (
                                <Text style={styles.addressLine}>
                                    {order.shipping_address.address_line2}
                                </Text>
                            )}
                            <Text style={styles.addressLine}>
                                {order.shipping_address?.city}, {order.shipping_address?.state} -{' '}
                                {order.shipping_address?.pincode || order.shipping_address?.postal_code}
                            </Text>
                            <Text style={styles.addressPhone}>
                                Phone: {order.shipping_address?.phone}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Coupon Applied */}
                {order.coupon_code && order.discount > 0 && (
                    <Card style={styles.section}>
                        <Text style={styles.sectionTitle}>Coupon Applied</Text>
                        <View style={styles.couponContent}>
                            <View style={styles.couponIconContainer}>
                                <Ionicons name="pricetag" size={20} color={COLORS.success} />
                            </View>
                            <View style={styles.couponInfo}>
                                <Text style={styles.couponCode}>{order.coupon_code}</Text>
                                <Text style={styles.couponType}>
                                    {order.coupon_type === 'first_order'
                                        ? 'First Order Coupon'
                                        : order.coupon_type === 'cart_value'
                                            ? 'Cart Value Coupon'
                                            : order.coupon_type === 'party'
                                                ? 'Party Coupon'
                                                : 'General Coupon'}
                                </Text>
                                <Text style={styles.couponSavings}>
                                    You saved {formatPrice(order.discount)}
                                </Text>
                            </View>
                            <View style={styles.couponBadge}>
                                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                <Text style={styles.couponBadgeText}>Applied</Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Payment Method */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentInfo}>
                        <Ionicons
                            name={
                                order.payment_method === 'cod'
                                    ? 'cash-outline'
                                    : order.payment_method === 'card'
                                        ? 'card-outline'
                                        : 'wallet-outline'
                            }
                            size={22}
                            color={COLORS.primary}
                        />
                        <View style={styles.paymentText}>
                            <Text style={styles.paymentMethod}>
                                {order.payment_method === 'cod'
                                    ? 'Cash on Delivery'
                                    : order.payment_method === 'card'
                                        ? 'Credit/Debit Card'
                                        : order.payment_method === 'upi'
                                            ? 'UPI Payment'
                                            : 'Wallet'}
                            </Text>
                            <Text style={styles.paymentStatus}>
                                Status: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    {canCancel && (
                        <Button
                            title="Cancel Order"
                            variant="outline"
                            onPress={handleCancelOrder}
                            style={styles.actionButton}
                            icon={<Ionicons name="close-circle-outline" size={20} color={COLORS.error} />}
                        />
                    )}
                    {order.status === 'delivered' && (
                        <Button
                            title="Reorder"
                            variant="primary"
                            onPress={handleReorder}
                            style={styles.actionButton}
                            icon={<Ionicons name="refresh-outline" size={20} color={COLORS.white} />}
                        />
                    )}
                    <Button
                        title="Need Help?"
                        variant="ghost"
                        onPress={handleContactSupport}
                        style={styles.actionButton}
                        icon={<Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />}
                    />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
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
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    helpButton: {
        padding: SPACING.xs,
    },
    placeholder: {
        width: 32,
    },
    loadingContainer: {
        padding: SPACING.md,
    },
    skeletonItem: {
        marginBottom: SPACING.md,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    errorText: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textSecondary,
        marginVertical: SPACING.md,
    },
    statusCard: {
        margin: SPACING.md,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderNumber: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    orderDate: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.xs,
    },
    statusText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
    },
    trackingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.primary}10`,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.md,
    },
    trackingText: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.primary,
        marginLeft: SPACING.sm,
    },
    section: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: BORDER_RADIUS.lg,
    },
    imagePlaceholder: {
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginHorizontal: SPACING.md,
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    itemQty: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    itemPrice: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    priceLabel: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    priceValue: {
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
        marginVertical: SPACING.sm,
    },
    totalLabel: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    totalValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
    },
    addressContent: {
        flexDirection: 'row',
    },
    addressText: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    addressName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: 4,
    },
    addressLine: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: FONT_SIZE.sm * 1.5,
    },
    addressPhone: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        marginTop: SPACING.xs,
    },
    couponContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.success}10`,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: `${COLORS.success}30`,
    },
    couponIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    couponInfo: {
        flex: 1,
    },
    couponCode: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.success,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    couponType: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.success,
        marginTop: 2,
        fontWeight: FONT_WEIGHT.medium,
    },
    couponSavings: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        marginTop: 2,
        fontWeight: FONT_WEIGHT.medium,
    },
    couponBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    couponBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.success,
        marginLeft: 4,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentText: {
        marginLeft: SPACING.md,
    },
    paymentMethod: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    paymentStatus: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    actionsContainer: {
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    actionButton: {
        width: '100%',
    },
    bottomPadding: {
        height: 30,
    },
});

export default OrderDetailScreen;
