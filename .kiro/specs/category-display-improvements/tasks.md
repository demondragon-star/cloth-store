# Implementation Plan: Category Display Improvements

## Overview

This implementation plan converts the category display improvements design into actionable coding tasks. The approach follows a phased strategy: first adding image assets and updating the component, then migrating the database, and finally integrating everything together. Each task builds incrementally to ensure the feature works correctly at every step.

## Tasks

- [x] 1. Set up category image assets
  - Create `assets/images/categories/` directory structure
  - Add placeholder images for Men, Women, Kids, and Sports categories
  - Ensure images are optimized (1200x800 resolution, <500KB each)
  - Verify images are properly included in the app bundle
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 2. Create category asset mapping configuration
  - [x] 2.1 Create `src/constants/categoryAssets.ts` file
    - Define CATEGORY_IMAGES mapping object with require() statements
    - Implement getCategoryImage() helper function
    - Export types and constants
    - _Requirements: 3.3, 4.2_
  
  - [x] 2.2 Write unit tests for asset mapping
    - Test getCategoryImage() returns correct assets for valid category names
    - Test getCategoryImage() returns null for unmapped categories
    - Verify all four categories have valid mappings
    - _Requirements: 3.3_

- [ ] 3. Update CategoryCard component for image rendering
  - [x] 3.1 Modify CategoryCard.tsx to use local assets
    - Import categoryAssets configuration
    - Add image resolution logic (local asset → remote URL → fallback)
    - Implement error state handling with useState
    - Add onError handler for image loading failures
    - Update large variant to use resolved images
    - _Requirements: 1.1, 1.2, 1.7, 5.1, 5.2_
  
  - [x] 3.2 Write property test for CategoryCard image rendering
    - **Property 1: Category image rendering**
    - **Validates: Requirements 1.1, 1.2**
  
  - [x] 3.3 Write property test for image load failure fallback
    - **Property 2: Image load failure fallback**
    - **Validates: Requirements 1.7**
  
  - [x] 3.4 Write property test for backward compatibility
    - **Property 5: Backward compatibility with missing images**
    - **Validates: Requirements 5.1**
  
  - [x] 3.5 Write property test for error resilience
    - **Property 6: Error resilience**
    - **Validates: Requirements 5.2, 5.3**
  
  - [x] 3.6 Write property test for large variant overlay
    - **Property 8: Large variant overlay**
    - **Validates: Requirements 5.5**
  
  - [x] 3.7 Write unit tests for specific category examples
    - Test Men category displays men's fashion image
    - Test Women category displays women's fashion image
    - Test Kids category displays kids' fashion image
    - Test Sports category displays sports' fashion image
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [x] 4. Checkpoint - Verify component changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create database migration for category updates
  - [x] 5.1 Create migration file `admin-web/migrations/005_update_categories.sql`
    - Write SQL to update Men, Women, Kids, Sports categories with image_url and display_order
    - Write SQL to deactivate Footwear and Accessories categories
    - Add transaction wrapper for rollback safety
    - Include comments explaining each step
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 5.2 Write database verification tests
    - Test exactly 4 active categories exist after migration
    - Test Footwear and Accessories are inactive
    - Test display_order values are correct (1-4)
    - Test each category has an image_url value
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.3, 4.4, 4.5, 4.6_

- [ ] 6. Handle product reassignment from obsolete categories
  - [x] 6.1 Add product reassignment logic to migration
    - Query products in Footwear category
    - Query products in Accessories category
    - Create reassignment strategy (manual or automated)
    - Update product_categories junction table
    - _Requirements: 2.2, 2.3_
  
  - [x] 6.2 Write tests for product reassignment
    - Verify no products remain in inactive categories
    - Verify all products have at least one active category
    - _Requirements: 2.2, 2.3_

- [ ] 7. Verify Category Service behavior
  - [x] 7.1 Write property test for active category filtering
    - **Property 3: Active category filtering**
    - **Validates: Requirements 2.4**
  
  - [x] 7.2 Write property test for category ordering
    - **Property 4: Category ordering**
    - **Validates: Requirements 2.5**
  
  - [x] 7.3 Write integration tests for CategoriesScreen
    - Test screen displays exactly 4 categories
    - Test categories appear in correct order
    - Test images load and display correctly
    - Test navigation to CategoryItems works
    - Test search/filter functionality still works
    - _Requirements: 2.1, 2.5_

- [ ] 8. Test offline functionality
  - [x] 8.1 Write property test for offline asset availability
    - **Property 7: Offline asset availability**
    - **Validates: Requirements 5.4**
  
  - [x] 8.2 Write integration test for offline mode
    - Simulate offline network state
    - Verify categories load from cache
    - Verify images display from local assets
    - Verify no network errors occur
    - _Requirements: 5.4_

- [x] 9. Final checkpoint - Integration verification
  - Run all tests to ensure everything works together
  - Test on iOS simulator/device
  - Test on Android emulator/device
  - Verify image quality and load times
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The migration should be tested on a staging database before production
- Image assets should be sourced from appropriate stock photo sites or created by design team
- Consider adding image attribution if using stock photos
