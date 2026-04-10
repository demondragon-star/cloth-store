import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Image, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants/theme';
import { orderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../types';
import { AdminOrdersStackParamList } from '../../navigation/AdminNavigator';
import { LinearGradient } from 'expo-linear-gradient';

type AdminOrderDetailsRouteProp = RouteProp<AdminOrdersStackParamList, 'AdminOrderDetails'>;

export const AdminOrderDetailsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<AdminOrderDetailsRouteProp>();
    const { orderId } = route.params;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Tracking modal state
    const [trackingModalVisible, setTrackingModalVisible] = useState(false);
    const [courierName, setCourierName] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const { data, error } = await orderService.getOrderById(orderId);
            if (error) {
                Alert.alert('Error', 'Failed to load order details');
                navigation.goBack();
                return;
            }
            setOrder(data);
            if (data?.courier_name) setCourierName(data.courier_name);
            if (data?.tracking_url) setTrackingUrl(data.tracking_url);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        // If moving to out_for_delivery, show tracking modal first
        if (newStatus === 'out_for_delivery') {
            setPendingStatus(newStatus);
            setTrackingModalVisible(true);
            return;
        }

        Alert.alert(
            'Update Status',
            `Change status to "${newStatus.replace(/_/g, ' ').toUpperCase()}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            const { error } = await orderService.updateOrderStatus(orderId, newStatus);
                            if (error) {
                                Alert.alert('Error', 'Failed to update order status');
                            } else {
                                loadOrder();
                            }
                        } catch {
                            Alert.alert('Error', 'An unexpected error occurred');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handleConfirmDispatch = async () => {
        if (!pendingStatus) return;
        if (!trackingUrl.trim()) {
            Alert.alert('Required', 'Please enter a tracking link for the customer.');
            return;
        }
        try {
            setUpdating(true);
            setTrackingModalVisible(false);
            const { error } = await orderService.updateOrderStatus(
                orderId,
                pendingStatus,
                undefined,
                trackingUrl.trim(),
                courierName.trim() || undefined
            );
            if (error) {
                Alert.alert('Error', 'Failed to update order status');
            } else {
                loadOrder();
            }
        } catch {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setUpdating(false);
            setPendingStatus(null);
        }
    };

    if (loading || !order) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={COLORS.primaryLight} />
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return COLORS.warning;
            case 'confirmed': return COLORS.info;
            case 'out_for_delivery': return COLORS.primary;
            case 'delivered': return COLORS.success;
            case 'cancelled': return COLORS.error;
            default: return COLORS.gray[500];
        }
    };

    const renderStatusButton = (status: OrderStatus, label: string, color: string) => (
        <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: color }]}
            onPress={() => handleUpdateStatus(status)}
            disabled={updating}
            key={status}
        >
            {updating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
                <Text style={styles.actionButtonText}>{label}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: DARK.background }}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order {order.order_number}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* Status Section */}
                    <View style={styles.section}>
                        <View style={styles.statusHeader}>
                            <Text style={styles.sectionTitle}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                    {order.status.replace(/_/g, ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.dateText}>Placed on {format(new Date(order.created_at), 'PPP')}</Text>

                        {/* Cancellation info */}
                        {order.status === 'cancelled' && order.cancel_reason && (
                            <View style={styles.cancelReasonBox}>
                                <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                                <Text style={styles.cancelReasonText}>
                                    Reason: {order.cancel_reason}
                                </Text>
                            </View>
                        )}

                        <View style={styles.actionsContainer}>
                            {order.status === 'pending' && renderStatusButton('confirmed', '✓ Confirm Order', COLORS.info)}
                            {order.status === 'confirmed' && renderStatusButton('out_for_delivery', '🚚 Mark Out for Delivery', COLORS.primary)}
                            {order.status === 'out_for_delivery' && renderStatusButton('delivered', '✓ Mark Delivered', COLORS.success)}
                            {['pending', 'confirmed'].includes(order.status) &&
                                renderStatusButton('cancelled', '✕ Cancel Order', COLORS.error)
                            }
                        </View>
                    </View>

                    {/* Tracking Info (shown when dispatched) */}
                    {order.tracking_url && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tracking Info</Text>
                            {order.courier_name && (
                                <View style={styles.trackingRow}>
                                    <Ionicons name="business-outline" size={16} color={DARK.textMuted} />
                                    <Text style={styles.trackingValue}>{order.courier_name}</Text>
                                </View>
                            )}
                            <View style={styles.trackingRow}>
                                <Ionicons name="link-outline" size={16} color={COLORS.primaryLight} />
                                <Text style={[styles.trackingValue, { color: COLORS.primaryLight, flex: 1 }]} numberOfLines={1}>
                                    {order.tracking_url}
                                </Text>
                            </View>
                            {/* Allow admin to update tracking link */}
                            <TouchableOpacity
                                style={styles.updateTrackingBtn}
                                onPress={() => {
                                    setCourierName(order.courier_name || '');
                                    setTrackingUrl(order.tracking_url || '');
                                    setPendingStatus('out_for_delivery');
                                    setTrackingModalVisible(true);
                                }}
                            >
                                <Text style={styles.updateTrackingBtnText}>Update Tracking Link</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Items Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
                        {order.items?.map((item) => (
                            <View key={item.id} style={styles.itemCard}>
                                <Image
                                    source={{ uri: item.image_url || 'https://via.placeholder.com/60' }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>
                                    <Text style={styles.itemMeta}>Qty: {item.quantity} | {item.sku}</Text>
                                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                        <Text style={styles.addressText}>{order.shipping_address.full_name}</Text>
                        <Text style={styles.addressText}>{order.shipping_address.address_line1}</Text>
                        <Text style={styles.addressText}>
                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                        </Text>
                        <Text style={styles.addressText}>{order.shipping_address.country}</Text>
                        <Text style={styles.addressText}>Phone: {order.shipping_address.phone}</Text>
                    </View>

                    {/* Coupon Applied */}
                    {order.coupon_code && order.discount > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Coupon Applied</Text>
                            <View style={styles.couponCard}>
                                <Ionicons name="pricetag" size={20} color={COLORS.success} />
                                <Text style={styles.couponCode}>{order.coupon_code}</Text>
                                <Text style={styles.couponSavings}>-${order.discount.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}

                    {/* Payment Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Summary</Text>
                        {[
                            { label: 'Subtotal', value: `$${order.subtotal.toFixed(2)}` },
                            ...(order.discount > 0 ? [{ label: 'Discount', value: `-$${order.discount.toFixed(2)}`, color: COLORS.success }] : []),
                            { label: 'Shipping', value: `$${order.shipping.toFixed(2)}` },
                            { label: 'Tax', value: `$${order.tax.toFixed(2)}` },
                        ].map(({ label, value, color }) => (
                            <View style={styles.summaryRow} key={label}>
                                <Text style={[styles.summaryLabel, color ? { color } : {}]}>{label}</Text>
                                <Text style={[styles.summaryValue, color ? { color } : {}]}>{value}</Text>
                            </View>
                        ))}
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Tracking Info Modal */}
            <Modal
                visible={trackingModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTrackingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Add Tracking Info</Text>
                        <Text style={styles.modalSubtitle}>
                            This will be shared with the customer to track their parcel.
                        </Text>

                        <Text style={styles.inputLabel}>Courier Name (Optional)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Rapido, DTDC, Delhivery..."
                            placeholderTextColor={DARK.textMuted}
                            value={courierName}
                            onChangeText={setCourierName}
                        />

                        <Text style={styles.inputLabel}>Tracking Link *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="https://track.courier.com/..."
                            placeholderTextColor={DARK.textMuted}
                            value={trackingUrl}
                            onChangeText={setTrackingUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => { setTrackingModalVisible(false); setPendingStatus(null); }}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={handleConfirmDispatch}
                            >
                                <Text style={styles.modalBtnConfirmText}>Dispatch Order</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DARK.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: DARK.card.borderColor,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DARK.card.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: 60,
    },
    section: {
        backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xxl,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: DARK.card.borderColor,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    statusText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.bold,
    },
    dateText: {
        fontSize: FONT_SIZE.sm,
        color: DARK.textMuted,
        marginBottom: SPACING.md,
    },
    cancelReasonBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: `${COLORS.error}15`,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    cancelReasonText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        flex: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    actionButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        minWidth: 120,
        alignItems: 'center',
    },
    actionButtonText: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.semibold,
        fontSize: FONT_SIZE.sm,
    },
    trackingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    trackingValue: {
        color: DARK.textMuted,
        fontSize: FONT_SIZE.sm,
    },
    updateTrackingBtn: {
        marginTop: SPACING.sm,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    updateTrackingBtnText: {
        color: COLORS.primaryLight,
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
    },
    itemCard: {
        flexDirection: 'row',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: DARK.card.borderColor,
    },
    itemImage: {
        width: 64,
        height: 64,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    itemInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
        marginBottom: 2,
    },
    itemMeta: {
        fontSize: FONT_SIZE.xs,
        color: DARK.textMuted,
    },
    itemPrice: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
        marginTop: 2,
    },
    addressText: {
        fontSize: FONT_SIZE.md,
        color: DARK.textMuted,
        marginBottom: 2,
    },
    couponCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: 'rgba(16,185,129,0.1)',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    couponCode: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: '#34D399',
        textTransform: 'uppercase',
    },
    couponSavings: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: '#34D399',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    summaryLabel: {
        color: DARK.textMuted,
        fontSize: FONT_SIZE.md,
    },
    summaryValue: {
        color: COLORS.white,
        fontSize: FONT_SIZE.md,
    },
    totalRow: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: DARK.card.borderColor,
    },
    totalLabel: {
        fontWeight: FONT_WEIGHT.bold,
        fontSize: FONT_SIZE.lg,
        color: COLORS.white,
    },
    totalValue: {
        fontWeight: FONT_WEIGHT.bold,
        fontSize: FONT_SIZE.lg,
        color: COLORS.primaryLight,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: DARK.card.backgroundColor,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.xl,
        borderTopWidth: 1,
        borderColor: DARK.card.borderColor,
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
        marginBottom: SPACING.xs,
    },
    modalSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: DARK.textMuted,
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: DARK.textMuted,
        marginBottom: SPACING.xs,
    },
    modalInput: {
        backgroundColor: DARK.background,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: DARK.card.borderColor,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        color: COLORS.white,
        fontSize: FONT_SIZE.md,
        marginBottom: SPACING.md,
    },
    modalActions: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
    },
    modalBtnCancel: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    modalBtnCancelText: {
        color: DARK.textMuted,
        fontWeight: FONT_WEIGHT.semibold,
    },
    modalBtnConfirm: {
        backgroundColor: COLORS.primary,
    },
    modalBtnConfirmText: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.bold,
    },
});
