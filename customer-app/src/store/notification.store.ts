// Notification store using Zustand
import { create } from 'zustand';
import type { Notification } from '../types';
import { notificationService } from '../services';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    pushToken: string | null;

    // Actions
    fetchNotifications: (userId: string) => Promise<void>;
    fetchUnreadCount: (userId: string) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    clearAllNotifications: (userId: string) => Promise<void>;
    registerPushNotifications: (userId: string) => Promise<void>;
    clearError: () => void;
    subscribeToNotifications: (userId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    pushToken: null,

    fetchNotifications: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await notificationService.getNotifications(userId);

            if (error) {
                set({ error, isLoading: false });
                return;
            }

            set({ notifications: data || [], isLoading: false });
            await get().fetchUnreadCount(userId);
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchUnreadCount: async (userId) => {
        try {
            const count = await notificationService.getUnreadCount(userId);
            set({ unreadCount: count });
            await notificationService.setBadgeCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    },

    markAsRead: async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);

            const notifications = get().notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            );

            const unreadCount = notifications.filter(n => !n.is_read).length;

            set({ notifications, unreadCount });
            await notificationService.setBadgeCount(unreadCount);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    markAllAsRead: async (userId) => {
        try {
            await notificationService.markAllAsRead(userId);

            const notifications = get().notifications.map(n => ({ ...n, is_read: true }));

            set({ notifications, unreadCount: 0 });
            await notificationService.setBadgeCount(0);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);

            const notifications = get().notifications.filter(n => n.id !== notificationId);
            const unreadCount = notifications.filter(n => !n.is_read).length;

            set({ notifications, unreadCount });
            await notificationService.setBadgeCount(unreadCount);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    clearAllNotifications: async (userId) => {
        try {
            await notificationService.clearAllNotifications(userId);
            set({ notifications: [], unreadCount: 0 });
            await notificationService.setBadgeCount(0);
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    registerPushNotifications: async (userId) => {
        try {
            const token = await notificationService.registerForPushNotifications();

            if (token) {
                set({ pushToken: token });
                await notificationService.savePushToken(userId, token);
            }
        } catch (error) {
            console.error('Error registering push notifications:', error);
        }
    },

    clearError: () => set({ error: null }),

    subscribeToNotifications: (userId) => {
        const subscription = notificationService.subscribeToNotifications(userId, (notifications) => {
            set({ notifications });
            const unreadCount = notifications.filter(n => !n.is_read).length;
            set({ unreadCount });
            notificationService.setBadgeCount(unreadCount);
        });

        return () => {
            subscription.unsubscribe();
        };
    },
}));

export default useNotificationStore;
