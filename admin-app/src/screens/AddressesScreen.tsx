// Addresses Management Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button, EmptyState, SkeletonListItem } from '../components';
import { useAuthStore } from '../store';
import { addressService } from '../services';
import { useRefresh } from '../hooks';
import type { RootStackParamList, Address } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AddressesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAddresses = useCallback(async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { data, error } = await addressService.getAddresses(user.id);
            if (data) {
                setAddresses(data);
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadAddresses();
    }, [loadAddresses]);

    const { refreshing, onRefresh } = useRefresh(loadAddresses);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleAddAddress = () => {
        navigation.navigate('AddAddress');
    };

    const handleEditAddress = (address: Address) => {
        navigation.navigate('EditAddress', { addressId: address.id });
    };

    const handleSetDefault = async (addressId: string) => {
        if (!user) return;

        try {
            const { error } = await addressService.setDefaultAddress(user.id, addressId);
            if (error) {
                throw new Error(error);
            }

            // Update local state
            setAddresses((prev) =>
                prev.map((addr) => ({
                    ...addr,
                    is_default: addr.id === addressId,
                }))
            );

            Toast.show({
                type: 'success',
                text1: 'Default Address Updated',
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to update default address.',
            });
        }
    };

    const handleDeleteAddress = (address: Address) => {
        Alert.alert(
            'Delete Address',
            `Are you sure you want to delete "${address.label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await addressService.deleteAddress(address.id);
                            if (error) {
                                throw new Error(error);
                            }

                            setAddresses((prev) => prev.filter((a) => a.id !== address.id));

                            Toast.show({
                                type: 'success',
                                text1: 'Address Deleted',
                            });
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: error.message || 'Failed to delete address.',
                            });
                        }
                    },
                },
            ]
        );
    };

    const renderAddress = ({ item }: { item: Address }) => (
        <Card style={styles.addressCard}>
            <View style={styles.addressHeader}>
                <View style={styles.labelContainer}>
                    <View style={styles.labelBadge}>
                        <Ionicons
                            name={item.type === 'home' ? 'home' : item.type === 'work' ? 'briefcase' : 'location'}
                            size={14}
                            color={COLORS.primary}
                        />
                        <Text style={styles.labelText}>{item.label}</Text>
                    </View>
                    {item.is_default && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteAddress(item)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>

            <Text style={styles.addressName}>{item.full_name}</Text>
            <Text style={styles.addressText}>{item.address_line1}</Text>
            {item.address_line2 && (
                <Text style={styles.addressText}>{item.address_line2}</Text>
            )}
            <Text style={styles.addressText}>
                {item.city}, {item.state} - {item.pincode || item.postal_code}
            </Text>
            <Text style={styles.addressPhone}>
                <Ionicons name="call-outline" size={14} color={COLORS.gray[500]} /> {item.phone}
            </Text>

            <View style={styles.addressActions}>
                <Button
                    title="Edit"
                    variant="outline"
                    size="small"
                    onPress={() => handleEditAddress(item)}
                    style={styles.actionButton}
                />
                {!item.is_default && (
                    <Button
                        title="Set as Default"
                        variant="ghost"
                        size="small"
                        onPress={() => handleSetDefault(item.id)}
                        style={styles.actionButton}
                    />
                )}
            </View>
        </Card>
    );

    const renderEmpty = () => (
        <EmptyState
            icon="location-outline"
            title="No Addresses"
            description="You haven't added any addresses yet. Add one to make checkout faster."
            actionLabel="Add Address"
            onAction={handleAddAddress}
        />
    );

    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
                <SkeletonListItem key={i} style={styles.skeletonItem} />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <TouchableOpacity onPress={handleAddAddress} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={addresses}
                renderItem={renderAddress}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
            />

            {addresses.length > 0 && (
                <View style={styles.footer}>
                    <Button
                        title="Add New Address"
                        onPress={handleAddAddress}
                        icon={<Ionicons name="add-circle-outline" size={20} color={COLORS.white} />}
                        size="large"
                    />
                </View>
            )}
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
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    addButton: {
        padding: SPACING.xs,
    },
    list: {
        padding: SPACING.md,
        paddingBottom: 100,
    },
    addressCard: {
        marginBottom: SPACING.md,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    labelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.primary}15`,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    labelText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
        textTransform: 'uppercase',
    },
    defaultBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    defaultBadgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    deleteButton: {
        padding: SPACING.xs,
    },
    addressName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    addressText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: FONT_SIZE.sm * 1.5,
    },
    addressPhone: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        marginTop: SPACING.sm,
    },
    addressActions: {
        flexDirection: 'row',
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        gap: SPACING.sm,
    },
    actionButton: {
        minWidth: 80,
    },
    loadingContainer: {
        padding: SPACING.md,
    },
    skeletonItem: {
        marginBottom: SPACING.md,
    },
    footer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.lg,
    },
});

export default AddressesScreen;
