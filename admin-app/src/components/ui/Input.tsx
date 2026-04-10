// Premium Input component with floating label and refined focus states
import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    Animated,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, FONT_WEIGHT } from '../../constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
    showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    showPasswordToggle,
    secureTextEntry,
    value,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (!value) {
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        onBlur?.(e);
    };

    const labelStyle = {
        top: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [17, -9],
        }),
        fontSize: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [FONT_SIZE.md, FONT_SIZE.xs + 1],
        }),
        color: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.gray[400], isFocused ? COLORS.primary : COLORS.gray[500]],
        }),
    };

    const getBorderColor = () => {
        if (error) return COLORS.error;
        if (isFocused) return COLORS.primary;
        return COLORS.gray[200];
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <View
                style={[
                    styles.inputContainer,
                    { borderColor: getBorderColor() },
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={isFocused ? COLORS.primary : COLORS.gray[400]}
                        style={styles.leftIcon}
                    />
                )}

                <View style={styles.inputWrapper}>
                    <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
                    <TextInput
                        {...props}
                        value={value}
                        style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholderTextColor={COLORS.gray[400]}
                        secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
                    />
                </View>

                {showPasswordToggle && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.rightIconButton}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={COLORS.gray[400]}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !showPasswordToggle && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIconButton}
                        disabled={!onRightIconPress}
                    >
                        <Ionicons name={rightIcon} size={20} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        minHeight: 58,
    },
    inputContainerFocused: {
        backgroundColor: COLORS.primarySoft,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    inputContainerError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorSoft,
    },
    inputWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        position: 'absolute',
        left: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 4,
        fontWeight: FONT_WEIGHT.medium,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        paddingVertical: SPACING.md,
        fontWeight: FONT_WEIGHT.regular,
    },
    inputWithLeftIcon: {
        paddingLeft: SPACING.xs,
    },
    leftIcon: {
        marginRight: SPACING.sm,
    },
    rightIconButton: {
        padding: SPACING.xs + 2,
        marginLeft: SPACING.xs,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs + 2,
        paddingHorizontal: SPACING.xs,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        marginLeft: SPACING.xs,
        fontWeight: FONT_WEIGHT.medium,
    },
});
