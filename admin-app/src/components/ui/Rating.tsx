// Premium Rating display and input component
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants/theme';

interface RatingProps {
    value: number;
    maxValue?: number;
    size?: number;
    showValue?: boolean;
    showCount?: boolean;
    count?: number;
    editable?: boolean;
    onChange?: (value: number) => void;
    style?: ViewStyle;
}

export const Rating: React.FC<RatingProps> = ({
    value,
    maxValue = 5,
    size = 18,
    showValue = false,
    showCount = false,
    count = 0,
    editable = false,
    onChange,
    style,
}) => {
    const handlePress = (rating: number) => {
        if (editable && onChange) {
            onChange(rating);
        }
    };

    const renderStar = (index: number) => {
        const filled = index < Math.floor(value);
        const halfFilled = index === Math.floor(value) && value % 1 >= 0.5;

        const iconName = filled ? 'star' : halfFilled ? 'star-half' : 'star-outline';
        const color = filled || halfFilled ? '#F59E0B' : COLORS.gray[200];

        const StarComponent = editable ? TouchableOpacity : View;

        return (
            <StarComponent
                key={index}
                onPress={() => handlePress(index + 1)}
                style={styles.star}
            >
                <Ionicons name={iconName} size={size} color={color} />
            </StarComponent>
        );
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.starsContainer}>
                {Array.from({ length: maxValue }).map((_, index) => renderStar(index))}
            </View>
            {showValue && (
                <Text style={styles.value}>{value.toFixed(1)}</Text>
            )}
            {showCount && count > 0 && (
                <Text style={styles.count}>({count.toLocaleString()})</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
    },
    star: {
        marginRight: 3,
    },
    value: {
        marginLeft: SPACING.xs + 2,
        fontSize: FONT_SIZE.sm + 1,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    count: {
        marginLeft: SPACING.xs,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textTertiary,
        fontWeight: FONT_WEIGHT.medium,
    },
});
