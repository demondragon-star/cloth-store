// Premium Avatar component with gradient fallback and ring
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_WEIGHT, GRADIENTS, SHADOWS } from '../../constants/theme';
import { getInitials } from '../../utils/format';

interface AvatarProps {
    source?: string | null;
    uri?: string | null;
    name?: string;
    size?: number;
    style?: ViewStyle;
    showRing?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
    source,
    uri,
    name = '',
    size = 48,
    style,
    showRing = false,
}) => {
    const fontSize = size * 0.38;
    const initials = getInitials(name);
    const imageSource = source || uri;
    const ringSize = size + 6;

    const avatarContent = imageSource ? (
        <Image
            source={{ uri: imageSource }}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: COLORS.gray[100],
                },
                !showRing && style,
            ] as any}
        />
    ) : (
        <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                !showRing && style,
            ] as any}
        >
            <Text style={[styles.initials, { fontSize }]}>{initials || '?'}</Text>
        </LinearGradient>
    );

    if (showRing) {
        return (
            <View
                style={[
                    {
                        width: ringSize,
                        height: ringSize,
                        borderRadius: ringSize / 2,
                        borderWidth: 3,
                        borderColor: COLORS.white,
                        justifyContent: 'center',
                        alignItems: 'center',
                        ...SHADOWS.sm,
                    },
                    style,
                ]}
            >
                {avatarContent}
            </View>
        );
    }

    return avatarContent;
};

const styles = StyleSheet.create({
    initials: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.bold,
        letterSpacing: 0.5,
    },
});
