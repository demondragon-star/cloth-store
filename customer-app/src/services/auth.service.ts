// Authentication service using Supabase
import { supabase, TABLES } from './supabase';
import type { User, UserProfile, NotificationPreferences } from '../types';
import { withRateLimit } from '../utils/rateLimiter';

export interface AuthCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends AuthCredentials {
    fullName: string;
    phone?: string;
}

export interface AuthResponse {
    user: User | null;
    error: string | null;
}

class AuthService {
    private userCache: { user: any | null; timestamp: number } | null = null;
    private readonly CACHE_DURATION = 60000; // 60 seconds cache - increased from 10s
    private lastAuthCallTime: number = 0;
    private readonly MIN_AUTH_CALL_INTERVAL = 5000; // Minimum 5 seconds between auth API calls

    // Sign up with email and password
    async signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: credentials.email,
                password: credentials.password,
                options: {
                    data: {
                        full_name: credentials.fullName,
                        phone: credentials.phone,
                    },
                },
            });

            if (error) {
                return { user: null, error: error.message };
            }

            // NOTE: The database trigger `handle_new_user()` automatically creates
            // the profile record, so we don't need to insert manually

            return {
                user: data.user ? this.mapAuthUserToUser(data.user) : null,
                error: null,
            };
        } catch (error: any) {
            return { user: null, error: error.message || 'An error occurred during sign up' };
        }
    }

    // Sign in with email and password
    async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) {
                return { user: null, error: error.message };
            }

            return {
                user: data.user ? this.mapAuthUserToUser(data.user) : null,
                error: null,
            };
        } catch (error: any) {
            return { user: null, error: error.message || 'An error occurred during sign in' };
        }
    }

    // Sign out
    async signOut(): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                return { error: error.message };
            }
            // Clear cache on sign out
            this.userCache = null;
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'An error occurred during sign out' };
        }
    }

    // Send password reset email
    async resetPassword(email: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'shopease://reset-password',
            });

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'An error occurred during password reset' };
        }
    }

    // Update password
    async updatePassword(newPassword: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'An error occurred during password update' };
        }
    }

    // Send magic link
    async sendMagicLink(email: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: 'shopease://auth/callback',
                },
            });

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'An error occurred sending magic link' };
        }
    }

    // Get current session
    async getSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                return { session: null, error: error.message };
            }
            return { session: data.session, error: null };
        } catch (error: any) {
            return { session: null, error: error.message };
        }
    }

    // Get current user with rate limit protection
    async getCurrentUser(): Promise<User | null> {
        // Check cache first
        const now = Date.now();
        if (this.userCache && (now - this.userCache.timestamp) < this.CACHE_DURATION) {
            return this.userCache.user ? this.mapAuthUserToUser(this.userCache.user) : null;
        }

        // Prevent too frequent auth API calls
        const timeSinceLastCall = now - this.lastAuthCallTime;
        if (timeSinceLastCall < this.MIN_AUTH_CALL_INTERVAL) {
            // Return cached data even if expired, rather than making a new call
            if (this.userCache?.user) {
                return this.mapAuthUserToUser(this.userCache.user);
            }
            return null;
        }

        this.lastAuthCallTime = now;

        try {
            const result = await withRateLimit(async () => {
                const { data: { user }, error } = await supabase.auth.getUser();
                
                if (error) {
                    // Check if it's a session missing error (not a real error, just no session)
                    if (error.message?.includes('session missing') || error.message?.includes('Auth session missing')) {
                        return null;
                    }
                    throw error;
                }
                
                return user;
            }, {
                maxRetries: 2, // Reduced retries to avoid hammering the API
                baseDelay: 5000, // Longer initial delay
                maxDelay: 30000,
            });
            
            // Update cache
            this.userCache = { user: result, timestamp: now };
            
            if (!result) {
                // If rate limit protection returns null, try session fallback
                console.log('No user from getUser(), trying session fallback');
                const { session } = await this.getSession();
                if (session?.user) {
                    this.userCache = { user: session.user, timestamp: now };
                    return this.mapAuthUserToUser(session.user);
                }
                return null;
            }
            
            return this.mapAuthUserToUser(result);
        } catch (error: any) {
            // Don't log session missing errors as errors - they're expected when not logged in
            if (error.message?.includes('session missing') || error.message?.includes('Auth session missing')) {
                this.userCache = { user: null, timestamp: now };
                return null;
            }
            
            console.error('Error getting current user:', error);
            
            // Try session fallback on any error
            try {
                const { session } = await this.getSession();
                if (session?.user) {
                    this.userCache = { user: session.user, timestamp: now };
                    return this.mapAuthUserToUser(session.user);
                }
            } catch (fallbackError: any) {
                // Don't log session missing errors
                if (!fallbackError.message?.includes('session missing')) {
                    console.error('Session fallback also failed:', fallbackError);
                }
            }
            
            // Cache the null result to prevent repeated failed calls
            this.userCache = { user: null, timestamp: now };
            return null;
        }
    }

    // Get user profile from database
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase
                .from(TABLES.USERS)
                .select(`
          *,
          addresses:${TABLES.ADDRESSES}(*)
        `)
                .eq('id', userId)
                .single();

            if (error || !data) {
                return null;
            }

            return {
                ...data,
                notification_preferences: data.notification_preferences || {
                    push_enabled: true,
                    email_enabled: true,
                    sms_enabled: false,
                    order_updates: true,
                    promotions: true,
                    new_arrivals: true,
                },
            } as UserProfile;
        } catch (error) {
            return null;
        }
    }

    // Update user profile
    async updateProfile(userId: string, updates: Partial<User>): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.USERS)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (error) {
                return { error: error.message };
            }
            
            // Clear cache after profile update
            this.userCache = null;
            
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'An error occurred updating profile' };
        }
    }

    // Update notification preferences
    async updateNotificationPreferences(
        userId: string,
        preferences: NotificationPreferences
    ): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.USERS)
                .update({
                    notification_preferences: preferences,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (error) {
                return { error: error.message };
            }
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'An error occurred updating preferences' };
        }
    }

    // Upload avatar
    async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
        try {
            
            // Extract file extension
            const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}/avatar-${Date.now()}.${fileExtension}`;
            const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
            
            
            // For React Native, we need to read the file as ArrayBuffer
            // Use fetch with the local file URI
            const response = await fetch(imageUri);
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            
            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, uint8Array, {
                    contentType: mimeType,
                    upsert: true,
                });
            
            if (uploadError) {
                console.error('Upload error:', uploadError);
                return { url: null, error: uploadError.message };
            }
            
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
            
            
            // Update user profile with new avatar URL
            await this.updateProfile(userId, { avatar_url: publicUrl });
            
            return { url: publicUrl, error: null };
        } catch (error: any) {
            console.error('Avatar upload exception:', error);
            return { url: null, error: error.message || 'Failed to upload avatar' };
        }
    }

    // Subscribe to auth state changes
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }

    // Map Supabase auth user to our User type
    private mapAuthUserToUser(authUser: any): User {
        return {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || '',
            phone: authUser.user_metadata?.phone,
            avatar_url: authUser.user_metadata?.avatar_url,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at || authUser.created_at,
        };
    }
}

export const authService = new AuthService();
export default authService;
