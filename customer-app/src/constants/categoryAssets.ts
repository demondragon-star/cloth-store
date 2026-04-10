/**
 * Category Image Assets Configuration
 * 
 * This module provides mappings between category names and their corresponding
 * image sources. Currently using remote URLs as placeholders.
 * 
 */

import { ImageSourcePropType } from 'react-native';

/**
 * Mapping of category names to their image sources
 * 
 * Note: Currently using placeholder URLs from Unsplash
 * To use local assets: Replace URLs with require('../../assets/images/categories/[name].jpg')
 * Format: 1200x800px JPG, optimized to <500KB
 */
export const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  'Men': { uri: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1200&h=800&fit=crop' },
  'Women': { uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=800&fit=crop' },
  'Kids': { uri: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&h=800&fit=crop' },
  'Sports': { uri: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=800&fit=crop' },
};

/**
 * Helper function to get category image by name
 * 
 * @param categoryName - The name of the category (e.g., 'Men', 'Women')
 * @returns The image source for the category, or null if not found
 * 
 * @example
 * const image = getCategoryImage('Men');
 * if (image) {
 *   <Image source={image} />
 * }
 */
export const getCategoryImage = (categoryName: string): ImageSourcePropType | null => {
  const image = CATEGORY_IMAGES[categoryName];
  
  if (!image) {
    console.warn(`No image mapping found for category: ${categoryName}`);
    return null;
  }
  
  return image;
};

/**
 * Check if a category has an image mapping
 * 
 * @param categoryName - The name of the category
 * @returns True if the category has an image mapping
 */
export const hasCategoryImage = (categoryName: string): boolean => {
  return categoryName in CATEGORY_IMAGES;
};

/**
 * Get all available category names that have image mappings
 * 
 * @returns Array of category names with images
 */
export const getAvailableCategories = (): string[] => {
  return Object.keys(CATEGORY_IMAGES);
};
