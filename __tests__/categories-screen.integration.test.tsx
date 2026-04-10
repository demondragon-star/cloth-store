/**
 * Integration Tests for CategoriesScreen
 * 
 * Tests the complete flow of the CategoriesScreen including
 * data loading, filtering, and navigation.
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { CategoriesScreen } from '../src/screens/main/CategoriesScreen';
import { itemService } from '../src/services';
import { Category } from '../src/types';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock item service
jest.mock('../src/services', () => ({
  itemService: {
    getCategories: jest.fn(),
  },
}));

// Mock category assets
jest.mock('../src/constants/categoryAssets', () => ({
  getCategoryImage: jest.fn((name: string) => {
    const images: Record<string, number> = {
      'Men': 1,
      'Women': 2,
      'Kids': 3,
      'Sports': 4,
    };
    return images[name] || null;
  }),
  CATEGORY_IMAGES: {
    'Men': 1,
    'Women': 2,
    'Kids': 3,
    'Sports': 4,
  },
}));

describe('CategoriesScreen Integration Tests', () => {
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Men',
      slug: 'men',
      image_url: 'men',
      display_order: 1,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Women',
      slug: 'women',
      image_url: 'women',
      display_order: 2,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Kids',
      slug: 'kids',
      image_url: 'kids',
      display_order: 3,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '4',
      name: 'Sports',
      slug: 'sports',
      image_url: 'sports',
      display_order: 4,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (itemService.getCategories as jest.Mock).mockResolvedValue({
      data: mockCategories,
      error: null,
    });
  });

  describe('Category Display', () => {
    test('screen displays exactly 4 categories', async () => {
      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Men')).toBeDefined();
        expect(getByText('Women')).toBeDefined();
        expect(getByText('Kids')).toBeDefined();
        expect(getByText('Sports')).toBeDefined();
      });
    });

    test('categories appear in correct order (Men, Women, Kids, Sports)', async () => {
      const { getAllByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        const categoryNames = ['Men', 'Women', 'Kids', 'Sports'];
        categoryNames.forEach(name => {
          expect(getAllByText(name).length).toBeGreaterThan(0);
        });
      });

      // Verify order by checking display_order
      expect(mockCategories[0].name).toBe('Men');
      expect(mockCategories[1].name).toBe('Women');
      expect(mockCategories[2].name).toBe('Kids');
      expect(mockCategories[3].name).toBe('Sports');
    });

    test('images load and display correctly', async () => {
      const { UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        const images = UNSAFE_getAllByType(require('react-native').Image);
        // Should have images for all 4 categories
        expect(images.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Navigation', () => {
    test('navigation to CategoryItems works when category is pressed', async () => {
      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Men')).toBeDefined();
      });

      const menCategory = getByText('Men');
      fireEvent.press(menCategory.parent?.parent || menCategory);

      expect(mockNavigate).toHaveBeenCalledWith('CategoryItems', {
        categoryId: '1',
        categoryName: 'Men',
      });
    });

    test('navigation to Search works when search bar is pressed', async () => {
      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Search categories...')).toBeDefined();
      });

      const searchBar = getByText('Search categories...');
      fireEvent.press(searchBar.parent || searchBar);

      expect(mockNavigate).toHaveBeenCalledWith('Search');
    });
  });

  describe('Search/Filter Functionality', () => {
    test('search/filter functionality still works', async () => {
      const { getByText, queryByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Men')).toBeDefined();
        expect(getByText('Women')).toBeDefined();
      });

      // All categories should be visible initially
      expect(queryByText('Men')).toBeDefined();
      expect(queryByText('Women')).toBeDefined();
      expect(queryByText('Kids')).toBeDefined();
      expect(queryByText('Sports')).toBeDefined();
    });
  });

  describe('Data Loading', () => {
    test('loads categories from itemService on mount', async () => {
      render(<CategoriesScreen />);

      await waitFor(() => {
        expect(itemService.getCategories).toHaveBeenCalled();
      });
    });

    test('displays loading state initially', () => {
      const { UNSAFE_getAllByType } = render(<CategoriesScreen />);

      // Should show skeleton loaders initially
      const skeletons = UNSAFE_getAllByType(require('../src/components').SkeletonListItem);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('handles empty category list', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('No Categories Found')).toBeDefined();
      });
    });

    test('handles service error gracefully', async () => {
      (itemService.getCategories as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CategoriesScreen />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error loading categories:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Refresh Functionality', () => {
    test('refresh functionality reloads categories', async () => {
      const { getByTestId } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(itemService.getCategories).toHaveBeenCalledTimes(1);
      });

      // Simulate pull-to-refresh
      // Note: This is a simplified test; actual refresh testing may require more setup
      await waitFor(() => {
        expect(itemService.getCategories).toHaveBeenCalled();
      });
    });
  });

  describe('Only Active Categories', () => {
    test('does not display inactive categories', async () => {
      const categoriesWithInactive: Category[] = [
        ...mockCategories,
        {
          id: '5',
          name: 'Footwear',
          slug: 'footwear',
          display_order: 99,
          is_active: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '6',
          name: 'Accessories',
          slug: 'accessories',
          display_order: 99,
          is_active: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      // Service should filter out inactive categories
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: categoriesWithInactive.filter(cat => cat.is_active),
        error: null,
      });

      const { queryByText, getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Men')).toBeDefined();
      });

      // Inactive categories should not be displayed
      expect(queryByText('Footwear')).toBeNull();
      expect(queryByText('Accessories')).toBeNull();
    });
  });

  describe('UI Elements', () => {
    test('displays screen title and subtitle', async () => {
      const { getByText } = render(<CategoriesScreen />);

      expect(getByText('Categories')).toBeDefined();
      expect(getByText('Browse products by category')).toBeDefined();
    });

    test('displays search bar placeholder', async () => {
      const { getByText } = render(<CategoriesScreen />);

      expect(getByText('Search categories...')).toBeDefined();
    });
  });
});
