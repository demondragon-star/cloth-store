// Search Screen
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Keyboard,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import {
    SearchBar,
    ProductCard,
    EmptyState,
    SkeletonCard,
    Card,
    Button,
} from '../components';
import { useSearch } from '../hooks';
import { useEntranceAnimation } from '../hooks/useScrollAnimation';
import { useAuthStore, useWishlistStore, useCartStore } from '../store';
import type { RootStackParamList, Item, SearchFilters } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TRENDING_SEARCHES = ['Jeans', 'T-Shirts', 'Dresses', 'Sneakers', 'Jackets', 'Hoodies', 'Shorts', 'Sarees'];

const SORT_OPTIONS = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Highest Rated' },
    { key: 'newest', label: 'Newest First' },
];

export const SearchScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    const { user } = useAuthStore();
    const { isItemInWishlist, toggleWishlist } = useWishlistStore();

    // Get initial query from navigation params if provided
    const initialQuery = (route.params as any)?.query || '';

    const {
        query,
        setQuery,
        results,
        isLoading,
        hasMore,
        total,
        searchHistory,
        loadMore,
        clearSearch,
        removeFromHistory,
        clearHistory,
    } = useSearch({ autoSearch: true });

    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState<string>('relevance');
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(results.length);

    useEffect(() => {
        if (!isLoading && results.length > 0) triggerEntrance();
    }, [isLoading, results.length]);

    // Set initial query if provided
    useEffect(() => {
        if (initialQuery && initialQuery !== query) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleItemPress = (item: Item) => {
        Keyboard.dismiss();
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

    const handleHistoryPress = (historyQuery: string) => {
        setQuery(historyQuery);
    };

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setShowFilters(false);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
                <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search products..."
                    autoFocus
                    showHistory={query.length === 0}
                    searchHistory={searchHistory}
                    onSuggestionPress={handleHistoryPress}
                    onRemoveFromHistory={removeFromHistory}
                    onClearHistory={clearHistory}
                />
            </View>
        </View>
    );

    const renderFiltersBar = () => (
        <View style={styles.filtersBar}>
            <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
            >
                <Ionicons name="funnel-outline" size={18} color={COLORS.text} />
                <Text style={styles.filterButtonText}>Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setShowFilters(!showFilters)}
            >
                <Ionicons name="swap-vertical-outline" size={18} color={COLORS.text} />
                <Text style={styles.sortButtonText}>
                    {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
                </Text>
            </TouchableOpacity>

            {results.length > 0 && (
                <Text style={styles.resultsCount}>{total} results</Text>
            )}
        </View>
    );

    const renderSortOptions = () => {
        if (!showFilters) return null;

        return (
            <Card style={styles.sortOptionsCard}>
                <Text style={styles.sortTitle}>Sort By</Text>
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
        <Animated.View style={[styles.itemContainer, index % 2 === 0 && styles.itemLeft, getEntranceStyle(index)]}>
            <ProductCard
                item={item}
                onPress={() => handleItemPress(item)}
                onWishlistPress={() => handleWishlistToggle(item.id)}
                onAddToCartPress={() => handleAddToCart(item)}
                isInWishlist={isItemInWishlist(item.id)}
                style={styles.productCard}
            />
        </Animated.View>
    );

    const renderEmpty = () => {
        if (isLoading) {
            return (
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
        }

        if (query.length === 0) {
            return (
                <View style={styles.emptyStateContainer}>
                    <View style={styles.trendingHeader}>
                        <Ionicons name="flame-outline" size={18} color="#F97316" />
                        <Text style={styles.trendingTitle}>Trending Searches</Text>
                    </View>
                    <View style={styles.trendingChips}>
                        {TRENDING_SEARCHES.map((term) => (
                            <TouchableOpacity
                                key={term}
                                style={styles.trendingChip}
                                onPress={() => setQuery(term)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trending-up-outline" size={14} color={COLORS.primary} />
                                <Text style={styles.trendingChipText}>{term}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {searchHistory.length > 0 && (
                        <>
                            <View style={styles.trendingHeader}>
                                <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                                <Text style={[styles.trendingTitle, { color: COLORS.textSecondary }]}>Recent Searches</Text>
                            </View>
                            <View style={styles.trendingChips}>
                                {searchHistory.slice(0, 6).map((term) => (
                                    <TouchableOpacity
                                        key={term}
                                        style={[styles.trendingChip, styles.historyChip]}
                                        onPress={() => handleHistoryPress(term)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.trendingChipText, { color: COLORS.textSecondary }]}>{term}</Text>
                                        <TouchableOpacity onPress={() => removeFromHistory(term)} style={{ padding: 8, marginLeft: 4 }}>
                                            <Ionicons name="close" size={12} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.noResultsContainer}>
                <View style={styles.noResultsIconBg}>
                    <Ionicons name="search-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Results Found</Text>
                <Text style={styles.emptyDescription}>
                    We couldn't find anything matching "{query}"
                </Text>
                <TouchableOpacity style={styles.clearSearchBtn} onPress={clearSearch} activeOpacity={0.8}>
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderFooter = () => {
        if (!hasMore || isLoading) return null;

        return (
            <View style={styles.loadMoreContainer}>
                <Button
                    title="Load More"
                    onPress={loadMore}
                    variant="outline"
                    size="small"
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {renderHeader()}

            {results.length > 0 && renderFiltersBar()}
            {renderSortOptions()}

            <FlatList
                data={results}
                numColumns={2}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                columnWrapperStyle={results.length > 0 ? styles.columnWrapper : undefined}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                keyboardShouldPersistTaps="handled"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backButton: { marginRight: SPACING.sm },
    searchContainer: { flex: 1 },
    filtersBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    filterButton: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: COLORS.primary, marginRight: SPACING.sm, gap: 4,
    },
    filterButtonText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
    sortButton: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: COLORS.border, gap: 4,
    },
    sortButtonText: { fontSize: FONT_SIZE.sm, color: COLORS.text },
    resultsCount: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'right' },
    sortOptionsCard: { margin: SPACING.md, marginTop: 0 },
    sortTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.sm },
    sortOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border + '40',
    },
    sortOptionActive: {
        backgroundColor: `${COLORS.primary}10`, marginHorizontal: -SPACING.md, paddingHorizontal: SPACING.md,
    },
    sortOptionText: { fontSize: FONT_SIZE.md, color: COLORS.text },
    sortOptionTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
    list: { padding: SPACING.md, paddingBottom: 100 },
    columnWrapper: { justifyContent: 'space-between' },
    itemContainer: { width: '48%', marginBottom: SPACING.md },
    itemLeft: {},
    productCard: { width: '100%' },
    loadingContainer: { padding: SPACING.md },
    loadingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
    skeletonCard: { width: '48%' },
    emptyStateContainer: { padding: SPACING.lg },
    trendingHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm, marginTop: SPACING.md },
    trendingTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
    trendingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    trendingChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: COLORS.primary + '12', paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: COLORS.primary + '30',
    },
    historyChip: { backgroundColor: COLORS.background, borderColor: COLORS.border },
    trendingChipText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.primary },
    noResultsContainer: { alignItems: 'center', padding: SPACING.xl, paddingTop: SPACING.xxl },
    noResultsIconBg: {
        width: 90, height: 90, backgroundColor: COLORS.primary + '12', borderRadius: 45,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
    },
    emptyIcon: { marginBottom: SPACING.lg },
    emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
    emptyDescription: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: FONT_SIZE.md * 1.5 },
    clearSearchBtn: {
        marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
    },
    clearSearchText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
    loadMoreContainer: { alignItems: 'center', paddingVertical: SPACING.lg },
});

export default SearchScreen;
