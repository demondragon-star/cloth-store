import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store';
import { supportService, SupportMessage, SupportChat } from '../../services/support.service';
import { AdminOrdersStackParamList } from '../../navigation/AdminNavigator';

type AdminChatRouteProp = RouteProp<AdminOrdersStackParamList, 'AdminChat'>;

export const AdminChatScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<AdminChatRouteProp>();
    const { chatId, userName } = route.params;
    const { user } = useAuthStore();

    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [chatInfo, setChatInfo] = useState<SupportChat | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChat();

        const subscription = supportService.subscribeToMessages(chatId, (newMsg) => {
            setMessages(prev => [...prev, newMsg]);
            // Mark customer messages as read when admin views them
            if (newMsg.sender_role === 'customer') {
                supportService.markMessagesRead(chatId, 'admin');
            }
        });

        return () => { subscription.unsubscribe(); };
    }, [chatId]);

    const loadChat = async () => {
        try {
            setLoading(true);
            const { data, error } = await supportService.getMessages(chatId);
            if (error) throw new Error(error);
            if (data) setMessages(data);
            // Mark customer messages read
            await supportService.markMessagesRead(chatId, 'admin');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;
        try {
            setSending(true);
            const { error } = await supportService.sendMessage(chatId, user.id, inputText, 'admin');
            if (error) throw new Error(error);
            setInputText('');
        } catch (error) {
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleCloseChat = () => {
        Alert.alert('Close Chat', 'Mark this conversation as resolved?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Close', style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await supportService.closeChat(chatId);
                        if (error) throw new Error(error);
                        navigation.goBack();
                    } catch (error: any) {
                        Alert.alert('Error', error.message || 'Failed to resolve chat');
                    }
                }
            }
        ]);
    };

    const renderMessage = ({ item }: { item: SupportMessage }) => {
        const isAdmin = item.sender_role === 'admin';
        return (
            <View style={[styles.messageRow, isAdmin && styles.messageRowAdmin]}>
                {!isAdmin && (
                    <View style={styles.userAvatar}>
                        <Ionicons name="person" size={14} color={DARK.textMuted} />
                    </View>
                )}
                <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
                    <Text style={[styles.messageText, isAdmin ? styles.messageTextAdmin : styles.messageTextUser]}>
                        {item.message}
                    </Text>
                    <Text style={[styles.timeText, isAdmin && styles.timeTextAdmin]}>
                        {format(new Date(item.created_at), 'p')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: DARK.background }}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{userName || 'Customer'}</Text>
                        <Text style={styles.headerSubtitle}>Support Conversation</Text>
                    </View>
                    <TouchableOpacity onPress={handleCloseChat} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Resolve</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryLight} />
                    </View>
                ) : (
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={styles.messageList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No messages yet. The customer will see your reply instantly.</Text>
                            }
                        />
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type a reply..."
                                placeholderTextColor={DARK.textMuted}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                                onPress={handleSend}
                                disabled={!inputText.trim() || sending}
                            >
                                {sending
                                    ? <ActivityIndicator size="small" color={COLORS.white} />
                                    : <Ionicons name="send" size={18} color={COLORS.white} />
                                }
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderBottomWidth: 1, borderBottomColor: DARK.card.borderColor,
    },
    backButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: DARK.card.backgroundColor,
        alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
    },
    headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    headerSubtitle: { fontSize: FONT_SIZE.xs, color: DARK.textMuted },
    closeButton: {
        backgroundColor: `${COLORS.error}20`,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.lg,
    },
    closeButtonText: { color: COLORS.error, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { padding: SPACING.md, paddingBottom: SPACING.xxl || 40 },
    messageRow: {
        flexDirection: 'row', alignItems: 'flex-end',
        marginBottom: SPACING.sm, maxWidth: '80%',
    },
    messageRowAdmin: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    userAvatar: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: DARK.card.backgroundColor,
        alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
    },
    bubble: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: 18,
    },
    bubbleUser: {
        backgroundColor: DARK.card.backgroundColor,
        borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    bubbleAdmin: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    messageText: { fontSize: FONT_SIZE.md, lineHeight: 20 },
    messageTextUser: { color: COLORS.white },
    messageTextAdmin: { color: COLORS.white },
    timeText: { fontSize: 10, color: DARK.textMuted, marginTop: 4, textAlign: 'right' },
    timeTextAdmin: { color: 'rgba(255,255,255,0.6)' },
    emptyText: {
        textAlign: 'center', color: DARK.textMuted,
        fontSize: FONT_SIZE.sm, marginTop: 60, paddingHorizontal: SPACING.xl,
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: SPACING.sm, backgroundColor: DARK.card.backgroundColor,
        borderTopWidth: 1, borderTopColor: DARK.card.borderColor,
    },
    input: {
        flex: 1, minHeight: 44, maxHeight: 120,
        backgroundColor: DARK.background,
        borderRadius: 22, paddingHorizontal: SPACING.md,
        paddingTop: 12, paddingBottom: 12,
        fontSize: FONT_SIZE.md, color: COLORS.white,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    sendButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.sm,
    },
    sendButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
});

export default AdminChatScreen;
