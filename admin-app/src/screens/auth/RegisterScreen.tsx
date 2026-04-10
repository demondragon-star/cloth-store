// Register Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Button, Input } from '../../components';
import { useAuthStore } from '../../store';
import {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateName,
    validatePhone,
} from '../../utils/validation';
import type { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { signUp, isLoading, clearError } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const handleRegister = async () => {
        clearError();

        // Validate all inputs
        const nameValidation = validateName(fullName, 'Full Name');
        const emailValidation = validateEmail(email);
        const phoneValidation = validatePhone(phone);
        const passwordValidation = validatePassword(password);
        const confirmValidation = validateConfirmPassword(password, confirmPassword);

        const newErrors = {
            fullName: nameValidation.error,
            email: emailValidation.error,
            phone: phoneValidation.error,
            password: passwordValidation.error,
            confirmPassword: confirmValidation.error,
        };

        if (!nameValidation.isValid || !emailValidation.isValid ||
            !phoneValidation.isValid || !passwordValidation.isValid ||
            !confirmValidation.isValid) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const result = await signUp(email.trim(), password, fullName.trim(), phone.trim() || undefined);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Account Created',
                text2: 'Please check your email to verify your account.',
            });
            // Navigation is handled automatically by RootNavigator based on user role
            // No need to manually navigate - the navigator will route to Admin or Main based on is_admin flag
        } else {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: result.error || 'Please try again.',
            });
        }
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Fill in the details to get started</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            error={errors.fullName}
                            leftIcon="person-outline"
                            autoCapitalize="words"
                            autoComplete="name"
                        />

                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            error={errors.email}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Input
                            label="Phone Number (Optional)"
                            value={phone}
                            onChangeText={setPhone}
                            error={errors.phone}
                            leftIcon="call-outline"
                            keyboardType="phone-pad"
                            autoComplete="tel"
                        />

                        <Input
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            error={errors.password}
                            leftIcon="lock-closed-outline"
                            showPasswordToggle
                            autoCapitalize="none"
                            autoComplete="password-new"
                        />

                        <Input
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            error={errors.confirmPassword}
                            leftIcon="lock-closed-outline"
                            showPasswordToggle
                            autoCapitalize="none"
                            autoComplete="password-new"
                        />

                        {/* Password Requirements */}
                        <View style={styles.requirements}>
                            <Text style={styles.requirementsTitle}>Password must contain:</Text>
                            <View style={styles.requirementRow}>
                                <Ionicons
                                    name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    color={password.length >= 8 ? COLORS.success : COLORS.gray[400]}
                                />
                                <Text style={styles.requirementText}>At least 8 characters</Text>
                            </View>
                            <View style={styles.requirementRow}>
                                <Ionicons
                                    name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    color={/[A-Z]/.test(password) ? COLORS.success : COLORS.gray[400]}
                                />
                                <Text style={styles.requirementText}>One uppercase letter</Text>
                            </View>
                            <View style={styles.requirementRow}>
                                <Ionicons
                                    name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    color={/[0-9]/.test(password) ? COLORS.success : COLORS.gray[400]}
                                />
                                <Text style={styles.requirementText}>One number</Text>
                            </View>
                            <View style={styles.requirementRow}>
                                <Ionicons
                                    name={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    color={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? COLORS.success : COLORS.gray[400]}
                                />
                                <Text style={styles.requirementText}>One special character</Text>
                            </View>
                        </View>

                        <Button
                            title="Create Account"
                            onPress={handleRegister}
                            loading={isLoading}
                            fullWidth
                            size="large"
                            style={styles.registerButton}
                        />

                        {/* Terms */}
                        <Text style={styles.termsText}>
                            By signing up, you agree to our{' '}
                            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                            <Text style={styles.linkText}>Privacy Policy</Text>
                        </Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={handleLogin}>
                            <Text style={styles.loginText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
    },
    header: {
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.xxxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    form: {
        flex: 1,
    },
    requirements: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    requirementsTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    requirementText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
    },
    registerButton: {
        marginTop: SPACING.sm,
    },
    termsText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.lg,
        lineHeight: FONT_SIZE.sm * 1.6,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.medium,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    footerText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    loginText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.semibold,
    },
});

export default RegisterScreen;
