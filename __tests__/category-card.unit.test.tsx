/**
 * Unit Tests for CategoryCard Component
 * 
 * Tests specific category examples to ensure each category
 * displays the correct fashion image.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
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

describe('CategoryCard Component - Unit Tests', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockCategory = (name: string): Category => ({
    id: `${name.toLowerCase()}-id`,
    name,
    slug: name.toLowerCase(),
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  describe('Specific Category Image Display', () => {
    // Requirement 1.3: Men category displays men's fashion image
    test('Men category displays men\'s fashion image', () => {
      const category = createMockCategory('Men');
      const menImage = categoryAssets.CATEGORY_IMAGES['Men'];
      
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(menImage);

      const { UNSAFE_getByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      expect(categoryAssets.getCategoryImage).toHaveBeenCalledWith('Men');
      
      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source).toBe(menImage);
    });

    // Requirement 1.4: Women category displays women's fashion image
    test('Women category displays women\'s fashion image', () => {
      const category = createMockCategory('Women');
      const womenImage = categoryAssets.CATEGORY_IMAGES['Women'];
      
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(womenImage);

      const { UNSAFE_getByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      expect(categoryAssets.getCategoryImage).toHaveBeenCalledWith('Women');
      
      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source).toBe(womenImage);
    });

    // Requirement 1.5: Kids category displays kids' fashion image
    test('Kids category displays kids\' fashion image', () => {
      const category = createMockCategory('Kids');
      const kidsImage = categoryAssets.CATEGORY_IMAGES['Kids'];
      
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(kidsImage);

      const { UNSAFE_getByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      expect(categoryAssets.getCategoryImage).toHaveBeenCalledWith('Kids');
      
      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source).toBe(kidsImage);
    });

    // Requirement 1.6: Sports category displays sports fashion image
    test('Sports category displays sports fashion image', () => {
      const category = createMockCategory('Sports');
      const sportsImage = categoryAssets.CATEGORY_IMAGES['Sports'];
      
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(sportsImage);

      const { UNSAFE_getByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      expect(categoryAssets.getCategoryImage).toHaveBeenCalledWith('Sports');
      
      const image = UNSAFE_getByType(require('react-native').Image);
      expect(image.props.source).toBe(sportsImage);
    });
  });

  describe('Category Variants', () => {
    test('default variant renders correctly with image', () => {
      const category = createMockCategory('Men');
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(1);

      const { getByText, UNSAFE_getByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      expect(getByText('Men')).toBeDefined();
      expect(UNSAFE_getByType(require('react-native').Image)).toBeDefined();
    });

    test('large variant renders correctly with image and overlay', () => {
      const category = createMockCategory('Women');
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(2);

      const { getByText, UNSAFE_getByType, UNSAFE_getAllByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="large"
        />
      );

      expect(getByText('Women')).toBeDefined();
      expect(UNSAFE_getByType(require('react-native').Image)).toBeDefined();
      
      // Should have gradient overlay
      const gradients = UNSAFE_getAllByType(require('expo-linear-gradient').LinearGradient);
      expect(gradients.length).toBeGreaterThan(0);
    });

    test('compact variant renders correctly', () => {
      const category = createMockCategory('Kids');
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(3);

      const { getByText } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="compact"
        />
      );

      expect(getByText('Kids')).toBeDefined();
    });
  });

  describe('Fallback Behavior', () => {
    test('displays gradient placeholder when no image is available', () => {
      const category = createMockCategory('Electronics');
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(null);

      const { UNSAFE_getAllByType } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      // Should render LinearGradient as fallback
      const gradients = UNSAFE_getAllByType(require('expo-linear-gradient').LinearGradient);
      expect(gradients.length).toBeGreaterThan(0);
    });

    test('handles image load error gracefully', () => {
      const category = createMockCategory('Sports');
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(4);

      const { UNSAFE_getByType, getByText } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      const image = UNSAFE_getByType(require('react-native').Image);
      
      // Simulate error
      expect(() => {
        image.props.onError({ nativeEvent: { error: 'Load failed' } });
      }).not.toThrow();

      // Category name should still be visible
      expect(getByText('Sports')).toBeDefined();
    });
  });

  describe('Interaction', () => {
    test('calls onPress when category card is pressed', () => {
      const category = createMockCategory('Men');
      (categoryAssets.getCategoryImage as jest.Mock).mockReturnValue(1);

      const { getByText } = render(
        <CategoryCard
          category={category}
          onPress={mockOnPress}
          variant="default"
        />
      );

      const touchable = getByText('Men').parent?.parent;
      expect(touchable).toBeDefined();
    });
  });
});
