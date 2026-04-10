# Implementation Plan: Coupon Discovery and Notification System

## Overview

This implementation plan breaks down the coupon discovery and notification system into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early. The plan follows a bottom-up approach: core services first, then UI components, then integration.

## Tasks

- [x] 1. Extend Coupon Service with Discovery Methods
  - Implement `getAvailableCouponsForModal()` method to fetch and filter coupons based on user eligibility and cart value
  - Implement `getActiveCouponsForBanners()` method to fetch active coupons for banner display
  - Implement `calculateRemainingAmount()` helper method for cart-value coupons
  - Implement `hasUserPlacedOrders()` helper method to check user order history
  - Add TypeScript interfaces for `CouponWithEligibility` and `BannerData`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1_

- [ ] 1.1 Write property test for first-order coupon exclusion
  - **Property 2: First-Order Coupon Exclusion**
  - **Validates: Requirements 1.3**

- [ ] 1.2 Write property test for cart-value coupon display logic
  - **Property 3: Cart-Value Coupon Display with Unlock Message**
  - **Validates: Requirements 1.4**

- [ ] 1.3 Write property test for remaining amount calculation
  - **Property 4: Remaining Amount Calculation**
  - **Validates: Requirements 1.5**

- [ ] 1.4 Write property test for comprehensive eligibility filtering
  - **Property 7: Comprehensive Eligibility Filtering**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ] 1.5 Write property test for unlock message formatting
  - **Property 8: Unlock Message Formatting**
  - **Validates: Requirements 2.6**

- [ ] 1.6 Write unit tests for service methods
  - Test empty coupon list handling
  - Test edge cases (expired coupons, usage limits reached)
  - Test error handling for API failures
  - _Requirements: 6.1, 6.2_

- [ ] 2. Create Coupon Modal Component
  - Create `src/components/CouponModal.tsx` with modal UI structure
  - Implement coupon list rendering with eligible and locked sections
  - Add loading states and error handling
  - Implement coupon selection handler
  - Style modal with theme constants (colors, spacing, shadows)
  - Add empty state UI ("No coupons available")
  - _Requirements: 1.1, 1.6, 1.7, 6.2_

- [ ] 2.1 Write property test for modal display trigger
  - **Property 1: Modal Display Trigger**
  - **Validates: Requirements 1.1**

- [ ] 2.2 Write property test for coupon information completeness
  - **Property 5: Coupon Information Completeness**
  - **Validates: Requirements 1.6**

- [ ] 2.3 Write property test for coupon application trigger
  - **Property 6: Coupon Application Trigger**
  - **Validates: Requirements 1.7**

- [ ] 2.4 Write unit tests for modal component
  - Test modal open/close behavior
  - Test empty state display
  - Test loading state display
  - Test error state display
  - _Requirements: 6.2_

- [ ] 3. Integrate Coupon Modal into Cart Screen
  - Import and add CouponModal component to Cart screen
  - Add state management for modal visibility
  - Connect coupon input field tap handler to open modal
  - Implement coupon selection handler to apply coupon to cart
  - Add validation and error display for coupon application
  - Update cart total calculation when coupon is applied
  - _Requirements: 1.7, 1.8, 6.6_

- [ ] 3.1 Write property test for coupon application validation
  - **Property 17: Comprehensive Coupon Validation**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 3.2 Write property test for validation error messages
  - **Property 18: Validation Error Messages**
  - **Validates: Requirements 5.5**

- [ ] 3.3 Write property test for validation error display
  - **Property 20: Validation Error Display**
  - **Validates: Requirements 6.6**

- [ ] 3.4 Write unit tests for cart integration
  - Test coupon application success flow
  - Test coupon application failure flow
  - Test validation error display
  - Test cart total recalculation
  - _Requirements: 1.8, 6.3, 6.6_

- [ ] 4. Checkpoint - Test Coupon Modal Flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create Coupon Banner Carousel Component
  - Create `src/components/CouponBannerCarousel.tsx` with carousel structure
  - Implement banner rendering with coupon details
  - Add auto-slide functionality with 3-second interval
  - Implement manual swipe navigation using FlatList or react-native-snap-carousel
  - Add pagination dots indicator
  - Implement banner tap handler (show details or copy code)
  - Add loading and error states
  - Handle empty state (hide carousel or show default banner)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 4.9, 6.5_

- [ ] 5.1 Write property test for carousel display logic
  - **Property 13: Carousel Display for Multiple Banners**
  - **Validates: Requirements 4.4, 4.6**

- [ ] 5.2 Write property test for pagination dots display
  - **Property 14: Pagination Dots Display**
  - **Validates: Requirements 4.7**

- [ ] 5.3 Write property test for banner information completeness
  - **Property 15: Banner Information Completeness**
  - **Validates: Requirements 4.8**

- [ ] 5.4 Write property test for banner tap handler
  - **Property 16: Banner Tap Handler**
  - **Validates: Requirements 4.9**

- [ ] 5.5 Write unit tests for carousel component
  - Test single banner display (static, no carousel)
  - Test empty state handling
  - Test auto-slide timer cleanup on unmount
  - Test manual swipe navigation
  - Test error handling for auto-slide failures
  - _Requirements: 4.2, 4.3, 6.5_

- [ ] 6. Integrate Banner Carousel into Home Screen
  - Import CouponBannerCarousel component
  - Replace static promo banner with dynamic carousel
  - Position carousel in appropriate location (after search bar)
  - Ensure carousel loads on screen mount
  - Add refresh logic to reload banners on pull-to-refresh
  - _Requirements: 4.1_

- [ ] 6.1 Write property test for banner fetch on load
  - **Property 12: Banner Fetch on Home Screen Load**
  - **Validates: Requirements 4.1**

- [ ] 6.2 Write integration tests for home screen
  - Test banner carousel rendering
  - Test banner data loading
  - Test refresh behavior
  - _Requirements: 4.1_

- [ ] 7. Checkpoint - Test Banner Carousel Flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create Notification Edge Function
  - Create `admin-web/supabase/functions/send-coupon-notification/index.ts`
  - Implement function to fetch all user push tokens from database
  - Implement notification message formatting logic
  - Implement batch notification sending via Expo Push API (batches of 100)
  - Implement retry logic with exponential backoff (3 attempts)
  - Add error logging for failed notifications
  - Create notification records in database for all users
  - _Requirements: 3.1, 3.2, 3.4, 8.5_

- [ ] 8.1 Write property test for notification content completeness
  - **Property 10: Notification Content Completeness**
  - **Validates: Requirements 3.2**

- [ ] 8.2 Write property test for notification logging
  - **Property 21: Notification Logging**
  - **Validates: Requirements 8.5**

- [ ] 8.3 Write unit tests for edge function
  - Test notification message formatting
  - Test batch sending logic
  - Test retry logic
  - Test error handling
  - Test notification record creation
  - _Requirements: 3.4, 3.5_

- [ ] 9. Create Database Trigger for Coupon Notifications
  - Create migration file `admin-web/migrations/005_coupon_notification_trigger.sql`
  - Implement `notify_new_coupon()` trigger function
  - Create trigger on coupons table for INSERT and UPDATE operations
  - Configure trigger to call edge function with coupon data
  - Add trigger logic to only fire when coupon is set to active
  - Test trigger in development environment
  - _Requirements: 3.1, 8.1, 8.2, 8.3_

- [ ] 9.1 Write property test for notification trigger on active coupon
  - **Property 9: Notification Trigger on Active Coupon Creation**
  - **Validates: Requirements 3.1, 8.1, 8.2**

- [ ] 9.2 Write property test for no notification on inactive coupon
  - **Property 11: No Notification for Inactive Coupons**
  - **Validates: Requirements 8.3**

- [ ] 9.3 Write integration tests for trigger
  - Test trigger fires on coupon INSERT with active=true
  - Test trigger fires on coupon UPDATE from inactive to active
  - Test trigger does not fire on coupon INSERT with active=false
  - Test trigger does not fire on coupon UPDATE with active=false
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 10. Implement Notification Handling in Mobile App
  - Update notification handler in `App.tsx` to handle 'coupon_created' notification type
  - Implement navigation logic to show coupon details when notification is tapped
  - Add notification response listener for background/killed app states
  - Test notification tap behavior in different app states (foreground, background, killed)
  - _Requirements: 3.3_

- [ ] 10.1 Write unit tests for notification handling
  - Test navigation on notification tap
  - Test notification handling in different app states
  - _Requirements: 3.3_

- [ ] 11. Add Caching and Performance Optimizations
  - Implement 5-minute cache for coupon data in modal using AsyncStorage or React Query
  - Add cache invalidation logic on coupon application
  - Implement lazy loading for banner images
  - Add image preloading for next banner in carousel
  - Optimize coupon list rendering with FlatList virtualization
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 11.1 Write unit tests for caching logic
  - Test cache storage and retrieval
  - Test cache expiration (5 minutes)
  - Test cache invalidation on coupon application
  - _Requirements: 7.5_

- [ ] 12. Add Error Handling and Edge Cases
  - Implement network error handling with retry buttons
  - Add offline mode support with cached data display
  - Implement race condition handling (coupon expires while viewing)
  - Add error logging for all failure scenarios
  - Implement graceful degradation for banner auto-slide failures
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 12.1 Write unit tests for error scenarios
  - Test network error handling
  - Test offline mode behavior
  - Test coupon expiry during viewing
  - Test banner auto-slide error recovery
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 13. Add Accessibility Features
  - Add screen reader labels to all interactive elements in modal
  - Add screen reader labels to banner carousel
  - Implement keyboard navigation support for modal
  - Add pause button for banner auto-slide (accessibility requirement)
  - Ensure sufficient color contrast for all text
  - Test with screen reader (TalkBack/VoiceOver)
  - _Requirements: All (accessibility is cross-cutting)_

- [ ] 14. Final Integration and Testing
  - Run all unit tests and property tests
  - Perform manual testing of complete flows
  - Test notification delivery end-to-end
  - Test coupon application in various scenarios
  - Test banner carousel with different coupon counts (0, 1, multiple)
  - Verify error handling in all components
  - Test offline behavior
  - _Requirements: All_

- [ ] 15. Final Checkpoint - Complete System Verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: services → components → integration
- Notification system requires backend deployment (edge function and database trigger)
- Testing should be performed incrementally after each major component
