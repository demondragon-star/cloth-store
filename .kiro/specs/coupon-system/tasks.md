# Implementation Plan: Coupon System

## Overview

This implementation plan breaks down the coupon system into discrete, incremental tasks. Each task builds on previous work, starting with database schema and core service logic, then moving to admin interfaces, and finally user-facing features. The plan includes property-based tests and unit tests as sub-tasks to ensure correctness at each step.

## Tasks

- [x] 1. Database Schema and Migrations
  - [x] 1.1 Create coupons table migration
    - Create migration file `admin-web/migrations/002_create_coupons.sql`
    - Include all fields: id, code, description, discount_type, discount_value, coupon_type, min_cart_value, max_discount, usage_limit_per_user, total_usage_limit, current_usage_count, valid_from, valid_until, is_active, created_by, created_at, updated_at
    - Add CHECK constraints for data validation
    - Add UNIQUE constraint on code
    - _Requirements: 2.1, 2.2, 6.1_
  
  - [x] 1.2 Create coupon_usage table migration
    - Add to same migration file
    - Include fields: id, coupon_id, user_id, order_id, discount_amount, used_at
    - Add foreign key constraints with CASCADE delete
    - Add UNIQUE constraint on (coupon_id, user_id)
    - _Requirements: 6.2_
  
  - [x] 1.3 Create indexes for performance
    - Add indexes on: code, is_active, valid_from/valid_until, coupon_type, user_id, coupon_id, order_id
    - _Requirements: 6.3_
  
  - [x] 1.4 Create database helper functions
    - Create `can_user_use_coupon()` function for validation
    - Create timestamp update triggers
    - _Requirements: 7.1_
  
  - [x] 1.5 Add RLS policies
    - Enable RLS on both tables
    - Create policies for public read, authenticated write
    - _Requirements: 10.3_

- [x] 2. TypeScript Types and Interfaces
  - [x] 2.1 Add coupon types to src/types/index.ts
    - Add Coupon interface
    - Add CouponUsage interface
    - Add CouponValidationResult interface
    - Add AppliedCoupon interface
    - Add CouponStatistics interface
    - Update Cart interface to include appliedCoupon field
    - _Requirements: 2.1, 2.2_

- [-] 3. Coupon Service - Core Validation Logic
  - [x] 3.1 Create src/services/coupon.service.ts skeleton
    - Create CouponService class
    - Add method stubs for all public methods
    - Import types and Supabase client
    - _Requirements: 7.1_
  
  - [x] 3.2 Implement validateCoupon() method
    - Check coupon exists and is active
    - Validate date range
    - Check first order requirement (query orders table)
    - Check cart value requirement
    - Check user usage (query coupon_usage table)
    - Check total usage limit
    - Return CouponValidationResult with appropriate error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ] 3.3 Write property test for first order validation
    - **Property 1: First Order Coupon Validation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 3.3**
    - Generate random users with varying order counts
    - Generate random first-order coupons
    - Verify validation only passes when order count is zero
  
  - [ ] 3.4 Write property test for cart value validation
    - **Property 2: Cart Value Requirement Validation**
    - **Validates: Requirements 2.1, 3.4**
    - Generate random coupons with various min_cart_value
    - Generate random cart totals
    - Verify validation passes only when cart >= min_cart_value
  
  - [ ] 3.5 Write property test for date validation
    - **Property 5: Date Validity Validation**
    - **Validates: Requirements 3.5, 9.2**
    - Generate random coupons with various date ranges
    - Generate random current dates
    - Verify validation passes only when current date is within range
  
  - [ ] 3.6 Write property test for active status validation
    - **Property 6: Active Status Validation**
    - **Validates: Requirements 3.6**
    - Generate random coupons with varying is_active status
    - Verify validation only passes for active coupons
  
  - [ ] 3.7 Write property test for usage limit validation
    - **Property 7: Total Usage Limit Validation**
    - **Validates: Requirements 3.7**
    - Generate random coupons with usage limits
    - Simulate various usage counts
    - Verify validation fails when limit is reached

- [ ] 4. Coupon Service - Discount Calculation
  - [x] 4.1 Implement calculateDiscount() helper method
    - Handle fixed amount discounts
    - Handle percentage discounts with max_discount cap
    - Ensure discount never exceeds cart total
    - _Requirements: 7.2_
  
  - [ ] 4.2 Write property test for discount calculation
    - **Property 8: Discount Calculation Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Generate random coupons (fixed and percentage)
    - Generate random cart totals
    - Verify discount calculation is correct for all cases
    - Verify discount never exceeds cart total

- [-] 5. Coupon Service - Application and Usage Tracking
  - [x] 5.1 Implement applyCoupon() method
    - Call validateCoupon() first
    - Calculate discount using calculateDiscount()
    - Return AppliedCoupon object
    - _Requirements: 7.1_
  
  - [x] 5.2 Implement trackUsage() method
    - Create record in coupon_usage table
    - Increment current_usage_count in coupons table
    - Use database transaction for atomicity
    - Handle race conditions
    - _Requirements: 7.3_
  
  - [ ] 5.3 Write property test for usage tracking
    - **Property 9: Usage Tracking Completeness**
    - **Validates: Requirements 7.4, 7.5**
    - Generate random orders with coupons
    - Verify usage record is created
    - Verify usage count is incremented by exactly 1
  
  - [ ] 5.4 Write property test for one-time use per user
    - **Property 4: One-Time Use Per User**
    - **Validates: Requirements 3.2, 3.7**
    - Generate random users and coupons
    - Simulate usage
    - Verify second attempt fails with appropriate error

- [-] 6. Coupon Service - User-Facing Methods
  - [x] 6.1 Implement getAvailableCoupons() method
    - Query active coupons within date range
    - Filter by user eligibility (first order, usage)
    - Filter by cart value
    - Return sorted list (highest discount first)
    - _Requirements: 4.2_
  
  - [x] 6.2 Implement removeCoupon() method
    - Simple method to clear applied coupon from cart state
    - _Requirements: 3.1_
  
  - [ ] 6.3 Write unit tests for getAvailableCoupons()
    - Test filtering by first order status
    - Test filtering by cart value
    - Test filtering by usage limits
    - Test sorting by discount amount

- [ ] 7. Checkpoint - Core Service Complete
  - Ensure all tests pass
  - Verify database operations work correctly
  - Test validation logic with various scenarios
  - Ask the user if questions arise

- [-] 8. Coupon Service - Admin Methods
  - [x] 8.1 Implement createCoupon() method
    - Validate coupon data
    - Generate code if not provided
    - Insert into coupons table
    - Create audit log entry
    - _Requirements: 5.2_
  
  - [x] 8.2 Implement updateCoupon() method
    - Validate updates
    - Update coupons table
    - Create audit log entry
    - _Requirements: 5.2_
  
  - [x] 8.3 Implement deleteCoupon() method
    - Soft delete (set is_active = false) or hard delete
    - Create audit log entry
    - _Requirements: 5.2_
  
  - [x] 8.4 Implement getCoupons() method
    - Query all coupons with optional filter for active/inactive
    - Include usage statistics
    - _Requirements: 5.1_
  
  - [x] 8.5 Implement getCouponById() method
    - Query single coupon by ID
    - Include usage statistics
    - _Requirements: 5.1_
  
  - [x] 8.6 Implement getCouponStatistics() method
    - Calculate total uses, total discount given, unique users
    - Query coupon_usage table
    - _Requirements: 5.3_
  
  - [x] 8.7 Implement generateCouponCode() method
    - Generate random alphanumeric code (6-12 characters)
    - Check uniqueness against database
    - Avoid profanity (basic check)
    - _Requirements: 10.1_
  
  - [ ] 8.8 Write property test for unique code generation
    - **Property 11: Unique Coupon Code Generation**
    - **Validates: Requirements 10.1, 10.2**
    - Generate many codes
    - Verify all are unique
    - Verify all are alphanumeric and correct length
    - Verify sufficient randomness (no obvious patterns)
  
  - [ ] 8.9 Write unit tests for admin methods
    - Test coupon creation with valid data
    - Test coupon creation with invalid data (should fail)
    - Test coupon update
    - Test coupon deletion
    - Test audit log creation

- [-] 9. Admin UI - Coupons List Screen
  - [x] 9.1 Create src/screens/admin/AdminCouponsScreen.tsx
    - Create screen component with tabs (Active, Inactive, Expired)
    - Fetch coupons using couponService.getCoupons()
    - Display coupon cards with key information
    - Add Create Coupon button
    - Add Edit/Delete actions for each coupon
    - _Requirements: 5.1_
  
  - [x] 9.2 Implement coupon card component
    - Show code, type, discount value, status
    - Show usage statistics (used/limit)
    - Show validity dates
    - Add quick actions (Edit, Delete, Toggle Active)
    - _Requirements: 5.1_
  
  - [x] 9.3 Add navigation to AdminCouponsScreen
    - Update src/navigation/RootNavigator.tsx
    - Add to admin drawer menu
    - _Requirements: 5.1_
  
  - [ ] 9.4 Write unit tests for AdminCouponsScreen
    - Test rendering with empty list
    - Test rendering with coupons
    - Test tab switching
    - Test navigation to create/edit screens

- [-] 10. Admin UI - Coupon Details Screen
  - [x] 10.1 Create src/screens/admin/AdminCouponDetailsScreen.tsx
    - Create form with all coupon fields
    - Add validation for required fields
    - Add Generate Random Code button
    - Handle create and edit modes
    - _Requirements: 5.2_
  
  - [x] 10.2 Implement form validation
    - Validate required fields (code, discount_type, discount_value, coupon_type, valid_from, valid_until)
    - Validate discount_value > 0
    - Validate valid_until > valid_from
    - Validate code format (6-12 alphanumeric)
    - Show error messages inline
    - _Requirements: 5.2_
  
  - [x] 10.3 Implement form submission
    - Call couponService.createCoupon() or updateCoupon()
    - Show success/error toast messages
    - Navigate back to list on success
    - _Requirements: 5.2_
  
  - [x] 10.4 Add date pickers for validity period
    - Use React Native date picker component
    - Format dates properly for display and submission
    - _Requirements: 5.2_
  
  - [ ] 10.5 Write unit tests for AdminCouponDetailsScreen
    - Test form validation
    - Test code generation
    - Test form submission (create)
    - Test form submission (edit)
    - Test error handling

- [ ] 11. Checkpoint - Admin UI Complete
  - Ensure all admin screens render correctly
  - Test coupon creation flow end-to-end
  - Test coupon editing flow end-to-end
  - Verify validation works as expected
  - Ask the user if questions arise

- [-] 12. User UI - Checkout Screen Integration
  - [x] 12.1 Update src/screens/CheckoutScreen.tsx
    - Add coupon input section
    - Add state for applied coupon
    - Add state for available coupons
    - _Requirements: 4.1_
  
  - [x] 12.2 Implement coupon input and apply functionality
    - Add text input for coupon code
    - Add Apply button
    - Call couponService.applyCoupon() on submit
    - Show success message and discount amount
    - Show error message if validation fails
    - _Requirements: 4.1_
  
  - [x] 12.3 Implement remove coupon functionality
    - Add Remove button (shown when coupon is applied)
    - Clear applied coupon from state
    - Recalculate order total
    - _Requirements: 4.1_
  
  - [x] 12.4 Implement available coupons section
    - Fetch available coupons using couponService.getAvailableCoupons()
    - Display coupon cards with discount info
    - Show locked/unlocked status based on cart value
    - Add Apply button for each coupon
    - _Requirements: 4.2_
  
  - [x] 12.5 Implement cart value progress indicator
    - Show progress bar for locked coupons
    - Calculate and display amount needed to unlock
    - Update dynamically as cart changes
    - _Requirements: 4.3_
  
  - [x] 12.6 Update order summary to show discount
    - Add discount line item
    - Show coupon code
    - Recalculate total with discount
    - _Requirements: 4.4_
  
  - [ ] 12.7 Write property test for cart value change handling
    - **Property 10: Cart Value Change Handling**
    - **Validates: Requirements 9.1**
    - Generate random carts with applied coupons
    - Simulate cart value changes
    - Verify coupon is removed when cart falls below minimum
  
  - [ ] 12.8 Write unit tests for checkout screen coupon integration
    - Test coupon application flow
    - Test coupon removal flow
    - Test available coupons display
    - Test order summary with discount
    - Test error message display

- [-] 13. User UI - Cart Value Monitoring
  - [x] 13.1 Add cart value change listener
    - Monitor cart total changes
    - Re-validate applied coupon when cart changes
    - Remove coupon if no longer valid
    - Show notification when coupon is removed
    - _Requirements: 9.1_
  
  - [x] 13.2 Update available coupons when cart changes
    - Refresh available coupons list
    - Update locked/unlocked status
    - Update progress indicators
    - _Requirements: 4.2_
  
  - [ ] 13.3 Write unit tests for cart monitoring
    - Test coupon removal on cart value drop
    - Test available coupons update
    - Test notification display

- [-] 14. Order Placement Integration
  - [x] 14.1 Update order placement logic
    - Include coupon information in order data
    - Call couponService.trackUsage() after order is placed
    - Handle errors in usage tracking gracefully
    - _Requirements: 7.3_
  
  - [ ] 14.2 Update Order type to include coupon fields
    - Add coupon_code field
    - Add discount field (if not already present)
    - _Requirements: 7.3_
  
  - [ ] 14.3 Write integration tests for order placement with coupon
    - Test complete flow: apply coupon → place order → verify usage tracked
    - Test order placement without coupon
    - Test error handling if usage tracking fails

- [ ] 15. Error Handling and Edge Cases
  - [ ] 15.1 Implement comprehensive error messages
    - Add all error messages from design document
    - Ensure messages are user-friendly and actionable
    - _Requirements: 8.1_
  
  - [ ] 15.2 Handle concurrent usage scenarios
    - Use database transactions in trackUsage()
    - Handle race conditions gracefully
    - Show appropriate error if usage limit reached during checkout
    - _Requirements: 9.3_
  
  - [ ] 15.3 Implement order cancellation handling
    - Add logic to decrement usage count on order cancellation
    - Remove usage record from coupon_usage table
    - _Requirements: 9.4_
  
  - [ ] 15.4 Write unit tests for edge cases
    - Test concurrent usage attempts
    - Test order cancellation flow
    - Test coupon expiry during session
    - Test network error handling

- [ ] 16. Final Testing and Polish
  - [ ] 16.1 Run all property-based tests
    - Verify all 11 properties pass with 100+ iterations
    - Fix any failures
    - _Requirements: All_
  
  - [ ] 16.2 Run all unit tests
    - Verify 100% pass rate
    - Fix any failures
    - _Requirements: All_
  
  - [ ] 16.3 Manual testing of complete flows
    - Test admin coupon creation flow
    - Test user coupon application flow
    - Test various coupon types (first order, cart value, etc.)
    - Test error scenarios
    - _Requirements: All_
  
  - [ ] 16.4 UI/UX polish
    - Ensure consistent styling with app theme
    - Add loading states
    - Add animations for coupon application
    - Ensure accessibility
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_
  
  - [ ] 16.5 Performance testing
    - Test with large number of coupons
    - Test with high concurrent usage
    - Verify database query performance
    - _Requirements: Performance_

- [ ] 17. Final Checkpoint
  - Ensure all tests pass (property-based and unit)
  - Verify zero TypeScript errors
  - Test complete user flow end-to-end
  - Test complete admin flow end-to-end
  - Verify all requirements are met
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the existing codebase patterns (React Native, TypeScript, Supabase)
- All database operations use Supabase client
- All UI components follow the existing design system
