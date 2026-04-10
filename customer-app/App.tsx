// Main App Entry Point
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store';
import { authService, notificationService } from './src/services';
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
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      retry: 2,
    },
  },
});

// Configure AsyncStorage Persister for React Query
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
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

        return () => {
          try {
            receivedSubscription.remove();
            responseSubscription.remove();
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
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.white}
            translucent={false}
          />
          <AppContent />
          <Toast config={toastConfig} position="top" topOffset={50} />
        </PersistQueryClientProvider>
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
