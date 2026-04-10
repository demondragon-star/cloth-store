import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Dimensions, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { useSectionEntrance } from '../../hooks/useScrollAnimation';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - SPACING.lg * 2 - SPACING.sm) / 2;

interface Stats {
    totalRevenue: number;
    pendingOrders: number;
    totalOrders: number;
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalUsers: number;
    activeUsers: number;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
const Skeleton = ({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) => (
    <View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: DARK.skeleton.to }} />
);

const KpiSkeleton = () => (
    <View style={styles.kpiCard}>
        <Skeleton w={36} h={36} r={12} />
        <Skeleton w="70%" h={28} r={8} />
        <Skeleton w="50%" h={12} />
    </View>
);

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({
    label, value, icon, color, gradient, trend, trendLabel, onPress,
}: {
    label: string; value: string; icon: keyof typeof Ionicons.glyphMap;
    color: string; gradient: readonly [string, string]; trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; onPress?: () => void;
}) => (
    <TouchableOpacity
        style={styles.kpiCard}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
    >
        <View style={styles.kpiTopRow}>
            <LinearGradient colors={gradient} style={styles.kpiIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={icon} size={18} color={COLORS.white} />
            </LinearGradient>
            {trend && (
                <View style={[styles.trendBadge, {
                    backgroundColor: trend === 'up' ? 'rgba(16,185,129,0.15)' : trend === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'
                }]}>
                    <Ionicons
                        name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
                        size={12}
                        color={trend === 'up' ? '#34D399' : trend === 'down' ? '#F87171' : 'rgba(255,255,255,0.4)'}
                    />
                </View>
            )}
        </View>
        <Text style={styles.kpiValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
        {trendLabel && (
            <Text style={[styles.kpiTrend, {
                color: trend === 'up' ? '#34D399' : trend === 'down' ? '#F87171' : 'rgba(255,255,255,0.4)'
            }]}>{trendLabel}</Text>
        )}
    </TouchableOpacity>
);

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
            <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
                <Text style={styles.sectionAction}>{action}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ─── Quick Action ─────────────────────────────────────────────────────────────
const QuickAction = ({
    label, icon, gradient, onPress,
}: {
    label: string; icon: keyof typeof Ionicons.glyphMap;
    gradient: readonly [string, string]; onPress: () => void;
}) => (
    <TouchableOpacity style={styles.qaItem} onPress={onPress} activeOpacity={0.75}>
        <LinearGradient colors={gradient} style={styles.qaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={icon} size={24} color={COLORS.white} />
        </LinearGradient>
        <Text style={styles.qaLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const AdminDashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();

    const [stats, setStats] = useState<Stats>({
        totalRevenue: 0, pendingOrders: 0, totalOrders: 0,
        totalProducts: 0, lowStock: 0, outOfStock: 0,
        totalUsers: 0, activeUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Section entrance animation
    const { runEntrance, sectionStyle } = useSectionEntrance(4);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

            const [{ data: products }, { data: orders }, { count: totalUsers }, { data: recentBuyers }] =
                await Promise.all([
                    supabase.from('items').select('id, stock_quantity, is_active').eq('is_active', true),
                    supabase.from('orders').select('id, status, total, created_at, user_id').order('created_at', { ascending: false }).limit(2000),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('orders').select('user_id').gte('created_at', thirtyDaysAgo),
                ]);

            const p = products || [];
            const o = orders || [];
            setStats({
                totalRevenue: o.filter(x => ['delivered', 'out_for_delivery', 'preparing', 'confirmed'].includes(x.status)).reduce((s, x) => s + x.total, 0),
                pendingOrders: o.filter(x => x.status === 'pending').length,
                totalOrders: o.length,
                totalProducts: p.length,
                lowStock: p.filter(x => x.stock_quantity > 0 && x.stock_quantity <= 5).length,
                outOfStock: p.filter(x => x.stock_quantity === 0).length,
                totalUsers: totalUsers || 0,
                activeUsers: new Set(recentBuyers?.map(x => x.user_id)).size,
            });
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); runEntrance(); }
    };

    const onRefresh = () => { setRefreshing(true); load(); };
    const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
    const adminName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin';
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';



    return (
        <View style={styles.container}>
            {/* ─── Full-screen gradient background ─── */}
            <LinearGradient
                colors={DARK.gradient}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {/* Decorative gradient orbs */}
            <View style={styles.orbPurple} />
            <View style={styles.orbBlue} />
            <View style={styles.orbPink} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ─── Header ─── */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.greet}>{greeting}</Text>
                            <Text style={styles.adminName}>{adminName} 👋</Text>
                        </View>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
                            {stats.pendingOrders > 0 && (
                                <View style={styles.dot}>
                                    <Text style={styles.dotText}>{stats.pendingOrders > 9 ? '9+' : stats.pendingOrders}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.headerBtn, { marginLeft: 8 }]} onPress={() => navigation.navigate('Settings')}>
                            <Ionicons name="settings-outline" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Revenue Glass Card ─── */}
                <View style={styles.revenueCardOuter}>
                    <LinearGradient
                        colors={['rgba(99,102,241,0.35)', 'rgba(139,92,246,0.2)']}
                        style={styles.revenueCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.revenueTop}>
                            <View>
                                <Text style={styles.revenueLabel}>Total Revenue</Text>
                                <Text style={styles.revenueValue}>{fmt(stats.totalRevenue)}</Text>
                            </View>
                            <LinearGradient colors={['#6366F1', '#EC4899']} style={styles.revenueIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Ionicons name="wallet-outline" size={22} color={COLORS.white} />
                            </LinearGradient>
                        </View>
                        <View style={styles.revenueDivider} />
                        <View style={styles.revenueStats}>
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatValue}>{stats.totalOrders}</Text>
                                <Text style={styles.revenueStatLabel}>Orders</Text>
                            </View>
                            <View style={styles.revenueStatDot} />
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatValue}>{stats.activeUsers}</Text>
                                <Text style={styles.revenueStatLabel}>Active</Text>
                            </View>
                            <View style={styles.revenueStatDot} />
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatValue}>{stats.pendingOrders}</Text>
                                <Text style={styles.revenueStatLabel}>Pending</Text>
                            </View>
                            <View style={styles.revenueStatDot} />
                            <View style={styles.revenueStat}>
                                <Text style={styles.revenueStatValue}>{stats.totalProducts}</Text>
                                <Text style={styles.revenueStatLabel}>Products</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* ─── Body ─── */}
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.white} />}
                    contentContainerStyle={styles.body}
                >
                    {/* KPI Grid - 2 columns */}
                    <Animated.View style={sectionStyle(0)}>
                    <SectionHeader title="Overview" />
                    <View style={styles.kpiGrid}>
                        {loading ? (
                            [1, 2, 3, 4, 5, 6].map(i => <KpiSkeleton key={i} />)
                        ) : (<>
                            <KpiCard label="Pending Orders" value={`${stats.pendingOrders}`} icon="time-outline" color="#D97706"
                                gradient={['#F59E0B', '#EF4444']}
                                trend={stats.pendingOrders > 5 ? 'down' : 'up'}
                                trendLabel={stats.pendingOrders > 5 ? 'Needs attention' : 'On track'}
                                onPress={() => navigation.navigate('OrdersTab')} />
                            <KpiCard label="Total Orders" value={`${stats.totalOrders}`} icon="receipt-outline" color="#2563EB"
                                gradient={['#3B82F6', '#6366F1']}
                                trend="up" trendLabel="All time" onPress={() => navigation.navigate('OrdersTab')} />
                            <KpiCard label="Products" value={`${stats.totalProducts}`} icon="cube-outline" color="#7C3AED"
                                gradient={['#8B5CF6', '#A855F7']}
                                trend="neutral" trendLabel="Active" onPress={() => navigation.navigate('ProductsTab')} />
                            <KpiCard label="Low Stock" value={`${stats.lowStock}`} icon="warning-outline" color="#F97316"
                                gradient={['#F97316', '#FB923C']}
                                trend={stats.lowStock > 0 ? 'down' : 'up'}
                                trendLabel={stats.lowStock > 0 ? 'Reorder soon' : 'All stocked'}
                                onPress={() => navigation.navigate('ProductsTab')} />
                            <KpiCard label="Out of Stock" value={`${stats.outOfStock}`} icon="close-circle-outline" color="#DC2626"
                                gradient={['#EF4444', '#F87171']}
                                trend={stats.outOfStock > 0 ? 'down' : 'up'}
                                trendLabel={stats.outOfStock > 0 ? 'Action needed' : 'None'}
                                onPress={() => navigation.navigate('ProductsTab')} />
                            <KpiCard label="Customers" value={`${stats.totalUsers}`} icon="people-outline" color="#059669"
                                gradient={['#10B981', '#34D399']}
                                trend="up" trendLabel={`${stats.activeUsers} active`} />
                        </>)}
                    </View>
                    </Animated.View>



                    {/* Inventory Alert Banner */}
                    {!loading && (stats.lowStock > 0 || stats.outOfStock > 0) && (
                        <Animated.View style={sectionStyle(2)}>
                            <SectionHeader title="Inventory Alerts" />
                            <TouchableOpacity
                                style={styles.alertBanner}
                                onPress={() => navigation.navigate('ProductsTab')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['rgba(249,115,22,0.15)', 'rgba(239,68,68,0.08)']}
                                    style={styles.alertGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={styles.alertIcon}>
                                        <Ionicons name="alert-circle" size={22} color="#F97316" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.alertTitle}>
                                            {stats.outOfStock > 0
                                                ? `${stats.outOfStock} product${stats.outOfStock > 1 ? 's' : ''} out of stock`
                                                : `${stats.lowStock} product${stats.lowStock > 1 ? 's' : ''} running low`}
                                        </Text>
                                        <Text style={styles.alertSubtitle}>Tap to review inventory →</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK.background },

    // Decorative orbs
    orbPurple: {
        position: 'absolute', top: -60, right: -40, width: 200, height: 200,
        borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.12)',
    },
    orbBlue: {
        position: 'absolute', top: 200, left: -60, width: 160, height: 160,
        borderRadius: 80, backgroundColor: 'rgba(59,130,246,0.08)',
    },
    orbPink: {
        position: 'absolute', bottom: 100, right: -30, width: 120, height: 120,
        borderRadius: 60, backgroundColor: 'rgba(236,72,153,0.06)',
    },

    // Header
    header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    greet: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FONT_WEIGHT.medium },
    adminName: { fontSize: 26, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -0.5 },
    headerBtn: {
        backgroundColor: DARK.card.backgroundColor, padding: 10, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: DARK.card.borderColor, position: 'relative',
    },
    dot: {
        position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18,
        borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
        borderWidth: 2, borderColor: DARK.background,
    },
    dotText: { color: COLORS.white, fontSize: 9, fontWeight: FONT_WEIGHT.black },

    // Revenue Card
    revenueCardOuter: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
    revenueCard: {
        borderRadius: BORDER_RADIUS.xxl, padding: SPACING.lg,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    revenueLabel: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FONT_WEIGHT.medium, marginBottom: 4 },
    revenueValue: { fontSize: 36, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -1 },
    revenueIconBg: {
        width: 48, height: 48, borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center', alignItems: 'center',
    },
    revenueDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: SPACING.md },
    revenueStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    revenueStat: { alignItems: 'center', flex: 1 },
    revenueStatValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.black, color: COLORS.white },
    revenueStatLabel: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.5)', fontWeight: FONT_WEIGHT.medium, marginTop: 2 },
    revenueStatDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Body
    body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

    // Section Header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: DARK.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
    sectionAction: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.primaryLight },

    // KPI Grid (2 columns)
    kpiGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        gap: SPACING.sm, marginBottom: SPACING.lg,
    },
    kpiCard: {
        width: CARD_W, backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md,
        borderWidth: 1, borderColor: DARK.card.borderColor,
        gap: 6,
    },
    kpiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    kpiIconWrap: { width: 36, height: 36, borderRadius: BORDER_RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
    trendBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
    kpiValue: { fontSize: 28, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -0.5 },
    kpiLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium, color: 'rgba(255,255,255,0.5)' },
    kpiTrend: { fontSize: 10, fontWeight: FONT_WEIGHT.semibold, marginTop: 2 },

    // Quick Actions
    qaGrid: {
        flexDirection: 'row', gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    qaItem: { flex: 1, alignItems: 'center', gap: 8 },
    qaGradient: {
        width: 60, height: 60, borderRadius: BORDER_RADIUS.xxl,
        justifyContent: 'center', alignItems: 'center',
        ...SHADOWS.md,
    },
    qaLabel: { fontSize: 10, fontWeight: FONT_WEIGHT.semibold, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

    // Alert Banner
    alertBanner: {
        borderRadius: BORDER_RADIUS.xxl, overflow: 'hidden',
        marginBottom: SPACING.lg,
        borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)',
    },
    alertGradient: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        padding: SPACING.md,
    },
    alertIcon: { width: 42, height: 42, borderRadius: BORDER_RADIUS.xl, backgroundColor: 'rgba(249,115,22,0.15)', justifyContent: 'center', alignItems: 'center' },
    alertTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: '#FB923C' },
    alertSubtitle: { fontSize: FONT_SIZE.xs, color: '#FDBA74', marginTop: 2, fontWeight: FONT_WEIGHT.medium },
});

export default AdminDashboardScreen;
