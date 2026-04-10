# Implementation Plan: Admin Mobile App Improvements

## Overview

This implementation plan transforms the admin mobile app to match the functionality of the admin web application while providing a mobile-optimized experience. The plan addresses the "failed to create" product error, implements multi-category support, adds comprehensive order management, creates a statistics dashboard, and improves the overall UI/UX with professional styling and navigation.

The implementation leverages existing services (item.service.ts, order.service.ts) and the product_categories junction table already deployed in the database. Tasks are organized to build incrementally, with early validation through testing to catch issues quickly.

## Tasks

- [x] 1. Set up navigation structure and core UI components
  - Create bottom tab navigator with Dashboard, Products, Orders, and Settings tabs
  - Implement header component with screen titles and action buttons
  - Set up navigation types and route parameters
  - Configure tab icons and styling
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Implement Dashboard screen with statistics
  - [x] 2.1 Create dashboard data loading function
    - Implement loadDashboardData() to fetch products and orders
    - Calculate total products, total orders, total revenue, pending orders count
    - Extract 5 most recent orders
    - Filter products with stock < 10 for low stock alerts
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 2.2 Write property test for dashboard product count
    - **Property 5: Dashboard Product Count Accuracy**
    - **Validates: Requirements 4.1**
  
  - [x] 2.3 Write property test for dashboard order count and revenue
    - **Property 6: Dashboard Order Count and Revenue Accuracy**
    - **Validates: Requirements 4.1**
  
  - [x] 2.4 Write property test for recent orders sorting
    - **Property 7: Recent Orders Sorting**
    - **Validates: Requirements 4.2**
  
  - [x] 2.5 Write property test for low stock filtering
    - **Property 8: Low Stock Product Filtering**
    - **Validates: Requirements 4.3**
  
  - [x] 2.6 Create dashboard UI components
    - Build stats cards component (2x2 grid)
    - Build recent orders list component
    - Build low stock alerts list component
    - Implement pull-to-refresh functionality
    - Add loading skeleton states
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1_

- [x] 3. Implement product form validation and error handling
  - [x] 3.1 Create product form validation function
    - Validate required fields (name, description, price, stock, SKU, categories, images)
    - Validate price > 0
    - Validate stock >= 0
    - Validate at least one category selected
    - Validate at least one image provided
    - Return error messages for all invalid fields
    - _Requirements: 1.2, 1.5, 2.4_
  
  - [x] 3.2 Write property test for form validation
    - **Property 1: Form Validation Identifies Invalid Fields**
    - **Validates: Requirements 1.2, 1.5**
  
  - [x] 3.3 Write unit tests for validation edge cases
    - Test empty string validation
    - Test whitespace-only strings
    - Test negative numbers
    - Test zero values
    - Test empty arrays
    - _Requirements: 1.2, 1.5_

- [-] 4. Implement multi-category product support
  - [x] 4.1 Create category loading and selection functions
    - Implement loadCategories() using itemService.getCategories()
    - Implement loadProductCategories() to query product_categories table
    - Create category checkbox component
    - Handle category selection state
    - _Requirements: 2.1, 2.3_
  
  - [x] 4.2 Create category save/update functions
    - Implement saveProductCategories() to update product_categories table
    - Delete existing categories for product
    - Insert new category selections
    - Handle transaction errors
    - _Requirements: 2.2, 2.5_
  
  - [ ] 4.3 Write property test for multi-category round trip
    - **Property 3: Multi-Category Round Trip**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ] 4.4 Write unit tests for category operations
    - Test single category selection
    - Test multiple category selection
    - Test category update (add/remove)
    - Test empty category validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Implement image upload with multiple images support
  - [ ] 5.1 Create image selection and upload components
    - Build image picker component using React Native image picker
    - Create image thumbnail grid component
    - Implement image removal from selection
    - Add "Add Image" button with max limit enforcement (5 images)
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 5.2 Implement image upload function with progress
    - Use itemService.uploadImage() for each image
    - Upload images sequentially with progress tracking
    - Save image records to item_images table
    - Handle upload failures with retry logic
    - _Requirements: 3.4, 3.5_
  
  - [ ] 5.3 Write property test for image removal
    - **Property 4: Image Removal Preserves Other Images**
    - **Validates: Requirements 3.3**
  
  - [ ] 5.4 Write unit tests for image upload
    - Test single image upload
    - Test multiple image upload
    - Test max image limit enforcement
    - Test upload retry on failure
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 6. Checkpoint - Ensure validation and multi-category tests pass
  - Run all property tests and unit tests
  - Verify form validation works correctly
  - Verify multi-category operations work correctly
  - Verify image upload works correctly
  - Ask the user if questions arise

- [ ] 7. Implement product creation and fix "failed to create" error
  - [ ] 7.1 Create product form screen with all fields
    - Build form UI with text inputs (name, description, SKU)
    - Build number inputs (price, stock)
    - Integrate category checkboxes
    - Integrate image upload component
    - Add toggle switches (is_featured, is_active)
    - _Requirements: 1.1, 2.1, 3.1, 5.6_
  
  - [ ] 7.2 Implement product creation flow
    - Validate form data before submission
    - Create product using itemService.createItem()
    - Save product categories to product_categories table
    - Upload and save images
    - Handle errors with specific error messages
    - Display success toast notification
    - Clear form and navigate to product list
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.4, 8.5_
  
  - [ ] 7.3 Write property test for form state reset
    - **Property 2: Form State Reset After Creation**
    - **Validates: Requirements 1.4**
  
  - [ ] 7.4 Write property test for data synchronization
    - **Property 17: Data Synchronization After Operations**
    - **Validates: Requirements 10.1**
  
  - [ ] 7.5 Write unit tests for product creation
    - Test successful product creation
    - Test creation with validation errors
    - Test creation with network errors
    - Test form reset after creation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 8. Implement product editing functionality
  - [ ] 8.1 Create product edit screen
    - Load existing product data using itemService.getItemById()
    - Load existing product categories
    - Populate form fields with existing data
    - Pre-check selected categories
    - Display existing images
    - _Requirements: 2.3, 5.4, 5.6_
  
  - [ ] 8.2 Implement product update flow
    - Validate form data before submission
    - Update product using itemService.updateItem()
    - Update product categories in product_categories table
    - Handle new image uploads
    - Display success toast notification
    - Navigate back to product list
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 8.4, 8.5_
  
  - [ ] 8.3 Write unit tests for product editing
    - Test loading existing product
    - Test updating product fields
    - Test updating categories
    - Test adding new images
    - _Requirements: 2.3, 5.4, 5.6_

- [ ] 9. Implement product list screen with search and filters
  - [ ] 9.1 Create product list UI
    - Build product card component with image, name, price, stock
    - Implement infinite scroll pagination
    - Add floating action button for "Add Product"
    - Add loading indicators
    - _Requirements: 5.1, 8.1_
  
  - [ ] 9.2 Implement search functionality
    - Add search bar component
    - Implement real-time search using itemService.searchItems()
    - Debounce search input (300ms)
    - Display "no results" message when appropriate
    - _Requirements: 5.2_
  
  - [ ] 9.3 Implement category filter
    - Add category filter chips
    - Filter products by selected category using product_categories table
    - Allow clearing filter
    - _Requirements: 5.3_
  
  - [ ] 9.4 Implement product deletion
    - Add delete action to product cards
    - Show confirmation dialog before deletion
    - Delete product using itemService.deleteItem()
    - Refresh product list after deletion
    - Display success toast notification
    - _Requirements: 5.5, 8.4_
  
  - [ ] 9.5 Write property test for product list completeness
    - **Property 9: Product List Completeness**
    - **Validates: Requirements 5.1**
  
  - [ ] 9.6 Write property test for search filtering
    - **Property 10: Product Search Filtering**
    - **Validates: Requirements 5.2**
  
  - [ ] 9.7 Write property test for category filtering
    - **Property 11: Product Category Filtering**
    - **Validates: Requirements 5.3**
  
  - [ ] 9.8 Write unit tests for product list operations
    - Test pagination
    - Test search with various queries
    - Test category filter
    - Test product deletion
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 10. Checkpoint - Ensure product management tests pass
  - Run all property tests for product features
  - Verify product creation works end-to-end
  - Verify product editing works end-to-end
  - Verify search and filtering work correctly
  - Ask the user if questions arise

- [ ] 11. Implement order list screen with status filtering
  - [ ] 11.1 Create order list UI
    - Build order card component with order number, customer, total, status
    - Add status badge with color coding
    - Implement infinite scroll pagination
    - Add pull-to-refresh functionality
    - _Requirements: 6.1, 8.1_
  
  - [ ] 11.2 Implement status filter
    - Add status filter chips (All, Pending, Confirmed, Preparing, Out for Delivery, Delivered)
    - Filter orders by selected status
    - Update order list when filter changes
    - _Requirements: 6.2_
  
  - [ ] 11.3 Implement pending order count badge
    - Calculate pending order count
    - Display badge on Orders tab in navigation
    - Update badge when orders change
    - _Requirements: 6.6_
  
  - [ ] 11.4 Write property test for order list completeness
    - **Property 12: Order List Completeness**
    - **Validates: Requirements 6.1**
  
  - [ ] 11.5 Write property test for order status filtering
    - **Property 13: Order Status Filtering**
    - **Validates: Requirements 6.2**
  
  - [ ] 11.6 Write property test for pending order count
    - **Property 15: Pending Order Count Accuracy**
    - **Validates: Requirements 6.6**
  
  - [ ] 11.7 Write unit tests for order list operations
    - Test order loading
    - Test status filtering
    - Test pending count calculation
    - _Requirements: 6.1, 6.2, 6.6_

- [ ] 12. Implement order details screen with status updates
  - [ ] 12.1 Create order details UI
    - Build order header component (order number, date, status)
    - Build customer information section
    - Build shipping address section
    - Build order items list with images
    - Build payment information section
    - _Requirements: 6.3_
  
  - [ ] 12.2 Implement order status update
    - Add status dropdown selector
    - Implement updateOrderStatus using orderService.updateOrderStatus()
    - Display success toast notification after update
    - Refresh order details after update
    - Handle update errors
    - _Requirements: 6.4, 6.5, 8.4, 8.5_
  
  - [ ] 12.3 Write property test for order status update
    - **Property 14: Order Status Update Persistence**
    - **Validates: Requirements 6.4, 6.5**
  
  - [ ] 12.4 Write unit tests for order details
    - Test loading order details
    - Test status update
    - Test error handling
    - _Requirements: 6.3, 6.4, 6.5_

- [ ] 13. Implement settings screen with profile and logout
  - [ ] 13.1 Create settings UI
    - Build profile section with avatar and name
    - Display admin email
    - Add app version information
    - Add logout button
    - _Requirements: 9.1, 9.4_
  
  - [ ] 13.2 Implement profile loading
    - Load admin profile from Supabase auth
    - Display profile information
    - _Requirements: 9.1_
  
  - [ ] 13.3 Implement logout functionality
    - Show confirmation dialog on logout button tap
    - Clear authentication session using supabase.auth.signOut()
    - Navigate to login screen
    - _Requirements: 9.2, 9.3_
  
  - [ ] 13.4 Write property test for profile updates
    - **Property 16: Profile Update Persistence**
    - **Validates: Requirements 9.5**
  
  - [ ] 13.5 Write unit tests for settings operations
    - Test profile loading
    - Test logout flow
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 14. Implement comprehensive error handling and loading states
  - [ ] 14.1 Add loading indicators to all screens
    - Add loading skeletons for dashboard
    - Add loading spinners for lists
    - Add loading states for form submissions
    - Disable buttons during processing to prevent duplicate submissions
    - _Requirements: 8.1, 8.6_
  
  - [ ] 14.2 Implement error handling with toast notifications
    - Add error toast for network failures
    - Add error toast for validation failures
    - Add success toast for successful operations
    - Add retry buttons for network errors
    - _Requirements: 1.3, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 14.3 Write unit tests for error handling
    - Test network error display
    - Test validation error display
    - Test success notification display
    - Test retry functionality
    - _Requirements: 1.3, 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Implement UI/UX improvements and styling
  - [ ] 15.1 Style navigation components
    - Apply consistent styling to bottom tab navigator
    - Style header bar with proper colors and spacing
    - Add active tab highlighting
    - Ensure proper safe area handling
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 15.2 Style buttons and form elements
    - Create consistent button styles (primary, secondary, danger)
    - Apply proper alignment and spacing to all buttons
    - Style form inputs with consistent appearance
    - Add focus states for inputs
    - _Requirements: 7.4, 7.5_
  
  - [ ] 15.3 Apply consistent spacing and layout
    - Use consistent padding and margins throughout app
    - Ensure proper spacing between sections
    - Apply mobile design best practices
    - Test on multiple screen sizes
    - _Requirements: 7.5_
  
  - [ ] 15.4 Write visual regression tests
    - Capture screenshots of key screens
    - Compare against baseline images
    - _Requirements: 7.4, 7.5_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Run complete test suite (all property tests and unit tests)
  - Verify all 17 correctness properties pass
  - Verify all user flows work end-to-end
  - Test on both iOS and Android
  - Ask the user if questions arise

- [ ] 17. Integration and final testing
  - [ ] 17.1 Test complete product management flow
    - Create product with multiple categories and images
    - Edit product and update categories
    - Search for product
    - Filter products by category
    - Delete product
    - _Requirements: 1.1, 2.2, 3.1, 5.2, 5.3, 5.5_
  
  - [ ] 17.2 Test complete order management flow
    - View order list
    - Filter orders by status
    - Open order details
    - Update order status
    - Verify pending order badge updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 17.3 Test dashboard functionality
    - Verify all statistics are accurate
    - Tap on recent order and verify navigation
    - Tap on low stock product and verify navigation
    - Pull to refresh and verify data updates
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 17.4 Test settings and authentication
    - View profile information
    - Logout and verify session cleared
    - Login again and verify admin access
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 17.5 Write integration tests for complete flows
    - Test end-to-end product creation flow
    - Test end-to-end order management flow
    - Test end-to-end dashboard flow
    - _Requirements: All_

## Notes

- All tasks are required for comprehensive implementation with full test coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation leverages existing services (item.service.ts, order.service.ts) and the product_categories junction table
- Multi-category support is a critical feature that must be implemented correctly to match admin web functionality
- Error handling and loading states are essential for professional UX
- All tests should be run before considering the implementation complete
