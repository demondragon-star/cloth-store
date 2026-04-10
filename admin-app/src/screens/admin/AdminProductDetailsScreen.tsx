import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, DARK, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { itemService } from '../../services/item.service';
import { supabase } from '../../services/supabase';
import { Item, Category } from '../../types';
import { AdminProductsStackParamList } from '../../navigation/AdminNavigator';
import { validateProductForm, ProductFormData, hasValidationErrors, ValidationErrors } from '../../utils/productValidation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AdminProductDetailsRouteProp = RouteProp<AdminProductsStackParamList, 'AdminProductDetails'>;
type AdminProductDetailsNavigationProp = NativeStackNavigationProp<AdminProductsStackParamList, 'AdminProductDetails'>;

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const AdminProductDetailsScreen: React.FC = () => {
    const navigation = useNavigation<AdminProductDetailsNavigationProp>();
    const route = useRoute<AdminProductDetailsRouteProp>();
    const { productId: routeProductId } = route.params;
    const productId = routeProductId || 'new';
    const isNew = productId === 'new';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [compareAtPrice, setCompareAtPrice] = useState('');
    const [description, setDescription] = useState('');
    const [stock, setStock] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    // Images: { uri: string, isLocal: boolean }
    const [images, setImages] = useState<{ uri: string; isLocal: boolean }[]>([]);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        loadCategories();
        if (!isNew) {
            loadItem();
        }
    }, [productId]);

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);
            const { data, error } = await itemService.getCategories();
            if (error) {
                console.error('Failed to load categories:', error);
            } else if (data) {
                setCategories(data);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error loading categories:', err);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadProductCategories = async (productId: string): Promise<string[]> => {
        try {
            const { data, error } = await supabase
                .from('product_categories')
                .select('category_id')
                .eq('product_id', productId);

            if (error) {
                console.error('Failed to load product categories:', error);
                return [];
            }
            return data?.map(pc => pc.category_id) || [];
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error loading product categories:', err);
            return [];
        }
    };

    const loadItem = async () => {
        try {
            setLoading(true);
            const { data, error } = await itemService.getItemById(productId);
            if (error || !data) {
                Alert.alert('Error', 'Failed to load product details');
                navigation.goBack();
                return;
            }
            
            // Set form values with proper defaults
            setName(data.name ?? '');
            setSku(data.sku ?? '');
            setPrice(data.price?.toString() ?? '');
            setCompareAtPrice(data.compare_at_price?.toString() ?? '');
            setDescription(data.description ?? '');
            setStock(data.stock_quantity?.toString() ?? '0');
            setIsActive(data.is_active ?? true);
            setTags(data.tags ?? []);
            setSelectedSizes(data.sizes ?? []);

            // Load existing images from item_images table
            const existingImages: { uri: string; isLocal: boolean }[] = [];
            if (data.images && data.images.length > 0) {
                existingImages.push(...data.images.map(img => ({ uri: img.image_url, isLocal: false })));
            }
            setImages(existingImages);

            // Load product categories
            const categoryIds = await loadProductCategories(productId);
            setSelectedCategories(categoryIds);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error loading item:', err);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Navigate to editor screen instead of adding directly
            navigation.navigate('ImageEditor', {
                imageUri: result.assets[0].uri,
                onComplete: (processedUri: string) => {
                    setImages(prevImages => [...prevImages, { uri: processedUri, isLocal: true }]);
                }
            });
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Navigate to editor screen instead of adding directly
            navigation.navigate('ImageEditor', {
                imageUri: result.assets[0].uri,
                onComplete: (processedUri: string) => {
                    setImages(prevImages => [...prevImages, { uri: processedUri, isLocal: true }]);
                }
            });
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const toggleSize = (size: string) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter(s => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };

    const toggleCategory = (categoryId: string) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(c => c !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
        // Clear category error when user selects a category
        if (errors.categories) {
            const { categories, ...rest } = errors;
            setErrors(rest);
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const saveProductCategories = async (productId: string, categoryIds: string[]): Promise<{ error: string | null }> => {
        try {
            // Delete existing categories
            const { error: deleteError } = await supabase
                .from('product_categories')
                .delete()
                .eq('product_id', productId);

            if (deleteError) {
                return { error: deleteError.message };
            }

            // Insert new categories
            const categoryRecords = categoryIds.map(categoryId => ({
                product_id: productId,
                category_id: categoryId,
            }));

            const { error: insertError } = await supabase
                .from('product_categories')
                .insert(categoryRecords);

            if (insertError) {
                return { error: insertError.message };
            }

            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    };

    const handleSave = async () => {
        // Validate form data
        const formData: ProductFormData = {
            name,
            description,
            price,
            stock_quantity: stock,
            sku,
            selectedCategories,
            images,
        };

        const validationErrors = validateProductForm(formData);
        
        if (hasValidationErrors(validationErrors)) {
            setErrors(validationErrors);
            Alert.alert('Validation Error', 'Please fix the errors in the form before saving.');
            return;
        }

        // Clear errors if validation passes
        setErrors({});

        try {
            setSaving(true);

            // 1. Upload new (local) images
            const finalImageUrls: string[] = [];

            // Keep existing remote URLs
            images.forEach(img => {
                if (!img.isLocal) finalImageUrls.push(img.uri);
            });

            // Upload local images
            const localImages = images.filter(img => img.isLocal);
            if (localImages.length > 0) {
                setUploading(true);
                for (const img of localImages) {
                    const { url, error } = await itemService.uploadImage(img.uri, 'image/jpeg', isNew ? 'new' : productId);
                    if (url) {
                        finalImageUrls.push(url);
                    } else {
                        console.error('Failed to upload image:', error);
                        Alert.alert('Upload Warning', 'Some images failed to upload.');
                    }
                }
                setUploading(false);
            }

            // 2. Prepare Item Data (without image_urls)
            const itemData: Partial<Item> = {
                name,
                sku,
                price: parseFloat(price),
                compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
                description,
                stock_quantity: parseInt(stock) || 0,
                is_active: isActive,
                tags,
                sizes: selectedSizes,
            };

            let savedProductId: string;
            let result;

            if (isNew) {
                // Create new product - ensure category_id is provided
                const categoryId = selectedCategories[0] || '';
                result = await itemService.createItem({
                    ...itemData,
                    category_id: categoryId,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                });
                
                if (result.error) {
                    Alert.alert('Error', 'Failed to create product: ' + result.error);
                    return;
                }
                
                savedProductId = result.data?.id || '';
                if (!savedProductId) {
                    Alert.alert('Error', 'Failed to get product ID after creation');
                    return;
                }
            } else {
                // Update existing product
                result = await itemService.updateItem(productId, itemData);
                
                if (result.error) {
                    Alert.alert('Error', 'Failed to update product: ' + result.error);
                    return;
                }
                
                savedProductId = productId;
            }

            // 3. Save images to item_images table
            // Images are stored in a separate table to support multiple images per product
            // Each image has a URL, display_order, and is_primary flag
            if (finalImageUrls.length > 0) {
                // Delete existing images
                const { error: deleteError } = await supabase
                    .from('item_images')
                    .delete()
                    .eq('item_id', savedProductId);

                if (deleteError) {
                    console.error('Failed to delete existing images:', deleteError);
                }

                // Insert new images
                const imageRecords = finalImageUrls.map((url, index) => ({
                    item_id: savedProductId,
                    image_url: url,  // Use 'image_url' - actual database column name
                    display_order: index,
                    is_primary: index === 0,
                }));

                const { error: insertError } = await supabase
                    .from('item_images')
                    .insert(imageRecords);

                if (insertError) {
                    console.error('Failed to save image records:', insertError);
                    Alert.alert('Warning', 'Product saved but failed to save images to database');
                }
            }

            // 4. Save product categories
            const categoryResult = await saveProductCategories(savedProductId, selectedCategories);
            if (categoryResult.error) {
                Alert.alert('Warning', 'Product saved but failed to update categories: ' + categoryResult.error);
            }

            Alert.alert('Success', isNew ? 'Product created successfully!' : 'Product updated successfully!');
            navigation.goBack();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('Error saving product:', err);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const { error } = await itemService.deleteItem(productId);
                            if (error) {
                                Alert.alert("Error", "Failed to delete product");
                            } else {
                                Alert.alert("Success", "Product deleted successfully");
                                navigation.goBack();
                            }
                        } catch (error) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            console.error('Error deleting product:', err);
                            Alert.alert("Error", "An unexpected error occurred");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={COLORS.primaryLight} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={DARK.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.orbPurple} />
            <View style={styles.orbPink} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isNew ? 'Add Product' : 'Edit Product'}</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        {!isNew && (
                            <TouchableOpacity onPress={handleDelete} style={[styles.headerActionBtn, { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.3)' }]}>
                                <Ionicons name="trash-outline" size={18} color="#F87171" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
                            {saving ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Images Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Product Images *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                            <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
                                <Ionicons name="images-outline" size={24} color={COLORS.primaryLight} />
                                <Text style={styles.addImageText}>Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addImageButton} onPress={handleTakePhoto}>
                                <Ionicons name="camera-outline" size={24} color={COLORS.primaryLight} />
                                <Text style={styles.addImageText}>Camera</Text>
                            </TouchableOpacity>

                            {images.map((img, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri: img.uri }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => {
                                            removeImage(index);
                                            if (errors.images) {
                                                const { images, ...rest } = errors;
                                                setErrors(rest);
                                            }
                                        }}
                                    >
                                        <Ionicons name="close-circle" size={20} color={COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                        {uploading && <Text style={styles.uploadingText}>Uploading images...</Text>}
                        {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
                    </View>

                    {/* Basic Info */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Product Name *</Text>
                        <TextInput 
                            style={[styles.input, errors.name && styles.inputError]} 
                            value={name} 
                            onChangeText={(text) => {
                                setName(text);
                                if (errors.name) {
                                    const { name, ...rest } = errors;
                                    setErrors(rest);
                                }
                            }} 
                            placeholder="e.g. Cotton T-Shirt"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                        />
                        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: SPACING.md }}>
                                <Text style={styles.label}>Price ($) *</Text>
                                <TextInput
                                    style={[styles.input, errors.price && styles.inputError]}
                                    value={price}
                                    onChangeText={(text) => {
                                        setPrice(text);
                                        if (errors.price) {
                                            const { price, ...rest } = errors;
                                            setErrors(rest);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                />
                                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Discount Price</Text>
                                <TextInput
                                    style={styles.input}
                                    value={compareAtPrice}
                                    onChangeText={setCompareAtPrice}
                                    keyboardType="numeric"
                                    placeholder="Optional"
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: SPACING.md }}>
                                <Text style={styles.label}>SKU *</Text>
                                <TextInput 
                                    style={[styles.input, errors.sku && styles.inputError]} 
                                    value={sku} 
                                    onChangeText={(text) => {
                                        setSku(text);
                                        if (errors.sku) {
                                            const { sku, ...rest } = errors;
                                            setErrors(rest);
                                        }
                                    }} 
                                    placeholder="TSH-001"
                                    placeholderTextColor="rgba(255,255,255,0.25)" 
                                />
                                {errors.sku ? <Text style={styles.errorText}>{errors.sku}</Text> : null}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Stock Count *</Text>
                                <TextInput
                                    style={[styles.input, errors.stock_quantity && styles.inputError]}
                                    value={stock}
                                    onChangeText={(text) => {
                                        setStock(text);
                                        if (errors.stock_quantity) {
                                            const { stock_quantity, ...rest } = errors;
                                            setErrors(rest);
                                        }
                                    }}
                                    keyboardType="numeric"
                                />
                                {errors.stock_quantity ? <Text style={styles.errorText}>{errors.stock_quantity}</Text> : null}
                            </View>
                        </View>
                    </View>

                    {/* Categories Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Categories *</Text>
                        {loadingCategories ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <View style={styles.categoriesContainer}>
                                {categories.map(category => (
                                    <TouchableOpacity
                                        key={category.id}
                                        onPress={() => toggleCategory(category.id)}
                                        style={[
                                            styles.categoryCheckbox,
                                            selectedCategories.includes(category.id) && styles.categoryCheckboxSelected
                                        ]}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            selectedCategories.includes(category.id) && styles.checkboxSelected
                                        ]}>
                                            {selectedCategories.includes(category.id) && (
                                                <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.categoryText,
                                            selectedCategories.includes(category.id) && styles.categoryTextSelected
                                        ]}>{category.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {errors.categories ? (
                            <Text style={styles.errorText}>{errors.categories}</Text>
                        ) : null}
                    </View>

                    {/* Sizes */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Available Sizes</Text>
                        <View style={styles.sizesContainer}>
                            {AVAILABLE_SIZES.map(size => (
                                <TouchableOpacity
                                    key={size}
                                    onPress={() => toggleSize(size)}
                                    style={[
                                        styles.sizeChip,
                                        selectedSizes.includes(size) && styles.sizeChipSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.sizeText,
                                        selectedSizes.includes(size) && styles.sizeTextSelected
                                    ]}>{size}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Tags</Text>
                        <View style={styles.tagInputContainer}>
                            <TextInput
                                style={styles.tagInput}
                                value={tagInput}
                                onChangeText={setTagInput}
                                placeholder="Add a tag..."
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                onSubmitEditing={addTag}
                            />
                            <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                                <Ionicons name="add" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tagsList}>
                            {tags.map((tag, index) => (
                                <View key={index} style={styles.tagChip}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                    <TouchableOpacity onPress={() => removeTag(tag)}>
                                        <Ionicons name="close" size={16} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                            value={description}
                            onChangeText={(text) => {
                                setDescription(text);
                                if (errors.description) {
                                    const { description, ...rest } = errors;
                                    setErrors(rest);
                                }
                            }}
                            multiline
                            numberOfLines={4}
                            placeholder="Product description..."
                            placeholderTextColor="rgba(255,255,255,0.25)"
                        />
                        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
                    </View>

                    {/* Status */}
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.label}>Product Status</Text>
                            <TouchableOpacity
                                style={[styles.statusToggle, isActive ? styles.statusActive : styles.statusInactive]}
                                onPress={() => setIsActive(!isActive)}
                            >
                                <Text style={[styles.statusToggleText, { color: isActive ? '#34D399' : 'rgba(255,255,255,0.4)' }]}>
                                    {isActive ? 'Published' : 'Hidden'}
                                </Text>
                                <Ionicons
                                    name={isActive ? "eye" : "eye-off"}
                                    size={20}
                                    color={isActive ? '#34D399' : 'rgba(255,255,255,0.4)'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK.background },
    orbPurple: {
        position: 'absolute', top: 100, right: -40, width: 160, height: 160,
        borderRadius: 80, backgroundColor: 'rgba(139,92,246,0.08)',
    },
    orbPink: {
        position: 'absolute', bottom: 200, left: -30, width: 120, height: 120,
        borderRadius: 60, backgroundColor: 'rgba(236,72,153,0.05)',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    },
    backButton: {
        backgroundColor: DARK.card.backgroundColor, padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    headerActionBtn: {
        padding: SPACING.sm, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    },
    saveButton: { borderRadius: BORDER_RADIUS.full, overflow: 'hidden', minWidth: 80, alignItems: 'center' },
    saveGradient: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, alignItems: 'center' },
    saveButtonText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
    headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.white },
    content: { paddingHorizontal: SPACING.md, paddingBottom: 120 },
    section: {
        backgroundColor: DARK.card.backgroundColor, padding: SPACING.md, marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.xxl, borderWidth: 1, borderColor: DARK.card.borderColor,
    },
    sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.md, color: COLORS.white },
    imageList: { flexDirection: 'row' },
    addImageButton: {
        width: 80, height: 80, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        borderStyle: 'dashed', borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    addImageText: { fontSize: FONT_SIZE.xs, color: COLORS.primaryLight, marginTop: 4 },
    imageWrapper: { width: 80, height: 80, marginRight: SPACING.md, position: 'relative' },
    previewImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.lg },
    removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: DARK.background, borderRadius: 12 },
    uploadingText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', marginTop: SPACING.sm, fontStyle: 'italic' },
    row: { flexDirection: 'row', gap: SPACING.md },
    label: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', marginBottom: SPACING.xs, fontWeight: FONT_WEIGHT.semibold },
    input: {
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md, color: COLORS.white, marginBottom: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: SPACING.md },
    sizesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    sizeChip: {
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)',
    },
    sizeChipSelected: { backgroundColor: 'rgba(99,102,241,0.3)', borderColor: '#6366F1' },
    sizeText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)' },
    sizeTextSelected: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
    tagInputContainer: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)', borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.sm, marginBottom: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tagInput: { flex: 1, paddingVertical: SPACING.sm, fontSize: FONT_SIZE.md, color: COLORS.white },
    addTagButton: { padding: SPACING.xs },
    tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
    tagChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(99,102,241,0.25)', paddingHorizontal: SPACING.md,
        paddingVertical: 4, borderRadius: BORDER_RADIUS.full, gap: 4,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)',
    },
    tagText: { fontSize: FONT_SIZE.sm, color: COLORS.white },
    statusToggle: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    },
    statusActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
    statusInactive: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
    statusToggleText: { fontWeight: FONT_WEIGHT.semibold },
    categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    categoryCheckbox: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', gap: SPACING.sm,
    },
    categoryCheckboxSelected: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)' },
    checkbox: {
        width: 20, height: 20, borderRadius: 6, borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    checkboxSelected: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    categoryText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.6)' },
    categoryTextSelected: { color: COLORS.white, fontWeight: FONT_WEIGHT.semibold },
    errorText: { color: '#F87171', fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
    inputError: { borderColor: '#F87171', borderWidth: 1.5 },
});

