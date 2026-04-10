# Implementation Plan: Product Deletion Fix

## Overview

This implementation plan addresses the product deletion bug by creating a database migration that modifies the `validate_product_has_category()` trigger function. The fix enables CASCADE deletes when products are removed while preserving protection against manual removal of the last category from a product.

## Tasks

- [x] 1. Create database migration file
  - Create new migration file: `admin-web/migrations/008_fix_product_deletion_cascade.sql`
  - Add migration header with purpose and date
  - Include rollback instructions in comments
  - _Requirements: 3.1, 3.2_

- [x] 2. Implement modified trigger function
  - [x] 2.1 Write updated `validate_product_has_category()` function
    - Add product existence check to detect CASCADE deletes
    - Preserve existing validation logic for manual deletions
    - Use `CREATE OR REPLACE FUNCTION` for idempotency
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.4, 3.2, 3.3, 3.4_
  
  - [x] 2.2 Write property test for CASCADE delete behavior
    - **Property 1: CASCADE Delete Removes All Categories**
    - **Validates: Requirements 1.1, 1.3, 2.4**
    - Generate random products with 1-10 categories
    - Delete product and verify all product_categories entries removed
    - Run 100+ iterations
  
  - [x] 2.3 Write property test for manual last category protection
    - **Property 2: Manual Last Category Deletion Blocked**
    - **Validates: Requirements 2.1, 4.3, 2.4, 3.3**
    - Generate random products with exactly 1 category
    - Attempt manual category deletion and verify error raised
    - Run 100+ iterations

- [x] 3. Add unit tests for specific scenarios
  - [x] 3.1 Write unit test for product with multiple categories
    - Create product with 2 categories
    - Delete product and verify CASCADE succeeds
    - Verify all product_categories entries removed
    - _Requirements: 4.1_
  
  - [x] 3.2 Write unit test for product with single category
    - Create product with 1 category
    - Delete product and verify CASCADE succeeds
    - Verify product_categories entry removed
    - _Requirements: 4.2_
  
  - [x] 3.3 Write unit test for manual non-last category deletion
    - Create product with 3 categories
    - Manually delete one category (not the last)
    - Verify deletion succeeds and only one entry removed
    - _Requirements: 2.2, 4.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add migration verification tests
  - [x] 5.1 Write property test for migration idempotency
    - **Property 4: Migration Idempotency and Data Preservation**
    - **Validates: Requirements 3.4, 3.5**
    - Create random test data (products and categories)
    - Run migration multiple times
    - Verify no errors and data unchanged
    - Run 100+ iterations
  
  - [x] 5.2 Write integration test for migration application
    - Set up test database with sample data
    - Apply migration
    - Verify trigger function updated correctly
    - Test both CASCADE and manual deletion scenarios
    - _Requirements: 3.5, 4.5_

- [x] 6. Final checkpoint - Verify fix in test environment
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The migration uses `CREATE OR REPLACE FUNCTION` for safe reapplication
- All tests should use the fast-check library for property-based testing (already in devDependencies)
- Each property test must include a comment tag: `// Feature: product-deletion-fix, Property {N}: {description}`
- The fix requires no application code changes, only database migration
- Migration should be tested in a development environment before production deployment
