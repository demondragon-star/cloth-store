/**
 * Feature: category-display-improvements
 * Property-based tests for offline asset availability
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
    'Men': 1,
    'Women': 2,
    'Kids': 3,
    'Sports': 4,
  },
}));

describe('Offline Functionality - Property Tests', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Feature: category-display-improvements, Property 7: Offline asset availability
  // **Validates: Requirements 5.4**
  describe('Property 7: Offline asset availability', () => {
    test('for any category with local asset mapping, CategoryCard displays image successfully in offline mode', () => {
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
            // Mock local asset (simulating offline mode - no network requests)
            const localAsset = categoryAssets.CATEGORY_IMAGES[category.name as keyof typeof categoryAssets.CATEGORY_IMAGES];
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(localAsset);

            // Render should succeed without network
            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            // Should render Image component with local asset
            const image = UNSAFE_getByType(require('react-native').Image);
            expect(image).toBeDefined();
            expect(image.props.source).toBe(localAsset);
            
            // Verify no network URL is used
            expect(image.props.source).not.toHaveProperty('uri');
          }
        ),
        { numRuns: 50 }
      );
    });

    test('local assets work without network connection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
          (categoryName) => {
            const category: Category = {
              id: `${categoryName}-id`,
              name: categoryName,
              slug: categoryName.toLowerCase(),
              display_order: 1,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const localAsset = categoryAssets.CATEGORY_IMAGES[categoryName as keyof typeof categoryAssets.CATEGORY_IMAGES];
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(localAsset);

            // Should not throw even in "offline" mode
            expect(() => {
              render(
                <CategoryCard
                  category={category}
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

    test('local assets are immediately available without async loading', () => {
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
            const localAsset = categoryAssets.CATEGORY_IMAGES[category.name as keyof typeof categoryAssets.CATEGORY_IMAGES];
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(localAsset);

            const startTime = Date.now();
            
            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            const endTime = Date.now();
            const renderTime = endTime - startTime;

            // Render should be fast (synchronous, no network delay)
            // Allow up to 100ms for render (generous for test environment)
            expect(renderTime).toBeLessThan(100);

            // Image should be present immediately
            const image = UNSAFE_getByType(require('react-native').Image);
            expect(image).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('offline mode does not degrade user experience', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
              slug: fc.string({ minLength: 1 }),
              display_order: fc.integer({ min: 1, max: 4 }),
              is_active: fc.constant(true),
              created_at: fc.date().map(d => d.toISOString()),
              updated_at: fc.date().map(d => d.toISOString()),
            }),
            { minLength: 1, maxLength: 4 }
          ),
          (categories) => {
            // Simulate offline mode - all categories use local assets
            (categoryAssets.getCategoryImage as jest.Mock).mockImplementation((name: string) => {
              return categoryAssets.CATEGORY_IMAGES[name as keyof typeof categoryAssets.CATEGORY_IMAGES] || null;
            });

            // All categories should render successfully
            categories.forEach(category => {
              expect(() => {
                render(
                  <CategoryCard
                    category={category as Category}
                    onPress={mockOnPress}
                    variant="default"
                  />
                );
              }).not.toThrow();
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Offline vs Online Behavior', () => {
    test('local assets take priority over remote URLs even when online', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom('Men', 'Women', 'Kids', 'Sports'),
            slug: fc.string({ minLength: 1 }),
            image_url: fc.webUrl(), // Remote URL provided
            display_order: fc.integer({ min: 1, max: 4 }),
            is_active: fc.constant(true),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          (category) => {
            const localAsset = categoryAssets.CATEGORY_IMAGES[category.name as keyof typeof categoryAssets.CATEGORY_IMAGES];
            (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(localAsset);

            const { UNSAFE_getByType } = render(
              <CategoryCard
                category={category as Category}
                onPress={mockOnPress}
                variant="default"
              />
            );

            const image = UNSAFE_getByType(require('react-native').Image);
            
            // Should use local asset, not remote URL
            expect(image.props.source).toBe(localAsset);
            expect(image.props.source).not.toEqual({ uri: category.image_url });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
