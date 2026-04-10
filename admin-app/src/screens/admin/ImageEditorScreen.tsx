import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants/theme';
import { bgRemovalService } from '../../services/bg-removal.service';
import { AdminProductsStackParamList } from '../../navigation/AdminNavigator';

type ImageEditorRouteProp = RouteProp<AdminProductsStackParamList, 'ImageEditor'>;

export const ImageEditorScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<ImageEditorRouteProp>();
    
    // The initial image passed from the Product Details screen
    const { imageUri, onComplete } = route.params;

    const [currentImage, setCurrentImage] = useState<string>(imageUri);
    const [originalImage, setOriginalImage] = useState<string>(imageUri);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBgRemoved, setIsBgRemoved] = useState(false);

    // Call the Python FastAPI backend to remove background
    const handleRemoveBackground = async () => {
        if (isProcessing) return;
        
        try {
            setIsProcessing(true);
            const result = await bgRemovalService.removeBackground(currentImage);
            
            if (result.success && result.uri) {
                setCurrentImage(result.uri);
                setIsBgRemoved(true);
            } else {
                Alert.alert(
                    'Processing Failed', 
                    result.error || 'Could not remove the background. Ensure the Pyton server is running.'
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    // Revert back to the original image
    const handleRevert = () => {
        setCurrentImage(originalImage);
        setIsBgRemoved(false);
    };

    // Open camera to take a new photo (Deprecated, using Cancel instead)

    // Return the image back to the product details screen
    const handleConfirm = () => {
        if (onComplete) {
            onComplete(currentImage);
        }
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.iconButton}
                >
                    <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Image</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Image Preview Container */}
            <View style={styles.imageContainer}>
                <View style={styles.checkerboard}>
                    <Image 
                        source={{ uri: currentImage }} 
                        style={styles.image} 
                        resizeMode="contain"
                    />
                </View>

                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.processingText}>Removing Background...</Text>
                        <Text style={styles.processingSubText}>This uses AI and may take 5-15 seconds.</Text>
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.controlsContainer}
                contentContainerStyle={styles.controlsContent}
                keyboardShouldPersistTaps="handled"
            >
                {!isBgRemoved ? (
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleRemoveBackground}
                        disabled={isProcessing}
                    >
                        <LinearGradient 
                            colors={['#8B5CF6', '#6366F1']} 
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="color-wand" size={20} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Remove Background (AI)</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.revertButton]}
                        onPress={handleRevert}
                        disabled={isProcessing}
                    >
                        <View style={styles.revertButtonInner}>
                            <Ionicons name="refresh" size={20} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Revert to Original</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <View style={styles.secondaryControls}>
                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={() => navigation.goBack()}
                        disabled={isProcessing}
                    >
                        <Ionicons name="close-circle-outline" size={24} color={COLORS.white} />
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.secondaryButton, styles.confirmButton]}
                        onPress={handleConfirm}
                        disabled={isProcessing}
                    >
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                        <Text style={styles.secondaryButtonText}>Use This Image</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK.background, // Use strict dark mode background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: SPACING.md,
    },
    checkerboard: {
        width: '100%',
        height: '100%',
        backgroundColor: '#111', 
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    processingText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.bold,
        marginTop: SPACING.md,
    },
    processingSubText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    controlsContainer: {
        backgroundColor: DARK.card.backgroundColor,
        borderTopWidth: 1,
        borderTopColor: DARK.card.borderColor,
    },
    controlsContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    actionButton: {
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
    },
    revertButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    revertButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
    },
    secondaryControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.md,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    confirmButton: {
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        borderColor: 'rgba(52, 211, 153, 0.3)',
    },
    secondaryButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.xs,
        fontWeight: FONT_WEIGHT.medium,
    },
});
