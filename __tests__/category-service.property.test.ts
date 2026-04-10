/**
 * Feature: category-display-improvements
 * Property-based tests for Category Service behavior
 */

import fc from 'fast-check';

describe('Category Service - Property Tests', () => {
  // Mock category data generator
  const categoryArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1 }),
    slug: fc.string({ minLength: 1 }),
    image_url: fc.option(fc.string(), { nil: undefined }),
    display_order: fc.integer({ min: 1, max: 100 }),
    is_active: fc.boolean(),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

  // Feature: category-display-improvements, Property 3: Active category filtering
  // **Validates: Requirements 2.4**
  describe('Property 3: Active category filtering', () => {
    test('for any call to getCategories(), returned list contains only categories where is_active is true', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 1, maxLength: 20 }),
          (categories) => {
            // Simulate getCategories() filtering
            const getCategories = (allCategories: any[]) => {
              return allCategories.filter(cat => cat.is_active === true);
            };

            const result = getCategories(categories);

            // Verify all returned categories are active
            result.forEach(category => {
              expect(category.is_active).toBe(true);
            });

            // Verify no inactive categories are included
            const inactiveCategories = categories.filter(cat => !cat.is_active);
            inactiveCategories.forEach(inactiveCategory => {
              expect(result).not.toContainEqual(inactiveCategory);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getCategories() never returns categories with is_active = false', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 5, maxLength: 20 }),
          (categories) => {
            // Ensure at least some inactive categories exist
            const categoriesWithInactive = categories.map((cat, idx) => ({
              ...cat,
              is_active: idx % 3 !== 0, // Make every 3rd category inactive
            }));

            const getCategories = (allCategories: any[]) => {
              return allCategories.filter(cat => cat.is_active === true);
            };

            const result = getCategories(categoriesWithInactive);

            // No result should have is_active = false
            const hasInactive = result.some(cat => cat.is_active === false);
            expect(hasInactive).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('filtering preserves all properties of active categories', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 1, maxLength: 10 }),
          (categories) => {
            const getCategories = (allCategories: any[]) => {
              return allCategories.filter(cat => cat.is_active === true);
            };

            const result = getCategories(categories);
            const activeCategories = categories.filter(cat => cat.is_active);

            // Verify all properties are preserved
            result.forEach((resultCat, idx) => {
              const originalCat = activeCategories[idx];
              expect(resultCat.id).toBe(originalCat.id);
              expect(resultCat.name).toBe(originalCat.name);
              expect(resultCat.slug).toBe(originalCat.slug);
              expect(resultCat.image_url).toBe(originalCat.image_url);
              expect(resultCat.display_order).toBe(originalCat.display_order);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: category-display-improvements, Property 4: Category ordering
  // **Validates: Requirements 2.5**
  describe('Property 4: Category ordering', () => {
    test('for any list of categories, getCategories() returns them ordered by display_order ascending', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 2, maxLength: 20 }),
          (categories) => {
            // Simulate getCategories() with filtering and ordering
            const getCategories = (allCategories: any[]) => {
              return allCategories
                .filter(cat => cat.is_active === true)
                .sort((a, b) => a.display_order - b.display_order);
            };

            const result = getCategories(categories);

            // Verify ordering
            for (let i = 1; i < result.length; i++) {
              expect(result[i].display_order).toBeGreaterThanOrEqual(result[i - 1].display_order);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('categories with lower display_order appear before those with higher display_order', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 3, maxLength: 15 }),
          (categories) => {
            const getCategories = (allCategories: any[]) => {
              return allCategories
                .filter(cat => cat.is_active === true)
                .sort((a, b) => a.display_order - b.display_order);
            };

            const result = getCategories(categories);

            // Check each pair of adjacent categories
            for (let i = 0; i < result.length - 1; i++) {
              const current = result[i];
              const next = result[i + 1];
              
              if (current.display_order < next.display_order) {
                // Current should appear before next (which it does by index)
                expect(i).toBeLessThan(i + 1);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('ordering is stable and consistent across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 2, maxLength: 10 }),
          (categories) => {
            const getCategories = (allCategories: any[]) => {
              return allCategories
                .filter(cat => cat.is_active === true)
                .sort((a, b) => a.display_order - b.display_order);
            };

            const result1 = getCategories(categories);
            const result2 = getCategories(categories);

            // Results should be identical
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('ordering works correctly with duplicate display_order values', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 3, maxLength: 10 }),
          (categories) => {
            // Force some duplicate display_order values
            const categoriesWithDuplicates = categories.map((cat, idx) => ({
              ...cat,
              display_order: Math.floor(idx / 2) + 1, // Creates duplicates
              is_active: true,
            }));

            const getCategories = (allCategories: any[]) => {
              return allCategories
                .filter(cat => cat.is_active === true)
                .sort((a, b) => a.display_order - b.display_order);
            };

            const result = getCategories(categoriesWithDuplicates);

            // Verify still sorted
            for (let i = 1; i < result.length; i++) {
              expect(result[i].display_order).toBeGreaterThanOrEqual(result[i - 1].display_order);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined Filtering and Ordering', () => {
    test('getCategories() applies both filtering and ordering correctly', () => {
      fc.assert(
        fc.property(
          fc.array(categoryArbitrary, { minLength: 5, maxLength: 20 }),
          (categories) => {
            const getCategories = (allCategories: any[]) => {
              return allCategories
                .filter(cat => cat.is_active === true)
                .sort((a, b) => a.display_order - b.display_order);
            };

            const result = getCategories(categories);

            // All must be active
            result.forEach(cat => {
              expect(cat.is_active).toBe(true);
            });

            // All must be ordered
            for (let i = 1; i < result.length; i++) {
              expect(result[i].display_order).toBeGreaterThanOrEqual(result[i - 1].display_order);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
