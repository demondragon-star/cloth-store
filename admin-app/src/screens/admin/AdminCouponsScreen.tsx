import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { couponService } from '../../services/coupon.service';
import { useEntranceAnimation } from '../../hooks/useScrollAnimation';
import { Coupon } from '../../types';

type TabType = 'active' | 'inactive' | 'expired';

const TABS: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; inactiveColor: string }[] = [
    { key: 'active', label: 'Active', icon: 'checkmark-circle', color: '#10B981', inactiveColor: 'rgba(16,185,129,0.25)' },
    { key: 'inactive', label: 'Inactive', icon: 'pause-circle', color: '#F59E0B', inactiveColor: 'rgba(245,158,11,0.25)' },
    { key: 'expired', label: 'Expired', icon: 'close-circle', color: '#EF4444', inactiveColor: 'rgba(239,68,68,0.25)' },
];

type AdminNavigationProp = NativeStackNavigationProp<any>;

export const AdminCouponsScreen: React.FC = () => {
    const navigation = useNavigation<AdminNavigationProp>();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('active');

    const loadCoupons = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await couponService.getCoupons(true);

            if (error) {
                Alert.alert('Error', error);
                return;
            }

            if (data) {
                setCoupons(data);
            }
        } catch (error) {
            console.error('Failed to load coupons:', error);
            Alert.alert('Error', 'Failed to load coupons');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    const onRefresh = () => {
        setRefreshing(true);
        loadCoupons();
    };

    const handleDelete = async (couponId: string, couponCode: string) => {
        Alert.alert(
            'Delete Coupon',
            `Are you sure you want to delete coupon ${couponCode}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await couponService.deleteCoupon(couponId);
                        if (error) {
                            Alert.alert('Error', error);
                        } else {
                            Alert.alert('Success', 'Coupon deleted successfully');
                            loadCoupons();
                        }
                    },
                },
            ]
        );
    };

    const handleToggleActive = async (coupon: Coupon) => {
        const { error } = await couponService.updateCoupon(coupon.id, {
            is_active: !coupon.is_active,
        });

        if (error) {
            Alert.alert('Error', error);
        } else {
            loadCoupons();
        }
    };

    const getFilteredCoupons = () => {
        const now = new Date();

        return coupons.filter((coupon) => {
            const validUntil = new Date(coupon.valid_until);

            if (activeTab === 'active') {
                return coupon.is_active && validUntil >= now;
            } else if (activeTab === 'inactive') {
                return !coupon.is_active && validUntil >= now;
            } else {
                return validUntil < now;
            }
        });
    };

    const getCouponTypeIcon = (type: string | null | undefined): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'first_order': return 'gift-outline';
            case 'cart_value': return 'cart-outline';
            case 'party': return 'sparkles-outline';
            default: return 'pricetag-outline';
        }
    };

    const getCouponTypeGradient = (type: string | null | undefined): string[] => {
        switch (type) {
            case 'first_order': return ['#EC4899', '#F97316'];
            case 'cart_value': return ['#6366F1', '#06B6D4'];
            case 'party': return ['#8B5CF6', '#EC4899'];
            default: return ['#10B981', '#06B6D4'];
        }
    };

    const renderCouponCard = ({ item, index }: { item: Coupon; index: number }) => {
        const isExpired = new Date(item.valid_until) < new Date();
        const usagePercent = item.total_usage_limit
            ? (item.current_usage_count / item.total_usage_limit) * 100
            : 0;
        const gradient = getCouponTypeGradient(item.coupon_type);

        return (
            <Animated.View style={getEntranceStyle(index)}>
            <TouchableOpacity
                style={styles.couponCard}
                onPress={() => navigation.navigate('AdminCouponDetails', { couponId: item.id })}
                activeOpacity={0.7}
            >
                {/* Row 1: Icon + Title + Expired Badge */}
                <View style={styles.couponHeader}>
                    <View style={styles.couponTitleRow}>
                        <LinearGradient colors={gradient as [string, string]} style={styles.couponIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Ionicons name={getCouponTypeIcon(item.coupon_type)} size={20} color={COLORS.white} />
                        </LinearGradient>
                        <View style={styles.couponTitleContainer}>
                            <Text style={styles.couponCode}>{item.code}</Text>
                            <Text style={styles.couponType}>
                                {item.coupon_type ? item.coupon_type.replace('_', ' ').toUpperCase() : 'GENERAL'}
                            </Text>
                        </View>
                    </View>
                    {isExpired && (
                        <View style={styles.expiredBadge}>
                            <Text style={styles.expiredText}>EXPIRED</Text>
                        </View>
                    )}
                </View>

                {/* Row 2: Details */}
                <View style={styles.couponDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Discount</Text>
                        <Text style={styles.detailValue}>
                            {item.discount_type === 'fixed' ? `₹${item.discount_value}` : `${item.discount_value}%`}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Min Cart</Text>
                        <Text style={styles.detailValue}>₹{item.min_cart_value}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Valid Until</Text>
                        <Text style={[styles.detailValue, isExpired && { color: '#F87171' }]}>
                            {format(new Date(item.valid_until), 'MMM dd, yyyy')}
                        </Text>
                    </View>
                </View>

                {item.total_usage_limit ? (
                    <View style={styles.usageContainer}>
                        <View style={styles.usageInfo}>
                            <Text style={styles.usageText}>
                                Used {item.current_usage_count}/{item.total_usage_limit}
                            </Text>
                            <Text style={styles.usagePercent}>{usagePercent.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <LinearGradient
                                colors={gradient as [string, string]}
                                style={[styles.progressFill, { width: `${Math.min(usagePercent, 100)}%` }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                        </View>
                    </View>
                ) : null}

                {/* Row 3: Action bar — toggle + delete, separated from content */}
                <View style={styles.couponActionBar}>
                    <TouchableOpacity
                        onPress={() => handleToggleActive(item)}
                        style={[styles.actionBtn, item.is_active ? styles.actionBtnActive : styles.actionBtnInactive]}
                    >
                        <Ionicons
                            name={item.is_active ? 'toggle' : 'toggle-outline'}
                            size={22}
                            color={item.is_active ? '#34D399' : 'rgba(255,255,255,0.4)'}
                        />
                        <Text style={[styles.actionBtnLabel, { color: item.is_active ? '#34D399' : 'rgba(255,255,255,0.4)' }]}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.code)}
                        style={[styles.actionBtn, styles.actionBtnDelete]}
                    >
                        <Ionicons name="trash-outline" size={16} color="#F87171" />
                        <Text style={[styles.actionBtnLabel, { color: '#F87171' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
            </Animated.View>
        );
    };

    const filteredCoupons = getFilteredCoupons();
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(filteredCoupons.length);

    useEffect(() => {
        if (!loading && filteredCoupons.length > 0) {
            triggerEntrance();
        }
    }, [activeTab, loading]);

    return (
        <View style={styles.container}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.orbPurple} />
            <View style={styles.orbBlue} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Coupons</Text>
                        <Text style={styles.subtitle}>{coupons.length} total coupons</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[
                                        styles.tab,
                                        {
                                            backgroundColor: isActive ? tab.color : tab.inactiveColor,
                                            borderColor: isActive ? tab.color : `${tab.color}80`,
                                        },
                                    ]}
                                    onPress={() => setActiveTab(tab.key)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={tab.icon} size={18} color="#FFFFFF" />
                                    <Text style={styles.tabText}>{tab.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredCoupons}
                    renderItem={renderCouponCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.white} />}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.08)']} style={styles.emptyIconBg}>
                                    <Ionicons name="pricetag-outline" size={48} color={COLORS.primaryLight} />
                                </LinearGradient>
                                <Text style={styles.emptyTitle}>No coupons found</Text>
                                <Text style={styles.emptySubtext}>Create your first coupon to get started</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loading && !refreshing ? (
                            <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primaryLight} /></View>
                        ) : null
                    }
                />

                {/* FAB */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('AdminCouponDetails', { couponId: 'new' })}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={['#6366F1', '#EC4899']} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Ionicons name="add" size={28} color={COLORS.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK.background },
    orbPurple: {
        position: 'absolute', top: 100, right: -40, width: 180, height: 180,
        borderRadius: 90, backgroundColor: 'rgba(139,92,246,0.1)',
    },
    orbBlue: {
        position: 'absolute', bottom: 200, left: -50, width: 140, height: 140,
        borderRadius: 70, backgroundColor: 'rgba(99,102,241,0.06)',
    },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    },
    title: { fontSize: 28, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -0.5 },
    subtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FONT_WEIGHT.medium, marginTop: 2 },
    refreshBtn: {
        backgroundColor: DARK.card.backgroundColor, padding: 12, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },

    // Tabs
    tabWrapper: {
        marginBottom: 20,
    },
    tabContent: {
        paddingHorizontal: 20, gap: 12,
    },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 22, paddingVertical: 13,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 2,
    },
    tabText: { fontSize: 15, color: '#FFFFFF', fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.3 },
    activeTabText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },

    // List
    listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 },
    couponCard: {
        backgroundColor: DARK.card.backgroundColor, borderRadius: 20,
        padding: 18, marginBottom: 16,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    couponHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    couponTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    couponIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    couponTitleContainer: { flex: 1 },
    couponCode: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    couponType: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    couponDetails: { marginTop: 4, gap: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.4)' },
    detailValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.white },
    usageContainer: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: DARK.card.borderColor },
    usageInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    usageText: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.4)' },
    usagePercent: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, color: COLORS.primaryLight },
    progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    // Action bar at bottom of card
    couponActionBar: {
        flexDirection: 'row', gap: 10, marginTop: 16,
        paddingTop: 14, borderTopWidth: 1, borderTopColor: DARK.card.borderColor,
    },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    },
    actionBtnActive: { backgroundColor: 'rgba(52,211,153,0.12)' },
    actionBtnInactive: { backgroundColor: 'rgba(255,255,255,0.06)' },
    actionBtnDelete: { backgroundColor: 'rgba(248,113,113,0.12)' },
    actionBtnLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },

    // Expired badge (inline, not absolute)
    expiredBadge: {
        backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 12,
        paddingVertical: 5, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
        marginLeft: 10,
    },
    expiredText: { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: '#F87171', letterSpacing: 0.5 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl * 2 },
    emptyIconBg: {
        width: 96, height: 96, borderRadius: 48,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
    },
    emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white, marginTop: SPACING.md },
    emptySubtext: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.4)', marginTop: SPACING.xs },
    loader: { paddingVertical: SPACING.lg, alignItems: 'center' },

    // FAB
    fab: {
        position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: SPACING.lg,
        width: 64, height: 64, borderRadius: 32, ...SHADOWS.xl, overflow: 'hidden',
    },
    fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
