// Add/Edit Address Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    TextInput,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Card } from '../components';
import { useAuthStore } from '../store';
import { addressService } from '../services';
import type { RootStackParamList, Address } from '../types';
import { useSectionEntrance } from '../hooks/useScrollAnimation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ADDRESS_TYPES = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'work', label: 'Work', icon: 'briefcase-outline' },
    { id: 'other', label: 'Other', icon: 'location-outline' },
];

export const AddAddressScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp<{ params?: { addressId?: string } }, 'params'>>();
    const { user } = useAuthStore();

    const isEditing = !!route.params?.addressId;

    const [type, setType] = useState<'home' | 'work' | 'other'>('home');
    const [label, setLabel] = useState('Home');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const { runEntrance, sectionStyle } = useSectionEntrance(3);

    useEffect(() => {
        if (!isFetching) runEntrance();
    }, [isFetching]);

    useEffect(() => {
        if (isEditing && route.params?.addressId) {
            loadAddress(route.params.addressId);
        }
    }, [isEditing, route.params?.addressId]);

    const loadAddress = async (addressId: string) => {
        try {
            const { data, error } = await addressService.getAddressById(addressId);
            if (data) {
                setType(data.type);
                setLabel(data.label);
                setFullName(data.full_name);
                setPhone(data.phone);
                setAddressLine1(data.address_line1);
                setAddressLine2(data.address_line2 || '');
                setCity(data.city);
                setState(data.state);
                setPincode(data.pincode || data.postal_code);
                setIsDefault(data.is_default);
            }
        } catch (error) {
            console.error('Error loading address:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load address.',
            });
        } finally {
            setIsFetching(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!fullName.trim()) newErrors.fullName = 'Name is required';
        if (!phone.trim()) newErrors.phone = 'Phone is required';
        if (!addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
        if (!city.trim()) newErrors.city = 'City is required';
        if (!state.trim()) newErrors.state = 'State is required';
        if (!pincode.trim()) newErrors.pincode = 'Pincode is required';
        else if (!/^\d{6}$/.test(pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        if (!user) return;

        setIsLoading(true);

        try {
            const addressData = {
                user_id: user.id,
                type,
                label,
                full_name: fullName.trim(),
                phone: phone.trim(),
                address_line1: addressLine1.trim(),
                address_line2: addressLine2.trim() || undefined,
                city: city.trim(),
                state: state.trim(),
                postal_code: pincode.trim(),
                pincode: pincode.trim(),
                country: 'India',
                is_default: isDefault,
            };

            if (isEditing && route.params?.addressId) {
                const { error } = await addressService.updateAddress(route.params.addressId, addressData);
                if (error) throw new Error(error);

                Toast.show({
                    type: 'success',
                    text1: 'Address Updated',
                    text2: 'Your address has been updated successfully.',
                });
            } else {
                const { error } = await addressService.addAddress(user.id, addressData as any);
                if (error) throw new Error(error);

                Toast.show({
                    type: 'success',
                    text1: 'Address Added',
                    text2: 'Your new address has been saved.',
                });
            }

            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to save address.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTypeSelect = (selectedType: 'home' | 'work' | 'other') => {
        setType(selectedType);
        setLabel(selectedType.charAt(0).toUpperCase() + selectedType.slice(1));
    };

    if (isFetching) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <Text>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Address' : 'Add New Address'}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Address Type */}
                <Animated.View style={sectionStyle(0)}>
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Address Type</Text>
                    <View style={styles.typeContainer}>
                        {ADDRESS_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.typeButton,
                                    type === item.id && styles.typeButtonSelected,
                                ]}
                                onPress={() => handleTypeSelect(item.id as any)}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={24}
                                    color={type === item.id ? COLORS.primary : COLORS.gray[500]}
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    type === item.id && styles.typeLabelSelected,
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Contact Details */}
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <TextInput
                            style={[styles.input, errors.fullName && styles.inputError]}
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                if (errors.fullName) setErrors({ ...errors, fullName: '' });
                            }}
                            placeholder="Enter full name"
                            placeholderTextColor={COLORS.gray[400]}
                        />
                        {errors.fullName && (
                            <Text style={styles.errorText}>{errors.fullName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number *</Text>
                        <TextInput
                            style={[styles.input, errors.phone && styles.inputError]}
                            value={phone}
                            onChangeText={(text) => {
                                setPhone(text);
                                if (errors.phone) setErrors({ ...errors, phone: '' });
                            }}
                            placeholder="Enter phone number"
                            placeholderTextColor={COLORS.gray[400]}
                            keyboardType="phone-pad"
                        />
                        {errors.phone && (
                            <Text style={styles.errorText}>{errors.phone}</Text>
                        )}
                    </View>
                </Card>
                </Animated.View>

                {/* Address Details */}
                <Animated.View style={sectionStyle(1)}>
                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Address Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Address Line 1 *</Text>
                        <TextInput
                            style={[styles.input, errors.addressLine1 && styles.inputError]}
                            value={addressLine1}
                            onChangeText={(text) => {
                                setAddressLine1(text);
                                if (errors.addressLine1) setErrors({ ...errors, addressLine1: '' });
                            }}
                            placeholder="House/Flat No, Building Name"
                            placeholderTextColor={COLORS.gray[400]}
                        />
                        {errors.addressLine1 && (
                            <Text style={styles.errorText}>{errors.addressLine1}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Address Line 2</Text>
                        <TextInput
                            style={styles.input}
                            value={addressLine2}
                            onChangeText={setAddressLine2}
                            placeholder="Street, Area, Landmark (Optional)"
                            placeholderTextColor={COLORS.gray[400]}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                            <Text style={styles.inputLabel}>City *</Text>
                            <TextInput
                                style={[styles.input, errors.city && styles.inputError]}
                                value={city}
                                onChangeText={(text) => {
                                    setCity(text);
                                    if (errors.city) setErrors({ ...errors, city: '' });
                                }}
                                placeholder="City"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                            {errors.city && (
                                <Text style={styles.errorText}>{errors.city}</Text>
                            )}
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>State *</Text>
                            <TextInput
                                style={[styles.input, errors.state && styles.inputError]}
                                value={state}
                                onChangeText={(text) => {
                                    setState(text);
                                    if (errors.state) setErrors({ ...errors, state: '' });
                                }}
                                placeholder="State"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                            {errors.state && (
                                <Text style={styles.errorText}>{errors.state}</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Pincode *</Text>
                        <TextInput
                            style={[styles.input, errors.pincode && styles.inputError]}
                            value={pincode}
                            onChangeText={(text) => {
                                setPincode(text);
                                if (errors.pincode) setErrors({ ...errors, pincode: '' });
                            }}
                            placeholder="6-digit pincode"
                            placeholderTextColor={COLORS.gray[400]}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        {errors.pincode && (
                            <Text style={styles.errorText}>{errors.pincode}</Text>
                        )}
                    </View>
                </Card>
                </Animated.View>

                {/* Default Address Toggle */}
                <Animated.View style={sectionStyle(2)}>
                <Card style={styles.section}>
                    <TouchableOpacity
                        style={styles.defaultToggle}
                        onPress={() => setIsDefault(!isDefault)}
                    >
                        <View style={styles.defaultInfo}>
                            <Ionicons
                                name="star-outline"
                                size={22}
                                color={COLORS.primary}
                            />
                            <View style={styles.defaultText}>
                                <Text style={styles.defaultTitle}>Set as Default</Text>
                                <Text style={styles.defaultSubtitle}>
                                    Use this address for all orders
                                </Text>
                            </View>
                        </View>
                        <View style={[
                            styles.checkbox,
                            isDefault && styles.checkboxChecked,
                        ]}>
                            {isDefault && (
                                <Ionicons name="checkmark" size={16} color={COLORS.white} />
                            )}
                        </View>
                    </TouchableOpacity>
                </Card>
                </Animated.View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <Button
                    title={isEditing ? 'Update Address' : 'Save Address'}
                    onPress={handleSave}
                    loading={isLoading}
                    size="large"
                    style={styles.saveButton}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    placeholder: {
        width: 32,
    },
    section: {
        margin: SPACING.md,
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
    },
    typeButtonSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    typeLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.gray[500],
        marginTop: SPACING.xs,
    },
    typeLabelSelected: {
        color: COLORS.primary,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    inputLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.gray[50],
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    inputRow: {
        flexDirection: 'row',
    },
    errorText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    defaultToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    defaultInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    defaultText: {
        marginLeft: SPACING.md,
    },
    defaultTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    defaultSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 2,
        borderColor: COLORS.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    bottomPadding: {
        height: 100,
    },
    footer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.lg,
    },
    saveButton: {
        width: '100%',
    },
});

export default AddAddressScreen;
