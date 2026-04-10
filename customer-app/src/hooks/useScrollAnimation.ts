import { useRef, useCallback, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VISIBLE_THRESHOLD = SCREEN_HEIGHT * 0.85;

/**
 * 3D scroll animation hook — drives perspective transforms on list items.
 */
export function useScrollAnimation(itemHeight: number = 180) {
    const scrollY = useRef(new Animated.Value(0)).current;

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
    );

    const getAnimatedStyle = useCallback(
        (index: number) => {
            const inputStart = index * itemHeight - VISIBLE_THRESHOLD;
            const inputEnd = index * itemHeight - VISIBLE_THRESHOLD + itemHeight;

            return {
                opacity: scrollY.interpolate({
                    inputRange: [inputStart, inputEnd],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                }),
                transform: [
                    { perspective: 1000 },
                    { scale: scrollY.interpolate({ inputRange: [inputStart, inputEnd], outputRange: [0.88, 1], extrapolate: 'clamp' }) },
                    { translateY: scrollY.interpolate({ inputRange: [inputStart, inputEnd], outputRange: [40, 0], extrapolate: 'clamp' }) },
                    { rotateX: scrollY.interpolate({ inputRange: [inputStart, inputEnd], outputRange: ['-8deg', '0deg'], extrapolate: 'clamp' }) },
                ],
            };
        },
        [scrollY, itemHeight]
    );

    return { scrollY, onScroll, getAnimatedStyle };
}

/**
 * Staggered entrance animation for FlatList items.
 * Uses spring + stagger with a built-in delay so animation plays visibly after navigation.
 */
export function useEntranceAnimation(itemCount: number, staggerDelay: number = 100) {
    const animations = useRef<Animated.Value[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    while (animations.current.length < itemCount) {
        animations.current.push(new Animated.Value(0));
    }

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const triggerEntrance = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        animations.current.forEach(anim => anim.setValue(0));

        timerRef.current = setTimeout(() => {
            Animated.stagger(staggerDelay,
                animations.current.slice(0, itemCount).map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 40,
                        friction: 7,
                    })
                )
            ).start();
        }, 250);
    }, [itemCount, staggerDelay]);

    const getEntranceStyle = useCallback(
        (index: number) => {
            const anim = animations.current[index];
            if (!anim) return {};

            return {
                opacity: anim,
                transform: [
                    { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
                    { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
                ],
            };
        },
        []
    );

    return { triggerEntrance, getEntranceStyle };
}

/**
 * Section entrance animation for ScrollView-based screens.
 * Staggered spring that fades and slides each section in.
 */
export function useSectionEntrance(sectionCount: number, staggerDelay: number = 120) {
    const anims = useRef(
        Array.from({ length: sectionCount }, () => new Animated.Value(0))
    ).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const runEntrance = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        anims.forEach(a => a.setValue(0));

        timerRef.current = setTimeout(() => {
            Animated.stagger(staggerDelay,
                anims.map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    })
                )
            ).start();
        }, 200);
    }, [staggerDelay]);

    const sectionStyle = useCallback((index: number) => ({
        opacity: anims[index],
        transform: [
            { translateY: anims[index].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
            { scale: anims[index].interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
        ],
    }), []);

    return { runEntrance, sectionStyle };
}
