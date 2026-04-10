/**
 * Feature: category-display-improvements
 * Property-based tests for CategoryCard component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import { CategoryCard } from '../src/components/CategoryCard';
import { Category } from '../src/types';
import * as categoryAssets from '../src/constants/categoryAssets';

// Mock the category assets module
jest.mock('../src/constants/categoryAssets', () => ({
  getCategoryImage: jest.fn(),
  CATEGORY_IMAGES: {
    'Men': 1, // Mock image source (require() returns a number in tests)
    'Women': 2,
    'Kids': 3,
    'Sports': 4,
  },
}));

describe('CategoryCard Component - Property Tests', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Feature: category-display-improvements, Property 1: Category image rendering
  // **Validates: Requirements 1.1, 1.2**
  describe('Property 1: Category image rendering', () => {
    test('for any active category with image_url or matching asset name, CategoryCard renders an Image component', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
            slug: fc.string({ minLength: 1 }),
            image_url: fc.option(fc.webUrl(), { nil: undefined }),
            display_order: fc.integer({ min: 1, max: 4 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            // Mock getCategoryImage to return a valid image source for these categories
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(
              categoryAssets.CATEGORY_IMAGES[category.name as keyof typeof categoryAssets.CATEGORY_IMAGES]
            );

            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            // Should render an Image component (not just a gradient placeholder)
            const images = UNSAFE_getByType(require('react-native').Image);
            expect(images).toBeDefined();
            
            // Verify getCategoryImage was called with the category name
            expect(categoryAssets.getCategoryImage).toHaveBeenCalledWith(category.name);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('for any category with local asset, Image component receives valid source prop', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
            slug: fc.string({ minLength: 1 }),
            display_order: fc.integer({ min: 1, max: 4 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            const mockImageSource = categoryAssets.CATEGORY_IMAGES[category.name as keyof typeof categoryAssets.CATEGORY_IMAGES];
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(mockImageSource);

            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            const image = UNSAFE_getByType(require('react-native').Image);
            expect(image.props.source).toBe(mockImageSource);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('for any category with image_url but no local asset, Image uses remote URL', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }).filter(n => !['Men', 'Women', 'Kids', 'Sports'].includes(n)),
            slug: fc.string({ minLength: 1 }),
            image_url: fc.webUrl(),
            display_order: fc.integer({ min: 1, max: 10 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            // Mock getCategoryImage to return null (no local asset)
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(null);

            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            const image = UNSAFE_getByType(require('react-native').Image);
            expect(image.props.source).toEqual({ uri: category.image_url });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: category-display-improvements, Property 2: Image load failure fallback
  // **Validates: Requirements 1.7**
  describe('Property 2: Image load failure fallback', () => {
    test('for any category where image fails to load, CategoryCard displays fallback without crashing', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
            slug: fc.string({ minLength: 1 }),
            image_url: fc.option(fc.webUrl(), { nil: undefined }),
            display_order: fc.integer({ min: 1, max: 4 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(
              categoryAssets.CATEGORY_IMAGES[category.name as keyof typeof categoryAssets.CATEGORY_IMAGES]
            );

            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            const image = UNSAFE_getByType(require('react-native').Image);
            
            // Simulate image load error
            const onError = image.props.onError;
            expect(onError).toBeDefined();
            
            // Should not throw when error handler is called
            expect(() => {
              onError({ nativeEvent: { error: 'Failed to load' } });
            }).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: category-display-improvements, Property 5: Backward compatibility with missing images
  // **Validates: Requirements 5.1**
  describe('Property 5: Backward compatibility with missing images', () => {
    test('for any category without image_url and without matching asset, CategoryCard displays gradient placeholder', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }).filter(n => !['Men', 'Women', 'Kids', 'Sports'].includes(n)),
            slug: fc.string({ minLength: 1 }),
            image_url: fc.constant(undefined),
            display_order: fc.integer({ min: 1, max: 10 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            // Mock getCategoryImage to return null (no local asset)
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(null);

            const { UNSAFE_getAllByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            // Should render LinearGradient as fallback
            const gradients = UNSAFE_getAllByType(require('expo-linear-gradient').LinearGradient);
            expect(gradients.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: category-display-improvements, Property 6: Error resilience
  // **Validates: Requirements 5.2, 5.3**
  describe('Property 6: Error resilience', () => {
    test('for any category with invalid image_url, CategoryCard handles errors gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            slug: fc.string({ minLength: 1 }),
            image_url: fc.string({ minLength: 1 }), // Invalid URL
            display_order: fc.integer({ min: 1, max: 10 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(null);

            // Should not throw during render
            expect(() => {
              render(
                <CategoryCard
                  category={category as Category}
                  onPress={mockOnPress}
                  variant="default"
                />
              );
            }).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('for any category, CategoryCard continues functioning after image error', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
            slug: fc.string({ minLength: 1 }),
            display_order: fc.integer({ min: 1, max: 4 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(1);

            const { UNSAFE_getByType, getByText } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            const image = UNSAFE_getByType(require('react-native').Image);
            
            // Trigger error
            image.props.onError({ nativeEvent: { error: 'Failed' } });
            
            // Component should still display category name
            expect(getByText(category.name)).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: category-display-improvements, Property 8: Large variant overlay
  // **Validates: Requirements 5.5**
  describe('Property 8: Large variant overlay', () => {
    test('for any category with large variant, CategoryCard displays both image and gradient overlay', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
            slug: fc.string({ minLength: 1 }),
            display_order: fc.integer({ min: 1, max: 4 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(1);

            const { UNSAFE_getByType, UNSAFE_getAllByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="large"
              />
            );

            // Should have Image component
            const image = UNSAFE_getByType(require('react-native').Image);
            expect(image).toBeDefined();

            // Should have LinearGradient overlay
            const gradients = UNSAFE_getAllByType(require('expo-linear-gradient').LinearGradient);
            expect(gradients.length).toBeGreaterThan(0);
            
            // Verify gradient has overlay colors
            const overlay = gradients.find((g: any) => 
              g.props.colors && g.props.colors.includes('transparent')
            );
            expect(overlay).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
