// Onboarding Screen with slider
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    Dimensions,
    StyleSheet,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Button } from '../../components';
import { useAuthStore } from '../../store';
import type { RootStackParamList } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    gradient: string[];
}

const SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        icon: 'bag-handle-outline',
        title: 'Discover Products',
        description: 'Explore thousands of products from your favorite brands, all in one place.',
        gradient: ['#6366F1', '#8B5CF6'],
    },
    {
        id: '2',
        icon: 'heart-outline',
        title: 'Save Favorites',
        description: 'Create your wishlist and never miss out on products you love.',
        gradient: ['#EC4899', '#F472B6'],
    },
    {
        id: '3',
        icon: 'flash-outline',
        title: 'Fast Delivery',
        description: 'Get your orders delivered quickly right to your doorstep.',
        gradient: ['#14B8A6', '#2DD4BF'],
    },
    {
        id: '4',
        icon: 'shield-checkmark-outline',
        title: 'Secure Payments',
        description: 'Shop with confidence using our secure payment methods.',
        gradient: ['#F59E0B', '#FBBF24'],
    },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (slideIndex !== activeIndex) {
            setActiveIndex(slideIndex);
        }
    };

    const handleNext = () => {
        if (activeIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToOffset({
                offset: (activeIndex + 1) * SCREEN_WIDTH,
                animated: true,
            });
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = () => {
        handleGetStarted();
    };

    const handleGetStarted = () => {
        setOnboardingComplete();
        // The RootNavigator will automatically react to the state change 
        // and switch from the Onboarding screen to the Auth stack.
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            <LinearGradient
                colors={item.gradient as any}
                style={styles.iconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={item.icon} size={80} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Skip Button */}
            {activeIndex < SLIDES.length - 1 && (
                <View style={styles.skipContainer}>
                    <Button
                        title="Skip"
                        onPress={handleSkip}
                        variant="ghost"
                        size="small"
                    />
                </View>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={renderSlide}
                bounces={false}
            />

            {/* Pagination & Navigation */}
            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                activeIndex === index && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    <Button
                        title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        onPress={handleNext}
                        fullWidth
                        size="large"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    skipContainer: {
        position: 'absolute',
        top: 60,
        right: SPACING.lg,
        zIndex: 10,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: BORDER_RADIUS.xxxl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xxl,
        ...SHADOWS.lg,
    },
    title: {
        fontSize: FONT_SIZE.xxxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.md,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: FONT_SIZE.lg * 1.6,
        paddingHorizontal: SPACING.lg,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray[200],
        marginHorizontal: 4,
    },
    dotActive: {
        width: 28,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    buttonContainer: {
        width: '100%',
    },
});

export default OnboardingScreen;
