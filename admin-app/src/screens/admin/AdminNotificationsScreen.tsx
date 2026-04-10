import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS, DARK } from '../../constants/theme';
import { supabase } from '../../services/supabase';

type NotificationType = 'all' | 'promotional' | 'order_update' | 'new_product' | 'custom';

interface NotificationTemplate {
    type: NotificationType;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    description: string;
}

export const AdminNotificationsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [selectedType, setSelectedType] = useState<NotificationType>('all');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [sending, setSending] = useState(false);

    const notificationTemplates: NotificationTemplate[] = [
        {
            type: 'all',
            title: 'All Users',
            icon: 'people',
            color: '#8B5CF6',
            description: 'Send to all registered users',
        },
        {
            type: 'promotional',
            title: 'Promotional',
            icon: 'pricetag',
            color: '#F59E0B',
            description: 'Discounts, offers, and deals',
        },
        {
            type: 'order_update',
            title: 'Order Updates',
            icon: 'cube',
            color: '#3B82F6',
            description: 'Order status and delivery updates',
        },
        {
            type: 'new_product',
            title: 'New Products',
            icon: 'sparkles',
            color: '#10B981',
            description: 'New arrivals and collections',
        },
        {
            type: 'custom',
            title: 'Custom',
            icon: 'create',
            color: '#EF4444',
            description: 'Custom notification message',
        },
    ];

    const handleSendNotification = async () => {
        if (!notificationTitle.trim() || !notificationMessage.trim()) {
            Alert.alert('Error', 'Please enter both title and message');
            return;
        }

        Alert.alert(
            'Confirm Send',
            `Send notification to ${selectedType === 'all' ? 'all users' : selectedType + ' category'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async () => {
                        try {
                            setSending(true);

                            // Get users based on selected type
                            let userQuery = supabase.from('profiles').select('id, email, full_name');

                            // For demo, we'll send to all users
                            // In production, you'd filter based on notification type
                            const { data: users, error: usersError } = await userQuery;

                            if (usersError) {
                                throw usersError;
                            }

                            if (!users || users.length === 0) {
                                Alert.alert('Info', 'No users found to send notification');
                                return;
                            }

                            // Create notification records for each user
                            const notifications = users.map(user => ({
                                user_id: user.id,
                                title: notificationTitle,
                                message: notificationMessage,
                                type: selectedType,
                                is_read: false,
                                created_at: new Date().toISOString(),
                            }));

                            const { error: insertError } = await supabase
                                .from('notifications')
                                .insert(notifications);

                            if (insertError) {
                                throw insertError;
                            }

                            Alert.alert(
                                'Success',
                                `Notification sent to ${users.length} user(s)!`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            setNotificationTitle('');
                                            setNotificationMessage('');
                                            navigation.goBack();
                                        },
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error('Error sending notification:', error);
                            Alert.alert('Error', error.message || 'Failed to send notification');
                        } finally {
                            setSending(false);
                        }
                    },
                },
            ]
        );
    };

    const loadTemplate = (type: NotificationType) => {
        setSelectedType(type);
        
        // Load predefined templates
        switch (type) {
            case 'promotional':
                setNotificationTitle('Special Offer! 🎉');
                setNotificationMessage('Get 20% off on all products. Limited time offer!');
                break;
            case 'order_update':
                setNotificationTitle('Order Update');
                setNotificationMessage('Your order has been shipped and will arrive soon!');
                break;
            case 'new_product':
                setNotificationTitle('New Arrivals! ✨');
                setNotificationMessage('Check out our latest collection of products!');
                break;
            case 'all':
            case 'custom':
                setNotificationTitle('');
                setNotificationMessage('');
                break;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: DARK.background }}>
        <LinearGradient colors={DARK.gradient as any} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Notification Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Notification Type</Text>
                    <View style={styles.typesGrid}>
                        {notificationTemplates.map((template) => (
                            <TouchableOpacity
                                key={template.type}
                                style={[
                                    styles.typeCard,
                                    selectedType === template.type && styles.typeCardSelected,
                                    { borderLeftColor: template.color, borderLeftWidth: 4 },
                                ]}
                                onPress={() => loadTemplate(template.type)}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: template.color + '20' }]}>
                                    <Ionicons name={template.icon} size={24} color={template.color} />
                                </View>
                                <View style={styles.typeInfo}>
                                    <Text style={styles.typeTitle}>{template.title}</Text>
                                    <Text style={styles.typeDescription}>{template.description}</Text>
                                </View>
                                {selectedType === template.type && (
                                    <Ionicons name="checkmark-circle" size={24} color={template.color} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Notification Content */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notification Content</Text>
                    
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={notificationTitle}
                        onChangeText={setNotificationTitle}
                        placeholder="Enter notification title"
                        placeholderTextColor={COLORS.gray[400]}
                        maxLength={100}
                    />

                    <Text style={styles.label}>Message *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notificationMessage}
                        onChangeText={setNotificationMessage}
                        placeholder="Enter notification message"
                        placeholderTextColor={COLORS.gray[400]}
                        multiline
                        numberOfLines={6}
                        maxLength={500}
                    />

                    <Text style={styles.charCount}>
                        {notificationMessage.length}/500 characters
                    </Text>
                </View>

                {/* Preview */}
                {notificationTitle && notificationMessage && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Preview</Text>
                        <View style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                <Ionicons name="notifications" size={20} color={COLORS.primary} />
                                <Text style={styles.previewTitle}>{notificationTitle}</Text>
                            </View>
                            <Text style={styles.previewMessage}>{notificationMessage}</Text>
                            <Text style={styles.previewTime}>Just now</Text>
                        </View>
                    </View>
                )}

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={handleSendNotification}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name="send" size={20} color={COLORS.white} />
                            <Text style={styles.sendButtonText}>Send Notification</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
        </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: DARK.card.borderColor,
    },
    backButton: {
        padding: SPACING.xs,
        backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.md,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    content: {
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    typesGrid: {
        gap: SPACING.md,
    },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: DARK.card.borderWidth,
        borderColor: DARK.card.borderColor,
    },
    typeCardSelected: {
        backgroundColor: 'rgba(139,92,246,0.15)',
        borderWidth: 1,
        borderColor: DARK.accentPurple,
    },
    typeIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    typeInfo: {
        flex: 1,
    },
    typeTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
        marginBottom: 2,
    },
    typeDescription: {
        fontSize: FONT_SIZE.sm,
        color: DARK.textMuted,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
        marginBottom: SPACING.xs,
        marginTop: SPACING.md,
    },
    input: {
        backgroundColor: DARK.input.backgroundColor,
        borderWidth: 1,
        borderColor: DARK.input.borderColor,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.white,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: FONT_SIZE.xs,
        color: DARK.textMuted,
        textAlign: 'right',
        marginTop: SPACING.xs,
    },
    previewCard: {
        backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: DARK.accentPurple,
        borderWidth: DARK.card.borderWidth,
        borderColor: DARK.card.borderColor,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    previewTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
        marginLeft: SPACING.sm,
    },
    previewMessage: {
        fontSize: FONT_SIZE.sm,
        color: DARK.textMuted,
        lineHeight: 20,
        marginBottom: SPACING.sm,
    },
    previewTime: {
        fontSize: FONT_SIZE.xs,
        color: DARK.textDim,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: DARK.accentPurple,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        gap: SPACING.sm,
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    sendButtonText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
});
