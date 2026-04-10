import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Platform, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { itemService } from '../../services/item.service';
import { Swipeable } from 'react-native-gesture-handler';
import { supabase } from '../../services/supabase';
import { useEntranceAnimation } from '../../hooks/useScrollAnimation';
import { Item } from '../../types';
import { AdminProductsStackParamList } from '../../navigation/AdminNavigator';

type AdminNavigationProp = NativeStackNavigationProp<AdminProductsStackParamList>;

const SkeletonProductCard = () => (
    <View style={styles.card}>
        <View style={{ width: 80, height: 80, borderRadius: BORDER_RADIUS.xl, backgroundColor: DARK.skeleton.to }} />
        <View style={{ flex: 1, marginLeft: SPACING.md, gap: SPACING.sm }}>
            <View style={{ width: '75%', height: 14, backgroundColor: DARK.skeleton.to, borderRadius: 8 }} />
            <View style={{ width: '45%', height: 11, backgroundColor: DARK.skeleton.from, borderRadius: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <View style={{ width: '35%', height: 14, backgroundColor: DARK.skeleton.to, borderRadius: 6 }} />
                <View style={{ width: '30%', height: 14, backgroundColor: DARK.skeleton.from, borderRadius: 6 }} />
            </View>
        </View>
    </View>
);

export const AdminProductsScreen: React.FC = () => {
    const navigation = useNavigation<AdminNavigationProp>();
    const [products, setProducts] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadProducts = useCallback(async (pageNum: number, shouldRefresh: boolean = false) => {
        try {
            if (shouldRefresh) {
                setLoading(true);
            }

            const response = await itemService.getAllItems(pageNum, 10);

            if (response.data) {
                setProducts(prev => shouldRefresh ? response.data!.data : [...prev, ...response.data!.data]);
                setHasMore(response.data.has_more);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadProducts(1, true);
    }, [loadProducts]);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadProducts(1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadProducts(nextPage);
        }
    };

    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(products.length);

    useEffect(() => {
        if (!loading && products.length > 0) {
            triggerEntrance();
        }
    }, [loading]);

    const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
        try {
            await supabase.from('items').update({ is_active: !currentStatus }).eq('id', productId);
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !currentStatus } : p));
        } catch (error) {
            Alert.alert('Error', 'Failed to update product status');
        }
    };

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, item: Item) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });
        
        const actionLabel = item.is_active ? 'Hide' : 'Publish';
        const actionColor = item.is_active ? COLORS.gray[600] : COLORS.success;
        const actionIcon = item.is_active ? 'eye-off-outline' : 'eye-outline';

        return (
            <TouchableOpacity 
                style={[styles.swipeActionRight, { backgroundColor: actionColor }]} 
                onPress={() => toggleProductStatus(item.id, item.is_active)}
            >
                <Animated.View style={[styles.swipeActionContent, { transform: [{ translateX: trans }] }]}>
                    <Ionicons name={actionIcon} size={24} color={COLORS.white} />
                    <Text style={styles.swipeActionText}>{actionLabel}</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderProductItem = ({ item, index }: { item: Item; index: number }) => {
        const imageUrl = item.images?.[0]?.image_url || item.image_urls?.[0];
        const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 5;
        const isOutOfStock = item.stock_quantity === 0;

        return (
            <Animated.View style={getEntranceStyle(index)}>
            <Swipeable
                renderRightActions={(prog, drag) => renderRightActions(prog, drag, item)}
                containerStyle={{ marginBottom: SPACING.sm }}
            >
            <TouchableOpacity
                style={[styles.card, { marginBottom: 0 }]}
                onPress={() => navigation.navigate('AdminProductDetails', { productId: item.id })}
                activeOpacity={0.7}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                        <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.3)" />
                    </View>
                )}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)' }]}>
                            <View style={[styles.liveIndicator, { backgroundColor: item.is_active ? '#10B981' : COLORS.gray[400] }]} />
                            <Text style={[styles.statusText, { color: item.is_active ? '#34D399' : 'rgba(255,255,255,0.4)' }]}>
                                {item.is_active ? 'Live' : 'Off'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.sku}>SKU: {item.sku}</Text>
                    <View style={styles.cardFooter}>
                        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                        <View style={styles.stockRow}>
                            <View style={[
                                styles.stockDot,
                                { backgroundColor: isOutOfStock ? COLORS.error : isLowStock ? '#F59E0B' : COLORS.success }
                            ]} />
                            <Text style={[
                                styles.stock,
                                isOutOfStock && { color: '#F87171' },
                                isLowStock && { color: '#FBBF24' }
                            ]}>
                                {isOutOfStock ? 'Out of stock' : `${item.stock_quantity} in stock`}
                            </Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
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
            <View style={styles.orbPink} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Products</Text>
                        <Text style={styles.subtitle}>{products.length} items in catalog</Text>
                    </View>
                    <TouchableOpacity style={styles.searchBtn} onPress={onRefresh}>
                        <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={loading && !refreshing ? [] : products}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.white} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={loading && !refreshing ? (
                        <>{[1,2,3,4,5].map(i => <SkeletonProductCard key={i} />)}</>
                    ) : null}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.08)']} style={styles.emptyIconBg}>
                                    <Ionicons name="cube-outline" size={48} color={COLORS.primaryLight} />
                                </LinearGradient>
                                <Text style={styles.emptyTitle}>No Products Yet</Text>
                                <Text style={styles.emptyText}>Tap the + button to add your first product</Text>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        !loading && hasMore ? (
                            <View style={styles.loader}><ActivityIndicator size="small" color={COLORS.primaryLight} /></View>
                        ) : null
                    }
                />

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('AdminProductDetails', { productId: 'new' })}
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

    // Decorative orbs
    orbPurple: {
        position: 'absolute', top: 120, right: -50, width: 180, height: 180,
        borderRadius: 90, backgroundColor: 'rgba(139,92,246,0.1)',
    },
    orbPink: {
        position: 'absolute', bottom: 150, left: -40, width: 120, height: 120,
        borderRadius: 60, backgroundColor: 'rgba(236,72,153,0.06)',
    },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
    },
    title: { fontSize: 28, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -0.5 },
    subtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FONT_WEIGHT.medium, marginTop: 2 },
    searchBtn: {
        backgroundColor: DARK.card.backgroundColor, padding: 10, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },

    // List
    listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
    card: {
        flexDirection: 'row', backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md, marginBottom: SPACING.sm,
        borderWidth: 1, borderColor: DARK.card.borderColor, alignItems: 'center',
    },
    image: { width: 76, height: 76, borderRadius: BORDER_RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.05)' },
    imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1, marginLeft: SPACING.md, marginRight: SPACING.sm, gap: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.white, flex: 1, marginRight: SPACING.sm },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, gap: 4 },
    liveIndicator: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: FONT_WEIGHT.bold },
    sku: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.35)' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.black, color: COLORS.primaryLight },
    stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stockDot: { width: 7, height: 7, borderRadius: 4 },
    stock: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.4)', fontWeight: FONT_WEIGHT.medium },

    // Empty
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl * 2 },
    emptyIconBg: {
        width: 96, height: 96, borderRadius: 48,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
    },
    emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white, marginBottom: SPACING.xs },
    emptyText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.4)' },
    loader: { paddingVertical: SPACING.md, alignItems: 'center' },

    // FAB
    fab: {
        position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: SPACING.lg,
        width: 64, height: 64, borderRadius: 32, ...SHADOWS.xl, overflow: 'hidden',
    },
    fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Swipe Actions
    swipeActionRight: {
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
