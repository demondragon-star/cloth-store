// Settings Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button } from '../components';
import { useAuthStore } from '../store';
import { APP_CONFIG } from '../constants/config';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false,
}) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
    >
        <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
            <Ionicons
                name={icon}
                size={22}
                color={danger ? COLORS.error : COLORS.primary}
            />
        </View>
        <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
                {title}
            </Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightElement || (
            onPress && <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        )}
    </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { signOut, user } = useAuthStore();

    // Notification preferences (local state - can be connected to backend)
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [orderUpdates, setOrderUpdates] = useState(true);
    const [promotions, setPromotions] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleChangePassword = () => {
        Alert.alert(
            'Change Password',
            'A password reset link will be sent to your email address.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Link',
                    onPress: () => {
                        Toast.show({
                            type: 'success',
                            text1: 'Email Sent',
                            text2: 'Check your email for the password reset link.',
                        });
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Toast.show({
                            type: 'info',
                            text1: 'Account Deletion',
                            text2: 'Please contact support to delete your account.',
                        });
                    },
                },
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear all cached data including images and temporary files.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    onPress: () => {
                        Toast.show({
                            type: 'success',
                            text1: 'Cache Cleared',
                            text2: 'App cache has been cleared successfully.',
                        });
                    },
                },
            ]
        );
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

                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <Text style={styles.sectionTitle}>Account</Text>
                <Card style={styles.section}>
                    <SettingItem
                        icon="person-outline"
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <SettingItem
                        icon="location-outline"
                        title="Saved Addresses"
                        subtitle="Manage your delivery addresses"
                        onPress={() => navigation.navigate('Addresses')}
                    />
                    <SettingItem
                        icon="lock-closed-outline"
                        title="Change Password"
                        subtitle="Update your account password"
                        onPress={handleChangePassword}
                    />
                </Card>

                {/* Notifications Section */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <Card style={styles.section}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        subtitle="Receive push notifications"
                        rightElement={
                            <Switch
                                value={pushEnabled}
                                onValueChange={setPushEnabled}
                                trackColor={{ false: COLORS.gray[300], true: `${COLORS.primary}60` }}
                                thumbColor={pushEnabled ? COLORS.primary : COLORS.gray[100]}
                            />
                        }
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Email Notifications"
                        subtitle="Receive email updates"
                        rightElement={
                            <Switch
                                value={emailEnabled}
                                onValueChange={setEmailEnabled}
                                trackColor={{ false: COLORS.gray[300], true: `${COLORS.primary}60` }}
                                thumbColor={emailEnabled ? COLORS.primary : COLORS.gray[100]}
                            />
                        }
                    />
                    <SettingItem
                        icon="bag-outline"
                        title="Order Updates"
                        subtitle="Get notified about your orders"
                        rightElement={
                            <Switch
                                value={orderUpdates}
                                onValueChange={setOrderUpdates}
                                trackColor={{ false: COLORS.gray[300], true: `${COLORS.primary}60` }}
                                thumbColor={orderUpdates ? COLORS.primary : COLORS.gray[100]}
                            />
                        }
                    />
                    <SettingItem
                        icon="gift-outline"
                        title="Promotions & Offers"
                        subtitle="Receive deals and discount alerts"
                        rightElement={
                            <Switch
                                value={promotions}
                                onValueChange={setPromotions}
                                trackColor={{ false: COLORS.gray[300], true: `${COLORS.primary}60` }}
                                thumbColor={promotions ? COLORS.primary : COLORS.gray[100]}
                            />
                        }
                    />
                </Card>

                {/* Appearance Section */}
                <Text style={styles.sectionTitle}>Appearance</Text>
                <Card style={styles.section}>
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        subtitle="Switch to dark theme"
                        rightElement={
                            <Switch
                                value={darkMode}
                                onValueChange={(value) => {
                                    setDarkMode(value);
                                    Toast.show({
                                        type: 'info',
                                        text1: 'Coming Soon',
                                        text2: 'Dark mode will be available in a future update.',
                                    });
                                }}
                                trackColor={{ false: COLORS.gray[300], true: `${COLORS.primary}60` }}
                                thumbColor={darkMode ? COLORS.primary : COLORS.gray[100]}
                            />
                        }
                    />
                    <SettingItem
                        icon="language-outline"
                        title="Language"
                        subtitle="English"
                        onPress={() => {
                            Toast.show({
                                type: 'info',
                                text1: 'Coming Soon',
                                text2: 'Multi-language support coming soon.',
                            });
                        }}
                    />
                </Card>

                {/* Storage Section */}
                <Text style={styles.sectionTitle}>Storage</Text>
                <Card style={styles.section}>
                    <SettingItem
                        icon="trash-outline"
                        title="Clear Cache"
                        subtitle="Free up storage space"
                        onPress={handleClearCache}
                    />
                </Card>

                {/* About Section */}
                <Text style={styles.sectionTitle}>About</Text>
                <Card style={styles.section}>
                    <SettingItem
                        icon="information-circle-outline"
                        title="App Version"
                        subtitle={APP_CONFIG.version}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        onPress={() => {
                            Toast.show({
                                type: 'info',
                                text1: 'Terms of Service',
                                text2: 'Opening terms of service...',
                            });
                        }}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Privacy Policy"
                        onPress={() => {
                            Toast.show({
                                type: 'info',
                                text1: 'Privacy Policy',
                                text2: 'Opening privacy policy...',
                            });
                        }}
                    />
                    <SettingItem
                        icon="star-outline"
                        title="Rate App"
                        subtitle="Love the app? Rate us!"
                        onPress={() => {
                            Toast.show({
                                type: 'success',
                                text1: 'Thank You!',
                                text2: 'Your feedback means a lot to us.',
                            });
                        }}
                    />
                </Card>

                {/* Danger Zone */}
                <Text style={styles.sectionTitle}>Danger Zone</Text>
                <Card style={styles.section}>
                    <SettingItem
                        icon="log-out-outline"
                        title="Logout"
                        onPress={handleLogout}
                        danger
                    />
                    <SettingItem
                        icon="trash-bin-outline"
                        title="Delete Account"
                        subtitle="Permanently delete your account"
                        onPress={handleDeleteAccount}
                        danger
                    />
                </Card>

                <View style={styles.bottomPadding} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
    },
    placeholder: {
        width: 32,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    section: {
        marginHorizontal: SPACING.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    settingIconDanger: {
        backgroundColor: `${COLORS.error}15`,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
    },
    settingTitleDanger: {
        color: COLORS.error,
    },
    settingSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    bottomPadding: {
        height: 50,
    },
});

export default SettingsScreen;
