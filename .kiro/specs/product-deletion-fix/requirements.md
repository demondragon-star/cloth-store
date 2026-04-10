# Requirements Document

## Introduction

This specification addresses a critical bug in the product deletion functionality. Currently, users cannot delete products due to a database trigger that prevents removal of the last category from a product. When a product is deleted, the CASCADE delete attempts to remove all associated entries from the product_categories junction table, but the `validate_product_has_category()` trigger blocks this operation, causing the entire deletion to fail.

The fix must modify the trigger logic to distinguish between manual category removal (which should be blocked if it's the last category) and CASCADE deletes triggered by product deletion (which should be allowed).

## Glossary

- **Product**: An item in the items table that can be sold
- **Category**: A classification in the categories table used to organize products
- **Product_Categories**: Junction table managing the many-to-many relationship between products and categories
- **CASCADE Delete**: A database operation where deleting a parent record automatically deletes related child records
- **Trigger**: A database function that automatically executes in response to certain events
- **Migration**: A versioned database schema change script

## Requirements

### Requirement 1: Allow Product Deletion with CASCADE

**User Story:** As an administrator, I want to delete products from the system, so that I can remove discontinued or incorrect items from the catalog.

#### Acceptance Criteria

1. WHEN a product is deleted from the items table, THE System SHALL allow the CASCADE delete to remove all associated product_categories entries
2. WHEN a CASCADE delete occurs on product_categories, THE System SHALL not invoke the category validation trigger
3. WHEN a product deletion completes, THE System SHALL ensure all related product_categories entries are removed
4. WHEN a product deletion fails, THE System SHALL provide a clear error message indicating the cause

### Requirement 2: Preserve Manual Category Removal Protection

**User Story:** As an administrator, I want to prevent accidental removal of the last category from a product, so that all products maintain proper categorization.

#### Acceptance Criteria

1. WHEN a user manually deletes the last category from a product, THE System SHALL prevent the deletion and raise an error
2. WHEN a user manually deletes a non-last category from a product, THE System SHALL allow the deletion
3. WHEN the validation trigger blocks a manual deletion, THE System SHALL provide a descriptive error message
4. THE System SHALL distinguish between manual deletions and CASCADE deletions from product removal

### Requirement 3: Database Migration Implementation

**User Story:** As a developer, I want a database migration that fixes the trigger logic, so that the fix can be applied consistently across all environments.

#### Acceptance Criteria

1. THE Migration SHALL create a new versioned migration file following the existing naming convention
2. THE Migration SHALL modify the validate_product_has_category function to detect CASCADE deletes
3. THE Migration SHALL preserve all existing trigger functionality for manual deletions
4. THE Migration SHALL be idempotent and safe to run multiple times
5. WHEN the migration is applied, THE System SHALL maintain data integrity for all existing products

### Requirement 4: Verification and Testing

**User Story:** As a developer, I want to verify the fix works correctly, so that I can ensure products can be deleted without breaking category validation.

#### Acceptance Criteria

1. WHEN testing product deletion, THE System SHALL successfully delete products with multiple categories
2. WHEN testing product deletion, THE System SHALL successfully delete products with a single category
3. WHEN testing manual category removal, THE System SHALL still prevent removal of the last category
4. WHEN testing manual category removal, THE System SHALL allow removal of non-last categories
5. THE System SHALL maintain referential integrity throughout all deletion operations
