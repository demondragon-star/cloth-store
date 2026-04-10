// Order Timeline component for order tracking
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { formatDateTime } from '../utils/format';
import type { OrderTimeline, OrderStatus } from '../types';

interface OrderTimelineProps {
    timeline: OrderTimeline[];
    currentStatus: OrderStatus;
    style?: ViewStyle;
}

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'receipt-outline',
    confirmed: 'checkmark-circle-outline',
    preparing: 'cube-outline',
    out_for_delivery: 'car-outline',
    delivered: 'checkmark-done-circle-outline',
    cancelled: 'close-circle-outline',
    refunded: 'return-down-back-outline',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: COLORS.warning,
    confirmed: COLORS.info,
    preparing: COLORS.accent,
    out_for_delivery: COLORS.secondary,
    delivered: COLORS.success,
    cancelled: COLORS.error,
    refunded: COLORS.gray[500],
};

export const OrderTimelineComponent: React.FC<OrderTimelineProps> = ({
    timeline,
    currentStatus,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            {timeline.map((item, index) => {
                const isCompleted = index < timeline.length;
                const isCurrent = item.status === currentStatus;
                const isLast = index === timeline.length - 1;
                const color = STATUS_COLORS[item.status];

                return (
                    <View key={item.status} style={styles.timelineItem}>
                        <View style={styles.iconColumn}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: color },
                                    isCurrent && styles.iconContainerCurrent,
                                ]}
                            >
                                <Ionicons
                                    name={STATUS_ICONS[item.status]}
                                    size={20}
                                    color={COLORS.white}
                                />
                            </View>
                            {!isLast && (
                                <View
                                    style={[
                                        styles.line,
                                        { backgroundColor: isCompleted ? color : COLORS.gray[200] },
                                    ]}
                                />
                            )}
                        </View>

                        <View style={styles.contentColumn}>
                            <Text style={[styles.message, isCurrent && styles.messageCurrent]}>
                                {item.message}
                            </Text>
                            <Text style={styles.timestamp}>{formatDateTime(item.timestamp)}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: SPACING.md,
    },
    timelineItem: {
        flexDirection: 'row',
    },
    iconColumn: {
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerCurrent: {
        transform: [{ scale: 1.1 }],
    },
    line: {
        width: 2,
        flex: 1,
        minHeight: 40,
    },
    contentColumn: {
        flex: 1,
        paddingBottom: SPACING.lg,
    },
    message: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    messageCurrent: {
        fontWeight: FONT_WEIGHT.bold,
    },
    timestamp: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
});

export default OrderTimelineComponent;
