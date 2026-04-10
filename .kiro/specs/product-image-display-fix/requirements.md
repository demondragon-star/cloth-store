# Requirements Document

## Introduction

This specification addresses a critical bug where product images uploaded by administrators are not displaying correctly for users in the mobile application. Images show placeholder icons instead of actual product images on product cards (home screen, category screens) and product detail pages. The root cause appears to be a mismatch between the database column names and the code's expectations for image URL properties.

## Glossary

- **Item_Images_Table**: The Supabase database table that stores product image metadata and URLs
- **ProductCard**: React Native component that displays product information in a card format on list views
- **ImageSlider**: React Native component that displays product images in a carousel on detail pages
- **Item_Service**: Service layer that handles data fetching from Supabase for products and images
- **Image_URL_Property**: The property name used to access image URLs from the database response
- **Admin_Upload**: The process by which administrators add product images through the admin interface

## Requirements

### Requirement 1: Database Schema Investigation

**User Story:** As a developer, I want to verify the actual database schema for the item_images table, so that I can identify the correct column names for image URLs.

#### Acceptance Criteria

1. WHEN querying the item_images table schema, THE System SHALL return the actual column definitions including data types and names
2. THE Investigation SHALL identify whether the image URL column is named 'url', 'image_url', or another name
3. THE Investigation SHALL verify that the column name matches what the Supabase query is selecting
4. THE Investigation SHALL document any discrepancies between expected and actual column names

### Requirement 2: Image Upload Verification

**User Story:** As a developer, I want to verify that admin image uploads are storing data correctly, so that I can ensure images are available for retrieval.

#### Acceptance Criteria

1. WHEN an admin uploads a product image, THE System SHALL store the image URL in the item_images table
2. WHEN an admin uploads a product image, THE System SHALL store the URL in the correct column as defined by the database schema
3. WHEN querying uploaded images, THE System SHALL return non-null URL values for successfully uploaded images
4. IF an image upload fails, THEN THE System SHALL log the error and notify the admin

### Requirement 3: Consistent Image URL Access

**User Story:** As a developer, I want to standardize how image URLs are accessed throughout the application, so that images display consistently across all components.

#### Acceptance Criteria

1. THE ProductCard SHALL access image URLs using the correct property name from the database response
2. THE ImageSlider SHALL access image URLs using the correct property name from the database response
3. WHEN the database returns image data, THE System SHALL use a single, consistent property name to access URLs
4. THE ItemImage TypeScript interface SHALL accurately reflect the actual database column names

### Requirement 4: Supabase Query Correctness

**User Story:** As a developer, I want to ensure Supabase queries select the correct columns, so that image data is properly retrieved.

#### Acceptance Criteria

1. WHEN the Item_Service fetches items with images, THE Query SHALL select all necessary columns from the item_images table
2. THE Query SHALL use the correct table name as defined in the TABLES constant
3. WHEN images are fetched, THE Response SHALL include the image URL property with valid, accessible URLs
4. THE Query SHALL handle cases where items have no images without causing errors

### Requirement 5: Fallback Handling

**User Story:** As a user, I want to see appropriate placeholder images when product images are unavailable, so that the UI remains functional and informative.

#### Acceptance Criteria

1. WHEN a product has no images, THE ProductCard SHALL display a placeholder icon
2. WHEN a product has no images, THE ImageSlider SHALL display a placeholder icon
3. WHEN an image URL is null or undefined, THE System SHALL display the placeholder instead of attempting to load the image
4. THE Placeholder SHALL be visually distinct and indicate that no image is available

### Requirement 6: Image URL Validation

**User Story:** As a developer, I want to validate that image URLs are accessible, so that broken images are detected and handled appropriately.

#### Acceptance Criteria

1. WHEN an image URL is retrieved from the database, THE System SHALL verify it is a non-empty string
2. WHEN an image URL is retrieved, THE System SHALL verify it follows a valid URL format
3. IF an image URL is invalid or inaccessible, THEN THE System SHALL log a warning and display the placeholder
4. THE System SHALL handle both Supabase storage URLs and external URLs correctly

### Requirement 7: Type Safety

**User Story:** As a developer, I want TypeScript interfaces to accurately reflect the database schema, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE ItemImage interface SHALL define properties that match the actual database columns
2. WHEN accessing image properties, THE TypeScript compiler SHALL provide accurate type checking
3. THE ItemImage interface SHALL mark optional properties correctly based on database constraints
4. THE Item interface SHALL correctly type the images array relationship

### Requirement 8: Testing and Verification

**User Story:** As a developer, I want to verify the fix works across all scenarios, so that images display correctly in all contexts.

#### Acceptance Criteria

1. WHEN a product with images is displayed on the home screen, THE ProductCard SHALL show the first product image
2. WHEN a product with images is displayed on a category screen, THE ProductCard SHALL show the first product image
3. WHEN a product detail page is opened, THE ImageSlider SHALL display all product images
4. WHEN a product has multiple images, THE ImageSlider SHALL allow users to swipe through all images
5. WHEN a product has no images, THE System SHALL display placeholders without errors
