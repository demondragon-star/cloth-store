# Implementation Plan: Mobile App Bug Fixes

## Overview

This implementation plan addresses three critical bugs: dynamic profile statistics, avatar upload to Supabase Storage, and product image upload to Supabase Storage. The tasks are organized to fix each issue incrementally with testing at each step.

## Tasks

- [x] 1. Fix Profile Statistics Display
  - [x] 1.1 Add state management for profile stats in ProfileScreen
    - Add useState hooks for orderCount, savedAmount, and loading state
    - Initialize with default values (0 for counts, 0 for amount)
    - _Requirements: 1.1, 1.6_

  - [x] 1.2 Implement loadProfileStats function
    - Create async function to fetch user orders using orderService.getUserOrders()
    - Calculate order count from orders array length
    - Calculate saved amount by summing discount fields from all orders
    - Handle cases where orders is null or empty (display 0)
    - Update state with calculated values
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.3 Add useEffect to load stats on mount
    - Call loadProfileStats when component mounts
    - Add dependency on user?.id to reload when user changes
    - Handle loading state appropriately
    - _Requirements: 1.1_

  - [x] 1.4 Update UI to display dynamic values
    - Replace hardcoded "12" with {orderCount}
    - Replace hardcoded "₹2.5K" with formatted savedAmount (₹{savedAmount.toFixed(2)})
    - Add loading indicators while fetching data
    - _Requirements: 1.2, 1.4_

  - [ ] 1.5 Write property test for order count accuracy
    - **Property 1: Order Count Accuracy**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 1.6 Write property test for saved amount calculation
    - **Property 2: Saved Amount Calculation**
    - **Validates: Requirements 1.3, 1.4**

  - [ ] 1.7 Write unit tests for edge cases
    - Test with no orders (should display 0)
    - Test with orders but no discounts (should display ₹0)
    - Test with null/undefined discount values
    - Test formatting of large saved amounts
    - _Requirements: 1.6_

- [x] 2. Fix Avatar Upload to Supabase Storage
  - [x] 2.1 Update authService.uploadAvatar() method
    - Replace FormData approach with fetch + blob conversion
    - Fetch image from URI using fetch(imageUri)
    - Convert response to blob using response.blob()
    - Extract file extension from URI
    - Generate unique filename using userId and timestamp
    - Upload blob to Supabase Storage 'avatars' bucket with proper contentType
    - Use upsert: true to replace existing avatars
    - Get public URL from storage
    - Update user profile with new avatar_url
    - Return { url, error } object
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 2.7_

  - [x] 2.2 Update EditProfileScreen.handleSave() to use fixed upload
    - Check if avatarUrl is a local URI (starts with 'file://' or 'content://')
    - If local, call authService.uploadAvatar() before updating profile
    - Handle upload errors with try-catch and display error toast
    - Use uploaded URL in profile update
    - If not local (already a public URL), use as-is
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 2.3 Write property test for avatar upload persistence
    - **Property 3: Avatar Upload Persistence**
    - **Validates: Requirements 2.2, 2.3**

  - [ ] 2.4 Write property test for blob conversion
    - **Property 4: Avatar Upload Blob Conversion**
    - **Validates: Requirements 2.5**

  - [ ] 2.5 Write unit tests for avatar upload error handling
    - Test with invalid URI
    - Test with network error (mock fetch failure)
    - Test with storage error (mock Supabase error)
    - Test with missing file extension
    - Verify error messages are descriptive
    - _Requirements: 2.4, 4.3, 4.5_

- [x] 3. Fix Product Image Upload to Supabase Storage
  - [x] 3.1 Update itemService.uploadImage() method
    - Remove FormData approach
    - Fetch image from URI using fetch(uri)
    - Convert response to blob using response.blob()
    - Extract file extension from fileType parameter
    - Generate unique filename using productId and timestamp
    - Upload blob to Supabase Storage 'products' bucket with proper contentType
    - Use upsert: false to prevent overwriting
    - Get public URL from storage
    - Return { url, error } object
    - Add detailed error logging
    - _Requirements: 3.2, 3.5, 3.6, 3.8_

  - [x] 3.2 Verify AdminProductDetailsScreen.handleSave() integration
    - Review existing image upload loop in handleSave
    - Ensure it correctly calls itemService.uploadImage() for local images
    - Verify error handling for partial upload failures
    - Verify finalImageUrls array includes both existing and new URLs
    - Ensure item_images table is updated with all URLs
    - _Requirements: 3.1, 3.3, 3.4, 3.7_

  - [ ] 3.3 Write property test for product image upload persistence
    - **Property 5: Product Image Upload Persistence**
    - **Validates: Requirements 3.3, 3.7**

  - [ ] 3.4 Write property test for product image blob conversion
    - **Property 6: Product Image Blob Conversion**
    - **Validates: Requirements 3.5**

  - [ ] 3.5 Write unit tests for product image upload error handling
    - Test with invalid URI
    - Test with network error
    - Test with storage error
    - Test partial upload failure (some images succeed, some fail)
    - Verify error messages and logging
    - _Requirements: 3.4, 4.3, 4.5_

- [x] 4. Add User Feedback and Loading States
  - [x] 4.1 Add loading indicators for profile stats
    - Show skeleton or spinner while loading stats
    - Handle loading state in ProfileScreen
    - _Requirements: 4.1_

  - [x] 4.2 Add upload progress feedback for avatar
    - Show loading indicator during avatar upload
    - Display success toast on successful upload
    - Display error toast with specific message on failure
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.3 Add upload progress feedback for product images
    - Show "Uploading images..." text during batch upload
    - Display success alert on successful upload
    - Display warning alert if some images fail
    - Display error alert if all images fail
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 4.4 Write property test for error handling
    - **Property 7: Image Upload Error Handling**
    - **Validates: Requirements 4.3, 4.5**

  - [ ] 4.5 Write unit tests for user feedback
    - Test loading states display correctly
    - Test success messages display correctly
    - Test error messages display correctly
    - Test progress indicators show during operations
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Integration Testing and Verification
  - [ ] 6.1 Test complete avatar upload flow
    - Select image from gallery
    - Verify local preview displays
    - Save profile
    - Verify upload succeeds and avatar persists
    - Restart app and verify avatar still displays
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 6.2 Test complete product image upload flow
    - Select multiple images for a product
    - Verify local previews display
    - Save product
    - Verify all images upload and persist
    - Verify images display in product details
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 6.3 Test profile stats accuracy
    - Create test orders with various discount values
    - Verify order count displays correctly
    - Verify saved amount displays correctly
    - Test with no orders (should show 0)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [ ] 6.4 Write property test for default values
    - **Property 8: Default Values for Missing Data**
    - **Validates: Requirements 1.6**

  - [ ] 6.5 Write integration tests for complete flows
    - Test avatar upload end-to-end with mocked Supabase
    - Test product image upload end-to-end with mocked Supabase
    - Test profile stats loading with mocked database
    - Test error scenarios with mocked failures
    - _Requirements: All_

- [ ] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify complete user flows work correctly
