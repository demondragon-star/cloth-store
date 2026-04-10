// Edit Profile Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    TextInput,
    Image,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Card, Avatar } from '../components';
import { useAuthStore } from '../store';
import { authService } from '../services';
import { validateEmail, validatePhone, validateName } from '../utils/validation';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, updateProfile } = useAuthStore();

    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleBack = () => {
        navigation.goBack();
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Name is required';
        } else if (!validateName(fullName)) {
            newErrors.fullName = 'Please enter a valid name';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (phone && !validatePhone(phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please grant permission to access photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                // In production, you would upload this to Supabase Storage
                // For now, we'll just show the local URI
                setAvatarUrl(result.assets[0].uri);
                Toast.show({
                    type: 'info',
                    text1: 'Image Selected',
                    text2: 'Avatar will be updated when you save.',
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to pick image',
            });
        }
    };

    const handleTakePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please grant permission to access camera.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatarUrl(result.assets[0].uri);
                Toast.show({
                    type: 'info',
                    text1: 'Photo Captured',
                    text2: 'Avatar will be updated when you save.',
                });
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to take photo',
            });
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Update Profile Photo',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: handleTakePhoto },
                { text: 'Choose from Library', onPress: handlePickImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        if (!user) return;

        setIsLoading(true);

        try {
            let finalAvatarUrl = avatarUrl;
            
            // If avatar is a local URI (starts with file:// or content://), upload it
            if (avatarUrl && (avatarUrl.startsWith('file://') || avatarUrl.startsWith('content://'))) {
                const { url, error } = await authService.uploadAvatar(user.id, avatarUrl);
                
                if (error) {
                    throw new Error(`Avatar upload failed: ${error}`);
                }
                
                finalAvatarUrl = url || avatarUrl;
            }
            
            // Update profile with final avatar URL
            const { error } = await updateProfile({
                full_name: fullName.trim(),
                phone: phone.trim() || undefined,
                avatar_url: finalAvatarUrl || undefined,
            });

            if (error) {
                throw new Error(error);
            }

            Toast.show({
                type: 'success',
                text1: 'Profile Updated',
                text2: 'Your profile has been updated successfully.',
            });

            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error.message || 'Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Avatar
                            uri={avatarUrl}
                            name={fullName}
                            size={120}
                        />
                        <TouchableOpacity
                            style={styles.editAvatarButton}
                            onPress={showImageOptions}
                        >
                            <Ionicons name="camera" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={showImageOptions}>
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <Card style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                            <Ionicons name="person-outline" size={20} color={COLORS.gray[400]} />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={(text) => {
                                    setFullName(text);
                                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                                }}
                                placeholder="Enter your full name"
                                placeholderTextColor={COLORS.gray[400]}
                                autoCapitalize="words"
                            />
                        </View>
                        {errors.fullName && (
                            <Text style={styles.errorText}>{errors.fullName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address *</Text>
                        <View style={[styles.inputContainer, styles.inputDisabled]}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
                            <TextInput
                                style={[styles.input, styles.inputTextDisabled]}
                                value={email}
                                editable={false}
                                placeholder="Enter your email"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                            <Ionicons name="lock-closed" size={16} color={COLORS.gray[400]} />
                        </View>
                        <Text style={styles.helperText}>Email cannot be changed</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                            <Ionicons name="call-outline" size={20} color={COLORS.gray[400]} />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={(text) => {
                                    setPhone(text);
                                    if (errors.phone) setErrors({ ...errors, phone: '' });
                                }}
                                placeholder="Enter your phone number"
                                placeholderTextColor={COLORS.gray[400]}
                                keyboardType="phone-pad"
                            />
                        </View>
                        {errors.phone && (
                            <Text style={styles.errorText}>{errors.phone}</Text>
                        )}
                    </View>
                </Card>

                {/* Account Info */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.gray[500]} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Member Since</Text>
                            <Text style={styles.infoValue}>
                                {user?.created_at
                                    ? new Date(user.created_at).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })
                                    : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={isLoading}
                    size="large"
                    style={styles.saveButton}
                />
            </View>
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
    avatarSection: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.white,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.sm,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    changePhotoText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.primary,
    },
    formCard: {
        margin: SPACING.md,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray[50],
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
    },
    inputDisabled: {
        backgroundColor: COLORS.gray[100],
    },
    inputError: {
        borderColor: COLORS.error,
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    inputTextDisabled: {
        color: COLORS.gray[500],
    },
    errorText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    helperText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.gray[500],
        marginTop: SPACING.xs,
    },
    infoCard: {
        marginHorizontal: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoContent: {
        marginLeft: SPACING.md,
    },
    infoLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.medium,
        color: COLORS.text,
        marginTop: 2,
    },
    bottomPadding: {
        height: 100,
    },
    footer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.lg,
    },
    saveButton: {
        width: '100%',
    },
});

export default EditProfileScreen;
