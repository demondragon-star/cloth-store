// Cart Item component
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatPrice } from '../utils/format';
import type { CartItem as CartItemType } from '../types';

interface CartItemProps {
    item: CartItemType;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({
    item,
    onQuantityChange,
    onRemove,
}) => {
    const price = item.variant?.price || item.item.price;
    const imageUrl = item.item.images?.[0]?.image_url;

    return (
        <View style={[styles.container, SHADOWS.sm]}>
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color={COLORS.gray[400]} />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={2}>{item.item.name}</Text>
                    <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                </View>

                {item.variant && (
                    <Text style={styles.variant}>
                        {Object.values(item.variant.attributes).join(' / ')}
                    </Text>
                )}

                <View style={styles.footer}>
                    <Text style={styles.price}>{formatPrice(price * item.quantity)}</Text>

                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            onPress={() => onQuantityChange(item.quantity - 1)}
                            style={[
                                styles.quantityButton,
                                item.quantity <= 1 && styles.quantityButtonDisabled,
                            ]}
                            disabled={item.quantity <= 1}
                        >
                            <Ionicons
                                name="remove"
                                size={16}
                                color={item.quantity <= 1 ? COLORS.gray[300] : COLORS.text}
                            />
                        </TouchableOpacity>

                        <Text style={styles.quantity}>{item.quantity}</Text>

                        <TouchableOpacity
                            onPress={() => onQuantityChange(item.quantity + 1)}
                            style={styles.quantityButton}
                        >
                            <Ionicons name="add" size={16} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    name: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginRight: SPACING.sm,
    },
    removeButton: {
        padding: SPACING.xs,
    },
    variant: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    price: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray[50],
        borderRadius: BORDER_RADIUS.lg,
    },
    quantityButton: {
        padding: SPACING.sm,
    },
    quantityButtonDisabled: {
        opacity: 0.5,
    },
    quantity: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        minWidth: 28,
        textAlign: 'center',
    },
});

export default CartItem;
