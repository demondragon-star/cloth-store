// Order History Screen
import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Image,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, EmptyState, SkeletonListItem, Button } from '../components';
import { useAuthStore } from '../store';
import { orderService } from '../services';
import { formatPrice, formatDate } from '../utils/format';
import { ORDER_STATUS_LABELS } from '../constants/config';
import { useRefresh } from '../hooks';
import { useEntranceAnimation } from '../hooks/useScrollAnimation';
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

export const OrderHistoryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalOrders, setTotalOrders] = useState(0);
    const PAGE_SIZE = 10;

    const loadOrders = useCallback(async (reset = true) => {
        if (!user) return;

        if (reset) {
            setIsLoading(true);
            setPage(1);
        }

        try {
            const currentPage = reset ? 1 : page;
            const { data, total, error } = await orderService.getUserOrders(user.id, currentPage, PAGE_SIZE);

            if (data) {
                if (reset) {
                    setOrders(data);
                } else {
                    setOrders(prev => [...prev, ...data]);
                }
                setTotalOrders(total);
                setHasMore(data.length === PAGE_SIZE && orders.length + data.length < total);
                setPage(currentPage + 1);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, page, orders.length]);

    useEffect(() => {
        loadOrders(true);
    }, []);

    const { refreshing, onRefresh } = useRefresh(() => loadOrders(true));
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(orders.length);

    useEffect(() => {
        if (!isLoading && orders.length > 0) triggerEntrance();
    }, [isLoading]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleOrderPress = (order: Order) => {
        navigation.navigate('OrderDetail', { orderId: order.id });
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            loadOrders(false);
        }
    };

    const handleContinueShopping = () => {
        navigation.navigate('Main');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Orders</Text>
            <View style={styles.placeholder} />
        </View>
    );

    const renderOrder = ({ item, index }: { item: Order; index: number }) => {
        const statusColor = STATUS_COLORS[item.status];
        const statusLabel = ORDER_STATUS_LABELS[item.status];
        const firstItem = item.items?.[0];
        const itemCount = item.items?.length || 0;

        return (
            <Animated.View style={getEntranceStyle(index)}>
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => handleOrderPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderNumber}>Order #{item.order_number}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                </View>

                <View style={styles.orderItems}>
                    {firstItem && (
                        <View style={styles.itemRow}>
                            {firstItem.item?.images?.[0]?.image_url ? (
                                <Image
                                    source={{ uri: firstItem.item.images[0].image_url }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                            ) : firstItem.image_url ? (
                                <Image
                                    source={{ uri: firstItem.image_url }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.itemImage, styles.imagePlaceholder]}>
                                    <Ionicons name="image-outline" size={20} color={COLORS.gray[400]} />
                                </View>
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {firstItem.item_name}
                                </Text>
                                <Text style={styles.itemQty}>
                                    Qty: {firstItem.quantity}
                                    {itemCount > 1 && ` · +${itemCount - 1} more items`}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
                </View>

                <View style={styles.orderActions}>
                    {item.status === 'delivered' && (
                        <Button
                            title="Reorder"
                            variant="outline"
                            size="small"
                            onPress={() => { }}
                            style={styles.actionButton}
                        />
                    )}
                    <Button
                        title="View Details"
                        variant="ghost"
                        size="small"
                        onPress={() => handleOrderPress(item)}
                        icon={<Ionicons name="chevron-forward" size={16} color={COLORS.primary} />}
                        iconPosition="right"
                    />
                </View>
            </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmpty = () => (
        <EmptyState
            icon="bag-outline"
            title="No Orders Yet"
            description="You haven't placed any orders yet. Start shopping to see your orders here."
            actionLabel="Start Shopping"
            onAction={handleContinueShopping}
        />
    );

    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
                <SkeletonListItem key={i} style={styles.skeletonItem} />
            ))}
        </View>
    );

    const renderFooter = () => {
        if (!hasMore || orders.length === 0) return null;

        return (
            <View style={styles.loadMoreContainer}>
                <Button
                    title="Load More"
                    variant="outline"
                    size="small"
                    onPress={handleLoadMore}
                    loading={isLoading}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {renderHeader()}

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />
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
    list: {
        padding: SPACING.md,
        paddingBottom: 100,
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    orderNumber: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    orderDate: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: SPACING.xs,
    },
    statusText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
    },
    orderItems: {
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        paddingTop: SPACING.md,
        marginBottom: SPACING.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.md,
    },
    imagePlaceholder: {
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    itemQty: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        paddingTop: SPACING.md,
    },
    totalLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    totalValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
    },
    orderActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    actionButton: {
        minWidth: 80,
    },
    loadingContainer: {
        padding: SPACING.md,
    },
    skeletonItem: {
        marginBottom: SPACING.md,
    },
    loadMoreContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
});

export default OrderHistoryScreen;
