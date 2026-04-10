// Home Screen with personalized dashboard
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    TextInput,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import {
    ProductCard,
    CategoryCard,
    Avatar,
    Badge,
    SkeletonProductCard,
    SkeletonCategoryCard,
    CouponBannerCarousel,
} from '../../components';
import { useAuthStore, useCartStore, useNotificationStore, useWishlistStore } from '../../store';
import { itemService, supabase } from '../../services';
import { getTimeGreeting, getFirstName } from '../../utils/format';
import type { RootStackParamList, Category, Item } from '../../types';
import { useRefresh } from '../../hooks';
import { useSectionEntrance } from '../../hooks/useScrollAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const insets = useSafeAreaInsets();
    const { user, profile } = useAuthStore();
    const { itemCount } = useCartStore();
    const { unreadCount, fetchUnreadCount } = useNotificationStore();
    const { fetchWishlist, isItemInWishlist, toggleWishlist } = useWishlistStore();

    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
    const [newArrivals, setNewArrivals] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [categoriesRes, featuredRes, newArrivalsRes] = await Promise.all([
                itemService.getCategories(),
                itemService.getFeaturedItems(10),
                itemService.getItems({ sort_by: 'newest' }, 1, 10),
            ]);

            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (featuredRes.data) setFeaturedItems(featuredRes.data);
            if (newArrivalsRes.data) setNewArrivals(newArrivalsRes.data.data);

            if (user) {
                await fetchUnreadCount(user.id);
                await fetchWishlist(user.id);
            }
        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, fetchUnreadCount, fetchWishlist]);

    useEffect(() => {
        loadData();

        // Subscribe to real-time changes on the items table
        const channel = supabase
            .channel('public:items')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'items' },
                () => {
                    // Refetch data when a new item is added
                    loadData();
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'items' },
                () => {
                    // Refetch data when an item is updated (e.g. stock changes, becomes active)
                    loadData();
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'items' },
                () => {
                    // Refetch data when an item is deleted from admin systems
                    loadData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    const { refreshing, onRefresh } = useRefresh(loadData);

    // Section entrance animation
    const { runEntrance, sectionStyle } = useSectionEntrance(4);

    useEffect(() => {
        if (!isLoading) runEntrance();
    }, [isLoading]);

    const handleNotifications = () => {
        navigation.navigate('Notifications');
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Search', { query: searchQuery } as any);
        } else {
            navigation.navigate('Search');
        }
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Search', { query: searchQuery } as any);
        }
    };

    const handleCategoryPress = (category: Category) => {
        navigation.navigate('CategoryItems', {
            categoryId: category.id,
            categoryName: category.name,
        });
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
        if (!user) {
            Toast.show({
                type: 'error',
                text1: 'Login Required',
                text2: 'Please login to add items to cart.',
            });
            return;
        }

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
    };

    const handleCartPress = () => {
        navigation.navigate('Cart');
    };

    const renderHeader = () => (
        <LinearGradient
            colors={COLORS.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
        >
            <View style={styles.headerTop}>
                <TouchableOpacity
                    style={styles.profileSection}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Avatar
                        source={user?.avatar_url}
                        name={user?.full_name}
                        size={48}
                        style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }}
                    />
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>{getTimeGreeting()}</Text>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user ? getFirstName(user.full_name) : 'Guest'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('Wishlist')} style={styles.iconButton}>
                        <Ionicons name="heart-outline" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNotifications} style={styles.iconButton}>
                        <Badge count={unreadCount} size="small" style={{ backgroundColor: COLORS.secondary }}>
                            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                        </Badge>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleCartPress} style={styles.iconButton}>
                        <Badge count={itemCount} size="small" style={{ backgroundColor: COLORS.secondary }}>
                            <Ionicons name="cart-outline" size={24} color={COLORS.white} />
                        </Badge>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar - Now with actual input */}
            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for products..."
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                )}
            </View>
        </LinearGradient>
    );

    const renderPromoBanner = () => (
        <CouponBannerCarousel />
    );

    const renderCategories = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Search', { showCategories: true })}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ marginRight: SPACING.sm }}>
                            <SkeletonCategoryCard />
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <FlatList
                    data={categories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CategoryCard
                            category={item}
                            onPress={() => handleCategoryPress(item)}
                            style={styles.categoryCard}
                        />
                    )}
                />
            )}
        </View>
    );

    const renderFeaturedItems = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Search', { filter: 'featured' })}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ marginRight: SPACING.md, width: 180 }}>
                            <SkeletonProductCard />
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <FlatList
                    data={featuredItems}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            onPress={() => handleItemPress(item)}
                            onWishlistPress={() => handleWishlistToggle(item.id)}
                            onAddToCartPress={() => handleAddToCart(item)}
                            isInWishlist={isItemInWishlist(item.id)}
                            style={styles.productCard}
                        />
                    )}
                />
            )}
        </View>
    );

    const renderNewArrivals = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>New Arrivals</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Search', { filter: 'newest' })}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View>
                    {[1, 2, 3].map((i) => (
                        <SkeletonProductCard key={i} variant="horizontal" />
                    ))}
                </View>
            ) : (
                <View style={styles.newArrivalsGrid}>
                    {newArrivals.map((item) => (
                        <View key={item.id} style={styles.gridItemContainer}>
                            <ProductCard
                                item={item}
                                onPress={() => handleItemPress(item)}
                                onWishlistPress={() => handleWishlistToggle(item.id)}
                                onAddToCartPress={() => handleAddToCart(item)}
                                isInWishlist={isItemInWishlist(item.id)}
                                style={{ width: '100%' }}
                            />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {renderHeader()}
                <View style={styles.contentContainer}>
                    {renderPromoBanner()}
                    <Animated.View style={sectionStyle(0)}>{renderCategories()}</Animated.View>
                    <Animated.View style={sectionStyle(1)}>{renderNewArrivals()}</Animated.View>
                    <Animated.View style={sectionStyle(2)}>{renderFeaturedItems()}</Animated.View>
                    <View style={styles.bottomPadding} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        marginTop: -SPACING.xl,
        backgroundColor: COLORS.background,
        paddingTop: SPACING.xl,
    },
    header: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xxl + SPACING.md, // Extra padding for curve effect
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    greetingContainer: {
        marginLeft: SPACING.sm,
    },
    greeting: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    iconButton: {
        padding: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: BORDER_RADIUS.full,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    searchInput: {
        flex: 1,
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
        paddingVertical: SPACING.sm,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: 'rgba(255,255,255,0.7)',
    },
    promoBannerContainer: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.xs,
    },
    promoBanner: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    promoContent: {
        flex: 1,
        maxWidth: '70%',
    },
    promoLabel: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: SPACING.xs,
        fontWeight: FONT_WEIGHT.medium,
    },
    promoTitle: {
        fontSize: FONT_SIZE.xxxl,
        fontWeight: FONT_WEIGHT.black,
        color: COLORS.white,
        marginBottom: SPACING.xs,
    },
    promoDescription: {
        fontSize: FONT_SIZE.md,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: SPACING.md,
    },
    promoButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        alignSelf: 'flex-start',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    promoButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.secondary,
    },
    promoIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        opacity: 0.8,
    },
    section: {
        marginTop: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.black,
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    seeAll: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
        letterSpacing: 0.1,
    },
    categoryList: {
        paddingHorizontal: SPACING.md,
    },
    categoryCard: {
        marginRight: SPACING.sm,
    },
    productList: {
        paddingHorizontal: SPACING.md,
    },
    productCard: {
        marginRight: SPACING.md,
    },
    newArrivalsList: {
        paddingHorizontal: SPACING.md,
    },
    newArrivalsGrid: {
        paddingHorizontal: SPACING.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItemContainer: {
        width: '48%',
        marginBottom: SPACING.md,
    },
    bottomPadding: {
        height: 100,
    },
});

export default HomeScreen;
