// Payment Screen - Demo Implementation
// Note: This uses simulated payment processing for demonstration purposes
// In production, integrate with actual payment gateways (Razorpay, Stripe, etc.)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Card } from '../components';
import { paymentService } from '../services';
import { formatPrice } from '../utils/format';
import type { RootStackParamList, PaymentMethod } from '../types';
import { useSectionEntrance } from '../hooks/useScrollAnimation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PaymentScreenParams {
    orderId: string;
    amount: number;
    orderNumber: string;
}

export const PaymentScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProp<{ params: PaymentScreenParams }, 'params'>>();
    const { orderId, amount, orderNumber } = route.params || {
        orderId: '',
        amount: 0,
        orderNumber: '',
    };

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
    const [isProcessing, setIsProcessing] = useState(false);

    // Card details state
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');

    // UPI state
    const [upiId, setUpiId] = useState('');

    // Net Banking state
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    // Wallet state
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const { runEntrance, sectionStyle } = useSectionEntrance(2);

    useEffect(() => { runEntrance(); }, []);

    const paymentMethods = paymentService.getAvailablePaymentMethods();
    const banks = paymentService.getSupportedBanks();
    const wallets = paymentService.getSupportedWallets();

    const handleBack = () => {
        navigation.goBack();
    };

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.substring(0, 19); // 16 digits + 3 spaces
    };

    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
        }
        return cleaned;
    };

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            let result;

            switch (selectedMethod) {
                case 'card':
                    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
                        throw new Error('Please fill all card details');
                    }
                    result = await paymentService.processCardPayment(
                        {
                            number: cardNumber.replace(/\s/g, ''),
                            expiry: cardExpiry,
                            cvv: cardCvv,
                            name: cardName,
                        },
                        {
                            orderId,
                            amount,
                            customerName: cardName,
                            customerEmail: 'customer@example.com',
                        }
                    );
                    break;

                case 'upi':
                    if (!upiId) {
                        throw new Error('Please enter UPI ID');
                    }
                    result = await paymentService.processUPIPayment(upiId, {
                        orderId,
                        amount,
                        customerName: 'Customer',
                        customerEmail: 'customer@example.com',
                    });
                    break;

                case 'netbanking':
                    if (!selectedBank) {
                        throw new Error('Please select a bank');
                    }
                    result = await paymentService.processNetBankingPayment(selectedBank, {
                        orderId,
                        amount,
                        customerName: 'Customer',
                        customerEmail: 'customer@example.com',
                    });
                    break;

                case 'wallet':
                    if (!selectedWallet) {
                        throw new Error('Please select a wallet');
                    }
                    result = await paymentService.processWalletPayment(
                        selectedWallet as any,
                        {
                            orderId,
                            amount,
                            customerName: 'Customer',
                            customerEmail: 'customer@example.com',
                        }
                    );
                    break;

                case 'cod':
                default:
                    // COD doesn't need payment processing
                    result = { success: true, transactionId: `COD${Date.now()}` };
                    break;
            }

            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Payment Successful!',
                    text2: `Transaction ID: ${result.transactionId}`,
                });

                // Navigate to order confirmation
                navigation.reset({
                    index: 1,
                    routes: [
                        { name: 'Main' },
                        { name: 'OrderDetail', params: { orderId } },
                    ],
                });
            } else {
                throw new Error(result.error || 'Payment failed');
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Payment Failed',
                text2: error.message || 'Please try again',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const renderPaymentMethods = () => (
        <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            {paymentMethods.map((method) => (
                <TouchableOpacity
                    key={method.id}
                    style={[
                        styles.paymentMethod,
                        selectedMethod === method.id && styles.paymentMethodSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.id as PaymentMethod)}
                    disabled={!method.enabled}
                >
                    <View style={[
                        styles.methodIcon,
                        selectedMethod === method.id && styles.methodIconSelected,
                    ]}>
                        <Ionicons
                            name={method.icon as any}
                            size={24}
                            color={selectedMethod === method.id ? COLORS.white : COLORS.primary}
                        />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={[
                            styles.methodName,
                            selectedMethod === method.id && styles.methodNameSelected,
                        ]}>
                            {method.name}
                        </Text>
                        <Text style={styles.methodDescription}>{method.description}</Text>
                    </View>
                    <View style={[
                        styles.radioOuter,
                        selectedMethod === method.id && styles.radioOuterSelected,
                    ]}>
                        {selectedMethod === method.id && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>
            ))}
        </Card>
    );

    const renderCardForm = () => {
        if (selectedMethod !== 'card') return null;

        return (
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Card Details</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1234 5678 9012 3456"
                        placeholderTextColor={COLORS.gray[400]}
                        value={cardNumber}
                        onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                        keyboardType="numeric"
                        maxLength={19}
                    />
                </View>
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                        <Text style={styles.inputLabel}>Expiry</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="MM/YY"
                            placeholderTextColor={COLORS.gray[400]}
                            value={cardExpiry}
                            onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                            keyboardType="numeric"
                            maxLength={5}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>CVV</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123"
                            placeholderTextColor={COLORS.gray[400]}
                            value={cardCvv}
                            onChangeText={setCardCvv}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />
                    </View>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name on Card</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="JOHN DOE"
                        placeholderTextColor={COLORS.gray[400]}
                        value={cardName}
                        onChangeText={(text) => setCardName(text.toUpperCase())}
                        autoCapitalize="characters"
                    />
                </View>
            </Card>
        );
    };

    const renderUPIForm = () => {
        if (selectedMethod !== 'upi') return null;

        return (
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>UPI Payment</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>UPI ID</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="yourname@upi"
                        placeholderTextColor={COLORS.gray[400]}
                        value={upiId}
                        onChangeText={setUpiId}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
                <View style={styles.upiApps}>
                    <Text style={styles.upiAppsLabel}>Or pay using</Text>
                    <View style={styles.upiAppsRow}>
                        {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                            <TouchableOpacity key={app} style={styles.upiApp}>
                                <View style={styles.upiAppIcon}>
                                    <Ionicons name="phone-portrait" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.upiAppName}>{app}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Card>
        );
    };

    const renderNetBankingForm = () => {
        if (selectedMethod !== 'netbanking') return null;

        return (
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Select Bank</Text>
                <View style={styles.bankList}>
                    {banks.map((bank) => (
                        <TouchableOpacity
                            key={bank.code}
                            style={[
                                styles.bankItem,
                                selectedBank === bank.code && styles.bankItemSelected,
                            ]}
                            onPress={() => setSelectedBank(bank.code)}
                        >
                            <View style={styles.bankIcon}>
                                <Ionicons name="business" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={[
                                styles.bankName,
                                selectedBank === bank.code && styles.bankNameSelected,
                            ]}>
                                {bank.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>
        );
    };

    const renderWalletForm = () => {
        if (selectedMethod !== 'wallet') return null;

        return (
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Select Wallet</Text>
                <View style={styles.walletList}>
                    {wallets.map((wallet) => (
                        <TouchableOpacity
                            key={wallet.id}
                            style={[
                                styles.walletItem,
                                selectedWallet === wallet.id && styles.walletItemSelected,
                            ]}
                            onPress={() => setSelectedWallet(wallet.id)}
                        >
                            <View style={styles.walletIcon}>
                                <Ionicons name="wallet" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={[
                                styles.walletName,
                                selectedWallet === wallet.id && styles.walletNameSelected,
                            ]}>
                                {wallet.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Order Summary */}
                <Animated.View style={sectionStyle(0)}>
                <Card style={styles.orderSummary}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderLabel}>Order #{orderNumber || 'N/A'}</Text>
                        <Text style={styles.orderAmount}>{formatPrice(amount)}</Text>
                    </View>
                    <View style={styles.secureNote}>
                        <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                        <Text style={styles.secureText}>100% Secure Payment</Text>
                    </View>
                </Card>
                </Animated.View>

                <Animated.View style={sectionStyle(1)}>
                {renderPaymentMethods()}
                {renderCardForm()}
                {renderUPIForm()}
                {renderNetBankingForm()}
                {renderWalletForm()}

                {/* Mock Payment Notice */}
                <View style={styles.mockNotice}>
                    <Ionicons name="information-circle" size={20} color={COLORS.info} />
                    <Text style={styles.mockNoticeText}>
                        This is a demo app. No actual payment will be processed.
                    </Text>
                </View>
                </Animated.View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerLabel}>Total</Text>
                    <Text style={styles.footerAmount}>{formatPrice(amount)}</Text>
                </View>
                <Button
                    title={isProcessing ? 'Processing...' : `Pay ${formatPrice(amount)}`}
                    onPress={handlePayment}
                    loading={isProcessing}
                    disabled={isProcessing}
                    size="large"
                    style={styles.payButton}
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
    orderSummary: {
        margin: SPACING.md,
    },
    orderInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    orderLabel: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    orderAmount: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.primary,
    },
    secureNote: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    secureText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        marginLeft: SPACING.xs,
    },
    section: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    paymentMethodSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    methodIconSelected: {
        backgroundColor: COLORS.primary,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    methodNameSelected: {
        color: COLORS.primary,
    },
    methodDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
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
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    inputRow: {
        flexDirection: 'row',
    },
    upiApps: {
        marginTop: SPACING.md,
    },
    upiAppsLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    upiAppsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    upiApp: {
        alignItems: 'center',
    },
    upiAppIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    upiAppName: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text,
    },
    bankList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    bankItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
    },
    bankItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    bankIcon: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    bankName: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        flex: 1,
    },
    bankNameSelected: {
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
    },
    walletList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    walletItem: {
        width: '48%',
        alignItems: 'center',
        padding: SPACING.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
    },
    walletItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}08`,
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    walletName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    walletNameSelected: {
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
    },
    mockNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.info}15`,
        marginHorizontal: SPACING.md,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
    },
    mockNoticeText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.info,
        marginLeft: SPACING.sm,
    },
    bottomPadding: {
        height: 120,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.lg,
    },
    footerInfo: {
        marginRight: SPACING.md,
    },
    footerLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    footerAmount: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    payButton: {
        flex: 1,
    },
});

export default PaymentScreen;
