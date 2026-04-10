// Feature: admin-mobile-app-improvements
// Property-based tests for product form validation

import fc from 'fast-check';
import { validateProductForm, hasValidationErrors, ProductFormData } from '../src/utils/productValidation';

describe('Product Form Validation - Property Tests', () => {
  // Feature: admin-mobile-app-improvements, Property 1: Form Validation Identifies Invalid Fields
  // **Validates: Requirements 1.2, 1.5**
  describe('Property 1: Form Validation Identifies Invalid Fields', () => {
    test('validates that empty name is rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constant(''),
            description: fc.string({ minLength: 1 }),
            price: fc.double({ min: 0.01, noNaN: true }).map(String),
            stock_quantity: fc.integer({ min: 0 }).map(String),
            sku: fc.string({ minLength: 1 }),
            selectedCategories: fc.array(fc.uuid(), { minLength: 1 }),
            images: fc.array(fc.record({ uri: fc.webUrl(), isLocal: fc.boolean() }), { minLength: 1 }),
          }),
          (formData) => {
            const errors = validateProductForm(formData as ProductFormData);
            expect(errors.name).toBeDefined();
            expect(errors.name).toContain('required');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates that negative price is rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            description: fc.string({ minLength: 1 }),
            price: fc.double({ max: 0, noNaN: true }).map(String),
            stock_quantity: fc.integer({ min: 0 }).map(String),
            sku: fc.string({ minLength: 1 }),
            selectedCategories: fc.array(fc.uuid(), { minLength: 1 }),
            images: fc.array(fc.record({ uri: fc.webUrl(), isLocal: fc.boolean() }), { minLength: 1 }),
          }),
          (formData) => {
            const errors = validateProductForm(formData as ProductFormData);
            expect(errors.price).toBeDefined();
            expect(errors.price).toMatch(/greater than 0|required/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates that negative stock is rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            description: fc.string({ minLength: 1 }),
            price: fc.double({ min: 0.01, noNaN: true }).map(String),
            stock_quantity: fc.integer({ max: -1 }).map(String),
            sku: fc.string({ minLength: 1 }),
            selectedCategories: fc.array(fc.uuid(), { minLength: 1 }),
            images: fc.array(fc.record({ uri: fc.webUrl(), isLocal: fc.boolean() }), { minLength: 1 }),
          }),
          (formData) => {
            const errors = validateProductForm(formData as ProductFormData);
            expect(errors.stock_quantity).toBeDefined();
            expect(errors.stock_quantity).toContain('negative');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates that empty categories array is rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            description: fc.string({ minLength: 1 }),
            price: fc.double({ min: 0.01, noNaN: true }).map(String),
            stock_quantity: fc.integer({ min: 0 }).map(String),
            sku: fc.string({ minLength: 1 }),
            selectedCategories: fc.constant([] as string[]),
            images: fc.array(fc.record({ uri: fc.webUrl(), isLocal: fc.boolean() }), { minLength: 1 }),
          }),
          (formData) => {
            const errors = validateProductForm(formData as ProductFormData);
            expect(errors.categories).toBeDefined();
            expect(errors.categories).toContain('category');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates that empty images array is rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            description: fc.string({ minLength: 1 }),
            price: fc.double({ min: 0.01, noNaN: true }).map(String),
            stock_quantity: fc.integer({ min: 0 }).map(String),
            sku: fc.string({ minLength: 1 }),
            selectedCategories: fc.array(fc.uuid(), { minLength: 1 }),
            images: fc.constant([] as { uri: string; isLocal: boolean }[]),
          }),
          (formData) => {
            const errors = validateProductForm(formData as ProductFormData);
            expect(errors.images).toBeDefined();
            expect(errors.images).toContain('image');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validates that valid form data passes validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            description: fc.string({ minLength: 1 }),
            price: fc.double({ min: 0.01, noNaN: true }).map(String),
            stock_quantity: fc.integer({ min: 0 }).map(String),
            sku: fc.string({ minLength: 1 }),
            selectedCategories: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
            images: fc.array(fc.record({ uri: fc.webUrl(), isLocal: fc.boolean() }), { minLength: 1, maxLength: 5 }),
          }),
          (formData) => {
            const errors = validateProductForm(formData as ProductFormData);
            expect(hasValidationErrors(errors)).toBe(false);
            expect(Object.keys(errors).length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
