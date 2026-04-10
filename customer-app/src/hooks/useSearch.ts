// Custom hook for search with debouncing and history
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDebounce } from './useDebounce';
import { itemService, supabase } from '../services';
import type { Item, SearchFilters, PaginatedResponse } from '../types';
import { SEARCH_CONFIG } from '../constants/config';

const SEARCH_HISTORY_KEY = 'search_history';

interface UseSearchOptions {
    autoSearch?: boolean;
    debounceDelay?: number;
}

interface UseSearchReturn {
    query: string;
    setQuery: (query: string) => void;
    results: Item[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
    total: number;
    searchHistory: string[];
    search: (filters?: SearchFilters) => Promise<void>;
    loadMore: () => Promise<void>;
    clearSearch: () => void;
    addToHistory: (query: string) => Promise<void>;
    removeFromHistory: (query: string) => Promise<void>;
    clearHistory: () => Promise<void>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
    const { autoSearch = true, debounceDelay = SEARCH_CONFIG.debounceDelay } = options;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    const debouncedQuery = useDebounce(query, debounceDelay);

    // Load search history on mount
    useEffect(() => {
        loadSearchHistory();

        const channel = supabase
            .channel(`search-items-${Date.now()}`)
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'items' },
                (payload) => {
                    setResults(prev => prev.filter(item => item.id !== payload.old.id));
                    setTotal(prev => Math.max(0, prev - 1));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Auto-search when debounced query changes
    useEffect(() => {
        if (autoSearch && debouncedQuery.length >= SEARCH_CONFIG.minSearchLength) {
            search();
        } else if (debouncedQuery.length < SEARCH_CONFIG.minSearchLength) {
            setResults([]);
            setTotal(0);
            setHasMore(false);
        }
    }, [debouncedQuery, autoSearch]);

    const loadSearchHistory = async () => {
        try {
            const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (history) {
                setSearchHistory(JSON.parse(history));
            }
        } catch (error) {
            console.error('Error loading search history:', error);
        }
    };

    const addToHistory = async (searchQuery: string) => {
        try {
            const trimmedQuery = searchQuery.trim();
            if (!trimmedQuery || trimmedQuery.length < SEARCH_CONFIG.minSearchLength) return;

            const updatedHistory = [
                trimmedQuery,
                ...searchHistory.filter(q => q !== trimmedQuery),
            ].slice(0, SEARCH_CONFIG.maxSearchHistory);

            setSearchHistory(updatedHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    };

    const removeFromHistory = async (searchQuery: string) => {
        try {
            const updatedHistory = searchHistory.filter(q => q !== searchQuery);
            setSearchHistory(updatedHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Error removing from search history:', error);
        }
    };

    const clearHistory = async () => {
        try {
            setSearchHistory([]);
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    };

    const search = useCallback(async (newFilters?: SearchFilters) => {
        const searchQuery = debouncedQuery.trim();
        if (searchQuery.length < SEARCH_CONFIG.minSearchLength) return;

        setIsLoading(true);
        setError(null);
        setPage(1);

        const appliedFilters = newFilters || filters;
        setFilters(appliedFilters);

        try {
            const { data, error: searchError } = await itemService.searchItems(
                searchQuery,
                appliedFilters,
                1
            );

            if (searchError) {
                setError(searchError);
                setResults([]);
                return;
            }

            if (data) {
                setResults(data.data);
                setTotal(data.total);
                setHasMore(data.has_more);

                // Add successful search to history
                await addToHistory(searchQuery);
            }
        } catch (err: any) {
            setError(err.message || 'Search failed');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedQuery, filters]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        const nextPage = page + 1;

        try {
            const { data, error: searchError } = await itemService.searchItems(
                debouncedQuery,
                filters,
                nextPage
            );

            if (searchError) {
                setError(searchError);
                return;
            }

            if (data) {
                setResults(prev => [...prev, ...data.data]);
                setPage(nextPage);
                setHasMore(data.has_more);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load more results');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, page, debouncedQuery, filters]);

    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setPage(1);
        setTotal(0);
        setHasMore(false);
        setError(null);
        setFilters({});
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        error,
        hasMore,
        page,
        total,
        searchHistory,
        search,
        loadMore,
        clearSearch,
        addToHistory,
        removeFromHistory,
        clearHistory,
    };
}

export default useSearch;
