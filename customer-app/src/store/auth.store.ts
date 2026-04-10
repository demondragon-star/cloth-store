// Auth store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserProfile, NotificationPreferences } from '../types';
import { authService } from '../services';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    hasCompletedOnboarding: boolean;
    lastSessionCheck: number | null;  // Track last session check time

    // Actions
    setUser: (user: User | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setOnboardingComplete: () => void;

    // Auth actions
    signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
    updateNotificationPreferences: (prefs: NotificationPreferences) => Promise<{ success: boolean; error?: string }>;
    uploadAvatar: (imageUri: string) => Promise<{ success: boolean; url?: string; error?: string }>;
    fetchProfile: () => Promise<void>;
    checkSession: () => Promise<void>;
    clearError: () => void;
}

// Rate limiting: minimum time between session checks (2 minutes)
const SESSION_CHECK_COOLDOWN = 120000;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            hasCompletedOnboarding: false,
            lastSessionCheck: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
            clearError: () => set({ error: null }),

            signUp: async (email, password, fullName, phone) => {
                set({ isLoading: true, error: null });
                try {
                    const { user, error } = await authService.signUp({
                        email,
                        password,
                        fullName,
                        phone,
                    });

                    if (error) {
                        set({ error, isLoading: false });
                        return { success: false, error };
                    }

                    if (user) {
                        set({ user, isAuthenticated: true, isLoading: false });
                        await get().fetchProfile();
                    }

                    return { success: true };
                } catch (error: any) {
                    const errorMessage = error.message || 'Sign up failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            signIn: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const { user, error } = await authService.signIn({ email, password });

                    if (error) {
                        set({ error, isLoading: false });
                        return { success: false, error };
                    }

                    if (user) {
                        set({ user, isAuthenticated: true, isLoading: false });
                        await get().fetchProfile();
                    }

                    return { success: true };
                } catch (error: any) {
                    const errorMessage = error.message || 'Sign in failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            signOut: async () => {
                set({ isLoading: true });
                try {
                    await authService.signOut();
                    set({
                        user: null,
                        profile: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    set({ isLoading: false, error: error.message });
                }
            },

            resetPassword: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    const { error } = await authService.resetPassword(email);

                    if (error) {
                        set({ error, isLoading: false });
                        return { success: false, error };
                    }

                    set({ isLoading: false });
                    return { success: true };
                } catch (error: any) {
                    const errorMessage = error.message || 'Password reset failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            updateProfile: async (updates) => {
                const { user } = get();
                if (!user) return { success: false, error: 'Not authenticated' };

                set({ isLoading: true, error: null });
                try {
                    const { error } = await authService.updateProfile(user.id, updates);

                    if (error) {
                        set({ error, isLoading: false });
                        return { success: false, error };
                    }

                    set({
                        user: { ...user, ...updates },
                        profile: get().profile ? { ...get().profile!, ...updates } : null,
                        isLoading: false,
                    });

                    return { success: true };
                } catch (error: any) {
                    const errorMessage = error.message || 'Profile update failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            updateNotificationPreferences: async (prefs) => {
                const { user, profile } = get();
                if (!user) return { success: false, error: 'Not authenticated' };

                set({ isLoading: true, error: null });
                try {
                    const { error } = await authService.updateNotificationPreferences(user.id, prefs);

                    if (error) {
                        set({ error, isLoading: false });
                        return { success: false, error };
                    }

                    if (profile) {
                        set({
                            profile: { ...profile, notification_preferences: prefs },
                            isLoading: false,
                        });
                    }

                    return { success: true };
                } catch (error: any) {
                    const errorMessage = error.message || 'Preferences update failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            uploadAvatar: async (imageUri) => {
                const { user } = get();
                if (!user) return { success: false, error: 'Not authenticated' };

                set({ isLoading: true, error: null });
                try {
                    const { url, error } = await authService.uploadAvatar(user.id, imageUri);

                    if (error) {
                        set({ error, isLoading: false });
                        return { success: false, error };
                    }

                    if (url) {
                        set({
                            user: { ...user, avatar_url: url },
                            profile: get().profile ? { ...get().profile!, avatar_url: url } : null,
                            isLoading: false,
                        });
                    }

                    return { success: true, url: url || undefined };
                } catch (error: any) {
                    const errorMessage = error.message || 'Avatar upload failed';
                    set({ error: errorMessage, isLoading: false });
                    return { success: false, error: errorMessage };
                }
            },

            fetchProfile: async () => {
                const { user } = get();
                if (!user) return;

                try {
                    const profile = await authService.getUserProfile(user.id);
                    if (profile) {
                        set({ profile });
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            },

            checkSession: async () => {
                // Rate limiting: prevent too frequent session checks
                const now = Date.now();
                const { lastSessionCheck } = get();
                
                if (lastSessionCheck && (now - lastSessionCheck) < SESSION_CHECK_COOLDOWN) {
                    return;
                }

                set({ isLoading: true, lastSessionCheck: now });
                try {
                    const user = await authService.getCurrentUser();
                    if (user) {
                        set({ user, isAuthenticated: true });
                        await get().fetchProfile();
                    } else {
                        // No user found - clear auth state
                        set({ user: null, isAuthenticated: false });
                    }
                } catch (error: any) {
                    // Handle session missing errors gracefully (not really errors)
                    if (error.message?.includes('session missing') || error.message?.includes('Auth session missing')) {

                        set({ user: null, isAuthenticated: false, error: null });
                        return;
                    }
                    
                    console.error('Error checking session:', error);
                    
                    // Handle rate limit errors gracefully
                    if (error.message?.includes('rate limit')) {
                        console.warn('Rate limit reached - will retry later');
                        set({ error: null }); // Don't show rate limit errors to user
                    }
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                hasCompletedOnboarding: state.hasCompletedOnboarding,
            }),
        }
    )
);

export default useAuthStore;
