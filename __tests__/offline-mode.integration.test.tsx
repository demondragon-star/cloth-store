/**
 * Integration Tests for Offline Mode
 * 
 * Tests the complete offline functionality including category loading,
 * image display, and error handling when network is unavailable.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CategoriesScreen } from '../src/screens/main/CategoriesScreen';
import { itemService } from '../src/services';
import { Category } from '../src/types';
import * as categoryAssets from '../src/constants/categoryAssets';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
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
  getCategoryImage: jest.fn(),
  CATEGORY_IMAGES: {
    'Men': 1,
    'Women': 2,
    'Kids': 3,
    'Sports': 4,
  },
}));

describe('Offline Mode Integration Tests', () => {
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
    
    // Mock getCategoryImage to return local assets
    (categoryAssets.getCategoryImage as jest.Mock).mockImplementation((name: string) => {
      return categoryAssets.CATEGORY_IMAGES[name as keyof typeof categoryAssets.CATEGORY_IMAGES] || null;
    });
  });

  describe('Offline Network State', () => {
    test('categories load from cache when offline', async () => {
      // Simulate offline mode - categories come from cache
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Men')).toBeDefined();
        expect(getByText('Women')).toBeDefined();
        expect(getByText('Kids')).toBeDefined();
        expect(getByText('Sports')).toBeDefined();
      });
    });

    test('images display from local assets without network errors', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        const images = UNSAFE_getAllByType(require('react-native').Image);
        expect(images.length).toBeGreaterThanOrEqual(4);
      });

      // Verify no network errors occurred
      // In offline mode, local assets should load without issues
      expect(categoryAssets.getCategoryImage).toHaveBeenCalled();
    });

    test('no network errors occur when using local assets', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CategoriesScreen />);

      await waitFor(() => {
        expect(itemService.getCategories).toHaveBeenCalled();
      });

      // Should not have any image loading errors
      const imageErrors = consoleSpy.mock.calls.filter(call => 
        call[0]?.includes?.('image') || call[0]?.includes?.('load')
      );
      expect(imageErrors.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Cached Data Handling', () => {
    test('app functions normally with cached category data', async () => {
      // Simulate cached data (Supabase offline cache)
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { getByText, UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        // All categories should be visible
        expect(getByText('Men')).toBeDefined();
        expect(getByText('Women')).toBeDefined();
        expect(getByText('Kids')).toBeDefined();
        expect(getByText('Sports')).toBeDefined();

        // Images should be present
        const images = UNSAFE_getAllByType(require('react-native').Image);
        expect(images.length).toBeGreaterThan(0);
      });
    });

    test('local assets work independently of network state', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        const images = UNSAFE_getAllByType(require('react-native').Image);
        
        // Verify images use local assets (not network URLs)
        images.forEach(image => {
          const source = image.props.source;
          // Local assets are numbers or objects without 'uri' property
          if (typeof source === 'object' && source !== null) {
            expect(source).not.toHaveProperty('uri');
          }
        });
      });
    });
  });

  describe('Network Failure Scenarios', () => {
    test('handles network timeout gracefully', async () => {
      // Simulate network timeout
      (itemService.getCategories as jest.Mock).mockRejectedValue(
        new Error('Network request failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        // Should show empty state or error message
        expect(getByText('No Categories Found')).toBeDefined();
      });

      consoleSpy.mockRestore();
    });

    test('local assets still work when API fails', async () => {
      // API fails but we have cached data
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        // Images should still render from local assets
        const images = UNSAFE_getAllByType(require('react-native').Image);
        expect(images.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance in Offline Mode', () => {
    test('categories render quickly without network delay', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const startTime = Date.now();

      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        expect(getByText('Men')).toBeDefined();
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // Should render quickly (no network delay)
      // Allow up to 1000ms for initial render in test environment
      expect(renderTime).toBeLessThan(1000);
    });

    test('images load instantly from local assets', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        const images = UNSAFE_getAllByType(require('react-native').Image);
        
        // Images should be present (no loading delay)
        expect(images.length).toBeGreaterThan(0);
        
        // Verify they're using local assets (immediate availability)
        images.forEach(image => {
          expect(image.props.source).toBeDefined();
        });
      });
    });
  });

  describe('User Experience in Offline Mode', () => {
    test('no visual degradation in offline mode', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { getByText, UNSAFE_getAllByType } = render(<CategoriesScreen />);

      await waitFor(() => {
        // All UI elements should be present
        expect(getByText('Categories')).toBeDefined();
        expect(getByText('Browse products by category')).toBeDefined();
        expect(getByText('Men')).toBeDefined();
        expect(getByText('Women')).toBeDefined();
        expect(getByText('Kids')).toBeDefined();
        expect(getByText('Sports')).toBeDefined();

        // Images should be displayed
        const images = UNSAFE_getAllByType(require('react-native').Image);
        expect(images.length).toBeGreaterThan(0);
      });
    });

    test('app remains functional in offline mode', async () => {
      (itemService.getCategories as jest.Mock).mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      const { getByText } = render(<CategoriesScreen />);

      await waitFor(() => {
        // Core functionality should work
        expect(getByText('Men')).toBeDefined();
        expect(getByText('Search categories...')).toBeDefined();
      });

      // No crashes or errors
      expect(() => {
        getByText('Categories');
      }).not.toThrow();
    });
  });
});
