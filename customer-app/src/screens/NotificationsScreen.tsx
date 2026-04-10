// Notifications Screen
import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, EmptyState, SkeletonListItem } from '../components';
import { useAuthStore, useNotificationStore } from '../store';
import { formatRelativeTime } from '../utils/format';
import { useRefresh } from '../hooks';
import { useEntranceAnimation } from '../hooks/useScrollAnimation';
import type { RootStackParamList, Notification } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    order: 'bag-outline',
    promotion: 'gift-outline',
    system: 'information-circle-outline',
    delivery: 'car-outline',
    payment: 'card-outline',
};

const NOTIFICATION_COLORS: Record<string, string> = {
    order: COLORS.primary,
    promotion: COLORS.warning,
    system: COLORS.info,
    delivery: COLORS.success,
    payment: COLORS.accent,
};

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const {
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotificationStore();

    const loadNotifications = useCallback(async () => {
        if (user) {
            await fetchNotifications(user.id);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const { refreshing, onRefresh } = useRefresh(loadNotifications);
    const { triggerEntrance, getEntranceStyle } = useEntranceAnimation(notifications.length);

    useEffect(() => {
        if (!isLoading && notifications.length > 0) triggerEntrance();
    }, [isLoading]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.data?.order_id) {
            navigation.navigate('OrderDetail', { orderId: notification.data.order_id });
        } else if (notification.data?.item_id) {
            navigation.navigate('ItemDetail', { itemId: notification.data.item_id });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (user) {
            await markAllAsRead(user.id);
        }
    };

    const handleDelete = async (notificationId: string) => {
        await deleteNotification(notificationId);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
        const iconName = NOTIFICATION_ICONS[item.type] || 'notifications-outline';
        const iconColor = NOTIFICATION_COLORS[item.type] || COLORS.primary;

        return (
            <Animated.View style={getEntranceStyle(index)}>
            <TouchableOpacity
                style={[styles.notificationCard, !item.is_read && styles.notificationUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                    <Ionicons name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationBody} numberOfLines={2}>
                        {item.body}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {formatRelativeTime(item.created_at)}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="close" size={18} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmpty = () => (
        <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            description="You don't have any notifications yet. We'll notify you about orders and updates."
        />
    );

    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonListItem key={i} style={styles.skeletonItem} />
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {renderHeader()}

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={isLoading ? renderLoading : renderEmpty}
            />
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
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    markAllButton: {
        padding: SPACING.xs,
    },
    markAllText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
    },
    list: {
        padding: SPACING.md,
        paddingBottom: 100,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    notificationUnread: {
        backgroundColor: `${COLORS.primary}05`,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    notificationBody: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        lineHeight: FONT_SIZE.sm * 1.4,
    },
    notificationTime: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.gray[400],
        marginTop: SPACING.sm,
    },
    deleteButton: {
        padding: SPACING.xs,
    },
    loadingContainer: {
        padding: SPACING.md,
    },
    skeletonItem: {
        marginBottom: SPACING.sm,
    },
});

export default NotificationsScreen;
