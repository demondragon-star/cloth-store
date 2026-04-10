// Category Items Screen - shows items for a specific category
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { ProductCard, EmptyState, SkeletonProductCard, Card, Button } from '../components';
import { useAuthStore, useWishlistStore, useCartStore } from '../store';
import { itemService, supabase } from '../services';
import { useRefresh } from '../hooks';
import { useEntranceAnimation } from '../hooks/useScrollAnimation';
import type { RootStackParamList, Item, ItemFilters } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'CategoryItems'>;

const SORT_OPTIONS = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Highest Rated' },
    { key: 'newest', label: 'Newest First' },
];

export const CategoryItemsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteType>();
    const { categoryId, categoryName } = route.params;

    const { user } = useAuthStore();
    const { isItemInWishlist, toggleWishlist } = useWishlistStore();

    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState<string>('relevance');
    const [showSortOptions, setShowSortOptions] = useState(false);

    const loadItems = useCallback(async (reset = true) => {
        if (reset) {
            setIsLoading(true);
            setPage(1);
        }

        try {
            const filters: ItemFilters = {
                category_id: categoryId,
                sort_by: sortBy as any,
            };

            const { data, error } = await itemService.getItems(filters, reset ? 1 : page);

            if (data) {
                if (reset) {
                    setItems(data.data);
                } else {
                    setItems(prev => [...prev, ...data.data]);
                }
                setTotal(data.total);
                setHasMore(data.has_more);
                setPage(data.page + 1);
            }
        } catch (error) {
            console.error('Error loading category items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [categoryId, sortBy, page]);

    useEffect(() => {
        loadItems(true);

        const channel = supabase
            .channel(`category-items-${categoryId}`)
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'items' },
                (payload) => {
                    setItems(prev => prev.filter(item => item.id !== payload.old.id));
                    setTotal(prev => Math.max(0, prev - 1));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [categoryId, sortBy]);

    const { refreshing, onRefresh } = useRefresh(() => loadItems(true));
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(items.length);

    useEffect(() => {
        if (!isLoading && items.length > 0) triggerEntrance();
    }, [isLoading]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleSearch = () => {
        navigation.navigate('Search');
    };

    const handleItemPress = (item: Item) => {
        navigation.navigate('ItemDetail', { itemId: item.id });
    };

    const handleWishlistToggle = async (itemId: string) => {
        if (!user) {
            Toast.show({
                type: 'error',
                text1: 'Login Required',
                text2: 'Please login to add items to wishlist.',
            });
            return;
        }

        const result = await toggleWishlist(user.id, itemId);
        
        if (result.error) {
            Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: result.error || 'Please try again.',
            });
        } else {
            Toast.show({
                type: 'success',
                text1: result.added ? 'Added to Wishlist' : 'Removed from Wishlist',
                text2: result.added ? 'Item saved to your wishlist.' : 'Item removed from your wishlist.',
            });
        }
    };

    const handleAddToCart = async (item: Item) => {
        if (user) {
            const { addToCart } = useCartStore.getState();
            const result = await addToCart(user.id, item.id, 1);
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Added to Cart',
                    text2: `${item.name} has been added to your cart.`,
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

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            loadItems(false);
        }
    };

    const handleSortChange = (newSort: string) => {
        setSortBy(newSort);
        setShowSortOptions(false);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
                <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
                <Text style={styles.headerSubtitle}>{total} products</Text>
            </View>
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Ionicons name="search-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
        </View>
    );

    const renderFiltersBar = () => (
        <View style={styles.filtersBar}>
            <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setShowSortOptions(!showSortOptions)}
            >
                <Ionicons name="swap-vertical-outline" size={18} color={COLORS.text} />
                <Text style={styles.sortButtonText}>
                    {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
                </Text>
                <Ionicons
                    name={showSortOptions ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.gray[500]}
                />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="filter-outline" size={18} color={COLORS.text} />
                <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSortOptions = () => {
        if (!showSortOptions) return null;

        return (
            <Card style={styles.sortOptionsCard}>
                {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.sortOption,
                            sortBy === option.key && styles.sortOptionActive,
                        ]}
                        onPress={() => handleSortChange(option.key)}
                    >
                        <Text
                            style={[
                                styles.sortOptionText,
                                sortBy === option.key && styles.sortOptionTextActive,
                            ]}
                        >
                            {option.label}
                        </Text>
                        {sortBy === option.key && (
                            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </Card>
        );
    };

    const renderItem = ({ item, index }: { item: Item; index: number }) => (
        <Animated.View style={getEntranceStyle(index)}>
        <View style={[styles.itemContainer, index % 2 === 0 && styles.itemLeft]}>
            <ProductCard
                item={item}
                onPress={() => handleItemPress(item)}
                onWishlistPress={() => handleWishlistToggle(item.id)}
                onAddToCartPress={() => handleAddToCart(item)}
                isInWishlist={isItemInWishlist(item.id)}
                style={styles.productCard}
            />
        </View>
        </Animated.View>
    );

    const renderEmpty = () => (
        <EmptyState
            icon="bag-outline"
            title="No Products Found"
            description={`We couldn't find any products in ${categoryName}.`}
            actionLabel="Browse Other Categories"
            onAction={handleBack}
        />
    );

    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingRow}>
                <SkeletonProductCard style={styles.skeletonCard} />
                <SkeletonProductCard style={styles.skeletonCard} />
            </View>
            <View style={styles.loadingRow}>
                <SkeletonProductCard style={styles.skeletonCard} />
                <SkeletonProductCard style={styles.skeletonCard} />
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!hasMore || items.length === 0) return null;

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
            {renderFiltersBar()}
            {renderSortOptions()}

            <FlatList
                data={items}
                numColumns={2}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                columnWrapperStyle={items.length > 0 ? styles.columnWrapper : undefined}
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
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: SPACING.md,
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    searchButton: {
        padding: SPACING.sm,
    },
    filtersBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SPACING.sm,
    },
    sortButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sortButtonText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterButtonText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        marginLeft: SPACING.xs,
    },
    sortOptionsCard: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.sm,
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    sortOptionActive: {
        backgroundColor: `${COLORS.primary}10`,
        marginHorizontal: -SPACING.md,
        paddingHorizontal: SPACING.md,
    },
    sortOptionText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    sortOptionTextActive: {
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.semibold,
    },
    list: {
        padding: SPACING.md,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    itemContainer: {
        width: '48%',
        marginBottom: SPACING.md,
    },
    itemLeft: {},
    productCard: {
        width: '100%',
    },
    loadingContainer: {
        padding: SPACING.md,
    },
    loadingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    skeletonCard: {
        width: '48%',
    },
    loadMoreContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
});

export default CategoryItemsScreen;
