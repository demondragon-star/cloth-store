// Forgot Password Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Button, Input } from '../../components';
import { useAuthStore } from '../../store';
import { validateEmail } from '../../utils/validation';
import type { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { resetPassword, isLoading, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>();
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async () => {
        clearError();

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setEmailError(validation.error);
            return;
        }

        setEmailError(undefined);

        const result = await resetPassword(email.trim());

        if (result.success) {
            setEmailSent(true);
            Toast.show({
                type: 'success',
                text1: 'Email Sent',
                text2: 'Check your inbox for password reset instructions.',
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Failed to Send Email',
                text2: result.error || 'Please try again.',
            });
        }
    };

    const handleBackToLogin = () => {
        navigation.navigate('Login');
    };

    if (emailSent) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

                <View style={styles.successContainer}>
                    <View style={styles.successIconContainer}>
                        <Ionicons name="mail-open-outline" size={64} color={COLORS.success} />
                    </View>
                    <Text style={styles.successTitle}>Check Your Email</Text>
                    <Text style={styles.successDescription}>
                        We've sent password reset instructions to:
                    </Text>
                    <Text style={styles.emailText}>{email}</Text>
                    <Text style={styles.successNote}>
                        If you don't see the email, check your spam folder.
                    </Text>

                    <Button
                        title="Back to Login"
                        onPress={handleBackToLogin}
                        fullWidth
                        size="large"
                        style={styles.backButton}
                    />

                    <TouchableOpacity
                        onPress={() => setEmailSent(false)}
                        style={styles.resendButton}
                    >
                        <Text style={styles.resendText}>Didn't receive the email? Resend</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backArrow}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Main Content */}
                    <View style={styles.mainContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-open-outline" size={48} color={COLORS.primary} />
                        </View>

                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.description}>
                            No worries! Enter your email address and we'll send you a link to reset your password.
                        </Text>

                        <Input
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            error={emailError}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            containerStyle={styles.inputContainer}
                        />

                        <Button
                            title="Send Reset Link"
                            onPress={handleResetPassword}
                            loading={isLoading}
                            fullWidth
                            size="large"
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleBackToLogin} style={styles.backToLoginButton}>
                            <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    header: {
        marginTop: SPACING.lg,
    },
    backArrow: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.gray[50],
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    description: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: FONT_SIZE.md * 1.6,
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.md,
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    footer: {
        paddingVertical: SPACING.xl,
        alignItems: 'center',
    },
    backToLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backToLoginText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.semibold,
        marginLeft: SPACING.xs,
    },
    // Success state styles
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    successIconContainer: {
        width: 120,
        height: 120,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    successTitle: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    successDescription: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    emailText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginTop: SPACING.xs,
        marginBottom: SPACING.lg,
    },
    successNote: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    backButton: {
        marginBottom: SPACING.md,
    },
    resendButton: {
        padding: SPACING.sm,
    },
    resendText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.medium,
    },
});

export default ForgotPasswordScreen;
