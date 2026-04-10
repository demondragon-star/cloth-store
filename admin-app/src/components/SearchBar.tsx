// Search Bar component with suggestions
import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Animated,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    suggestions?: string[];
    onSuggestionPress?: (suggestion: string) => void;
    onClearHistory?: () => void;
    showHistory?: boolean;
    searchHistory?: string[];
    onRemoveFromHistory?: (query: string) => void;
    autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    onSubmit,
    onFocus,
    onBlur,
    placeholder = 'Search products...',
    suggestions = [],
    onSuggestionPress,
    onClearHistory,
    showHistory = false,
    searchHistory = [],
    onRemoveFromHistory,
    autoFocus = false,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const animatedValue = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus?.();
    };

    const handleBlur = () => {
        // Delay blur to allow suggestion clicks
        setTimeout(() => {
            setIsFocused(false);
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
            onBlur?.();
        }, 200);
    };

    const handleClear = () => {
        onChangeText('');
        inputRef.current?.focus();
    };

    const handleSubmit = () => {
        Keyboard.dismiss();
        onSubmit?.();
    };

    const showSuggestions = isFocused && (suggestions.length > 0 || (showHistory && searchHistory.length > 0));

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                <Ionicons
                    name="search-outline"
                    size={20}
                    color={isFocused ? COLORS.primary : COLORS.gray[400]}
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={handleSubmit}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.gray[400]}
                    style={styles.input}
                    returnKeyType="search"
                    autoFocus={autoFocus}
                    autoCorrect={false}
                    autoCapitalize="none"
                    editable={true}
                    selectTextOnFocus={true}
                />
                {value.length > 0 && (
                    <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                )}
            </View>

            {showSuggestions && (
                <View style={[styles.suggestionsContainer, SHADOWS.lg]}>
                    {/* Search History */}
                    {showHistory && searchHistory.length > 0 && value.length === 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Searches</Text>
                                <TouchableOpacity onPress={onClearHistory}>
                                    <Text style={styles.clearText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                            {searchHistory.map((query, index) => (
                                <TouchableOpacity
                                    key={`history-${index}`}
                                    style={styles.suggestionItem}
                                    onPress={() => {
                                        onChangeText(query);
                                        onSuggestionPress?.(query);
                                    }}
                                >
                                    <Ionicons name="time-outline" size={18} color={COLORS.gray[400]} />
                                    <Text style={styles.suggestionText}>{query}</Text>
                                    <TouchableOpacity
                                        onPress={() => onRemoveFromHistory?.(query)}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons name="close" size={18} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    {/* Auto Suggestions */}
                    {suggestions.length > 0 && (
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) => `suggestion-${index}`}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.suggestionItem}
                                    onPress={() => onSuggestionPress?.(item)}
                                >
                                    <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
                                    <Text style={styles.suggestionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray[50],
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        height: 48,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary,
        ...SHADOWS.sm,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.xs,
        maxHeight: 300,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
    },
    clearText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.medium,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    suggestionText: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    removeButton: {
        padding: SPACING.xs,
    },
});

export default SearchBar;
