/**
 * Unit Tests for Category Assets Configuration
 * 
 * Tests the category image asset mapping functionality to ensure
 * all categories have valid image mappings and helper functions work correctly.
 */

import {
  CATEGORY_IMAGES,
  getCategoryImage,
  hasCategoryImage,
  getAvailableCategories,
} from '../src/constants/categoryAssets';

describe('Category Assets Configuration', () => {
  describe('CATEGORY_IMAGES mapping', () => {
    it('should have exactly 4 category mappings', () => {
      const categoryCount = Object.keys(CATEGORY_IMAGES).length;
      expect(categoryCount).toBe(4);
    });

    it('should have mappings for Men, Women, Kids, and Sports', () => {
      expect(CATEGORY_IMAGES).toHaveProperty('Men');
      expect(CATEGORY_IMAGES).toHaveProperty('Women');
      expect(CATEGORY_IMAGES).toHaveProperty('Kids');
      expect(CATEGORY_IMAGES).toHaveProperty('Sports');
    });

    it('should have valid image sources for all categories', () => {
      Object.entries(CATEGORY_IMAGES).forEach(([category, image]) => {
        expect(image).toBeDefined();
        expect(image).not.toBeNull();
        // Image sources from require() are typically numbers or objects or strings (in tests)
        expect(['number', 'object', 'string'].includes(typeof image)).toBe(true);
      });
    });
  });

  describe('getCategoryImage()', () => {
    it('should return correct asset for Men category', () => {
      const image = getCategoryImage('Men');
      expect(image).toBeDefined();
      expect(image).toBe(CATEGORY_IMAGES['Men']);
    });

    it('should return correct asset for Women category', () => {
      const image = getCategoryImage('Women');
      expect(image).toBeDefined();
      expect(image).toBe(CATEGORY_IMAGES['Women']);
    });

    it('should return correct asset for Kids category', () => {
      const image = getCategoryImage('Kids');
      expect(image).toBeDefined();
      expect(image).toBe(CATEGORY_IMAGES['Kids']);
    });

    it('should return correct asset for Sports category', () => {
      const image = getCategoryImage('Sports');
      expect(image).toBeDefined();
      expect(image).toBe(CATEGORY_IMAGES['Sports']);
    });

    it('should return null for unmapped category', () => {
      const image = getCategoryImage('Footwear');
      expect(image).toBeNull();
    });

    it('should return null for Accessories category', () => {
      const image = getCategoryImage('Accessories');
      expect(image).toBeNull();
    });

    it('should return null for empty string', () => {
      const image = getCategoryImage('');
      expect(image).toBeNull();
    });

    it('should return null for non-existent category', () => {
      const image = getCategoryImage('Electronics');
      expect(image).toBeNull();
    });

    it('should be case-sensitive', () => {
      const lowerCase = getCategoryImage('men');
      const upperCase = getCategoryImage('MEN');
      expect(lowerCase).toBeNull();
      expect(upperCase).toBeNull();
    });

    it('should log warning for unmapped categories', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      getCategoryImage('Unknown');
      expect(consoleSpy).toHaveBeenCalledWith(
        'No image mapping found for category: Unknown'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('hasCategoryImage()', () => {
    it('should return true for Men category', () => {
      expect(hasCategoryImage('Men')).toBe(true);
    });

    it('should return true for Women category', () => {
      expect(hasCategoryImage('Women')).toBe(true);
    });

    it('should return true for Kids category', () => {
      expect(hasCategoryImage('Kids')).toBe(true);
    });

    it('should return true for Sports category', () => {
      expect(hasCategoryImage('Sports')).toBe(true);
    });

    it('should return false for unmapped category', () => {
      expect(hasCategoryImage('Footwear')).toBe(false);
    });

    it('should return false for Accessories', () => {
      expect(hasCategoryImage('Accessories')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasCategoryImage('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(hasCategoryImage('men')).toBe(false);
      expect(hasCategoryImage('WOMEN')).toBe(false);
    });
  });

  describe('getAvailableCategories()', () => {
    it('should return array of 4 categories', () => {
      const categories = getAvailableCategories();
      expect(categories).toHaveLength(4);
    });

    it('should return Men, Women, Kids, and Sports', () => {
      const categories = getAvailableCategories();
      expect(categories).toContain('Men');
      expect(categories).toContain('Women');
      expect(categories).toContain('Kids');
      expect(categories).toContain('Sports');
    });

    it('should not include Footwear or Accessories', () => {
      const categories = getAvailableCategories();
      expect(categories).not.toContain('Footwear');
      expect(categories).not.toContain('Accessories');
    });

    it('should return array with no duplicates', () => {
      const categories = getAvailableCategories();
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });
  });
});
