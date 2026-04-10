# Design Document: Product Deletion Fix

## Overview

This design addresses the product deletion bug by modifying the database trigger that validates product categories. The current trigger prevents deletion of the last category from a product, which inadvertently blocks CASCADE deletes when products are removed. The solution detects whether a deletion is part of a CASCADE operation and allows it to proceed, while still protecting against manual removal of the last category.

## Architecture

The fix operates entirely at the database layer through a migration that modifies the existing trigger function. No application code changes are required since the issue is purely a database constraint problem.

### Key Components

1. **Migration File**: A new versioned SQL migration that updates the trigger logic
2. **Trigger Function**: Modified `validate_product_has_category()` function with CASCADE detection
3. **Trigger**: The existing `ensure_product_has_category` trigger (unchanged, but uses updated function)

### Detection Strategy

PostgreSQL provides context information during trigger execution. We can detect CASCADE deletes by checking if the parent product still exists when the trigger fires:

- **Manual deletion**: Product exists in items table → enforce validation
- **CASCADE deletion**: Product does not exist in items table → allow deletion

This approach is reliable because CASCADE deletes remove the parent first, then cascade to children.

## Components and Interfaces

### Modified Trigger Function

```sql
CREATE OR REPLACE FUNCTION validate_product_has_category()
RETURNS TRIGGER AS $$
DECLARE
    remaining_count INTEGER;
    product_exists BOOLEAN;
BEGIN
    -- Check if the parent product still exists
    -- If it doesn't exist, this is a CASCADE delete from product deletion
    SELECT EXISTS(SELECT 1 FROM items WHERE id = OLD.product_id) INTO product_exists;
    
    -- If product doesn't exist, allow the CASCADE delete
    IF NOT product_exists THEN
        RETURN OLD;
    END IF;
    
    -- Product exists, so this is a manual category removal
    -- Count remaining categories for this product after deletion
    SELECT COUNT(*) INTO remaining_count
    FROM product_categories
    WHERE product_id = OLD.product_id
    AND id != OLD.id;
    
    -- If this is the last category, prevent deletion
    IF remaining_count = 0 THEN
        RAISE EXCEPTION 'Cannot remove the last category from a product. Each product must have at least one category.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

### Migration File Structure

The migration follows the existing naming convention: `00X_fix_product_deletion_cascade.sql`

**Migration Components:**
1. Header comment explaining the purpose
2. Function replacement using `CREATE OR REPLACE FUNCTION`
3. No trigger recreation needed (function is already referenced)
4. Verification comment for testing

## Data Models

No data model changes are required. The existing schema remains unchanged:

- **items table**: Products (unchanged)
- **categories table**: Categories (unchanged)  
- **product_categories table**: Junction table (unchanged)

The fix only modifies the behavior of the trigger function, not the data structure.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: CASCADE Delete Removes All Categories

*For any* product with any number of categories, when the product is deleted from the items table, all associated entries in product_categories should be removed without triggering validation errors.

**Validates: Requirements 1.1, 1.3, 2.4**

### Property 2: Manual Last Category Deletion Blocked

*For any* product with exactly one category, attempting to manually delete that category from product_categories should raise an error and leave the product_categories entry unchanged.

**Validates: Requirements 2.1, 4.3, 2.4, 3.3**

### Property 3: Manual Non-Last Category Deletion Allowed

*For any* product with two or more categories, manually deleting any category except the last remaining one should succeed and remove only that specific product_categories entry.

**Validates: Requirements 2.2, 4.4, 3.3**

### Property 4: Migration Idempotency and Data Preservation

*For any* database state with existing products and categories, running the migration multiple times should succeed without errors, and all existing product and category data should remain unchanged after migration.

**Validates: Requirements 3.4, 3.5**

## Error Handling

### Error Scenarios

1. **Manual Last Category Deletion**
   - **Trigger**: User attempts to delete the last category from a product
   - **Response**: Raise exception with message: "Cannot remove the last category from a product. Each product must have at least one category."
   - **Recovery**: User must add another category before removing the current one

2. **Migration Failure**
   - **Trigger**: Migration encounters unexpected database state
   - **Response**: Transaction rollback, preserve existing state
   - **Recovery**: Review error logs, fix underlying issue, retry migration

3. **Referential Integrity Violation**
   - **Trigger**: Attempt to delete product with orphaned references
   - **Response**: Database constraint error
   - **Recovery**: Should not occur with proper CASCADE configuration

### Error Prevention

- Use `CREATE OR REPLACE FUNCTION` to ensure idempotent migration
- Maintain transaction boundaries for atomic operations
- Preserve existing trigger structure to avoid breaking changes

## Testing Strategy

### Dual Testing Approach

This fix requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific scenarios and edge cases
- **Property tests**: Verify universal properties across all inputs

### Unit Testing Focus

Unit tests should cover:
- Specific example: Delete product with 2 categories, verify CASCADE works
- Specific example: Delete product with 1 category, verify CASCADE works
- Edge case: Attempt manual deletion of last category, verify error
- Edge case: Delete non-last category manually, verify success
- Integration: Verify migration can be applied to existing database

### Property-Based Testing Focus

Property tests should cover:
- **Property 1**: For all products with any number of categories, CASCADE delete succeeds
- **Property 2**: For all products with exactly 1 category, manual category deletion fails
- **Property 3**: For all products with 2+ categories, manual non-last category deletion succeeds
- **Property 4**: For all database states, migration is idempotent and preserves data

### Property Test Configuration

- **Testing Library**: Use appropriate SQL testing framework or application-level tests that interact with the database
- **Minimum Iterations**: 100 iterations per property test
- **Tag Format**: Each test must include a comment: `-- Feature: product-deletion-fix, Property {N}: {property description}`
- **Test Data Generation**: Generate random products with varying numbers of categories (1-10)

### Test Execution Order

1. Run migration on test database
2. Execute unit tests for specific scenarios
3. Execute property tests for comprehensive coverage
4. Verify migration idempotency
5. Verify data integrity after all operations

### Success Criteria

- All unit tests pass
- All property tests pass with 100+ iterations
- Migration can be applied multiple times without errors
- No data loss or corruption after migration
- Product deletion works in all scenarios
- Manual category protection still functions correctly
