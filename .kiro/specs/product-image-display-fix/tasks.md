# Implementation Plan: Product Image Display Fix

## Overview

This implementation plan addresses the product image display bug by investigating the database schema, standardizing image URL access patterns, and ensuring proper error handling throughout the codebase. The approach is incremental, starting with investigation, then fixing the data layer, and finally updating UI components.

## Tasks

- [x] 1. Investigate database schema and current data
  - [x] 1.1 Query item_images table schema to identify actual column names
    - Write a database query or use Supabase dashboard to inspect the item_images table structure
    - Document the actual column name used for image URLs (url, image_url, or other)
    - Check if both columns exist and which one contains data
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Inspect existing image data in the database
    - Query sample records from item_images table
    - Verify which column contains the actual image URLs
    - Check for any null or invalid URLs in the data
    - Document findings about data quality and consistency
    - _Requirements: 1.4, 2.3_

  - [x] 1.3 Test current Supabase query response structure
    - Add temporary logging to item.service.ts to inspect the actual response from Supabase
    - Verify what properties are returned when querying images
    - Document the exact structure of the images array in the response
    - _Requirements: 4.1, 4.3_

- [x] 2. Update TypeScript interfaces based on findings
  - [x] 2.1 Update ItemImage interface to match database schema
    - Modify src/types/index.ts ItemImage interface
    - Use the correct property name (url or image_url) based on investigation
    - Remove the redundant property (either url or image_url)
    - Ensure all properties match the database columns
    - _Requirements: 3.4, 7.1, 7.3, 7.4_

  - [x] 2.2 Write property test for type consistency
    - **Property 3: Consistent URL Property Access**
    - **Validates: Requirements 3.1**
    - Generate random item objects with images
    - Verify that accessing the image URL property returns the expected value
    - Ensure no runtime errors when accessing the standardized property

- [x] 3. Fix item service image queries
  - [x] 3.1 Update Supabase queries to explicitly select image columns
    - Modify all queries in src/services/item.service.ts that fetch images
    - Replace wildcard (*) with explicit column selection for item_images
    - Use the correct property name identified in investigation
    - Update getItems(), getAllItems(), getItemById(), getFeaturedItems(), searchItems()
    - _Requirements: 4.1, 4.2_

  - [x] 3.2 Write property test for query response structure
    - **Property 5: URL Validation**
    - **Validates: Requirements 4.3, 6.1, 6.2**
    - Generate random items and fetch them from the database
    - Verify all returned image URLs are non-empty strings
    - Verify all URLs follow valid format (start with http:// or https://)

  - [x] 3.3 Write property test for items without images
    - **Property 4: Graceful Handling of Missing Images**
    - **Validates: Requirements 4.4, 5.1, 5.2, 5.3, 6.3**
    - Generate items with no images, null URLs, and invalid URLs
    - Verify queries succeed without errors
    - Verify the system handles missing images gracefully

- [x] 4. Fix admin image upload process
  - [x] 4.1 Update AdminProductDetailsScreen to store images in item_images table
    - Modify src/screens/admin/AdminProductDetailsScreen.tsx
    - After uploading images, insert records into item_images table instead of storing in image_urls array
    - Use the correct column name for the URL
    - Set display_order and is_primary fields appropriately
    - Delete existing images before inserting new ones
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Write property test for upload-retrieval round trip
    - **Property 1: Upload-Retrieval Round Trip**
    - **Validates: Requirements 2.1, 2.3**
    - Generate random image URLs
    - Simulate uploading and storing them in the database
    - Query the item back and verify the URLs are present and correct

  - [x] 4.3 Write unit test for upload error handling
    - **Property 2: Upload Error Handling**
    - **Validates: Requirements 2.4**
    - Simulate upload failures (network errors, storage errors)
    - Verify errors are logged and admin is notified
    - Verify the system doesn't crash or leave inconsistent state

- [x] 5. Update ProductCard component
  - [x] 5.1 Fix image URL access in ProductCard
    - Modify src/components/ProductCard.tsx
    - Remove the fallback pattern (item.url || item.image_url)
    - Use only the correct property name identified in investigation
    - Ensure fallback to placeholder works correctly for missing images
    - Update all three variants (default, compact, horizontal)
    - _Requirements: 3.1, 5.1_

  - [x] 5.2 Write unit test for ProductCard image display
    - Test ProductCard with item that has images
    - Test ProductCard with item that has no images
    - Test ProductCard with item that has null/undefined image URL
    - Verify placeholder displays correctly in all cases
    - _Requirements: 8.1, 8.2_

- [x] 6. Update ImageSlider component
  - [x] 6.1 Fix image URL access in ImageSlider
    - Modify src/components/ImageSlider.tsx
    - Remove the fallback pattern (item.url || item.image_url)
    - Use only the correct property name
    - Ensure placeholder displays when no images
    - Add error handling for image load failures
    - _Requirements: 3.1, 5.2_

  - [x] 6.2 Write property test for multiple images display
    - **Property 7: ImageSlider Displays All Images**
    - **Validates: Requirements 8.3**
    - Generate items with varying numbers of images (0 to 10)
    - Verify ImageSlider displays all images in correct order
    - Verify display_order field is respected

  - [x] 6.3 Write property test for image swipe functionality
    - **Property 8: Multiple Images Swipeable**
    - **Validates: Requirements 8.4**
    - Generate items with multiple images
    - Simulate swipe gestures
    - Verify all images are accessible via swipe

  - [x] 6.4 Write property test for multiple URL types
    - **Property 6: Multiple URL Types Support**
    - **Validates: Requirements 6.4**
    - Generate mix of Supabase storage URLs and external URLs
    - Verify both types are handled correctly
    - Verify images load without errors

- [x] 7. Add URL validation utility
  - [x] 7.1 Create URL validation helper function
    - Create or update a utility file (e.g., src/utils/validation.ts)
    - Implement isValidImageUrl() function
    - Check for non-empty string, valid URL format, and http/https protocol
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 Add image load error handling
    - Update ProductCard and ImageSlider to use onError callback
    - Log warnings when images fail to load
    - Optionally show placeholder on load failure
    - _Requirements: 6.3_

- [x] 8. Checkpoint - Test the complete fix
  - Ensure all tests pass
  - Manually test image display on home screen, category screens, and product detail pages
  - Test with products that have no images, one image, and multiple images
  - Verify admin upload flow works correctly
  - Check console for any errors or warnings
  - Ask the user if questions arise
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Clean up and documentation
  - [x] 9.1 Remove deprecated image_urls field if no longer needed
    - Check if any code still relies on the image_urls array on Item
    - If not needed, remove it from the Item interface
    - Update any remaining references
    - _Requirements: 7.4_

  - [x] 9.2 Add code comments explaining the image URL structure
    - Document which property name is used and why
    - Add comments to ItemImage interface
    - Add comments to image upload and retrieval code
    - _Requirements: 1.4_

## Notes

- The investigation phase (Task 1) is critical - all subsequent tasks depend on identifying the correct database column name
- All tasks including property-based and unit tests are required for comprehensive bug fix validation
- Each task references specific requirements for traceability
- The checkpoint (Task 8) ensures incremental validation before final cleanup
- Property tests should run with minimum 100 iterations to ensure comprehensive coverage
