import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView, Platform, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { orderService } from '../../services/order.service';
import { supabase } from '../../services/supabase';
import { Swipeable } from 'react-native-gesture-handler';
import { useEntranceAnimation } from '../../hooks/useScrollAnimation';
import { Order, OrderStatus } from '../../types';
import { AdminOrdersStackParamList } from '../../navigation/AdminNavigator';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all'; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { label: 'All', value: 'all', icon: 'layers-outline', color: '#6366F1' },
    { label: 'Pending', value: 'pending', icon: 'time-outline', color: '#D97706' },
    { label: 'Confirmed', value: 'confirmed', icon: 'checkmark-circle-outline', color: '#2563EB' },
    { label: 'Preparing', value: 'preparing', icon: 'construct-outline', color: '#7C3AED' },
    { label: 'In Transit', value: 'out_for_delivery', icon: 'car-outline', color: '#0891B2' },
    { label: 'Delivered', value: 'delivered', icon: 'checkmark-done-outline', color: '#059669' },
    { label: 'Cancelled', value: 'cancelled', icon: 'close-circle-outline', color: '#DC2626' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    pending:          { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'Pending', icon: 'time-outline' },
    confirmed:        { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Confirmed', icon: 'checkmark-circle-outline' },
    preparing:        { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', label: 'Preparing', icon: 'construct-outline' },
    out_for_delivery: { color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', label: 'In Transit', icon: 'car-outline' },
    delivered:        { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'Delivered', icon: 'checkmark-done-outline' },
    cancelled:        { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', label: 'Cancelled', icon: 'close-circle-outline' },
    refunded:         { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: 'Refunded', icon: 'return-down-back-outline' },
};

const SkeletonOrderCard = () => (
    <View style={styles.orderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: 16, backgroundColor: DARK.skeleton.to, borderRadius: 8 }} />
            <View style={{ width: 80, height: 24, backgroundColor: DARK.skeleton.from, borderRadius: 12 }} />
        </View>
        <View style={{ width: '70%', height: 12, backgroundColor: DARK.skeleton.from, borderRadius: 6, marginTop: SPACING.sm }} />
        <View style={{ width: '55%', height: 12, backgroundColor: DARK.skeleton.from, borderRadius: 6, marginTop: SPACING.xs }} />
    </View>
);

type AdminNavigationProp = NativeStackNavigationProp<AdminOrdersStackParamList>;

export const AdminOrdersScreen: React.FC = () => {
    const navigation = useNavigation<AdminNavigationProp>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
    
    // New Segmented Controls State
    const [mainMode, setMainMode] = useState<'overview' | 'processing'>('overview');
    const [processingSubMode, setProcessingSubMode] = useState<'to_dispatch' | 'dispatched'>('to_dispatch');

    // Realtime badge counts
    const [badges, setBadges] = useState({ pending: 0, confirmed: 0 });

    useEffect(() => {
        const fetchBadges = async () => {
            const { count: pendingCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: confirmedCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed');
            setBadges({ pending: pendingCount || 0, confirmed: confirmedCount || 0 });
        };
        fetchBadges();
        const sub = supabase.channel('orders-screen-badges')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchBadges)
            .subscribe();
        return () => { sub.unsubscribe(); };
    }, []);

    const loadOrders = useCallback(async (pageNum: number, shouldRefresh: boolean = false) => {
        try {
            if (shouldRefresh) {
                setLoading(true);
            }

            const response = await orderService.getAllOrders(pageNum, 10);

            if (response.data) {
                setOrders(prev => shouldRefresh ? response.data! : [...prev, ...response.data!]);
                setHasMore(response.data.length === 10);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadOrders(1, true);
    }, [loadOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadOrders(1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadOrders(nextPage);
        }
    };

    // Filter Logic based on selected mode
    let filteredOrders = orders;
    if (mainMode === 'overview') {
        filteredOrders = activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter);
    } else {
        if (processingSubMode === 'to_dispatch') {
            filteredOrders = orders.filter(o => o.status === 'confirmed');
        } else {
            filteredOrders = orders.filter(o => o.status === 'out_for_delivery');
        }
    }

    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(filteredOrders.length);

    useEffect(() => {
        if (!loading && filteredOrders.length > 0) {
            triggerEntrance();
        }
    }, [activeFilter, loading]);

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            // Trigger haptic or toast here if available
        } catch (error) {
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, item: Order) => {
        // Only show actions for pending or confirmed orders to advance them
        if (item.status !== 'pending' && item.status !== 'confirmed' && item.status !== 'preparing') return null;
        
        const nextStatus: OrderStatus = item.status === 'pending' ? 'confirmed' : item.status === 'confirmed' ? 'preparing' : 'out_for_delivery';
        const actionLabel = item.status === 'pending' ? 'Confirm' : item.status === 'confirmed' ? 'Prep' : 'Dispatch';
        
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity 
                style={styles.swipeActionRight} 
                onPress={() => updateOrderStatus(item.id, nextStatus)}
            >
                <Animated.View style={[styles.swipeActionContent, { transform: [{ translateX: trans }] }]}>
                    <Ionicons name="checkmark-done-circle-outline" size={24} color={COLORS.white} />
                    <Text style={styles.swipeActionText}>{actionLabel}</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
        const cfg = STATUS_CONFIG[item.status] || { color: COLORS.textSecondary, bg: COLORS.gray[100], label: item.status, icon: 'ellipse-outline' as const };
        return (
            <Animated.View style={getEntranceStyle(index)}>
            <Swipeable
                renderRightActions={(prog, drag) => renderRightActions(prog, drag, item)}
                containerStyle={{ marginBottom: SPACING.sm }}
            >
            <TouchableOpacity
                style={[styles.orderCard, { marginBottom: 0 }]}
                onPress={() => navigation.navigate('AdminOrderDetails', { orderId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdRow}>
                        <View style={[styles.orderStatusDot, { backgroundColor: cfg.color }]} />
                        <Text style={styles.orderNumber}>#{item.order_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={12} color={cfg.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                <View style={styles.orderInfo}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.infoText}>User: {item.user_id.substring(0, 8)}...</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.infoText}>{format(new Date(item.created_at), 'MMM dd, yyyy · hh:mm a')}</Text>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <View style={styles.priceTag}>
                        <Ionicons name="wallet-outline" size={14} color={COLORS.primaryLight} />
                        <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.viewBtn}>
                        <Text style={styles.viewBtnText}>View</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primaryLight} />
                    </View>
                </View>
            </TouchableOpacity>
            </Swipeable>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Full-screen dark gradient */}
            <LinearGradient
                colors={DARK.gradient}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={styles.orbPurple} />
            <View style={styles.orbBlue} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.title}>Orders</Text>
                            <Text style={styles.subtitle}>{filteredOrders.length} {mainMode === 'overview' ? (activeFilter === 'all' ? 'total' : activeFilter) : processingSubMode.replace('_', ' ')} orders</Text>
                        </View>
                        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Mode Toggle */}
                <View style={styles.mainToggleContainer}>
                    <TouchableOpacity 
                        style={[styles.mainToggleBtn, mainMode === 'overview' && styles.mainToggleBtnActive]}
                        onPress={() => setMainMode('overview')}
                    >
                        <Text style={[styles.mainToggleText, mainMode === 'overview' && styles.mainToggleTextActive]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.mainToggleBtn, mainMode === 'processing' && styles.mainToggleBtnActive]}
                        onPress={() => setMainMode('processing')}
                    >
                        <Text style={[styles.mainToggleText, mainMode === 'processing' && styles.mainToggleTextActive]}>Processing</Text>
                        {badges.confirmed > 0 && (
                            <View style={styles.badgeCircle}>
                                <Text style={styles.badgeText}>{badges.confirmed}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {mainMode === 'overview' ? (
                    <>
                        {/* Filter Tabs - Scrollable chips */}
                        <View style={styles.filterContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterContent}
                        >
                            {STATUS_FILTERS.map(f => {
                                const isActive = activeFilter === f.value;
                                return (
                                    <TouchableOpacity
                                        key={f.value}
                                        style={[styles.filterChip, isActive && { backgroundColor: f.color }]}
                                        onPress={() => setActiveFilter(f.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name={f.icon} size={14} color={isActive ? COLORS.white : 'rgba(255,255,255,0.5)'} />
                                        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                    </>
                ) : (
                    <>
                        {/* Processing Sub-Mode Toggle */}
                        <View style={styles.subToggleContainer}>
                            <TouchableOpacity 
                                style={[styles.subToggleBtn, processingSubMode === 'to_dispatch' && styles.subToggleBtnActive]}
                                onPress={() => setProcessingSubMode('to_dispatch')}
                            >
                                <Ionicons name="cube-outline" size={16} color={processingSubMode === 'to_dispatch' ? COLORS.primary : COLORS.gray[400]} />
                                <Text style={[styles.subToggleText, processingSubMode === 'to_dispatch' && styles.subToggleTextActive]}>To Dispatch</Text>
                                {badges.confirmed > 0 && (
                                    <View style={[styles.badgeCircle, { backgroundColor: COLORS.primaryLight }]}>
                                        <Text style={styles.badgeText}>{badges.confirmed}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.subToggleBtn, processingSubMode === 'dispatched' && styles.subToggleBtnActive]}
                                onPress={() => setProcessingSubMode('dispatched')}
                            >
                                <Ionicons name="car-outline" size={16} color={processingSubMode === 'dispatched' ? COLORS.primary : COLORS.gray[400]} />
                                <Text style={[styles.subToggleText, processingSubMode === 'dispatched' && styles.subToggleTextActive]}>Dispatched</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <FlatList
                    data={loading ? [] : filteredOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.white} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={loading ? (
                        <>{[1,2,3,4].map(i => <SkeletonOrderCard key={i} />)}</>
                    ) : null}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.08)']} style={styles.emptyIconBg}>
                                    <Ionicons name="receipt-outline" size={48} color={COLORS.primaryLight} />
                                </LinearGradient>
                                <Text style={styles.emptyTitle}>No orders found</Text>
                                <Text style={styles.emptySubtitle}>Try a different filter</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        !loading && hasMore ? (
                            <View style={styles.loader}><ActivityIndicator size="small" color={COLORS.primaryLight} /></View>
                        ) : null
                    }
                />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK.background },

    // Decorative orbs
    orbPurple: {
        position: 'absolute', top: 80, right: -50, width: 180, height: 180,
        borderRadius: 90, backgroundColor: 'rgba(139,92,246,0.1)',
    },
    orbBlue: {
        position: 'absolute', bottom: 200, left: -40, width: 140, height: 140,
        borderRadius: 70, backgroundColor: 'rgba(59,130,246,0.06)',
    },

    // Header
    header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 28, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -0.5 },
    subtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FONT_WEIGHT.medium, marginTop: 2, textTransform: 'capitalize' },
    refreshBtn: {
        backgroundColor: DARK.card.backgroundColor, padding: 10, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },

    // Mode Toggles
    mainToggleContainer: {
        flexDirection: 'row', backgroundColor: DARK.card.backgroundColor,
        marginHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg,
        padding: 4, marginBottom: SPACING.md, borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    mainToggleBtn: {
        flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
        borderRadius: BORDER_RADIUS.md,
    },
    mainToggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
    mainToggleText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.gray[400] },
    mainToggleTextActive: { color: COLORS.white },
    
    subToggleContainer: {
        flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.sm,
    },
    subToggleBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: BORDER_RADIUS.lg,
        backgroundColor: DARK.card.backgroundColor, borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    subToggleBtnActive: { borderColor: COLORS.primaryLight, backgroundColor: 'rgba(99,102,241,0.1)' },
    subToggleText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.gray[400] },
    subToggleTextActive: { color: COLORS.primaryLight },

    badgeCircle: { backgroundColor: COLORS.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
    badgeText: { color: COLORS.white, fontSize: 10, fontWeight: FONT_WEIGHT.black },

    // Filter chips
    filterContainer: { marginBottom: SPACING.md },
    filterContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: DARK.card.backgroundColor,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    filterChipText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: 'rgba(255,255,255,0.5)' },
    filterChipTextActive: { color: COLORS.white },

    // List
    listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
    orderCard: {
        backgroundColor: DARK.card.backgroundColor, borderRadius: BORDER_RADIUS.xxl,
        padding: SPACING.md, marginBottom: SPACING.sm,
        borderWidth: 1, borderColor: DARK.card.borderColor,
        gap: SPACING.sm,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    orderStatusDot: { width: 8, height: 8, borderRadius: 4 },
    orderNumber: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.black, color: COLORS.white },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
    orderInfo: { gap: SPACING.xs },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    infoText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.45)' },
    orderFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    },
    priceTag: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    orderTotal: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.black, color: COLORS.white },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.primaryLight },

    // Empty
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl * 2 },
    emptyIconBg: {
        width: 96, height: 96, borderRadius: 48,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
    },
    emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    emptySubtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.4)', marginTop: SPACING.xs },
    loader: { paddingVertical: SPACING.md, alignItems: 'center' },

    // Swipe Actions
    swipeActionRight: {
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderRadius: BORDER_RADIUS.xxl,
        borderWidth: 1, borderColor: DARK.card.borderColor,
        width: 100, 
    },
    swipeActionContent: {
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    swipeActionText: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.bold,
        fontSize: FONT_SIZE.xs,
        marginTop: 4,
    }
});
