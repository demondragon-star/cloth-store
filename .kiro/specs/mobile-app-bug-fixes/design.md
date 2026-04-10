# Design Document: Mobile App Bug Fixes

## Overview

This design addresses three critical bugs in the mobile e-commerce application:

1. **Profile Statistics**: Replace hardcoded values with dynamic database queries
2. **Avatar Upload**: Fix the image upload flow to properly save to Supabase Storage
3. **Product Image Upload**: Fix the admin product image upload to persist in storage

The fixes involve modifying the ProfileScreen to fetch real data, updating the auth service's uploadAvatar method to properly handle React Native image uploads, and fixing the item service's uploadImage method to correctly upload files to Supabase Storage.

## Architecture

### Component Overview

```
ProfileScreen (UI)
    ↓ queries
OrderService.getUserOrders() → Supabase orders table
    ↓ calculates
Profile Stats (orders count, saved amount)

EditProfileScreen (UI)
    ↓ calls
AuthService.uploadAvatar() → Supabase Storage (avatars bucket)
    ↓ updates
Supabase users table (avatar_url)

AdminProductDetailsScreen (UI)
    ↓ calls
ItemService.uploadImage() → Supabase Storage (products bucket)
    ↓ saves
Supabase item_images table
```

### Data Flow

**Profile Stats Flow:**
1. ProfileScreen loads
2. Fetch user orders from database
3. Calculate order count (length of orders array)
4. Calculate saved amount (sum of discount fields from orders)
5. Display calculated values

**Avatar Upload Flow:**
1. User selects image via ImagePicker
2. Image displays locally (preview)
3. User clicks save
4. Convert image URI to Blob
5. Upload blob to Supabase Storage avatars bucket
6. Get public URL from storage
7. Update user profile with avatar_url
8. Show success/error feedback

**Product Image Upload Flow:**
1. Admin selects images via ImagePicker
2. Images display locally (preview)
3. Admin clicks save
4. For each local image:
   - Convert URI to Blob
   - Upload blob to Supabase Storage products bucket
   - Collect public URL
5. Save all URLs to item_images table
6. Show success/error feedback

## Components and Interfaces

### ProfileScreen Modifications

**Current State:**
```typescript
// Hardcoded values
<Text style={styles.statValue}>12</Text>  // Orders
<Text style={styles.statValue}>₹2.5K</Text>  // Saved
```

**New State:**
```typescript
const [orderCount, setOrderCount] = useState(0);
const [savedAmount, setSavedAmount] = useState(0);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadProfileStats();
}, [user?.id]);

const loadProfileStats = async () => {
  if (!user?.id) return;
  
  setLoading(true);
  const { data: orders, error } = await orderService.getUserOrders(user.id, 1, 1000);
  
  if (!error && orders) {
    setOrderCount(orders.length);
    const totalSaved = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
    setSavedAmount(totalSaved);
  }
  
  setLoading(false);
};
```

### AuthService.uploadAvatar() Fix

**Current Implementation Issue:**
The current implementation attempts to use FormData with React Native, but doesn't properly convert the image URI to a blob that Supabase Storage can accept.

**Fixed Implementation:**
```typescript
async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
  try {
    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Extract file extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });
    
    if (uploadError) {
      return { url: null, error: uploadError.message };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Update user profile
    await this.updateProfile(userId, { avatar_url: publicUrl });
    
    return { url: publicUrl, error: null };
  } catch (error: any) {
    return { url: null, error: error.message || 'Failed to upload avatar' };
  }
}
```

### ItemService.uploadImage() Fix

**Current Implementation Issue:**
The uploadImage method tries to use FormData incorrectly for React Native and doesn't properly convert the image URI to a blob.

**Fixed Implementation:**
```typescript
async uploadImage(uri: string, fileType: string = 'image/jpeg', productId: string = 'temp'): Promise<{ url: string | null; error: string | null }> {
  try {
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Extract file extension
    const ext = fileType.split('/')[1] || 'jpg';
    const filename = `${productId}/${Date.now()}.${ext}`;
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('products')
      .upload(filename, blob, {
        contentType: fileType,
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filename);
    
    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload exception:', error);
    return { url: null, error: error.message || 'Failed to upload image' };
  }
}
```

### EditProfileScreen Integration

**Avatar Upload Integration:**
```typescript
const handleSave = async () => {
  if (!validateForm()) return;
  if (!user) return;
  
  setIsLoading(true);
  
  try {
    let finalAvatarUrl = avatarUrl;
    
    // If avatar is a local URI (starts with file:// or content://), upload it
    if (avatarUrl && (avatarUrl.startsWith('file://') || avatarUrl.startsWith('content://'))) {
      const { url, error } = await authService.uploadAvatar(user.id, avatarUrl);
      
      if (error) {
        throw new Error(`Avatar upload failed: ${error}`);
      }
      
      finalAvatarUrl = url || avatarUrl;
    }
    
    // Update profile with final avatar URL
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      avatar_url: finalAvatarUrl || undefined,
    });
    
    if (error) {
      throw new Error(error);
    }
    
    Toast.show({
      type: 'success',
      text1: 'Profile Updated',
      text2: 'Your profile has been updated successfully.',
    });
    
    navigation.goBack();
  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'Update Failed',
      text2: error.message || 'Please try again.',
    });
  } finally {
    setIsLoading(false);
  }
};
```

## Data Models

### Order Model (Existing)
```typescript
interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;  // Used for calculating saved amount
  tax: number;
  shipping: number;
  total: number;
  created_at: string;
  updated_at: string;
  // ... other fields
}
```

### User Profile Model (Existing)
```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;  // Updated by avatar upload
  created_at: string;
  updated_at: string;
}
```

### Item Image Model (Existing)
```typescript
interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;  // Public URL from Supabase Storage
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Order Count Accuracy
*For any* user with orders in the database, the displayed order count should equal the actual number of orders returned by the database query.

**Validates: Requirements 1.1, 1.2**

### Property 2: Saved Amount Calculation
*For any* user with orders containing discount values, the displayed saved amount should equal the sum of all discount fields from the user's orders.

**Validates: Requirements 1.3, 1.4**

### Property 3: Avatar Upload Persistence
*For any* valid image file uploaded as an avatar, after successful upload the user's avatar_url field in the database should contain a valid public URL pointing to the uploaded image in Supabase Storage.

**Validates: Requirements 2.2, 2.3**

### Property 4: Avatar Upload Blob Conversion
*For any* local image URI (file:// or content://), the upload process should successfully convert it to a blob format that Supabase Storage accepts.

**Validates: Requirements 2.5**

### Property 5: Product Image Upload Persistence
*For any* set of valid product images uploaded, after successful upload all image URLs should be saved to the item_images table with correct item_id, display_order, and is_primary values.

**Validates: Requirements 3.3, 3.7**

### Property 6: Product Image Blob Conversion
*For any* local image URI selected for a product, the upload process should successfully convert it to a blob format that Supabase Storage accepts.

**Validates: Requirements 3.5**

### Property 7: Image Upload Error Handling
*For any* image upload operation that fails, the system should return a descriptive error message and not crash or leave the UI in an inconsistent state.

**Validates: Requirements 4.3, 4.5**

### Property 8: Default Values for Missing Data
*For any* user with no orders or no discount data, the profile screen should display "0" for order count and "₹0" for saved amount without errors.

**Validates: Requirements 1.6**

## Error Handling

### Profile Stats Loading Errors
- **Network Failure**: Display cached values or "0" with a retry option
- **Database Query Error**: Log error, display "0" values, show subtle error indicator
- **No Orders Found**: Display "0" gracefully (not an error condition)

### Avatar Upload Errors
- **Network Failure**: Display "Upload failed. Please check your connection."
- **Storage Permission Error**: Display "Storage access denied. Please check permissions."
- **Invalid Image Format**: Display "Invalid image format. Please select a JPG or PNG."
- **File Too Large**: Display "Image too large. Please select a smaller image."
- **Blob Conversion Failure**: Display "Failed to process image. Please try another image."

### Product Image Upload Errors
- **Partial Upload Failure**: Continue with successful uploads, log failures, show warning
- **Complete Upload Failure**: Display error, keep local images for retry
- **Storage Bucket Not Found**: Display "Storage configuration error. Contact support."
- **Database Save Failure**: Display "Images uploaded but failed to save. Please retry."

### Error Recovery Strategies
1. **Retry Logic**: Implement exponential backoff for network errors
2. **Graceful Degradation**: Show cached/default values when data unavailable
3. **User Feedback**: Always inform user of operation status
4. **Logging**: Log all errors for debugging without exposing to user

## Testing Strategy

### Unit Tests
- Test order count calculation with various order arrays (0, 1, many orders)
- Test saved amount calculation with various discount values (0, positive, undefined)
- Test blob conversion from different URI formats (file://, content://, http://)
- Test error handling for invalid image URIs
- Test default value display when data is missing

### Property-Based Tests
- **Property 1**: Generate random order arrays, verify count matches array length
- **Property 2**: Generate random orders with discount values, verify sum calculation
- **Property 3**: Generate random image URIs, verify successful upload returns valid URL
- **Property 4**: Generate random local URIs, verify blob conversion succeeds
- **Property 5**: Generate random product image sets, verify all URLs saved correctly
- **Property 6**: Generate random image URIs, verify blob conversion for products
- **Property 7**: Generate invalid inputs, verify error messages returned
- **Property 8**: Test with empty order arrays, verify "0" displayed

### Integration Tests
- Test complete avatar upload flow from image selection to database update
- Test complete product image upload flow from selection to item_images table
- Test profile stats loading with real database queries
- Test error scenarios with mocked Supabase failures
- Test UI updates after successful/failed operations

### Manual Testing Checklist
- [ ] Select avatar from gallery, verify upload and display
- [ ] Take photo with camera for avatar, verify upload and display
- [ ] Select multiple product images, verify all upload correctly
- [ ] Test with poor network connection, verify error handling
- [ ] Test with no orders, verify "0" displays correctly
- [ ] Test with orders containing discounts, verify saved amount calculation
- [ ] Verify avatar persists after app restart
- [ ] Verify product images persist after app restart

### Property Test Configuration
- Minimum 100 iterations per property test
- Use fast-check or similar library for TypeScript
- Tag each test with feature name and property number
- Example tag: `Feature: mobile-app-bug-fixes, Property 1: Order Count Accuracy`
