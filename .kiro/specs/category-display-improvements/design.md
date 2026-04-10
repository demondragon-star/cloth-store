# Design Document: Category Display Improvements

## Overview

This design enhances the mobile app's category browsing experience by replacing placeholder colored grids with relevant fashion imagery and streamlining the category list to four core categories: Men, Women, Kids, and Sports. The implementation focuses on using local image assets for optimal performance and offline capability, while maintaining backward compatibility with the existing CategoryCard component.

The solution involves three main components:
1. Adding local image assets to the mobile app
2. Updating the database to reference these images and remove obsolete categories
3. Ensuring the CategoryCard component properly renders the images with appropriate fallbacks

## Architecture

### Component Structure

```
CategoriesScreen (Container)
    ├── CategoryCard (Presentation)
    │   ├── Image (React Native)
    │   ├── LinearGradient (Overlay)
    │   └── Text (Category Name)
    └── ItemService (Data Layer)
        └── Supabase (Database)
```

### Data Flow

1. **Category Loading**: CategoriesScreen calls `itemService.getCategories()`
2. **Database Query**: Supabase returns active categories ordered by display_order
3. **Rendering**: CategoryCard receives category data with image_url
4. **Image Resolution**: Component resolves local asset using require() or displays fallback
5. **Display**: Image renders with gradient overlay and category name

### Asset Management Strategy

**Local Assets Approach**: Store category images as local assets in the mobile app bundle rather than remote URLs. This provides:
- Faster load times (no network requests)
- Offline functionality
- Predictable image availability
- Reduced bandwidth usage

**Asset Location**: `assets/images/categories/`
- `men.jpg` - Men's fashion image
- `women.jpg` - Women's fashion image
- `kids.jpg` - Kids' fashion image
- `sports.jpg` - Sports fashion image

## Components and Interfaces

### 1. CategoryCard Component (Modified)

**File**: `src/components/CategoryCard.tsx`

**Changes Required**:
- Update image rendering logic to handle local assets
- Add asset mapping for category names to local images
- Maintain existing fallback behavior

**Asset Mapping**:
```typescript
const CATEGORY_IMAGES: Record<string, any> = {
  'Men': require('../../assets/images/categories/men.jpg'),
  'Women': require('../../assets/images/categories/women.jpg'),
  'Kids': require('../../assets/images/categories/kids.jpg'),
  'Sports': require('../../assets/images/categories/sports.jpg'),
};
```

**Image Resolution Logic**:
```typescript
// Priority order:
// 1. Local asset based on category name
// 2. Remote image_url if provided
// 3. Fallback gradient placeholder
```

### 2. Database Migration

**File**: `admin-web/migrations/005_update_categories.sql`

**Operations**:
1. Update existing categories (Men, Women, Kids, Sports) with:
   - Set `image_url` to category name identifier (e.g., 'men', 'women')
   - Set appropriate `display_order` values (1-4)
   - Ensure `is_active` is true

2. Deactivate or remove obsolete categories:
   - Set `is_active = false` for Footwear
   - Set `is_active = false` for Accessories

3. Handle product reassignment:
   - Products in Footwear → reassign to appropriate category (Men/Women/Sports)
   - Products in Accessories → reassign to appropriate category (Men/Women)

### 3. Category Service (No Changes Required)

**File**: `src/services/item.service.ts`

The existing `getCategories()` method already:
- Filters by `is_active = true`
- Orders by `display_order`
- Returns all necessary fields including `image_url`

No modifications needed to the service layer.

## Data Models

### Category Interface (Existing)

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;  // Will contain identifier for local asset
  icon?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Database Schema (categories table)

**Updated Records**:

| id | name | slug | image_url | display_order | is_active |
|----|------|------|-----------|---------------|-----------|
| uuid-1 | Men | men | men | 1 | true |
| uuid-2 | Women | women | women | 2 | true |
| uuid-3 | Kids | kids | kids | 3 | true |
| uuid-4 | Sports | sports | sports | 4 | true |
| uuid-5 | Footwear | footwear | null | 99 | false |
| uuid-6 | Accessories | accessories | null | 99 | false |

### Asset Mapping Configuration

```typescript
// src/constants/categoryAssets.ts
export const CATEGORY_IMAGES: Record<string, any> = {
  'Men': require('../assets/images/categories/men.jpg'),
  'Women': require('../assets/images/categories/women.jpg'),
  'Kids': require('../assets/images/categories/kids.jpg'),
  'Sports': require('../assets/images/categories/sports.jpg'),
};

// Helper function to get category image
export const getCategoryImage = (categoryName: string): any | null => {
  return CATEGORY_IMAGES[categoryName] || null;
};
```

## Error Handling

### Image Loading Failures

**Scenario**: Local asset fails to load or is missing

**Handling**:
1. Catch image loading errors using `onError` prop
2. Log error to console for debugging
3. Display fallback gradient placeholder with icon
4. Maintain user experience without crashes

**Implementation**:
```typescript
const [imageError, setImageError] = useState(false);

<Image
  source={categoryImage}
  onError={(e) => {
    console.error('Category image load error:', e.nativeEvent.error);
    setImageError(true);
  }}
  style={styles.largeImage}
/>

{imageError && (
  <View style={[styles.largeImage, styles.imagePlaceholder]}>
    <Ionicons name="grid-outline" size={40} color={COLORS.white} />
  </View>
)}
```

### Missing Category Mapping

**Scenario**: Category name doesn't match any asset mapping

**Handling**:
1. Check if category name exists in CATEGORY_IMAGES
2. If not found, check for image_url field
3. If neither exists, use fallback gradient
4. Log warning for unmapped categories

### Database Migration Errors

**Scenario**: Migration fails or products can't be reassigned

**Handling**:
1. Wrap migration in transaction
2. Validate category IDs exist before reassignment
3. Rollback on any error
4. Provide detailed error messages
5. Allow manual intervention if needed

### Offline Mode

**Scenario**: App is used without network connection

**Handling**:
- Local assets work perfectly offline (no network required)
- Category list loads from cached Supabase data
- Images display immediately from app bundle
- No degradation in user experience

## Testing Strategy

### Unit Tests

**CategoryCard Component Tests**:
1. Test rendering with valid category name (Men, Women, Kids, Sports)
2. Test rendering with image_url field
3. Test fallback rendering when no image available
4. Test error handling when image fails to load
5. Test all three variants (default, large, compact)
6. Test gradient overlay rendering on large variant

**Asset Mapping Tests**:
1. Verify all four categories have asset mappings
2. Test getCategoryImage helper function
3. Test handling of unmapped category names
4. Verify require() statements resolve correctly

### Integration Tests

**CategoriesScreen Tests**:
1. Test category list displays exactly 4 categories
2. Test categories appear in correct order (Men, Women, Kids, Sports)
3. Test images load and display correctly
4. Test navigation to CategoryItems screen
5. Test search/filter functionality still works
6. Test refresh functionality

**Database Tests**:
1. Verify migration updates categories correctly
2. Verify Footwear and Accessories are inactive
3. Verify display_order values are correct
4. Verify product reassignments completed
5. Test getCategories() returns only active categories

### Property-Based Tests

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.


### Property Reflection

After analyzing all acceptance criteria, I've identified the following properties and examples. Some criteria (1.3-1.6, 4.3-4.6) are specific examples that will be tested as concrete cases rather than properties. Several properties can be consolidated:

**Consolidation Opportunities**:
- Properties 1.1 and 1.2 both test image rendering and can be combined into a single comprehensive property
- Properties 5.2 and 5.3 both test error resilience and can be combined
- Criteria 1.3-1.6 are specific examples that don't need separate properties (covered by integration tests)
- Criteria 4.3-4.6 are specific examples that don't need separate properties (covered by database tests)

### Correctness Properties

Property 1: Category image rendering
*For any* active category with an image_url or matching asset name, the CategoryCard component should render an Image component with a valid source
**Validates: Requirements 1.1, 1.2**

Property 2: Image load failure fallback
*For any* category where the image fails to load, the CategoryCard should display the gradient placeholder with an icon and not crash
**Validates: Requirements 1.7**

Property 3: Active category filtering
*For any* call to getCategories(), the returned list should contain only categories where is_active is true
**Validates: Requirements 2.4**

Property 4: Category ordering
*For any* list of categories returned by getCategories(), the categories should be ordered by display_order in ascending order
**Validates: Requirements 2.5**

Property 5: Backward compatibility with missing images
*For any* category without an image_url and without a matching asset name, the CategoryCard should display the gradient placeholder without errors
**Validates: Requirements 5.1**

Property 6: Error resilience
*For any* category with an invalid image_url or during filtering/searching operations, the CategoryCard should handle errors gracefully and continue functioning
**Validates: Requirements 5.2, 5.3**

Property 7: Offline asset availability
*For any* category with a local asset mapping, the CategoryCard should display the image successfully when the app is in offline mode
**Validates: Requirements 5.4**

Property 8: Large variant overlay
*For any* category rendered with the large variant, the CategoryCard should display both the image and the gradient overlay for text readability
**Validates: Requirements 5.5**

## Implementation Notes

### Migration Strategy

**Phase 1: Add Assets**
1. Create `assets/images/categories/` directory
2. Add four category images (men.jpg, women.jpg, kids.jpg, sports.jpg)
3. Optimize images (resize to 1200x800, compress to <500KB)

**Phase 2: Update Code**
1. Create `src/constants/categoryAssets.ts` with asset mappings
2. Update `CategoryCard.tsx` to use asset mappings
3. Add error handling for image loading
4. Test component with all variants

**Phase 3: Database Migration**
1. Create migration script `005_update_categories.sql`
2. Update active categories with image_url identifiers
3. Deactivate Footwear and Accessories categories
4. Reassign products from obsolete categories
5. Test migration on staging database

**Phase 4: Verification**
1. Run unit tests for CategoryCard
2. Run integration tests for CategoriesScreen
3. Test on physical devices (iOS and Android)
4. Verify offline functionality
5. Check image quality and load times

### Rollback Plan

If issues arise:
1. Revert CategoryCard changes (component handles missing images gracefully)
2. Rollback database migration (restore Footwear/Accessories if needed)
3. Remove asset files if causing bundle size issues
4. All changes are backward compatible - existing functionality preserved

### Performance Considerations

**Bundle Size Impact**:
- 4 images × ~400KB = ~1.6MB added to app bundle
- Acceptable for improved UX
- Images compressed and optimized

**Load Time**:
- Local assets load instantly (no network delay)
- No additional API calls required
- Improved perceived performance vs remote images

**Memory Usage**:
- Images loaded on-demand by React Native
- Automatic memory management
- No memory leaks expected
