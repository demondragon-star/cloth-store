import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase, TABLES } from './supabase';
import type { Notification } from '../types';

// Check if running in Expo Go (SDK 53+ removed push notification support)
const isExpoGo = Constants.appOwnership === 'expo';

// Only set notification handler if not in Expo Go
if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

class NotificationService {
    async registerForPushNotifications(): Promise<string | null> {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                return null;
            }

            // Get the token
            try {
                // Project ID needs to be passed explicitly if not inferred correctly
                const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

                // If running in Expo Go and no projectId, return early to avoid crash
                if (!projectId && Constants.appOwnership === 'expo') {
                    return null;
                }

                const tokenData = await Notifications.getExpoPushTokenAsync({
                    projectId: projectId || undefined
                });
                token = tokenData.data;
            } catch (error: any) {
                // Suppress specific Expo Go error
                if (error?.message?.includes('removed from Expo Go')) {
                    return null;
                }
                console.error('Error fetching push token:', error);
                return null;
            }
        } else {
            return null;
        }

        return token || null;
    }

    async savePushToken(userId: string, token: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from('push_tokens')
                .upsert({
                    user_id: userId,
                    token: token,
                    device_type: Platform.OS,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,token' });

            if (error) {
                console.error('Error saving push token:', error);
                return { error: error.message };
            }

            return { error: null };
        } catch (error: any) {
            console.error('Error in savePushToken:', error);
            return { error: error.message };
        }
    }

    addNotificationReceivedListener(callback: (notification: any) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    addNotificationResponseReceivedListener(callback: (response: any) => void) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    async getNotifications(
        userId: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<{ data: Notification[] | null; total: number; error: string | null }> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                return { data: null, total: 0, error: error.message };
            }
            return { data, total: count || 0, error: null };
        } catch (error: any) {
            return { data: null, total: 0, error: error.message };
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) {
                return 0;
            }
            return count || 0;
        } catch {
            return 0;
        }
    }

    async markAsRead(notificationId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async markAllAsRead(userId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async deleteNotification(notificationId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .delete()
                .eq('id', notificationId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async clearAllNotifications(userId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .delete()
                .eq('user_id', userId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
        return supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: TABLES.NOTIFICATIONS,
                    filter: `user_id=eq.${userId}`,
                },
                async () => {
                    const { data } = await this.getNotifications(userId);
                    if (data) {
                        callback(data);
                    }
                }
            )
            .subscribe();
    }

    async setBadgeCount(count: number): Promise<void> {
        try {
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.error('Error setting badge count:', error);
        }
    }
}

export const notificationService = new NotificationService();
export default notificationService;
