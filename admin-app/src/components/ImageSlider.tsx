import React, { useState, useRef } from 'react';
import {
    View,
    Image,
    FlatList,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Modal,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import type { ItemImage } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageSliderProps {
    images: ItemImage[];
    height?: number;
    showThumbnails?: boolean;
    onImagePress?: (index: number) => void;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
    images,
    height = 350,
    showThumbnails = true,
    onImagePress,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const modalListRef = useRef<FlatList>(null);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (slideIndex !== activeIndex) {
            setActiveIndex(slideIndex);
        }
    };

    const scrollToIndex = (index: number) => {
        flatListRef.current?.scrollToOffset({
            offset: index * SCREEN_WIDTH,
            animated: true,
        });
        setActiveIndex(index);
    };

    const handleImagePress = (index: number) => {
        setModalVisible(true);
        // Sync modal list after a small delay to ensure it's rendered
        setTimeout(() => {
            modalListRef.current?.scrollToOffset({
                offset: index * SCREEN_WIDTH,
                animated: false,
            });
        }, 100);
        onImagePress?.(index);
    };

    if (!images || images.length === 0) {
        return (
            <View style={[styles.placeholder, { height }]}>
                <Ionicons name="image-outline" size={64} color={COLORS.gray[400]} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleImagePress(index)}
                        style={[styles.imageContainer, { width: SCREEN_WIDTH, height }]}
                    >
                        <Image
                            source={{ uri: item.image_url }}
                            style={styles.image}
                            resizeMode="contain"
                            onError={(error) => {
                                console.warn(`Failed to load image ${item.id}:`, error.nativeEvent.error);
                            }}
                        />
                    </TouchableOpacity>
                )}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {images.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => scrollToIndex(index)}
                        style={[
                            styles.dot,
                            activeIndex === index && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            {/* Thumbnails */}
            {showThumbnails && images.length > 1 && (
                <View style={styles.thumbnailsContainer}>
                    <FlatList
                        data={images}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailsList}
                        keyExtractor={(item) => `thumb-${item.id}`}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => scrollToIndex(index)}
                                style={[
                                    styles.thumbnail,
                                    activeIndex === index && styles.thumbnailActive,
                                ]}
                            >
                                <Image
                                    source={{ uri: item.image_url }}
                                    style={styles.thumbnailImage}
                                    resizeMode="cover"
                                    onError={(error) => {
                                        console.warn(`Failed to load thumbnail ${item.id}:`, error.nativeEvent.error);
                                    }}
                                />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Full Screen Zoom Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <StatusBar barStyle="light-content" backgroundColor="black" />
                    <SafeAreaView style={styles.modalSafeArea}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>

                        <FlatList
                            ref={modalListRef}
                            data={images}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => `full-${item.id}`}
                            initialScrollIndex={activeIndex}
                            getItemLayout={(_, index) => ({
                                length: SCREEN_WIDTH,
                                offset: SCREEN_WIDTH * index,
                                index,
                            })}
                            renderItem={({ item }) => (
                                <View style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center' }}>
                                    <Image
                                        source={{ uri: item.image_url }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                        onError={(error) => {
                                            console.warn(`Failed to load full image ${item.id}:`, error.nativeEvent.error);
                                        }}
                                    />
                                </View>
                            )}
                        />
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
    },
    placeholder: {
        backgroundColor: COLORS.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
    },
    imageContainer: {
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: SPACING.lg,
        left: 0,
        right: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray[400], // Darker default for better contrast on white
        marginHorizontal: 4,
        opacity: 0.5,
    },
    dotActive: {
        opacity: 1,
        width: 24,
        backgroundColor: COLORS.primary,
    },
    thumbnailsContainer: {
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    thumbnailsList: {
        paddingHorizontal: SPACING.md,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginRight: SPACING.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbnailActive: {
        borderColor: COLORS.primary,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    modalSafeArea: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
});

export default ImageSlider;
