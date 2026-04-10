import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { couponService } from '../../services/coupon.service';
import { Coupon } from '../../types';

type RouteParams = {
    AdminCouponDetails: {
        couponId: string;
    };
};

type AdminCouponDetailsRouteProp = RouteProp<RouteParams, 'AdminCouponDetails'>;

export const AdminCouponDetailsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<AdminCouponDetailsRouteProp>();
    const { couponId } = route.params;
    const isNew = couponId === 'new';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState('');
    const [couponType, setCouponType] = useState<
        'first_order' | 'cart_value' | 'party' | 'general'
    >('general');
    const [minCartValue, setMinCartValue] = useState('0');
    const [maxDiscount, setMaxDiscount] = useState('');
    const [usageLimitPerUser, setUsageLimitPerUser] = useState('1');
    const [totalUsageLimit, setTotalUsageLimit] = useState('');
    const [validFrom, setValidFrom] = useState(new Date());
    const [validUntil, setValidUntil] = useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ); // 30 days from now
    const [isActive, setIsActive] = useState(true);

    // Date picker state
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showUntilPicker, setShowUntilPicker] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isNew) {
            loadCoupon();
        }
    }, [couponId]);

    const loadCoupon = async () => {
        try {
            setLoading(true);
            const { data, error } = await couponService.getCouponById(couponId);

            if (error) {
                Alert.alert('Error', error);
                navigation.goBack();
                return;
            }

            if (data) {
                setCode(data.code);
                setDescription(data.description || '');
                setDiscountType(data.discount_type);
                setDiscountValue(data.discount_value.toString());
                setCouponType(data.coupon_type || 'general');
                setMinCartValue(data.min_cart_value.toString());
                setMaxDiscount(data.max_discount?.toString() || '');
                setUsageLimitPerUser(data.usage_limit_per_user.toString());
                setTotalUsageLimit(data.total_usage_limit?.toString() || '');
                setValidFrom(new Date(data.valid_from));
                setValidUntil(new Date(data.valid_until));
                setIsActive(data.is_active);
            }
        } catch (error) {
            console.error('Failed to load coupon:', error);
            Alert.alert('Error', 'Failed to load coupon');
        } finally {
            setLoading(false);
        }
    };

    const generateCode = async () => {
        const generatedCode = await couponService.generateCouponCode();
        setCode(generatedCode);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!code || code.length < 6 || code.length > 12) {
            newErrors.code = 'Code must be 6-12 characters';
        }

        if (!/^[A-Z0-9]+$/.test(code)) {
            newErrors.code = 'Code must be alphanumeric (uppercase)';
        }

        const discountVal = parseFloat(discountValue);
        if (!discountValue || isNaN(discountVal) || discountVal <= 0) {
            newErrors.discountValue = 'Discount value must be greater than 0';
        }

        const minCart = parseFloat(minCartValue);
        if (isNaN(minCart) || minCart < 0) {
            newErrors.minCartValue = 'Min cart value must be 0 or greater';
        }

        if (maxDiscount) {
            const maxDisc = parseFloat(maxDiscount);
            if (isNaN(maxDisc) || maxDisc <= 0) {
                newErrors.maxDiscount = 'Max discount must be greater than 0';
            }
        }

        const usageLimit = parseInt(usageLimitPerUser);
        if (isNaN(usageLimit) || usageLimit <= 0) {
            newErrors.usageLimitPerUser = 'Usage limit per user must be greater than 0';
        }

        if (totalUsageLimit) {
            const totalLimit = parseInt(totalUsageLimit);
            if (isNaN(totalLimit) || totalLimit <= 0) {
                newErrors.totalUsageLimit = 'Total usage limit must be greater than 0';
            }
        }

        if (validUntil <= validFrom) {
            newErrors.validUntil = 'Valid until must be after valid from';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix the errors in the form');
            return;
        }

        try {
            setSaving(true);

            const couponData: Partial<Coupon> = {
                code: code.toUpperCase(),
                description: description || undefined,
                discount_type: discountType,
                discount_value: parseFloat(discountValue),
                coupon_type: couponType,
                min_cart_value: parseFloat(minCartValue),
                max_discount: maxDiscount ? parseFloat(maxDiscount) : undefined,
                usage_limit_per_user: parseInt(usageLimitPerUser),
                total_usage_limit: totalUsageLimit ? parseInt(totalUsageLimit) : undefined,
                valid_from: validFrom.toISOString(),
                valid_until: validUntil.toISOString(),
                is_active: isActive,
            };

            let result;
            if (isNew) {
                result = await couponService.createCoupon(couponData);
            } else {
                result = await couponService.updateCoupon(couponId, couponData);
            }

            if (result.error) {
                Alert.alert('Error', result.error);
            } else {
                Alert.alert('Success', `Coupon ${isNew ? 'created' : 'updated'} successfully`, [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            }
        } catch (error) {
            console.error('Failed to save coupon:', error);
            Alert.alert('Error', 'Failed to save coupon');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryLight} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.orbPurple} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{isNew ? 'Create Coupon' : 'Edit Coupon'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {/* Basic Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Coupon Code <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.codeInputRow}>
                                <TextInput
                                    style={[styles.input, styles.codeInput, errors.code && styles.inputError]}
                                    value={code}
                                    onChangeText={(text) => setCode(text.toUpperCase())}
                                    placeholder="SAVE50"
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                    maxLength={12}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity style={styles.generateButton} onPress={generateCode}>
                                    <Ionicons name="refresh" size={20} color={COLORS.white} />
                                    <Text style={styles.generateButtonText}>Generate</Text>
                                </TouchableOpacity>
                            </View>
                            {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Save ₹50 on your first order"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>

                    {/* Discount Configuration */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Discount Configuration</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Discount Type <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => setDiscountType('fixed')}
                                >
                                    <View style={styles.radio}>
                                        {discountType === 'fixed' && <View style={styles.radioSelected} />}
                                    </View>
                                    <Text style={styles.radioLabel}>Fixed Amount (₹)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.radioOption}
                                    onPress={() => setDiscountType('percentage')}
                                >
                                    <View style={styles.radio}>
                                        {discountType === 'percentage' && <View style={styles.radioSelected} />}
                                    </View>
                                    <Text style={styles.radioLabel}>Percentage (%)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Discount Value <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, errors.discountValue && styles.inputError]}
                                value={discountValue}
                                onChangeText={setDiscountValue}
                                placeholder={discountType === 'fixed' ? '50' : '10'}
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                keyboardType="numeric"
                            />
                            {errors.discountValue && (
                                <Text style={styles.errorText}>{errors.discountValue}</Text>
                            )}
                        </View>

                        {discountType === 'percentage' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Maximum Discount (₹)</Text>
                                <TextInput
                                    style={[styles.input, errors.maxDiscount && styles.inputError]}
                                    value={maxDiscount}
                                    onChangeText={setMaxDiscount}
                                    placeholder="500"
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                    keyboardType="numeric"
                                />
                                {errors.maxDiscount && (
                                    <Text style={styles.errorText}>{errors.maxDiscount}</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Coupon Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Coupon Type <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.typeGrid}>
                            {[
                                { value: 'first_order', label: 'First Order', icon: '🎉' },
                                { value: 'cart_value', label: 'Cart Value', icon: '🛒' },
                                { value: 'party', label: 'Party/Event', icon: '🎊' },
                                { value: 'general', label: 'General', icon: '🎁' },
                            ].map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeCard,
                                        couponType === type.value && styles.typeCardSelected,
                                    ]}
                                    onPress={() =>
                                        setCouponType(
                                            type.value as 'first_order' | 'cart_value' | 'party' | 'general'
                                        )
                                    }
                                >
                                    <Text style={styles.typeIcon}>{type.icon}</Text>
                                    <Text
                                        style={[
                                            styles.typeLabel,
                                            couponType === type.value && styles.typeLabelSelected,
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Requirements */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Requirements</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Minimum Cart Value (₹)</Text>
                            <TextInput
                                style={[styles.input, errors.minCartValue && styles.inputError]}
                                value={minCartValue}
                                onChangeText={setMinCartValue}
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                keyboardType="numeric"
                            />
                            {errors.minCartValue && (
                                <Text style={styles.errorText}>{errors.minCartValue}</Text>
                            )}
                        </View>
                    </View>

                    {/* Usage Limits */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Usage Limits</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Usage Limit Per User <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, errors.usageLimitPerUser && styles.inputError]}
                                value={usageLimitPerUser}
                                onChangeText={setUsageLimitPerUser}
                                placeholder="1"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                keyboardType="numeric"
                            />
                            {errors.usageLimitPerUser && (
                                <Text style={styles.errorText}>{errors.usageLimitPerUser}</Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Total Usage Limit (Optional)</Text>
                            <TextInput
                                style={[styles.input, errors.totalUsageLimit && styles.inputError]}
                                value={totalUsageLimit}
                                onChangeText={setTotalUsageLimit}
                                placeholder="100"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                keyboardType="numeric"
                            />
                            {errors.totalUsageLimit && (
                                <Text style={styles.errorText}>{errors.totalUsageLimit}</Text>
                            )}
                        </View>
                    </View>

                    {/* Validity Period */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Validity Period <Text style={styles.required}>*</Text>
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Valid From</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowFromPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.dateText}>
                                    {validFrom.toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>
                            {showFromPicker && (
                                <DateTimePicker
                                    value={validFrom}
                                    mode="date"
                                    display="default"
                                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                        setShowFromPicker(false);
                                        if (selectedDate) {
                                            setValidFrom(selectedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Valid Until</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, errors.validUntil && styles.inputError]}
                                onPress={() => setShowUntilPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.dateText}>
                                    {validUntil.toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>
                            {errors.validUntil && (
                                <Text style={styles.errorText}>{errors.validUntil}</Text>
                            )}
                            {showUntilPicker && (
                                <DateTimePicker
                                    value={validUntil}
                                    mode="date"
                                    display="default"
                                    minimumDate={validFrom}
                                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                        setShowUntilPicker(false);
                                        if (selectedDate) {
                                            setValidUntil(selectedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    </View>

                    {/* Status */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Status</Text>
                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Active</Text>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#34D39980' }}
                                thumbColor={isActive ? '#34D399' : 'rgba(255,255,255,0.4)'}
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        disabled={saving}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButtonGradient}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {isNew ? 'Create Coupon' : 'Save Changes'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK.background,
    },
    orbPurple: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        top: -40,
        right: -60,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: DARK.card.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.md,
        paddingBottom: 120,
    },
    section: {
        backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xxl,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: DARK.card.borderColor,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: SPACING.xs,
    },
    required: {
        color: '#F87171',
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    inputError: {
        borderColor: '#F87171',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    codeInputRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    codeInput: {
        flex: 1,
    },
    generateButton: {
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.xs,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.4)',
    },
    generateButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        color: '#F87171',
        marginTop: SPACING.xs,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#8B5CF6',
    },
    radioLabel: {
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    typeCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    typeCardSelected: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: '#6366F1',
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: SPACING.xs,
    },
    typeLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    typeLabelSelected: {
        color: '#A78BFA',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dateText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        gap: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    cancelButton: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cancelButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    saveButton: {
        flex: 1,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
});
