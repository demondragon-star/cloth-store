// Help & Support Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    TextInput,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button } from '../components';
import { APP_CONFIG } from '../constants/config';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_DATA: FAQItem[] = [
    {
        question: 'How do I track my order?',
        answer: 'You can track your order by going to Profile > My Orders and selecting the order you want to track. You\'ll see real-time updates on your order status.',
    },
    {
        question: 'What is your return policy?',
        answer: 'We offer a 7-day easy return policy. If you\'re not satisfied with your purchase, you can initiate a return from the order details page within 7 days of delivery.',
    },
    {
        question: 'How do I change my delivery address?',
        answer: 'You can manage your addresses by going to Profile > Saved Addresses. You can add, edit, or delete addresses from there.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept Credit/Debit Cards, UPI, Net Banking, digital wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery.',
    },
    {
        question: 'How do I cancel my order?',
        answer: 'You can cancel your order from the order details page if it hasn\'t been shipped yet. Go to Profile > My Orders, select the order, and tap "Cancel Order".',
    },
    {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 5-7 business days. Express delivery (where available) takes 2-3 business days. Delivery times may vary based on your location.',
    },
    {
        question: 'Is my payment information secure?',
        answer: 'Yes! We use industry-standard SSL encryption and never store your complete card details. All payments are processed through secure payment gateways.',
    },
    {
        question: 'How do I apply a coupon code?',
        answer: 'You can apply coupon codes at checkout. Enter your code in the "Have a coupon?" field and tap "Apply". The discount will be reflected in your order total.',
    },
];

const FAQAccordion: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({
    item,
    isOpen,
    onToggle,
}) => (
    <View style={styles.faqItem}>
        <TouchableOpacity style={styles.faqHeader} onPress={onToggle} activeOpacity={0.7}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.gray[500]}
            />
        </TouchableOpacity>
        {isOpen && (
            <View style={styles.faqAnswerContainer}>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
        )}
    </View>
);

export const HelpScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleBack = () => {
        navigation.goBack();
    };

    const filteredFAQs = FAQ_DATA.filter(
        (item) =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCall = () => {
        Linking.openURL('tel:+911234567890');
    };

    const handleEmail = () => {
        Linking.openURL(`mailto:${APP_CONFIG.supportEmail}?subject=Support Request`);
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/911234567890');
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Empty Message',
                text2: 'Please enter your message.',
            });
            return;
        }

        setIsSending(true);

        // Simulate sending message
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsSending(false);
        setMessage('');

        Toast.show({
            type: 'success',
            text1: 'Message Sent!',
            text2: 'We\'ll get back to you within 24 hours.',
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>


                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <Card style={styles.faqSection}>
                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={COLORS.gray[400]} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search FAQ..."
                            placeholderTextColor={COLORS.gray[400]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* FAQ List */}
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((item, index) => (
                            <FAQAccordion
                                key={index}
                                item={item}
                                isOpen={openFAQ === index}
                                onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                            />
                        ))
                    ) : (
                        <View style={styles.noResults}>
                            <Ionicons name="help-circle-outline" size={48} color={COLORS.gray[300]} />
                            <Text style={styles.noResultsText}>No FAQs found</Text>
                            <Text style={styles.noResultsSubtext}>
                                Try different keywords or contact us directly
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Contact Form */}
                <Text style={styles.sectionTitle}>Send Us a Message</Text>
                <Card style={styles.contactSection}>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Describe your issue or question..."
                        placeholderTextColor={COLORS.gray[400]}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                    <Button
                        title="Send Message"
                        onPress={handleSendMessage}
                        loading={isSending}
                        icon={<Ionicons name="send" size={18} color={COLORS.white} />}
                        iconPosition="right"
                    />
                </Card>

                {/* Support Hours */}
                <Card style={styles.hoursCard}>
                    <View style={styles.hoursHeader}>
                        <Ionicons name="time-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.hoursTitle}>Support Hours</Text>
                    </View>
                    <View style={styles.hoursRow}>
                        <Text style={styles.hoursDay}>Monday - Friday</Text>
                        <Text style={styles.hoursTime}>9:00 AM - 8:00 PM</Text>
                    </View>
                    <View style={styles.hoursRow}>
                        <Text style={styles.hoursDay}>Saturday</Text>
                        <Text style={styles.hoursTime}>10:00 AM - 6:00 PM</Text>
                    </View>
                    <View style={styles.hoursRow}>
                        <Text style={styles.hoursDay}>Sunday</Text>
                        <Text style={styles.hoursTime}>Closed</Text>
                    </View>
                </Card>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appName}>{APP_CONFIG.name}</Text>
                    <Text style={styles.appVersion}>Version {APP_CONFIG.version}</Text>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
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
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.lg,
        marginBottom: SPACING.md,
    },
    quickAction: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    quickActionLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    faqSection: {
        marginHorizontal: SPACING.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray[50],
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    searchInput: {
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    faqQuestion: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginRight: SPACING.sm,
    },
    faqAnswerContainer: {
        paddingBottom: SPACING.md,
    },
    faqAnswer: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: FONT_SIZE.sm * 1.6,
    },
    noResults: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    noResultsText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginTop: SPACING.md,
    },
    noResultsSubtext: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    contactSection: {
        marginHorizontal: SPACING.md,
    },
    messageInput: {
        backgroundColor: COLORS.gray[50],
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        minHeight: 120,
        marginBottom: SPACING.md,
    },
    hoursCard: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.lg,
    },
    hoursHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    hoursTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    hoursDay: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    hoursTime: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.primary,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    appName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    appVersion: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    bottomPadding: {
        height: 30,
    },
});

export default HelpScreen;
