// Coupon Modal Component - Shows available coupons when user taps coupon input
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { couponService } from '../services';
import { formatPrice, formatDate } from '../utils/format';
import type { Coupon } from '../types';

interface CouponModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectCoupon: (coupon: Coupon) => void;
    userId: string;
    cartTotal: number;
}

export const CouponModal: React.FC<CouponModalProps> = ({
    visible,
    onClose,
    onSelectCoupon,
    userId,
    cartTotal,
}) => {
    const [eligible, setEligible] = useState<Coupon[]>([]);
    const [locked, setLocked] = useState<Array<Coupon & { amountNeeded: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            loadCoupons();
        }
    }, [visible, userId, cartTotal]);

    const loadCoupons = async () => {
        setLoading(true);
        setError(null);

        const result = await couponService.getAvailableCouponsForModal(userId, cartTotal);

        if (result.error) {
            setError(result.error);
        } else {
            setEligible(result.eligible);
            setLocked(result.locked);
        }

        setLoading(false);
    };

    const handleCouponSelect = (coupon: Coupon) => {
        onSelectCoupon(coupon);
        onClose();
    };

    const renderCouponItem = (coupon: Coupon, isLocked: boolean = false, amountNeeded?: number) => {
        const discountText =
            coupon.discount_type === 'percentage'
                ? `${coupon.discount_value}% OFF`
                : `₹${coupon.discount_value} OFF`;

        const expiryDate = new Date(coupon.valid_until);
        const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        return (
            <TouchableOpacity
                key={coupon.id}
                style={[styles.couponCard, isLocked && styles.couponCardLocked]}
                onPress={() => !isLocked && handleCouponSelect(coupon)}
                disabled={isLocked}
                activeOpacity={0.7}
            >
                <View style={styles.couponLeft}>
                    <View style={[styles.discountBadge, isLocked && styles.discountBadgeLocked]}>
                        <Text style={[styles.discountText, isLocked && styles.discountTextLocked]}>
                            {discountText}
                        </Text>
                    </View>
                </View>

                <View style={styles.couponRight}>
                    <View style={styles.couponHeader}>
                        <Text style={[styles.couponCode, isLocked && styles.couponCodeLocked]}>
                            {coupon.code}
                        </Text>
                        {isLocked && (
                            <View style={styles.lockBadge}>
                                <Ionicons name="lock-closed" size={12} color={COLORS.gray[500]} />
                            </View>
                        )}
                    </View>

                    {coupon.description && (
                        <Text style={styles.couponDescription} numberOfLines={2}>
                            {coupon.description}
                        </Text>
                    )}

                    <View style={styles.couponDetails}>
                        <View style={styles.couponDetailRow}>
                            <Ionicons name="pricetag-outline" size={14} color={COLORS.gray[500]} />
                            <Text style={styles.couponDetailText}>
                                {coupon.coupon_type === 'first_order'
                                    ? 'First Order Only'
                                    : coupon.coupon_type === 'cart_value'
                                        ? `Min. cart ₹${coupon.min_cart_value}`
                                        : 'General Coupon'}
                            </Text>
                        </View>
                        <View style={styles.couponDetailRow}>
                            <Ionicons name="time-outline" size={14} color={COLORS.gray[500]} />
                            <Text style={styles.couponDetailText}>
                                {daysLeft > 0 ? `${daysLeft} days left` : 'Expires today'}
                            </Text>
                        </View>
                    </View>

                    {isLocked && amountNeeded && (
                        <View style={styles.unlockMessage}>
                            <Ionicons name="information-circle" size={16} color={COLORS.warning} />
                            <Text style={styles.unlockText}>
                                Add ₹{Math.ceil(amountNeeded)} more to unlock this coupon
                            </Text>
                        </View>
                    )}

                    {!isLocked && (
                        <View style={styles.applyButton}>
                            <Text style={styles.applyButtonText}>TAP TO APPLY</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Available Coupons</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Loading coupons...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={loadCoupons} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : eligible.length === 0 && locked.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ticket-outline" size={64} color={COLORS.gray[300]} />
                            <Text style={styles.emptyTitle}>No Coupons Available</Text>
                            <Text style={styles.emptyDescription}>
                                Check back later for exciting offers!
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Eligible Coupons */}
                            {eligible.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>
                                        Available for You ({eligible.length})
                                    </Text>
                                    {eligible.map((coupon) => renderCouponItem(coupon, false))}
                                </View>
                            )}

                            {/* Locked Coupons */}
                            {locked.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>
                                        Add More to Unlock ({locked.length})
                                    </Text>
                                    {locked.map((coupon) =>
                                        renderCouponItem(coupon, true, coupon.amountNeeded)
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        maxHeight: '80%',
        ...SHADOWS.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    scrollContent: {
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    couponCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        ...SHADOWS.sm,
    },
    couponCardLocked: {
        borderColor: COLORS.gray[300],
        opacity: 0.7,
    },
    couponLeft: {
        width: 80,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.sm,
    },
    discountBadge: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    discountBadgeLocked: {
        backgroundColor: COLORS.gray[100],
    },
    discountText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.black,
        color: COLORS.primary,
        textAlign: 'center',
    },
    discountTextLocked: {
        color: COLORS.gray[500],
    },
    couponRight: {
        flex: 1,
        padding: SPACING.md,
    },
    couponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    couponCode: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    couponCodeLocked: {
        color: COLORS.gray[500],
    },
    lockBadge: {
        backgroundColor: COLORS.gray[100],
        borderRadius: BORDER_RADIUS.full,
        padding: 4,
    },
    couponDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    couponDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    couponDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    couponDetailText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.gray[600],
    },
    unlockMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.warning}15`,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.xs,
        marginTop: SPACING.xs,
    },
    unlockText: {
        flex: 1,
        fontSize: FONT_SIZE.xs,
        color: COLORS.warning,
        fontWeight: FONT_WEIGHT.semibold,
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: SPACING.xs,
        gap: 4,
    },
    applyButtonText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    loadingContainer: {
        padding: SPACING.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        padding: SPACING.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.error,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
    },
    retryButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    emptyContainer: {
        padding: SPACING.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    emptyDescription: {
        marginTop: SPACING.xs,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default CouponModal;
