# Requirements Document

## Introduction

This specification addresses three critical bugs in the mobile e-commerce application related to profile statistics display and image upload functionality. The issues prevent users from seeing accurate profile data and prevent both users and administrators from successfully uploading images to Supabase Storage.

## Glossary

- **Profile_Screen**: The user interface displaying user profile information and statistics
- **Avatar**: User profile picture stored in Supabase Storage
- **Product_Image**: Product photograph stored in Supabase Storage
- **Supabase_Storage**: Cloud storage service for storing images and files
- **Order_Count**: Total number of orders placed by a user
- **Saved_Amount**: Total discount amount saved across all user orders
- **Wishlist_Count**: Number of items in user's wishlist
- **Auth_Service**: Service handling user authentication and profile operations
- **Item_Service**: Service handling product/item operations
- **Image_Upload**: Process of transferring image from device to Supabase Storage

## Requirements

### Requirement 1: Dynamic Profile Statistics Display

**User Story:** As a user, I want to see accurate statistics on my profile screen, so that I can track my shopping activity and savings.

#### Acceptance Criteria

1. WHEN the Profile_Screen loads, THE System SHALL query the database for the user's actual order count
2. WHEN displaying the order count, THE System SHALL show the real number of orders from the database instead of hardcoded value "12"
3. WHEN the Profile_Screen loads, THE System SHALL calculate the total saved amount from all user orders
4. WHEN displaying the saved amount, THE System SHALL show the actual savings calculated from order discounts instead of hardcoded value "₹2.5K"
5. WHEN the Profile_Screen loads, THE System SHALL verify the wishlist count matches the current wishlist items length
6. WHEN order data or discount data is unavailable, THE System SHALL display "0" for order count and "₹0" for saved amount

### Requirement 2: Avatar Upload to Supabase Storage

**User Story:** As a user, I want to upload and save my profile picture, so that my avatar persists across sessions and devices.

#### Acceptance Criteria

1. WHEN a user selects an image from gallery or camera, THE System SHALL display the selected image locally
2. WHEN a user saves their profile with a new avatar, THE System SHALL upload the image file to Supabase_Storage avatars bucket
3. WHEN the avatar upload succeeds, THE System SHALL update the user's avatar_url field in the database with the public URL
4. WHEN the avatar upload fails, THE System SHALL display an error message and maintain the previous avatar
5. WHEN uploading an avatar, THE System SHALL convert the local image URI to a blob format compatible with Supabase_Storage
6. WHEN the avatar is uploaded, THE System SHALL use the user ID as the folder name and generate a unique filename
7. WHEN an avatar already exists for the user, THE System SHALL replace it using the upsert option

### Requirement 3: Product Image Upload to Supabase Storage

**User Story:** As an administrator, I want to upload product images that persist in storage, so that products display correctly with their images.

#### Acceptance Criteria

1. WHEN an admin selects product images from gallery or camera, THE System SHALL display the selected images locally
2. WHEN an admin saves a product with new images, THE System SHALL upload each image file to Supabase_Storage products bucket
3. WHEN product image uploads succeed, THE System SHALL save the public URLs to the item_images table
4. WHEN product image upload fails, THE System SHALL log the error and continue with remaining images
5. WHEN uploading product images, THE System SHALL convert local image URIs to blob format compatible with Supabase_Storage
6. WHEN uploading product images, THE System SHALL use the product ID as the folder name and timestamp for unique filenames
7. WHEN saving product images to the database, THE System SHALL set display_order and is_primary flags correctly
8. WHEN the uploadImage function is called, THE System SHALL properly handle React Native's FormData for file uploads

### Requirement 4: Error Handling and User Feedback

**User Story:** As a user or administrator, I want clear feedback during image uploads, so that I understand if operations succeed or fail.

#### Acceptance Criteria

1. WHEN an image upload starts, THE System SHALL display a loading indicator
2. WHEN an image upload succeeds, THE System SHALL display a success message
3. WHEN an image upload fails, THE System SHALL display a specific error message indicating the failure reason
4. WHEN multiple images are being uploaded, THE System SHALL show progress for the batch operation
5. WHEN network errors occur during upload, THE System SHALL provide a user-friendly error message
6. WHEN storage permissions are insufficient, THE System SHALL display an appropriate error message
