import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, KeyboardAvoidingView, Platform,
    TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../store';
import { supportService, SupportMessage, SupportChat } from '../services/support.service';

export const ChatScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    
    const [chat, setChat] = useState<SupportChat | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!user) {
            Alert.alert('Error', 'Please log in to use chat support.');
            navigation.goBack();
            return;
        }

        initializeChat();
    }, [user]);

    const initializeChat = async () => {
        try {
            setLoading(true);
            // Get or create active chat
            const { data: chatData, error: chatError } = await supportService.getOrCreateChat(user!.id);
            if (chatError || !chatData) throw new Error(chatError || 'Failed to initialize chat');
            
            setChat(chatData);

            // Fetch history
            const { data: msgData, error: msgError } = await supportService.getMessages(chatData.id);
            if (msgError) throw new Error(msgError);
            if (msgData) setMessages(msgData);

            // Mark admin messages as read
            await supportService.markMessagesRead(chatData.id, 'customer');

            // Subscribe to new messages
            const subscription = supportService.subscribeToMessages(chatData.id, (newMsg: SupportMessage) => {
                setMessages(prev => [...prev, newMsg]);
                if (newMsg.sender_role === 'admin') {
                    supportService.markMessagesRead(chatData.id, 'customer');
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not load chat');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !chat || !user) return;
        
        try {
            setSending(true);
            const { error } = await supportService.sendMessage(
                chat.id,
                user.id,
                inputText,
                'customer'
            );
            if (error) throw new Error(error);
            setInputText('');
        } catch (error) {
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Live Support</Text>
                    <Text style={styles.headerSubtitle}>
                        {chat?.status === 'open' ? 'We typically reply in a few minutes' : 'Chat closed'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={styles.messagesContainer}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    <Text style={styles.dateSeparator}>
                        {format(new Date(), 'EEEE, MMM d')}
                    </Text>
                    
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <View style={styles.messageRow}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="headset" size={16} color={COLORS.primary} />
                            </View>
                            <View style={[styles.bubble, styles.bubbleAdmin]}>
                                <Text style={styles.messageTextAdmin}>
                                    Hi there! How can we help you today?
                                </Text>
                            </View>
                        </View>
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender_role === 'customer';
                        return (
                            <View key={msg.id} style={[styles.messageRow, isMe && styles.messageRowMe]}>
                                {!isMe && (
                                    <View style={styles.avatarContainer}>
                                        <Ionicons name="headset" size={16} color={COLORS.primary} />
                                    </View>
                                )}
                                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleAdmin]}>
                                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextAdmin]}>
                                        {msg.message}
                                    </Text>
                                    <View style={styles.timeContainer}>
                                        <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
                                            {format(new Date(msg.created_at), 'p')}
                                        </Text>
                                        {isMe && (
                                            <Ionicons 
                                                name={msg.is_read ? "checkmark-done" : "checkmark"} 
                                                size={12} 
                                                color={msg.is_read ? COLORS.white : 'rgba(255,255,255,0.6)'} 
                                                style={{ marginLeft: 4 }}
                                            />
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.gray[400]}
                        multiline
                        maxLength={500}
                        editable={chat?.status === 'open'}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, (!inputText.trim() || chat?.status === 'closed') && styles.sendButtonDisabled]} 
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending || chat?.status === 'closed'}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={COLORS.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
        marginRight: SPACING.sm,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.success,
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    dateSeparator: {
        textAlign: 'center',
        fontSize: FONT_SIZE.xs,
        color: COLORS.gray[400],
        marginVertical: SPACING.lg,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: SPACING.md,
        maxWidth: '85%',
    },
    messageRowMe: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${COLORS.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    bubble: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 20,
    },
    bubbleAdmin: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    bubbleMe: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: FONT_SIZE.md,
        lineHeight: 22,
    },
    messageTextAdmin: {
        color: COLORS.text,
    },
    messageTextMe: {
        color: COLORS.white,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timeText: {
        fontSize: 10,
    },
    timeTextMe: {
        color: 'rgba(255,255,255,0.7)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: SPACING.sm,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: COLORS.gray[50],
        borderRadius: 22,
        paddingHorizontal: SPACING.md,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray[300],
    },
});

export default ChatScreen;
