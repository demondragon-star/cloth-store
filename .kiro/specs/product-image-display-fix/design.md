# Design Document: Product Image Display Fix

## Overview

This design addresses a critical bug where product images are not displaying correctly in the mobile application. The issue stems from inconsistencies in how image URLs are accessed from the database response. The code currently checks for both `url` and `image_url` properties (`item.images?.[0]?.url || item.images?.[0]?.image_url`), suggesting uncertainty about the actual property name returned by Supabase.

The fix involves:
1. Investigating the actual database schema to identify the correct column name
2. Standardizing image URL access throughout the codebase
3. Updating TypeScript interfaces to match the database schema
4. Ensuring proper fallback handling for missing images

## Architecture

### Current Architecture

```
┌─────────────────┐
│  Admin Upload   │
│   (Mobile App)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Item Service    │
│ uploadImage()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase        │
│ Storage Bucket  │
│ 'products'      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ item_images     │
│ Table           │
│ (stores URL)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Item Service    │
│ getItems()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI Components   │
│ ProductCard     │
│ ImageSlider     │
└─────────────────┘
```

### Problem Areas

1. **Database Schema Uncertainty**: The actual column name in `item_images` table is unknown
2. **Inconsistent Access Pattern**: Code uses `item.url || item.image_url` fallback pattern
3. **Type Definition Mismatch**: `ItemImage` interface defines both `url` and `image_url?` properties
4. **Upload vs Retrieval Mismatch**: Upload process may store URLs differently than retrieval expects

## Components and Interfaces

### 1. Database Schema Investigation

**Objective**: Determine the actual column structure of the `item_images` table.

**Approach**:
- Query Supabase to inspect the table schema
- Verify column names, data types, and constraints
- Check existing data to see which column contains image URLs
- Document the findings

**Expected Schema** (to be verified):
```sql
CREATE TABLE item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,  -- OR image_url TEXT NOT NULL?
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Item Service Updates

**Current Implementation** (item.service.ts):
```typescript
// Fetches items with images using:
.select(`
  *,
  images:${TABLES.ITEM_IMAGES}(*)
`)
```

**Issue**: The wildcard `(*)` selects all columns, but the code doesn't know which column contains the URL.

**Solution**: Explicitly select columns and verify the correct property name:
```typescript
.select(`
  *,
  images:${TABLES.ITEM_IMAGES}(
    id,
    url,
    alt_text,
    display_order,
    is_primary
  )
`)
```

### 3. TypeScript Interface Updates

**Current Interface** (types/index.ts):
```typescript
export interface ItemImage {
    id: string;
    url: string;
    alt_text?: string;
    display_order: number;
    is_primary: boolean;
    image_url?: string;  // Redundant property
}
```

**Issue**: Having both `url` and `image_url?` creates ambiguity.

**Solution**: Update interface to match the actual database schema:

**Option A** (if database uses 'url'):
```typescript
export interface ItemImage {
    id: string;
    url: string;
    alt_text?: string;
    display_order: number;
    is_primary: boolean;
}
```

**Option B** (if database uses 'image_url'):
```typescript
export interface ItemImage {
    id: string;
    image_url: string;
    alt_text?: string;
    display_order: number;
    is_primary: boolean;
}
```

### 4. Component Updates

#### ProductCard Component

**Current Implementation**:
```typescript
const imageUrl = item.images?.[0]?.url || item.images?.[0]?.image_url;
```

**Solution**: Use the correct property name consistently:
```typescript
// If database uses 'url':
const imageUrl = item.images?.[0]?.url;

// If database uses 'image_url':
const imageUrl = item.images?.[0]?.image_url;
```

**Fallback Handling**:
```typescript
{imageUrl ? (
    <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
) : (
    <View style={styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={40} color={COLORS.gray[400]} />
    </View>
)}
```

#### ImageSlider Component

**Current Implementation**:
```typescript
<Image
    source={{ uri: item.url || item.image_url }}
    style={styles.image}
    resizeMode="contain"
/>
```

**Solution**: Use the correct property name consistently:
```typescript
<Image
    source={{ uri: item.url }}  // or item.image_url
    style={styles.image}
    resizeMode="contain"
/>
```

### 5. Image Upload Process

**Current Implementation** (item.service.ts):
```typescript
async uploadImage(uri: string, fileType: string = 'image/jpeg', productId: string = 'temp'): Promise<{ url: string | null; error: string | null }> {
    // Uploads to Supabase storage
    // Returns publicUrl
}
```

**Issue**: The upload returns a `url`, but we need to verify this is stored correctly in `item_images` table.

**Solution**: Ensure the upload process stores the URL in the correct column:

```typescript
// After upload, when saving to item_images table:
const imageRecord = {
    item_id: productId,
    url: publicUrl,  // or image_url: publicUrl
    display_order: existingImages.length,
    is_primary: existingImages.length === 0
};

await supabase
    .from(TABLES.ITEM_IMAGES)
    .insert(imageRecord);
```

### 6. Admin Product Details Screen

**Current Implementation**:
The screen stores images in `image_urls` array on the Item record:
```typescript
const itemData: Partial<Item> = {
    // ...
    image_urls: finalImageUrls,
};
```

**Issue**: This stores URLs in the `items` table's `image_urls` column, not in the `item_images` table.

**Solution**: Update to store images in the `item_images` table:

```typescript
// After creating/updating the item:
if (finalImageUrls.length > 0) {
    // Delete existing images
    await supabase
        .from(TABLES.ITEM_IMAGES)
        .delete()
        .eq('item_id', savedProductId);
    
    // Insert new images
    const imageRecords = finalImageUrls.map((url, index) => ({
        item_id: savedProductId,
        url: url,  // or image_url: url
        display_order: index,
        is_primary: index === 0
    }));
    
    await supabase
        .from(TABLES.ITEM_IMAGES)
        .insert(imageRecords);
}
```

## Data Models

### ItemImage Model

```typescript
interface ItemImage {
    id: string;              // UUID primary key
    item_id: string;         // Foreign key to items table
    url: string;             // Image URL (or image_url based on schema)
    alt_text?: string;       // Optional alt text for accessibility
    display_order: number;   // Order in which images should be displayed
    is_primary: boolean;     // Whether this is the primary/featured image
    created_at: string;      // Timestamp
    updated_at: string;      // Timestamp
}
```

### Item Model (relevant fields)

```typescript
interface Item {
    id: string;
    name: string;
    // ...
    images: ItemImage[];     // Array of image objects from item_images table
    image_urls?: string[];   // Legacy field, may need to be deprecated
    // ...
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Upload-Retrieval Round Trip
*For any* valid image uploaded through the admin interface, storing it in the database and then querying the item's images should return the uploaded image URL in the correct property with a non-null value.
**Validates: Requirements 2.1, 2.3**

### Property 2: Upload Error Handling
*For any* image upload that fails, the system should log the error and notify the admin without crashing or leaving the system in an inconsistent state.
**Validates: Requirements 2.4**

### Property 3: Consistent URL Property Access
*For any* UI component that displays product images, accessing the image URL should use the same property name that matches the database schema.
**Validates: Requirements 3.1**

### Property 4: Graceful Handling of Missing Images
*For any* item with no images, null image URLs, or invalid image URLs, the UI components should display a placeholder icon without throwing errors or attempting to load invalid images.
**Validates: Requirements 4.4, 5.1, 5.2, 5.3, 6.3**

### Property 5: URL Validation
*For any* image URL retrieved from the database, the URL should be a non-empty string that follows valid URL format conventions (starts with http:// or https://).
**Validates: Requirements 4.3, 6.1, 6.2**

### Property 6: Multiple URL Types Support
*For any* valid image URL (whether Supabase storage URL or external URL), the system should handle it correctly and display the image without errors.
**Validates: Requirements 6.4**

### Property 7: ImageSlider Displays All Images
*For any* item with multiple images, the ImageSlider should display all images in the order specified by the display_order field.
**Validates: Requirements 8.3**

### Property 8: Multiple Images Swipeable
*For any* item with N images (where N > 1), the ImageSlider should allow users to swipe through all N images, with each image accessible via horizontal swipe gestures.
**Validates: Requirements 8.4**

## Error Handling

### 1. Missing Images

**Scenario**: Item has no images in the database.

**Handling**:
```typescript
if (!item.images || item.images.length === 0) {
    // Display placeholder
    return <PlaceholderImage />;
}
```

### 2. Invalid Image URLs

**Scenario**: Image URL is null, undefined, or malformed.

**Handling**:
```typescript
const imageUrl = item.images?.[0]?.url;
if (!imageUrl || !isValidUrl(imageUrl)) {
    console.warn(`Invalid image URL for item ${item.id}`);
    return <PlaceholderImage />;
}
```

### 3. Image Load Failures

**Scenario**: Image URL is valid but the image fails to load (network error, 404, etc.).

**Handling**:
```typescript
<Image
    source={{ uri: imageUrl }}
    style={styles.image}
    onError={(error) => {
        console.error(`Failed to load image: ${imageUrl}`, error);
        // Could set a state to show placeholder
    }}
/>
```

### 4. Upload Failures

**Scenario**: Admin uploads an image but the upload fails.

**Handling**:
```typescript
const { url, error } = await itemService.uploadImage(img.uri, 'image/jpeg', productId);
if (error) {
    console.error('Failed to upload image:', error);
    Alert.alert('Upload Error', `Failed to upload image: ${error}`);
    // Continue with other images
}
```

### 5. Database Write Failures

**Scenario**: Image uploads successfully but fails to save to item_images table.

**Handling**:
```typescript
const { error } = await supabase
    .from(TABLES.ITEM_IMAGES)
    .insert(imageRecords);

if (error) {
    console.error('Failed to save image records:', error);
    Alert.alert('Error', 'Images uploaded but failed to save to database');
    // Consider rolling back uploaded images
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Image URL Access**
   - Test accessing image URL from item with images
   - Test accessing image URL from item without images
   - Test accessing image URL with null/undefined values

2. **Type Validation**
   - Test that ItemImage interface matches expected structure
   - Test that Item interface correctly types the images array

3. **URL Validation**
   - Test valid URL formats
   - Test invalid URL formats
   - Test empty strings and null values

4. **Fallback Rendering**
   - Test placeholder display when no images
   - Test placeholder display when invalid URL
   - Test image display when valid URL

### Property-Based Tests

Property tests will verify universal properties across all inputs (minimum 100 iterations each):

1. **Property Test: Image URL Consistency**
   - **Feature: product-image-display-fix, Property 1: Image URL Consistency**
   - Generate random items with various image configurations
   - Verify that accessing image URLs always returns expected type
   - Verify no runtime errors when accessing image properties

2. **Property Test: Upload-Retrieval Round Trip**
   - **Feature: product-image-display-fix, Property 3: Upload-Retrieval Round Trip**
   - Generate random image URLs
   - Simulate upload and storage
   - Verify retrieval returns the same URL in the correct property

3. **Property Test: Fallback Display**
   - **Feature: product-image-display-fix, Property 4: Fallback Display**
   - Generate random items with missing/invalid images
   - Verify placeholder is always displayed without errors
   - Verify no null pointer exceptions

4. **Property Test: URL Validity**
   - **Feature: product-image-display-fix, Property 5: URL Validity**
   - Generate random strings (valid and invalid URLs)
   - Verify URL validation correctly identifies valid URLs
   - Verify invalid URLs are handled gracefully

### Integration Tests

1. **End-to-End Image Display**
   - Create a test product with images
   - Verify images display on home screen ProductCard
   - Verify images display on category screen ProductCard
   - Verify images display on product detail ImageSlider

2. **Admin Upload Flow**
   - Upload images through admin interface
   - Verify images are stored in database
   - Verify images display correctly for users

3. **Multiple Images**
   - Create product with multiple images
   - Verify all images display in ImageSlider
   - Verify correct ordering by display_order

### Manual Testing Checklist

- [ ] Verify database schema matches expectations
- [ ] Upload new product images through admin interface
- [ ] Check that images display on home screen
- [ ] Check that images display on category screens
- [ ] Check that images display on product detail page
- [ ] Test with products that have no images
- [ ] Test with products that have multiple images
- [ ] Test image swipe functionality in ImageSlider
- [ ] Verify placeholder displays correctly
- [ ] Check console for any errors or warnings

## Implementation Notes

### Investigation Phase

Before implementing fixes, we must:

1. **Query the database schema**:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'item_images';
   ```

2. **Check existing data**:
   ```sql
   SELECT id, url, image_url
   FROM item_images
   LIMIT 10;
   ```

3. **Verify Supabase query response**:
   ```typescript
   const { data } = await supabase
       .from('item_images')
       .select('*')
       .limit(1);
   console.log('Image data structure:', data);
   ```

### Decision Tree

Based on investigation results:

```
IF database column is 'url':
    - Update ItemImage interface to use 'url' only
    - Remove 'image_url' property
    - Update all components to use item.url
    
ELSE IF database column is 'image_url':
    - Update ItemImage interface to use 'image_url' only
    - Remove 'url' property
    - Update all components to use item.image_url
    
ELSE IF both columns exist:
    - Determine which is the primary column
    - Deprecate the other column
    - Migrate data if necessary
```

### Migration Considerations

If the database schema needs to be updated:

1. **Add new column** (if needed)
2. **Migrate existing data**
3. **Update application code**
4. **Deploy and verify**
5. **Remove old column** (after verification period)

### Backward Compatibility

To maintain backward compatibility during transition:

```typescript
// Temporary fallback during migration
const imageUrl = item.images?.[0]?.url || item.images?.[0]?.image_url;
```

This can be removed once all data is migrated and verified.
