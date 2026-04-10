import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store';

export const AdminSettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { signOut, user, profile } = useAuthStore();

    const handleLogout = async () => {
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
                    }
                }
            ]
        );
    };

    const SettingItem = ({ label, icon, onPress, isDestructive, gradient }: {
        label: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void;
        isDestructive?: boolean; gradient: string[];
    }) => (
        <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress} activeOpacity={0.6}>
            <View style={styles.itemLeft}>
                <LinearGradient colors={gradient as [string, string]} style={styles.iconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={icon} size={18} color={COLORS.white} />
                </LinearGradient>
                <Text style={[styles.itemText, isDestructive && { color: '#F87171' }]}>{label}</Text>
            </View>
            {onPress && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.orbPurple} />
            <View style={styles.orbPink} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <Text style={styles.headerSubtitle}>Manage your preferences</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <LinearGradient
                            colors={['rgba(99,102,241,0.25)', 'rgba(139,92,246,0.15)']}
                            style={styles.profileCardBg}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#EC4899']}
                                style={styles.avatar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.avatarText}>
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                                </Text>
                            </LinearGradient>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{profile?.full_name || 'Admin'}</Text>
                                <Text style={styles.profileEmail}>{user?.email}</Text>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{profile?.role?.toUpperCase() || 'ADMIN'}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* General Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>General</Text>
                        <SettingItem label="Notifications" icon="notifications-outline" gradient={['#F59E0B', '#EF4444']} onPress={() => {}} />
                        <SettingItem label="Security" icon="shield-checkmark-outline" gradient={['#10B981', '#06B6D4']} onPress={() => {}} />
                        <SettingItem label="App Info" icon="information-circle-outline" gradient={['#6366F1', '#8B5CF6']} onPress={() => {}} />
                    </View>

                    {/* Account */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        <SettingItem label="Logout" icon="log-out-outline" gradient={['#EF4444', '#F97316']} isDestructive onPress={handleLogout} />
                    </View>

                    <Text style={styles.version}>Version 1.0.0 · Admin Build</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK.background },
    orbPurple: {
        position: 'absolute', top: 80, right: -60, width: 200, height: 200,
        borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.1)',
    },
    orbPink: {
        position: 'absolute', bottom: 200, left: -30, width: 120, height: 120,
        borderRadius: 60, backgroundColor: 'rgba(236,72,153,0.06)',
    },
    header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
    headerTitle: { fontSize: 28, fontWeight: FONT_WEIGHT.black, color: COLORS.white, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FONT_WEIGHT.medium, marginTop: 2 },
    content: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },

    // Profile Card
    profileCard: { marginBottom: SPACING.lg, borderRadius: BORDER_RADIUS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: DARK.card.borderColor },
    profileCardBg: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
    avatar: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    },
    avatarText: { color: COLORS.white, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.black },
    profileInfo: { flex: 1 },
    profileName: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.black, color: COLORS.white },
    profileEmail: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.sm,
        paddingVertical: 2, borderRadius: BORDER_RADIUS.full, alignSelf: 'flex-start',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    roleText: { fontSize: FONT_SIZE.xs, color: COLORS.white, fontWeight: FONT_WEIGHT.bold },

    // Sections
    section: {
        backgroundColor: DARK.card.backgroundColor, borderRadius: BORDER_RADIUS.xxl,
        padding: SPACING.md, marginBottom: SPACING.md,
        borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: 'rgba(255,255,255,0.35)',
        marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 1,
    },
    item: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: SPACING.sm + 2,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 36, height: 36, borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    },
    itemText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium, color: COLORS.white },
    version: {
        textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: FONT_SIZE.xs,
        marginTop: SPACING.lg, marginBottom: SPACING.xl,
    },
});
