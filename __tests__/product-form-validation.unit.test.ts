// Feature: admin-mobile-app-improvements
// Unit tests for product form validation edge cases

import { validateProductForm, hasValidationErrors, ProductFormData } from '../src/utils/productValidation';

describe('Product Form Validation - Unit Tests', () => {
  const validFormData: ProductFormData = {
    name: 'Test Product',
    description: 'Test Description',
    price: '10.99',
    stock_quantity: '5',
    sku: 'TEST-001',
    selectedCategories: ['cat-1'],
    images: [{ uri: 'https://example.com/image.jpg', isLocal: false }],
  };

  describe('Name validation', () => {
    test('rejects empty string', () => {
      const formData = { ...validFormData, name: '' };
      const errors = validateProductForm(formData);
      expect(errors.name).toBeDefined();
    });

    test('rejects whitespace-only string', () => {
      const formData = { ...validFormData, name: '   ' };
      const errors = validateProductForm(formData);
      expect(errors.name).toBeDefined();
    });

    test('accepts valid name', () => {
      const formData = { ...validFormData, name: 'Valid Product Name' };
      const errors = validateProductForm(formData);
      expect(errors.name).toBeUndefined();
    });
  });

  describe('Description validation', () => {
    test('rejects empty string', () => {
      const formData = { ...validFormData, description: '' };
      const errors = validateProductForm(formData);
      expect(errors.description).toBeDefined();
    });

    test('rejects whitespace-only string', () => {
      const formData = { ...validFormData, description: '   ' };
      const errors = validateProductForm(formData);
      expect(errors.description).toBeDefined();
    });

    test('accepts valid description', () => {
      const formData = { ...validFormData, description: 'Valid description' };
      const errors = validateProductForm(formData);
      expect(errors.description).toBeUndefined();
    });
  });

  describe('Price validation', () => {
    test('rejects empty string', () => {
      const formData = { ...validFormData, price: '' };
      const errors = validateProductForm(formData);
      expect(errors.price).toBeDefined();
    });

    test('rejects negative number', () => {
      const formData = { ...validFormData, price: '-10' };
      const errors = validateProductForm(formData);
      expect(errors.price).toBeDefined();
      expect(errors.price).toContain('greater than 0');
    });

    test('rejects zero', () => {
      const formData = { ...validFormData, price: '0' };
      const errors = validateProductForm(formData);
      expect(errors.price).toBeDefined();
      expect(errors.price).toContain('greater than 0');
    });

    test('rejects non-numeric string', () => {
      const formData = { ...validFormData, price: 'abc' };
      const errors = validateProductForm(formData);
      expect(errors.price).toBeDefined();
    });

    test('accepts valid positive number', () => {
      const formData = { ...validFormData, price: '10.99' };
      const errors = validateProductForm(formData);
      expect(errors.price).toBeUndefined();
    });

    test('accepts decimal number', () => {
      const formData = { ...validFormData, price: '0.01' };
      const errors = validateProductForm(formData);
      expect(errors.price).toBeUndefined();
    });
  });

  describe('Stock quantity validation', () => {
    test('rejects empty string', () => {
      const formData = { ...validFormData, stock_quantity: '' };
      const errors = validateProductForm(formData);
      expect(errors.stock_quantity).toBeDefined();
    });

    test('rejects negative number', () => {
      const formData = { ...validFormData, stock_quantity: '-5' };
      const errors = validateProductForm(formData);
      expect(errors.stock_quantity).toBeDefined();
      expect(errors.stock_quantity).toContain('negative');
    });

    test('accepts zero', () => {
      const formData = { ...validFormData, stock_quantity: '0' };
      const errors = validateProductForm(formData);
      expect(errors.stock_quantity).toBeUndefined();
    });

    test('accepts positive number', () => {
      const formData = { ...validFormData, stock_quantity: '100' };
      const errors = validateProductForm(formData);
      expect(errors.stock_quantity).toBeUndefined();
    });

    test('rejects non-numeric string', () => {
      const formData = { ...validFormData, stock_quantity: 'abc' };
      const errors = validateProductForm(formData);
      expect(errors.stock_quantity).toBeDefined();
    });
  });

  describe('SKU validation', () => {
    test('rejects empty string', () => {
      const formData = { ...validFormData, sku: '' };
      const errors = validateProductForm(formData);
      expect(errors.sku).toBeDefined();
    });

    test('rejects whitespace-only string', () => {
      const formData = { ...validFormData, sku: '   ' };
      const errors = validateProductForm(formData);
      expect(errors.sku).toBeDefined();
    });

    test('accepts valid SKU', () => {
      const formData = { ...validFormData, sku: 'PROD-001' };
      const errors = validateProductForm(formData);
      expect(errors.sku).toBeUndefined();
    });
  });

  describe('Categories validation', () => {
    test('rejects empty array', () => {
      const formData = { ...validFormData, selectedCategories: [] };
      const errors = validateProductForm(formData);
      expect(errors.categories).toBeDefined();
      expect(errors.categories).toContain('category');
    });

    test('accepts single category', () => {
      const formData = { ...validFormData, selectedCategories: ['cat-1'] };
      const errors = validateProductForm(formData);
      expect(errors.categories).toBeUndefined();
    });

    test('accepts multiple categories', () => {
      const formData = { ...validFormData, selectedCategories: ['cat-1', 'cat-2', 'cat-3'] };
      const errors = validateProductForm(formData);
      expect(errors.categories).toBeUndefined();
    });
  });

  describe('Images validation', () => {
    test('rejects empty array', () => {
      const formData = { ...validFormData, images: [] };
      const errors = validateProductForm(formData);
      expect(errors.images).toBeDefined();
      expect(errors.images).toContain('image');
    });

    test('accepts single image', () => {
      const formData = { ...validFormData, images: [{ uri: 'https://example.com/image.jpg', isLocal: false }] };
      const errors = validateProductForm(formData);
      expect(errors.images).toBeUndefined();
    });

    test('accepts multiple images', () => {
      const formData = {
        ...validFormData,
        images: [
          { uri: 'https://example.com/image1.jpg', isLocal: false },
          { uri: 'https://example.com/image2.jpg', isLocal: false },
          { uri: 'file:///local/image.jpg', isLocal: true },
        ],
      };
      const errors = validateProductForm(formData);
      expect(errors.images).toBeUndefined();
    });
  });

  describe('hasValidationErrors helper', () => {
    test('returns true when errors exist', () => {
      const errors = { name: 'Name is required', price: 'Price must be greater than 0' };
      expect(hasValidationErrors(errors)).toBe(true);
    });

    test('returns false when no errors exist', () => {
      const errors = {};
      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('Complete form validation', () => {
    test('returns no errors for valid form', () => {
      const errors = validateProductForm(validFormData);
      expect(hasValidationErrors(errors)).toBe(false);
      expect(Object.keys(errors).length).toBe(0);
    });

    test('returns multiple errors for invalid form', () => {
      const invalidFormData: ProductFormData = {
        name: '',
        description: '',
        price: '-10',
        stock_quantity: '-5',
        sku: '',
        selectedCategories: [],
        images: [],
      };
      const errors = validateProductForm(invalidFormData);
      expect(hasValidationErrors(errors)).toBe(true);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.name).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.price).toBeDefined();
      expect(errors.stock_quantity).toBeDefined();
      expect(errors.sku).toBeDefined();
      expect(errors.categories).toBeDefined();
      expect(errors.images).toBeDefined();
    });
  });
});
