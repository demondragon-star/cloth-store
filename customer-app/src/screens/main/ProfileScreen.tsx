// Profile Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Avatar, Card } from '../../components';
import { useAuthStore, useCartStore, useWishlistStore } from '../../store';
import { orderService, supportService, supabase } from '../../services';
import { useSectionEntrance } from '../../hooks/useScrollAnimation';
import type { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    badge?: number;
    onPress: () => void;
    danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    title,
    subtitle,
    badge,
    onPress,
    danger,
}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
            <Ionicons
                name={icon}
                size={22}
                color={danger ? COLORS.error : COLORS.primary}
            />
        </View>
        <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.menuRight}>
            {badge !== undefined && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </View>
    </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, profile, signOut, isLoading } = useAuthStore();
    const { itemCount } = useCartStore();
    const { items: wishlistItems } = useWishlistStore();

    // State for profile statistics
    const [orderCount, setOrderCount] = useState(0);
    const [savedAmount, setSavedAmount] = useState(0);
    const [unreadSupportCount, setUnreadSupportCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);
    const { runEntrance, sectionStyle } = useSectionEntrance(4);

    useEffect(() => {
        if (!statsLoading) runEntrance();
    }, [statsLoading]);

    // Load profile statistics AND unread counts
    useEffect(() => {
        loadProfileStats();

        // Subscribe to real-time support message updates for badge
        if (!user?.id) return;
        const msgSub = supabase.channel('profile-support-badges')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `sender_role=eq.admin` },
                () => {
                    loadUnreadCounts();
                }
            )
            .subscribe();

        return () => { msgSub.unsubscribe(); };
    }, [user?.id]);

    const loadUnreadCounts = async () => {
        if (!user?.id) return;
        try {
            const { data: chats } = await supportService.getUserChats(user.id);
            if (chats && chats.length > 0) {
                const totalUnread = chats.reduce((sum: number, chat: any) => sum + (chat.unread_count || 0), 0);
                setUnreadSupportCount(totalUnread);
            } else {
                setUnreadSupportCount(0);
            }
        } catch (error) {
            console.error('Error fetching unread support counts', error);
        }
    };

    const loadProfileStats = async () => {
        if (!user?.id) {
            setStatsLoading(false);
            return;
        }

        setStatsLoading(true);
        try {
            const { data: orders, error } = await orderService.getUserOrders(user.id, 1, 1000);

            if (!error && orders) {
                setOrderCount(orders.length);
                const totalSaved = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
                setSavedAmount(totalSaved);
            } else {
                // If error or no orders, set to 0
                setOrderCount(0);
                setSavedAmount(0);
            }

            await loadUnreadCounts();

        } catch (error) {
            console.error('Error loading profile stats:', error);
            setOrderCount(0);
            setSavedAmount(0);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfile');
    };

    const handleOrders = () => {
        navigation.navigate('OrderHistory');
    };

    const handleAddresses = () => {
        navigation.navigate('Addresses');
    };

    const handleWishlist = () => {
        navigation.navigate('Wishlist');
    };

    const handleNotifications = () => {
        navigation.navigate('Notifications');
    };

    const handleSettings = () => {
        navigation.navigate('Settings');
    };

    const handleHelp = () => {
        navigation.navigate('Help');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        Toast.show({
                            type: 'success',
                            text1: 'Logged Out',
                            text2: 'You have been successfully logged out.',
                        });

                    },
                },
            ]
        );
    };

    const renderHeader = () => (
        <LinearGradient
            colors={COLORS.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            <View style={styles.profileInfo}>
                <Avatar
                    source={user?.avatar_url}
                    name={user?.full_name}
                    size={80}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{user?.full_name || 'Guest User'}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{user?.email || 'Not signed in'}</Text>
                </View>
                <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                    <Ionicons name="create-outline" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
                <TouchableOpacity style={styles.statItem} onPress={handleOrders}>
                    {statsLoading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.statValue}>{orderCount}</Text>
                    )}
                    <Text style={styles.statLabel}>Orders</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity style={styles.statItem} onPress={handleWishlist}>
                    <Text style={styles.statValue}>{wishlistItems.length}</Text>
                    <Text style={styles.statLabel}>Wishlist</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity style={styles.statItem}>
                    {statsLoading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.statValue}>₹{savedAmount.toFixed(0)}</Text>
                    )}
                    <Text style={styles.statLabel}>Saved</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {renderHeader()}

                {/* Menu Sections */}
                <View style={styles.menuContainer}>
                    {/* My Account */}
                    <Animated.View style={sectionStyle(0)}>
                    <Card style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>My Account</Text>
                        <MenuItem
                            icon="bag-outline"
                            title="My Orders"
                            subtitle="Track and view your orders"
                            onPress={handleOrders}
                        />
                        <MenuItem
                            icon="heart-outline"
                            title="Wishlist"
                            badge={wishlistItems.length}
                            onPress={handleWishlist}
                        />
                        <MenuItem
                            icon="location-outline"
                            title="Saved Addresses"
                            onPress={handleAddresses}
                        />
                        <MenuItem
                            icon="card-outline"
                            title="Payment Methods"
                            onPress={() => { }}
                        />
                    </Card>
                    </Animated.View>

                    {/* Preferences */}
                    <Animated.View style={sectionStyle(1)}>
                    <Card style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>Preferences</Text>
                        <MenuItem
                            icon="notifications-outline"
                            title="Notifications"
                            onPress={handleNotifications}
                        />
                        <MenuItem
                            icon="settings-outline"
                            title="Settings"
                            onPress={handleSettings}
                        />
                        <MenuItem
                            icon="language-outline"
                            title="Language"
                            subtitle="English"
                            onPress={() => { }}
                        />
                    </Card>
                    </Animated.View>

                    {/* Support */}
                    <Animated.View style={sectionStyle(2)}>
                    <Card style={styles.menuSection}>
                        <Text style={styles.sectionTitle}>Support</Text>
                        <MenuItem
                            icon="help-circle-outline"
                            title="Help Center"
                            badge={unreadSupportCount}
                            onPress={handleHelp}
                        />
                        <MenuItem
                            icon="chatbubbles-outline"
                            title="Chat with Us"
                            badge={unreadSupportCount}
                            onPress={handleHelp}
                        />
                        <MenuItem
                            icon="star-outline"
                            title="Rate the App"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="document-text-outline"
                            title="Terms & Privacy"
                            onPress={() => { }}
                        />
                    </Card>
                    </Animated.View>

                    {/* Logout */}
                    <Animated.View style={sectionStyle(3)}>
                    <Card style={styles.menuSection}>
                        <MenuItem
                            icon="log-out-outline"
                            title="Logout"
                            onPress={handleLogout}
                            danger
                        />
                    </Card>
                    </Animated.View>

                    {/* App Version */}
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xl,
        borderBottomLeftRadius: BORDER_RADIUS.xxl,
        borderBottomRightRadius: BORDER_RADIUS.xxl,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    userInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    userName: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    userEmail: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: SPACING.xs,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.lg,
        padding: SPACING.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    statLabel: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: SPACING.xs,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    menuContainer: {
        padding: SPACING.md,
        marginTop: -SPACING.lg,
    },
    menuSection: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIconDanger: {
        backgroundColor: `${COLORS.error}15`,
    },
    menuContent: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    menuTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    menuTitleDanger: {
        color: COLORS.error,
    },
    menuSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    badge: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.white,
    },
    version: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.lg,
        marginBottom: 100,
    },
});

export default ProfileScreen;
