// Wishlist Screen
import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    StatusBar,
    Alert,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants/theme';
import { ProductCard, SkeletonCard } from '../../components';
import { useAuthStore, useWishlistStore, useCartStore } from '../../store';
import { useRefresh } from '../../hooks';
import { useEntranceAnimation } from '../../hooks/useScrollAnimation';
import type { RootStackParamList, WishlistItem } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WishlistScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const { items, isLoading, fetchWishlist, removeFromWishlist } = useWishlistStore();
    const { addToCart } = useCartStore();

    const loadWishlist = useCallback(async () => {
        if (user) {
            await fetchWishlist(user.id);
        }
    }, [user, fetchWishlist]);

    useEffect(() => {
        loadWishlist();
    }, [loadWishlist]);

    const { refreshing, onRefresh } = useRefresh(loadWishlist);
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(items.length);

    useEffect(() => {
        if (!isLoading && items.length > 0) triggerEntrance();
    }, [isLoading]);

    const handleItemPress = (itemId: string) => {
        navigation.navigate('ItemDetail', { itemId });
    };

    const handleRemoveFromWishlist = (itemId: string) => {
        Alert.alert(
            'Remove from Wishlist',
            'Are you sure you want to remove this item from your wishlist?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        if (user) {
                            await removeFromWishlist(user.id, itemId);
                            Toast.show({
                                type: 'success',
                                text1: 'Removed from Wishlist',
                                text2: 'Item has been removed from your wishlist.',
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleAddToCart = async (item: WishlistItem) => {
        if (user) {
            const { addToCart } = useCartStore.getState();
            const result = await addToCart(user.id, item.item_id, 1);
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Added to Cart',
                    text2: `${item.item.name} has been added to your cart.`,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Add',
                    text2: result.error || 'Please try again.',
                });
            }
        }
    };

    const handleContinueShopping = () => {
        navigation.goBack();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>My Wishlist</Text>
                <View style={styles.countBadge}>
                    <Ionicons name="heart" size={12} color={COLORS.error} />
                    <Text style={styles.count}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item, index }: { item: WishlistItem; index: number }) => (
        <Animated.View style={getEntranceStyle(index)}>
        <View style={[styles.itemContainer, index % 2 === 0 && styles.itemContainerLeft]}>
            <ProductCard
                item={item.item}
                onPress={() => handleItemPress(item.item_id)}
                onWishlistPress={() => handleRemoveFromWishlist(item.item_id)}
                onAddToCartPress={() => handleAddToCart(item)}
                isInWishlist={true}
                style={styles.productCard}
            />
        </View>
        </Animated.View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name="heart-outline" size={52} color={COLORS.error} />
            </View>
            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptySubtitle}>Save items you love by tapping the heart icon</Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleContinueShopping}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#7C3AED'] as const}
                    style={styles.emptyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.emptyButtonText}>Start Shopping</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingRow}>
                <SkeletonCard style={styles.skeletonCard} />
                <SkeletonCard style={styles.skeletonCard} />
            </View>
            <View style={styles.loadingRow}>
                <SkeletonCard style={styles.skeletonCard} />
                <SkeletonCard style={styles.skeletonCard} />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <FlatList
                data={items}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.columnWrapper}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.white, paddingHorizontal: SPACING.md,
        paddingTop: SPACING.lg, paddingBottom: SPACING.md,
        marginBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.black, color: COLORS.text },
    countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    count: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
    list: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
    columnWrapper: { justifyContent: 'space-between' },
    itemContainer: { width: '48%', marginBottom: SPACING.md },
    itemContainerLeft: {},
    productCard: { width: '100%' },
    emptyContainer: {
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxl * 2,
    },
    emptyIconBg: {
        width: 100, height: 100, backgroundColor: '#FEE2E2',
        borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
    },
    emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.black, color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
    emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    emptyButton: { borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
    emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
    emptyButtonText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    loadingContainer: { padding: SPACING.md },
    loadingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
    skeletonCard: { width: '48%' },
});

export default WishlistScreen;
