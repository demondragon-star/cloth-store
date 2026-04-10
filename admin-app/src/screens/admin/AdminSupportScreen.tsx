import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants/theme';
import { supportService, SupportChat } from '../../services/support.service';
import { AdminOrdersStackParamList } from '../../navigation/AdminNavigator';

type NavProp = NativeStackNavigationProp<AdminOrdersStackParamList>;

export const AdminSupportScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadChats();

        const subscription = supportService.subscribeToAllChats(() => {
            loadChats();
        });

        return () => { subscription.unsubscribe(); };
    }, []);

    const loadChats = async () => {
        const { data, error } = await supportService.getAllChats();
        if (!error && data) setChats(data);
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadChats();
    }, []);

    const renderItem = ({ item }: { item: SupportChat }) => {
        const isOpen = item.status === 'open';
        const hasUnread = (item.unread_count || 0) > 0;
        const userName = item.user?.full_name || 'Customer';
        const email = item.user?.email || '';
        const lastMsg = item.lastMessage?.message || 'No messages yet';
        const lastTime = item.lastMessage
            ? format(new Date(item.lastMessage.created_at), 'p')
            : '';

        return (
            <TouchableOpacity
                style={[styles.chatCard, hasUnread && styles.chatCardUnread]}
                onPress={() => navigation.navigate('AdminChat', {
                    chatId: item.id,
                    userName,
                })}
            >
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatTop}>
                        <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]}>
                            {userName}
                        </Text>
                        <Text style={styles.chatTime}>{lastTime}</Text>
                    </View>
                    <Text style={styles.chatEmail} numberOfLines={1}>{email}</Text>
                    <Text style={[styles.chatLastMsg, hasUnread && styles.chatLastMsgUnread]}
                        numberOfLines={1}>
                        {lastMsg}
                    </Text>
                </View>

                <View style={styles.chatMeta}>
                    {hasUnread && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>{item.unread_count}</Text>
                        </View>
                    )}
                    <View style={[styles.statusDot, { backgroundColor: isOpen ? COLORS.success : COLORS.gray[500] }]} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: DARK.background }}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Customer Support</Text>
                    <Ionicons name="chatbubbles" size={24} color={COLORS.primaryLight} />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primaryLight} />
                    </View>
                ) : (
                    <FlatList
                        data={chats}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Ionicons name="chatbubble-outline" size={64} color={DARK.textMuted} />
                                <Text style={styles.emptyText}>No support chats yet</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        borderBottomWidth: 1, borderBottomColor: DARK.card.borderColor,
    },
    headerTitle: { fontSize: FONT_SIZE.xxl || 22, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    listContent: { padding: SPACING.md, paddingBottom: 60 },
    chatCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: DARK.card.backgroundColor,
        borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md,
        marginBottom: SPACING.sm, borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    chatCardUnread: {
        borderColor: `${COLORS.primaryLight}40`,
        backgroundColor: `${COLORS.primary}15`,
    },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: `${COLORS.primary}30`,
        alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
    },
    avatarText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.primaryLight },
    chatInfo: { flex: 1 },
    chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: DARK.textMuted },
    chatNameUnread: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
    chatTime: { fontSize: FONT_SIZE.xs, color: DARK.textMuted },
    chatEmail: { fontSize: FONT_SIZE.xs, color: DARK.textMuted, marginVertical: 2 },
    chatLastMsg: { fontSize: FONT_SIZE.sm, color: DARK.textMuted },
    chatLastMsgUnread: { color: COLORS.white },
    chatMeta: { alignItems: 'center', gap: SPACING.xs },
    unreadBadge: {
        backgroundColor: COLORS.primary, borderRadius: 10,
        minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: { color: COLORS.white, fontSize: 11, fontWeight: FONT_WEIGHT.bold },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    emptyText: { color: DARK.textMuted, fontSize: FONT_SIZE.md, marginTop: SPACING.md },
});

export default AdminSupportScreen;
