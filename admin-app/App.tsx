// Main App Entry Point
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store';
import { authService, notificationService } from './src/services';
import { supabase } from './src/services/supabase';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from './src/constants/theme';

// Suppress known warnings for Expo Go limitations and deprecations
LogBox.ignoreLogs([
  'expo-notifications',
  'Android Push notifications',
  'functionality provided by expo-notifications was removed from Expo Go',
  'useLegacyImplementation',
  'Reanimated 3',
  'Drawer.Navigator',
  'ImagePicker.MediaTypeOptions',
  'expo-image-picker',
]);

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Custom Toast configuration
const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: COLORS.success,
        borderLeftWidth: 5,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: SPACING.md }}
      text1Style={{
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
      }}
      text2Style={{
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: COLORS.error,
        borderLeftWidth: 5,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: SPACING.md }}
      text1Style={{
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
      }}
      text2Style={{
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: COLORS.info,
        borderLeftWidth: 5,
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: SPACING.md }}
      text1Style={{
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
      }}
      text2Style={{
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
      }}
    />
  ),
};

const AppContent: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const { checkSession, user } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Race checkSession against a 10-second timeout (increased from 5)
        const sessionPromise = checkSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timed out')), 10000)
        );

        try {
          await Promise.race([sessionPromise, timeoutPromise]);
        } catch (sessionError: any) {
          // Handle rate limit errors gracefully
          if (sessionError?.message?.includes('rate limit')) {
            console.warn('[App] Rate limit during session check - continuing with cached data');
          } else {
            console.warn('[App] Session check failed:', sessionError);
          }
        }

        // Set up auth state listener
        authService.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            useAuthStore.getState().setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              phone: session.user.user_metadata?.phone,
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
            });
          } else if (event === 'SIGNED_OUT') {
            useAuthStore.getState().setUser(null);
          }
        });
      } catch (error) {
        console.warn('[App] Error preparing app:', error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Register for push notifications when user is authenticated
  // Wrapped in try-catch as notifications don't work in Expo Go (SDK 53+)
  useEffect(() => {
    if (user) {
      try {
        notificationService.registerForPushNotifications().then((token) => {
          if (token) {
            notificationService.savePushToken(user.id, token);
          }
        }).catch((error) => {
          // Silently handle notification errors in Expo Go
        });

        // Set up notification listeners
        const receivedSubscription = notificationService.addNotificationReceivedListener(
          (notification) => {
            // Handle notification received
          }
        );

        const responseSubscription = notificationService.addNotificationResponseReceivedListener(
          (response) => {
            // Handle notification tap navigation here
          }
        );

        // Global Support Chat Listener for Admins
        const isAdmin = useAuthStore.getState().profile?.is_admin || useAuthStore.getState().profile?.role === 'admin' || useAuthStore.getState().user?.is_admin;
        let supportSub: any;

        if (isAdmin) {
          supportSub = supabase
            .channel('global-admin-support')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'support_messages' },
              (payload) => {
                const newMsg = payload.new as any;
                if (newMsg.sender_role === 'customer') {
                  Toast.show({
                    type: 'info',
                    text1: 'New Support Request',
                    text2: newMsg.message,
                  });
                  try {
                    Notifications.scheduleNotificationAsync({
                      content: {
                        title: 'New Support Request',
                        body: newMsg.message,
                        data: { chatId: newMsg.chat_id },
                        sound: true,
                      },
                      trigger: null, // immediate
                    });
                  } catch (e) {}
                }
              }
            ).subscribe();
        }

        return () => {
          try {
            receivedSubscription.remove();
            responseSubscription.remove();
            if (supportSub) supportSub.unsubscribe();
          } catch (error) {
            // Ignore cleanup errors
          }
        };
      } catch (error) {
        // Notifications not supported in Expo Go - this is expected
      }
    }
  }, [user]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <RootNavigator />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.white}
            translucent={false}
          />
          <AppContent />
          <Toast config={toastConfig} position="top" topOffset={50} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
