import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { reviewService } from '../services/review.service';
import { useAuthStore } from '../store';
import type { RootStackParamList } from '../types';
import Toast from 'react-native-toast-message';

type RouteType = RouteProp<RootStackParamList, 'WriteReview'>;
type NavType = NativeStackNavigationProp<RootStackParamList, 'WriteReview'>;

const StarRating: React.FC<{ rating: number; onRate: (r: number) => void }> = ({ rating, onRate }) => (
    <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => onRate(star)} style={styles.starBtn}>
                <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? '#FBBF24' : COLORS.gray[300]}
                />
            </TouchableOpacity>
        ))}
    </View>
);

export const WriteReviewScreen: React.FC = () => {
    const navigation = useNavigation<NavType>();
    const route = useRoute<RouteType>();
    const { itemId, itemName, orderId } = route.params;
    const { user } = useAuthStore();

    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    const handleSubmit = async () => {
        if (rating === 0) return Alert.alert('Rating Required', 'Please select a star rating.');
        if (!body.trim()) return Alert.alert('Review Required', 'Please write a short review.');
        if (!user) return;

        try {
            setSubmitting(true);
            const { error } = await reviewService.submitReview({
                item_id: itemId,
                user_id: user.id,
                order_id: orderId,
                rating,
                title: title.trim() || undefined,
                body: body.trim(),
            });

            if (error) throw new Error(error);

            Toast.show({ type: 'success', text1: 'Review Submitted!', text2: 'Thank you for your feedback.' });
            navigation.goBack();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Could not submit review' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write a Review</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={styles.submitBtn}>
                    {submitting
                        ? <ActivityIndicator size="small" color={COLORS.primary} />
                        : <Text style={styles.submitText}>Submit</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.itemName}>{itemName}</Text>

                {/* Star Rating */}
                <View style={styles.ratingSection}>
                    <StarRating rating={rating} onRate={setRating} />
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                    )}
                </View>

                {/* Title */}
                <Text style={styles.label}>Review Title (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Summarize your experience"
                    placeholderTextColor={COLORS.gray[400]}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                {/* Body */}
                <Text style={styles.label}>Your Review *</Text>
                <TextInput
                    style={[styles.input, styles.bodyInput]}
                    placeholder="What did you like or dislike about this product?"
                    placeholderTextColor={COLORS.gray[400]}
                    value={body}
                    onChangeText={setBody}
                    multiline
                    maxLength={1000}
                    textAlignVertical="top"
                />
                <Text style={styles.charCount}>{body.length}/1000</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: { padding: SPACING.sm },
    headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
    submitBtn: { padding: SPACING.sm },
    submitText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
    content: { padding: SPACING.lg },
    itemName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.lg },
    ratingSection: { alignItems: 'center', marginBottom: SPACING.xl },
    stars: { flexDirection: 'row' },
    starBtn: { padding: SPACING.xs },
    ratingLabel: { marginTop: SPACING.sm, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: '#FBBF24' },
    label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textSecondary, marginBottom: SPACING.xs },
    input: {
        backgroundColor: COLORS.gray[50], borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md, color: COLORS.text, marginBottom: SPACING.md,
    },
    bodyInput: { minHeight: 120, textAlignVertical: 'top', paddingTop: SPACING.sm },
    charCount: { textAlign: 'right', fontSize: FONT_SIZE.xs, color: COLORS.gray[400], marginTop: -SPACING.sm },
});

export default WriteReviewScreen;
