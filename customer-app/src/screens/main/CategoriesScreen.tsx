// Categories Screen
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { CategoryCard, SearchBar, EmptyState, SkeletonListItem } from '../../components';
import { itemService } from '../../services';
import { useRefresh, useDebounce } from '../../hooks';
import { useEntranceAnimation } from '../../hooks/useScrollAnimation';
import type { RootStackParamList, Category } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CategoriesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const debouncedSearch = useDebounce(searchQuery, 300);

    const loadData = useCallback(async () => {
        try {
            const categoriesRes = await itemService.getCategories();

            if (categoriesRes.data) {
                setCategories(categoriesRes.data);
                setFilteredCategories(categoriesRes.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (debouncedSearch.trim()) {
            const filtered = categories.filter(cat =>
                cat.name.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(categories);
        }
    }, [debouncedSearch, categories]);

    const { refreshing, onRefresh } = useRefresh(loadData);
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(filteredCategories.length);

    useEffect(() => {
        if (!isLoading && filteredCategories.length > 0) triggerEntrance();
    }, [isLoading]);

    const handleCategoryPress = (category: Category) => {
        navigation.navigate('CategoryItems', {
            categoryId: category.id,
            categoryName: category.name,
        });
    };

    const handleSearchPress = () => {
        navigation.navigate('Search');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>Browse products by category</Text>

            <TouchableOpacity onPress={handleSearchPress} style={styles.searchBar} activeOpacity={0.8}>
                <Ionicons name="search-outline" size={20} color={COLORS.gray[400]} />
                <Text style={styles.searchPlaceholder}>Search categories...</Text>
            </TouchableOpacity>
        </View>
    );

    const renderCategory = ({ item, index }: { item: Category; index: number }) => (
        <Animated.View style={getEntranceStyle(index)}>
        <CategoryCard
            category={item}
            onPress={() => handleCategoryPress(item)}
            variant="large"
            style={styles.categoryCard}
        />
        </Animated.View>
    );

    const renderEmpty = () => (
        <EmptyState
            icon="folder-open-outline"
            title="No Categories Found"
            description={searchQuery ? 'Try a different search term' : 'Categories will appear here'}
        />
    );

    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonListItem key={i} />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <FlatList
                data={filteredCategories}
                ListHeaderComponent={renderHeader}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
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
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.lg,
        marginBottom: SPACING.md,
        borderBottomLeftRadius: BORDER_RADIUS.xl,
        borderBottomRightRadius: BORDER_RADIUS.xl,
    },
    title: {
        fontSize: FONT_SIZE.xxxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray[50],
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.gray[400],
    },
    list: {
        paddingHorizontal: SPACING.md,
        paddingBottom: 100,
    },
    categoryCard: {
        marginBottom: SPACING.md,
    },
    loadingContainer: {
        padding: SPACING.md,
    },
});

export default CategoriesScreen;
