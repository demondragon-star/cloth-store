# Requirements Document

## Introduction

This specification defines the requirements for improving the category display in the mobile e-commerce application. The current implementation shows category cards with either solid colors or placeholder icons. This feature will enhance the user experience by displaying relevant fashion images for each category and streamlining the category list to focus on the core product categories.

## Glossary

- **Category**: A top-level product classification in the e-commerce system (e.g., Men, Women, Kids, Sports)
- **CategoryCard**: The React Native component that renders individual category items in the UI
- **CategoriesScreen**: The main screen that displays all available categories in a grid layout
- **Category_Service**: The backend service that manages category data retrieval from Supabase
- **Image_Asset**: A static image file stored in the mobile app's assets directory
- **Database**: The Supabase PostgreSQL database that stores category information

## Requirements

### Requirement 1: Display Category Images

**User Story:** As a user, I want to see relevant fashion images for each category, so that I can quickly identify and navigate to the products I'm interested in.

#### Acceptance Criteria

1. WHEN the CategoriesScreen loads, THE CategoryCard SHALL display a fashion-related image for each category
2. WHEN a category has an image_url defined, THE CategoryCard SHALL render that image using the Image component
3. WHEN the Men category is displayed, THE CategoryCard SHALL show an image representing men's fashion
4. WHEN the Women category is displayed, THE CategoryCard SHALL show an image representing women's fashion
5. WHEN the Kids category is displayed, THE CategoryCard SHALL show an image representing kids' fashion
6. WHEN the Sports category is displayed, THE CategoryCard SHALL show an image representing sports fashion
7. WHEN an image fails to load, THE CategoryCard SHALL display a fallback placeholder with an appropriate icon

### Requirement 2: Update Category List

**User Story:** As a product manager, I want to maintain only relevant categories in the system, so that users see a focused and curated shopping experience.

#### Acceptance Criteria

1. THE Database SHALL contain exactly four active categories: Men, Women, Kids, and Sports
2. WHEN the Footwear category exists, THE System SHALL mark it as inactive or remove it
3. WHEN the Accessories category exists, THE System SHALL mark it as inactive or remove it
4. WHEN the Category_Service fetches categories, THE System SHALL return only active categories
5. WHEN categories are displayed, THE System SHALL order them by display_order field

### Requirement 3: Manage Category Image Assets

**User Story:** As a developer, I want category images stored as local assets, so that the app loads quickly and works offline.

#### Acceptance Criteria

1. THE System SHALL store category images as local assets in the mobile app
2. WHEN the app builds, THE System SHALL include all category images in the bundle
3. WHEN a category image is referenced, THE System SHALL use the require() syntax for local assets
4. THE System SHALL provide images with appropriate dimensions for mobile display (minimum 800x600 pixels)
5. THE System SHALL optimize images for mobile performance (maximum 500KB per image)

### Requirement 4: Update Database Category Records

**User Story:** As a system administrator, I want category records updated with image URLs, so that the app can display the correct images for each category.

#### Acceptance Criteria

1. WHEN category records are updated, THE Database SHALL store the image_url for each category
2. WHEN using local assets, THE image_url field SHALL contain a reference identifier for the asset
3. WHEN the display_order is set, THE Men category SHALL have display_order 1
4. WHEN the display_order is set, THE Women category SHALL have display_order 2
5. WHEN the display_order is set, THE Kids category SHALL have display_order 3
6. WHEN the display_order is set, THE Sports category SHALL have display_order 4

### Requirement 5: Maintain Backward Compatibility

**User Story:** As a developer, I want the CategoryCard component to handle both image URLs and fallback states, so that the app remains stable during the transition.

#### Acceptance Criteria

1. WHEN a category has no image_url, THE CategoryCard SHALL display the existing gradient placeholder
2. WHEN the CategoryCard receives an invalid image_url, THE System SHALL log an error and show the fallback UI
3. WHEN categories are filtered or searched, THE CategoryCard SHALL continue to function correctly
4. WHEN the app is in offline mode, THE CategoryCard SHALL display local asset images without errors
5. WHEN the large variant is used, THE CategoryCard SHALL display images with the gradient overlay for text readability
