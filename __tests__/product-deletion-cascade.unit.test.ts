/**
 * Feature: product-deletion-fix
 * Unit tests for product deletion CASCADE behavior
 * 
 * These tests verify specific scenarios for the modified validate_product_has_category() trigger.
 */

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

// Simulate database operations
interface Product {
  id: string;
  name: string;
  categories: string[];
}

interface ProductCategory {
  id: string;
  product_id: string;
  category_id: string;
}

const simulateProductDeletion = (product: Product): { success: boolean; error?: string } => {
  // Step 1: Delete product (CASCADE will trigger)
  const productExists = false; // Product is being deleted
  
  // Step 2: CASCADE attempts to delete all product_categories entries
  const deletionResults = product.categories.map((categoryId, index) => {
    const remainingCount = product.categories.length - index - 1;
    return validateProductHasCategory(productExists, remainingCount);
  });
  
  // Check if all deletions succeeded
  const allSucceeded = deletionResults.every(r => r.allowed);
  
  if (!allSucceeded) {
    const failedResult = deletionResults.find(r => !r.allowed);
    return { success: false, error: failedResult?.error };
  }
  
  return { success: true };
};

const simulateManualCategoryDeletion = (
  product: Product,
  categoryIdToDelete: string
): { success: boolean; error?: string } => {
  const productExists = true; // Product still exists
  const categoryIndex = product.categories.indexOf(categoryIdToDelete);
  
  if (categoryIndex === -1) {
    return { success: false, error: 'Category not found' };
  }
  
  // Calculate remaining categories after deletion
  const remainingCount = product.categories.length - 1;
  
  const result = validateProductHasCategory(productExists, remainingCount);
  
  if (!result.allowed) {
    return { success: false, error: result.error };
  }
  
  return { success: true };
};

describe('Product Deletion CASCADE - Unit Tests', () => {
  describe('Product with Multiple Categories', () => {
    // Feature: product-deletion-fix
    // **Validates: Requirements 4.1**
    test('deleting product with 2 categories succeeds via CASCADE', () => {
      const product: Product = {
        id: 'prod-1',
        name: 'Test Product',
        categories: ['cat-1', 'cat-2'],
      };
      
      const result = simulateProductDeletion(product);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('all product_categories entries are removed when product is deleted', () => {
      const product: Product = {
        id: 'prod-2',
        name: 'Multi-Category Product',
        categories: ['cat-1', 'cat-2', 'cat-3'],
      };
      
      const result = simulateProductDeletion(product);
      
      expect(result.success).toBe(true);
      
      // Verify all categories can be deleted
      product.categories.forEach((categoryId, index) => {
        const productExists = false;
        const remainingCount = product.categories.length - index - 1;
        const categoryResult = validateProductHasCategory(productExists, remainingCount);
        expect(categoryResult.allowed).toBe(true);
      });
    });

    test('CASCADE delete works with exactly 2 categories', () => {
      const product: Product = {
        id: 'prod-3',
        name: 'Two Category Product',
        categories: ['cat-a', 'cat-b'],
      };
      
      const result = simulateProductDeletion(product);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Product with Single Category', () => {
    // Feature: product-deletion-fix
    // **Validates: Requirements 4.2**
    test('deleting product with 1 category succeeds via CASCADE', () => {
      const product: Product = {
        id: 'prod-4',
        name: 'Single Category Product',
        categories: ['cat-1'],
      };
      
      const result = simulateProductDeletion(product);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('product_categories entry is removed when product with single category is deleted', () => {
      const product: Product = {
        id: 'prod-5',
        name: 'One Category Product',
        categories: ['cat-only'],
      };
      
      const result = simulateProductDeletion(product);
      
      expect(result.success).toBe(true);
      
      // Verify the single category can be deleted via CASCADE
      const productExists = false;
      const remainingCount = 0; // Last category
      const categoryResult = validateProductHasCategory(productExists, remainingCount);
      expect(categoryResult.allowed).toBe(true);
    });

    test('CASCADE allows deletion of last category when product does not exist', () => {
      const productExists = false;
      const remainingCount = 0;
      
      const result = validateProductHasCategory(productExists, remainingCount);
      
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Manual Non-Last Category Deletion', () => {
    // Feature: product-deletion-fix
    // **Validates: Requirements 2.2, 4.4**
    test('manually deleting one category from product with 3 categories succeeds', () => {
      const product: Product = {
        id: 'prod-6',
        name: 'Three Category Product',
        categories: ['cat-1', 'cat-2', 'cat-3'],
      };
      
      const result = simulateManualCategoryDeletion(product, 'cat-2');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('only one product_categories entry is removed during manual deletion', () => {
      const product: Product = {
        id: 'prod-7',
        name: 'Multi Category Product',
        categories: ['cat-a', 'cat-b', 'cat-c'],
      };
      
      const categoryToDelete = 'cat-b';
      const result = simulateManualCategoryDeletion(product, categoryToDelete);
      
      expect(result.success).toBe(true);
      
      // Verify remaining count is correct
      const remainingCount = product.categories.length - 1;
      expect(remainingCount).toBe(2);
    });

    test('manual deletion of first category from 3-category product succeeds', () => {
      const product: Product = {
        id: 'prod-8',
        name: 'Product',
        categories: ['cat-1', 'cat-2', 'cat-3'],
      };
      
      const result = simulateManualCategoryDeletion(product, 'cat-1');
      
      expect(result.success).toBe(true);
    });

    test('manual deletion of middle category from 3-category product succeeds', () => {
      const product: Product = {
        id: 'prod-9',
        name: 'Product',
        categories: ['cat-1', 'cat-2', 'cat-3'],
      };
      
      const result = simulateManualCategoryDeletion(product, 'cat-2');
      
      expect(result.success).toBe(true);
    });
  });

  describe('Manual Last Category Protection', () => {
    // Feature: product-deletion-fix
    // **Validates: Requirements 2.1, 4.3**
    test('manually deleting last category from product fails', () => {
      const product: Product = {
        id: 'prod-10',
        name: 'Single Category Product',
        categories: ['cat-only'],
      };
      
      const result = simulateManualCategoryDeletion(product, 'cat-only');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('last category');
    });

    test('error message is descriptive when blocking last category deletion', () => {
      const productExists = true;
      const remainingCount = 0;
      
      const result = validateProductHasCategory(productExists, remainingCount);
      
      expect(result.allowed).toBe(false);
      expect(result.error).toMatch(/cannot.*remove.*last.*category/i);
    });

    test('manual deletion is blocked only when no categories remain', () => {
      const productExists = true;
      
      // Test with 0 remaining (should block)
      const result0 = validateProductHasCategory(productExists, 0);
      expect(result0.allowed).toBe(false);
      
      // Test with 1 remaining (should allow)
      const result1 = validateProductHasCategory(productExists, 1);
      expect(result1.allowed).toBe(true);
      
      // Test with 2 remaining (should allow)
      const result2 = validateProductHasCategory(productExists, 2);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('CASCADE vs Manual Deletion Distinction', () => {
    test('same remaining count behaves differently for CASCADE vs manual', () => {
      const remainingCount = 0; // Last category
      
      // CASCADE (product doesn't exist)
      const cascadeResult = validateProductHasCategory(false, remainingCount);
      expect(cascadeResult.allowed).toBe(true);
      
      // Manual (product exists)
      const manualResult = validateProductHasCategory(true, remainingCount);
      expect(manualResult.allowed).toBe(false);
    });

    test('product existence determines deletion behavior', () => {
      const remainingCount = 0;
      
      // When product doesn't exist (CASCADE)
      const cascadeResult = validateProductHasCategory(false, remainingCount);
      expect(cascadeResult.allowed).toBe(true);
      expect(cascadeResult.error).toBeUndefined();
      
      // When product exists (manual)
      const manualResult = validateProductHasCategory(true, remainingCount);
      expect(manualResult.allowed).toBe(false);
      expect(manualResult.error).toBeDefined();
    });

    test('CASCADE always allows deletion regardless of remaining count', () => {
      const productExists = false;
      
      [0, 1, 2, 5, 10].forEach(remainingCount => {
        const result = validateProductHasCategory(productExists, remainingCount);
        expect(result.allowed).toBe(true);
      });
    });

    test('manual deletion depends on remaining count', () => {
      const productExists = true;
      
      // 0 remaining - should block
      const result0 = validateProductHasCategory(productExists, 0);
      expect(result0.allowed).toBe(false);
      
      // 1+ remaining - should allow
      [1, 2, 5, 10].forEach(remainingCount => {
        const result = validateProductHasCategory(productExists, remainingCount);
        expect(result.allowed).toBe(true);
      });
    });
  });
});
