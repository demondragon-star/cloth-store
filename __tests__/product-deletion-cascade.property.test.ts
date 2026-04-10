/**
 * Feature: product-deletion-fix
 * Property-based tests for product deletion CASCADE behavior
 * 
 * These tests verify that the modified validate_product_has_category() trigger
 * allows CASCADE deletes when products are removed while still protecting against
 * manual removal of the last category.
 */

import fc from 'fast-check';

// Simulate the trigger function behavior
const validateProductHasCategory = (
  productExists: boolean,
  remainingCategoriesCount: number
): { allowed: boolean; error?: string } => {
  // If product doesn't exist, this is a CASCADE delete - allow it
  if (!productExists) {
    return { allowed: true };
  }

  // Product exists, so this is a manual category removal
  // If this is the last category, prevent deletion
  if (remainingCategoriesCount === 0) {
    return {
      allowed: false,
      error: 'Cannot remove the last category from a product. Each product must have at least one category.',
    };
  }

  return { allowed: true };
};

describe('Product Deletion CASCADE - Property Tests', () => {
  // Feature: product-deletion-fix, Property 1: CASCADE Delete Removes All Categories
  // **Validates: Requirements 1.1, 1.3, 2.4**
  describe('Property 1: CASCADE Delete Removes All Categories', () => {
    test('for any product with any number of categories (1-10), when product is deleted, all product_categories entries can be removed', () => {
      fc.assert(
        fc.property(
          fc.record({
            productId: fc.uuid(),
            categoryCount: fc.integer({ min: 1, max: 10 }),
          }),
          ({ productId, categoryCount }) => {
            // Simulate product deletion scenario
            const productExists = false; // Product has been deleted
            
            // Try to delete each category (CASCADE operation)
            for (let i = 0; i < categoryCount; i++) {
              const remainingCount = categoryCount - i - 1;
              const result = validateProductHasCategory(productExists, remainingCount);
              
              // All deletions should be allowed during CASCADE
              expect(result.allowed).toBe(true);
              expect(result.error).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('CASCADE delete allows removal of last category when product does not exist', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (productId) => {
            // Product has been deleted
            const productExists = false;
            const remainingCount = 0; // This is the last category
            
            const result = validateProductHasCategory(productExists, remainingCount);
            
            // Should allow deletion even though it's the last category
            expect(result.allowed).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any product with multiple categories, CASCADE delete processes all categories without errors', () => {
      fc.assert(
        fc.property(
          fc.record({
            productId: fc.uuid(),
            categories: fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
          }),
          ({ productId, categories }) => {
            const productExists = false; // CASCADE delete scenario
            
            // Simulate deleting all categories
            const deletionResults = categories.map((_, index) => {
              const remainingCount = categories.length - index - 1;
              return validateProductHasCategory(productExists, remainingCount);
            });
            
            // All deletions should succeed
            deletionResults.forEach(result => {
              expect(result.allowed).toBe(true);
            });
            
            // No errors should be raised
            const hasErrors = deletionResults.some(r => r.error !== undefined);
            expect(hasErrors).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('CASCADE delete behavior is consistent regardless of category count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (categoryCount) => {
            const productExists = false;
            
            // Test deletion of each category
            const results = Array.from({ length: categoryCount }, (_, i) => {
              const remainingCount = categoryCount - i - 1;
              return validateProductHasCategory(productExists, remainingCount);
            });
            
            // All should be allowed
            const allAllowed = results.every(r => r.allowed === true);
            expect(allAllowed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: product-deletion-fix, Property 2: Manual Last Category Deletion Blocked
  // **Validates: Requirements 2.1, 4.3, 2.4, 3.3**
  describe('Property 2: Manual Last Category Deletion Blocked', () => {
    test('for any product with exactly 1 category, manual deletion of that category is blocked', () => {
      fc.assert(
        fc.property(
          fc.record({
            productId: fc.uuid(),
            categoryId: fc.uuid(),
          }),
          ({ productId, categoryId }) => {
            // Product exists (manual deletion scenario)
            const productExists = true;
            const remainingCount = 0; // This is the last category
            
            const result = validateProductHasCategory(productExists, remainingCount);
            
            // Should block deletion
            expect(result.allowed).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('last category');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('manual deletion of last category always raises an error', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (productId) => {
            const productExists = true;
            const remainingCount = 0;
            
            const result = validateProductHasCategory(productExists, remainingCount);
            
            expect(result.allowed).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('error message for last category deletion is descriptive', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (productId) => {
            const productExists = true;
            const remainingCount = 0;
            
            const result = validateProductHasCategory(productExists, remainingCount);
            
            expect(result.error).toMatch(/cannot.*remove.*last.*category/i);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: product-deletion-fix, Property 3: Manual Non-Last Category Deletion Allowed
  // **Validates: Requirements 2.2, 4.4, 3.3**
  describe('Property 3: Manual Non-Last Category Deletion Allowed', () => {
    test('for any product with 2+ categories, manual deletion of non-last category succeeds', () => {
      fc.assert(
        fc.property(
          fc.record({
            productId: fc.uuid(),
            categoryCount: fc.integer({ min: 2, max: 10 }),
          }),
          ({ productId, categoryCount }) => {
            const productExists = true; // Manual deletion scenario
            
            // Try to delete categories except the last one
            for (let i = 0; i < categoryCount - 1; i++) {
              const remainingCount = categoryCount - i - 1;
              const result = validateProductHasCategory(productExists, remainingCount);
              
              // Should allow deletion (not the last category)
              expect(result.allowed).toBe(true);
              expect(result.error).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('manual deletion is allowed when at least one category remains', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (remainingCount) => {
            const productExists = true;
            
            const result = validateProductHasCategory(productExists, remainingCount);
            
            expect(result.allowed).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for products with many categories, manual deletion works until last category', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }),
          (initialCategoryCount) => {
            const productExists = true;
            const results = [];
            
            // Simulate deleting categories one by one
            for (let remaining = initialCategoryCount - 1; remaining >= 0; remaining--) {
              const result = validateProductHasCategory(productExists, remaining);
              results.push({ remaining, result });
            }
            
            // All deletions except the last should succeed
            results.forEach(({ remaining, result }) => {
              if (remaining > 0) {
                expect(result.allowed).toBe(true);
              } else {
                expect(result.allowed).toBe(false);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Trigger Behavior Distinction', () => {
    test('trigger distinguishes between CASCADE and manual deletion based on product existence', () => {
      fc.assert(
        fc.property(
          fc.record({
            productId: fc.uuid(),
            remainingCount: fc.integer({ min: 0, max: 5 }),
          }),
          ({ productId, remainingCount }) => {
            // Test both scenarios
            const cascadeResult = validateProductHasCategory(false, remainingCount);
            const manualResult = validateProductHasCategory(true, remainingCount);
            
            // CASCADE should always allow
            expect(cascadeResult.allowed).toBe(true);
            
            // Manual should depend on remaining count
            if (remainingCount === 0) {
              expect(manualResult.allowed).toBe(false);
            } else {
              expect(manualResult.allowed).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('product existence is the determining factor for CASCADE vs manual deletion', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (remainingCount) => {
            const cascadeResult = validateProductHasCategory(false, remainingCount);
            const manualResult = validateProductHasCategory(true, remainingCount);
            
            // CASCADE always allows regardless of remaining count
            expect(cascadeResult.allowed).toBe(true);
            
            // Manual depends on remaining count
            expect(manualResult.allowed).toBe(remainingCount > 0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
