# Design Document: Admin Mobile App Improvements

## Overview

This design addresses critical functionality gaps and UI/UX issues in the admin mobile application. The current admin mobile app has a "failed to create" error when adding products, lacks several features available in the admin web application, and requires significant UI improvements. This design brings the mobile app to feature parity with the web admin while providing a mobile-optimized experience.

The solution leverages existing React Native components, integrates with the established Supabase backend through existing services (item.service.ts, order.service.ts), and implements the multi-category feature using the product_categories junction table already deployed in the database.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Admin Mobile App (React Native)            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Products   │  │    Orders    │      │
│  │   Screen     │  │    Screen    │  │    Screen    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │           Navigation Component                      │     │
│  │  (Bottom Tab Navigator / Drawer)                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                            │                                  │
├────────────────────────────┼──────────────────────────────────┤
│                   Service Layer                               │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │  item.service.ts  │  order.service.ts  │  auth     │     │
│  └─────────────────────────┬──────────────────────────┘     │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Supabase API   │
                    │  - items        │
                    │  - product_     │
                    │    categories   │
                    │  - orders       │
                    │  - item_images  │
                    └─────────────────┘
```

### Navigation Structure

The app uses a bottom tab navigator for primary navigation with the following structure:

```
Bottom Tab Navigator
├── Dashboard Tab
│   └── Dashboard Screen
├── Products Tab
│   ├── Product List Screen
│   ├── Product Create/Edit Screen
│   └── Image Upload Screen
├── Orders Tab
│   ├── Order List Screen
│   └── Order Details Screen
└── Settings Tab
    └── Settings Screen
```

## Components and Interfaces

### 1. Navigation Component

**Purpose**: Provides primary navigation between admin sections

**Component Structure**:
```typescript
// AdminTabNavigator.tsx
interface TabNavigatorProps {
  initialRoute?: string;
}

const AdminTabNavigator: React.FC<TabNavigatorProps> = ({ initialRoute }) => {
  const pendingOrderCount = usePendingOrderCount();
  
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Products" 
        component={ProductsNavigator}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersNavigator}
        options={{ tabBarBadge: pendingOrderCount > 0 ? pendingOrderCount : undefined }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
```

**Key Features**:
- Bottom tab navigation with icons
- Badge on Orders tab showing pending order count
- Active tab highlighting
- Consistent styling across all tabs

### 2. Dashboard Screen

**Purpose**: Display key business metrics and recent activity

**Component Structure**:
```typescript
// DashboardScreen.tsx
interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
  lowStockProducts: Item[];
}

const DashboardScreen: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load dashboard data
  // Display stats cards
  // Display recent orders list
  // Display low stock alerts
};
```

**Data Loading**:
```typescript
async function loadDashboardData(): Promise<DashboardData> {
  // Fetch all products for count and low stock check
  const { data: products } = await itemService.getAllItems(1, 1000);
  
  // Fetch all orders for count and revenue
  const { data: orders } = await orderService.getAllOrders(1, 1000);
  
  // Calculate stats
  const stats = {
    totalProducts: products?.total || 0,
    totalOrders: orders?.total || 0,
    totalRevenue: orders?.data.reduce((sum, order) => sum + order.total, 0) || 0,
    pendingOrders: orders?.data.filter(o => o.status === 'pending').length || 0,
  };
  
  // Get recent orders (last 5)
  const recentOrders = orders?.data.slice(0, 5) || [];
  
  // Get low stock products (stock < 10)
  const lowStockProducts = products?.data.filter(p => p.stock_quantity < 10) || [];
  
  return { stats, recentOrders, lowStockProducts };
}
```

**UI Layout**:
- Stats cards at top (2x2 grid)
- Recent orders section with list
- Low stock alerts section with list
- Pull-to-refresh functionality
- Loading skeleton while data loads

### 3. Product List Screen

**Purpose**: Display all products with search and filter capabilities

**Component Structure**:
```typescript
// ProductListScreen.tsx
interface ProductListState {
  products: Item[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  page: number;
  hasMore: boolean;
}

const ProductListScreen: React.FC = () => {
  const [state, setState] = useState<ProductListState>({
    products: [],
    loading: true,
    searchQuery: '',
    selectedCategory: null,
    page: 1,
    hasMore: true,
  });
  
  // Load products with pagination
  // Handle search
  // Handle category filter
  // Handle product deletion
};
```

**Data Loading**:
```typescript
async function loadProducts(
  page: number,
  searchQuery: string,
  categoryId: string | null
): Promise<{ products: Item[]; hasMore: boolean }> {
  if (searchQuery) {
    const { data } = await itemService.searchItems(
      searchQuery,
      categoryId ? { category_id: categoryId } : {},
      page,
      20
    );
    return {
      products: data?.data || [],
      hasMore: data?.has_more || false,
    };
  } else {
    const { data } = await itemService.getAllItems(page, 20);
    return {
      products: data?.data || [],
      hasMore: data?.has_more || false,
    };
  }
}
```

**UI Features**:
- Search bar at top
- Category filter chips
- Product cards with image, name, price, stock
- Infinite scroll pagination
- Floating action button for "Add Product"
- Swipe actions for edit/delete

### 4. Product Form Screen

**Purpose**: Create or edit products with all fields including multi-category support

**Component Structure**:
```typescript
// ProductFormScreen.tsx
interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  selectedCategories: string[]; // Array of category IDs
  images: string[]; // Array of image URLs
  is_featured: boolean;
  is_active: boolean;
}

interface ProductFormProps {
  route: {
    params?: {
      productId?: string; // If editing existing product
    };
  };
  navigation: any;
}

const ProductFormScreen: React.FC<ProductFormProps> = ({ route, navigation }) => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Load categories
  // Load existing product if editing
  // Handle form submission
  // Handle image upload
  // Handle validation
};
```

**Multi-Category Implementation**:
```typescript
// Load categories for checkboxes
async function loadCategories(): Promise<Category[]> {
  const { data } = await itemService.getCategories();
  return data || [];
}

// Load existing product categories if editing
async function loadProductCategories(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('category_id')
    .eq('product_id', productId);
  
  if (error) return [];
  return data.map(pc => pc.category_id);
}

// Save product with categories
async function saveProduct(formData: ProductFormData, productId?: string): Promise<void> {
  // 1. Create or update product
  const productData = {
    name: formData.name,
    description: formData.description,
    price: formData.price,
    stock_quantity: formData.stock_quantity,
    sku: formData.sku,
    is_featured: formData.is_featured,
    is_active: formData.is_active,
  };
  
  let savedProductId: string;
  
  if (productId) {
    // Update existing product
    const { data, error } = await itemService.updateItem(productId, productData);
    if (error) throw new Error(error);
    savedProductId = productId;
  } else {
    // Create new product
    const { data, error } = await itemService.createItem(productData);
    if (error) throw new Error(error);
    savedProductId = data!.id;
  }
  
  // 2. Update product categories
  // Delete existing categories
  await supabase
    .from('product_categories')
    .delete()
    .eq('product_id', savedProductId);
  
  // Insert new categories
  const categoryInserts = formData.selectedCategories.map(categoryId => ({
    product_id: savedProductId,
    category_id: categoryId,
  }));
  
  await supabase
    .from('product_categories')
    .insert(categoryInserts);
  
  // 3. Upload and save images
  await saveProductImages(savedProductId, formData.images);
}
```

**Form Validation**:
```typescript
function validateProductForm(formData: ProductFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Product name is required';
  }
  
  if (!formData.description.trim()) {
    errors.description = 'Description is required';
  }
  
  if (formData.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }
  
  if (formData.stock_quantity < 0) {
    errors.stock_quantity = 'Stock cannot be negative';
  }
  
  if (!formData.sku.trim()) {
    errors.sku = 'SKU is required';
  }
  
  if (formData.selectedCategories.length === 0) {
    errors.categories = 'At least one category must be selected';
  }
  
  if (formData.images.length === 0) {
    errors.images = 'At least one image is required';
  }
  
  return errors;
}
```

**UI Layout**:
- Scrollable form with sections
- Text inputs for name, description, SKU
- Number inputs for price and stock
- Category checkboxes (scrollable list)
- Image upload section with thumbnails
- Toggle switches for featured/active status
- Save button (disabled during submission)
- Cancel button

### 5. Image Upload Component

**Purpose**: Handle multiple image selection and upload

**Component Structure**:
```typescript
// ImageUploadComponent.tsx
interface ImageUploadProps {
  images: string[]; // Current image URLs
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Handle image selection from gallery
  // Handle image upload
  // Handle image removal
  // Display thumbnails
};
```

**Image Upload Flow**:
```typescript
async function uploadImages(
  uris: string[],
  productId: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  for (const uri of uris) {
    // Upload each image
    const { url, error } = await itemService.uploadImage(uri, 'image/jpeg', productId);
    
    if (error) {
      throw new Error(`Failed to upload image: ${error}`);
    }
    
    if (url) {
      uploadedUrls.push(url);
      
      // Save image record to database
      await supabase.from('item_images').insert({
        item_id: productId,
        url: url,
        image_url: url,
        display_order: uploadedUrls.length,
      });
    }
  }
  
  return uploadedUrls;
}
```

**UI Features**:
- Grid of image thumbnails
- "Add Image" button
- Remove button on each thumbnail
- Upload progress indicator
- Maximum image limit enforcement

### 6. Order List Screen

**Purpose**: Display all orders with filtering by status

**Component Structure**:
```typescript
// OrderListScreen.tsx
interface OrderListState {
  orders: Order[];
  loading: boolean;
  selectedStatus: OrderStatus | 'all';
  page: number;
  hasMore: boolean;
}

const OrderListScreen: React.FC = () => {
  const [state, setState] = useState<OrderListState>({
    orders: [],
    loading: true,
    selectedStatus: 'all',
    page: 1,
    hasMore: true,
  });
  
  // Load orders with pagination
  // Handle status filter
  // Navigate to order details
};
```

**Data Loading**:
```typescript
async function loadOrders(
  page: number,
  status: OrderStatus | 'all'
): Promise<{ orders: Order[]; hasMore: boolean }> {
  const { data, total } = await orderService.getAllOrders(page, 20);
  
  let filteredOrders = data || [];
  
  if (status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  
  return {
    orders: filteredOrders,
    hasMore: total > page * 20,
  };
}
```

**UI Features**:
- Status filter chips (All, Pending, Confirmed, Preparing, Out for Delivery, Delivered)
- Order cards showing order number, customer, total, status
- Status badge with color coding
- Infinite scroll pagination
- Pull-to-refresh

### 7. Order Details Screen

**Purpose**: Display full order information and allow status updates

**Component Structure**:
```typescript
// OrderDetailsScreen.tsx
interface OrderDetailsProps {
  route: {
    params: {
      orderId: string;
    };
  };
}

const OrderDetailsScreen: React.FC<OrderDetailsProps> = ({ route }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Load order details
  // Handle status update
  // Display order information
};
```

**Status Update Flow**:
```typescript
async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  const { error } = await orderService.updateOrderStatus(orderId, newStatus);
  
  if (error) {
    throw new Error(error);
  }
  
  // Show success toast
  Toast.show({
    type: 'success',
    text1: 'Order Updated',
    text2: `Order status changed to ${newStatus}`,
  });
}
```

**UI Layout**:
- Order header (order number, date, status)
- Customer information section
- Shipping address section
- Order items list with images
- Payment information section
- Status update dropdown
- Update button

### 8. Settings Screen

**Purpose**: Display admin profile and app settings

**Component Structure**:
```typescript
// SettingsScreen.tsx
interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

const SettingsScreen: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load admin profile
  // Handle logout
  // Display app version
};
```

**Logout Flow**:
```typescript
async function handleLogout(): Promise<void> {
  // Show confirmation dialog
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          // Navigation will automatically redirect to login
        },
      },
    ]
  );
}
```

**UI Layout**:
- Profile section with avatar and name
- Account information
- App version
- Logout button

## Data Models

### Product Form Data Model

```typescript
interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  selectedCategories: string[]; // Array of category IDs
  images: string[]; // Array of image URLs or local URIs
  is_featured: boolean;
  is_active: boolean;
}
```

### Dashboard Stats Model

```typescript
interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[]; // Last 5 orders
  lowStockProducts: Item[]; // Products with stock < 10
}
```

### Multi-Category Data Model

The multi-category feature uses a junction table in the database:

```sql
-- product_categories table (already exists)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES items(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Data Flow**:
1. When loading product form: Query `product_categories` table to get all category IDs for the product
2. When saving product: Delete all existing entries for the product, then insert new entries for selected categories
3. When filtering products: Query `product_categories` to get product IDs, then filter items by those IDs

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Form Validation Identifies Invalid Fields

*For any* product form data with missing or invalid required fields (empty name, negative price, negative stock, empty SKU, no categories, no images), the validation function should return error messages for all invalid fields.

**Validates: Requirements 1.2, 1.5**

### Property 2: Form State Reset After Creation

*For any* product form state, after successful product creation, the form data should be reset to initial empty values.

**Validates: Requirements 1.4**

### Property 3: Multi-Category Round Trip

*For any* product with selected categories, saving the product then loading it for editing should return the same set of category IDs.

**Validates: Requirements 2.2, 2.3**

### Property 4: Image Removal Preserves Other Images

*For any* list of images and any single image in that list, removing that image should leave all other images in the list unchanged.

**Validates: Requirements 3.3**

### Property 5: Dashboard Product Count Accuracy

*For any* set of products in the database, the dashboard total product count should equal the actual number of products.

**Validates: Requirements 4.1**

### Property 6: Dashboard Order Count and Revenue Accuracy

*For any* set of orders in the database, the dashboard total order count should equal the actual number of orders, and the total revenue should equal the sum of all order totals.

**Validates: Requirements 4.1**

### Property 7: Recent Orders Sorting

*For any* set of orders in the database, the dashboard recent orders list should contain the 5 orders with the most recent created_at timestamps, sorted in descending order.

**Validates: Requirements 4.2**

### Property 8: Low Stock Product Filtering

*For any* set of products in the database, the dashboard low stock products list should contain only products where stock_quantity is less than 10.

**Validates: Requirements 4.3**

### Property 9: Product List Completeness

*For any* set of products in the database, the product list screen should retrieve and display all products with their name, price, stock_quantity, and at least one image.

**Validates: Requirements 5.1**

### Property 10: Product Search Filtering

*For any* search query and set of products, the search results should only include products where the query appears in the product name or description (case-insensitive).

**Validates: Requirements 5.2**

### Property 11: Product Category Filtering

*For any* category ID and set of products, the filtered product list should only include products that have an entry in the product_categories junction table with that category_id.

**Validates: Requirements 5.3**

### Property 12: Order List Completeness

*For any* set of orders in the database, the order list screen should retrieve and display all orders with their order_number, total, and status.

**Validates: Requirements 6.1**

### Property 13: Order Status Filtering

*For any* order status and set of orders, the filtered order list should only include orders where the status field matches the selected status.

**Validates: Requirements 6.2**

### Property 14: Order Status Update Persistence

*For any* order and any valid order status, updating the order status should persist the change to the database, and querying the order should return the new status.

**Validates: Requirements 6.4, 6.5**

### Property 15: Pending Order Count Accuracy

*For any* set of orders in the database, the pending order count badge should equal the number of orders where status equals 'pending'.

**Validates: Requirements 6.6**

### Property 16: Profile Update Persistence

*For any* admin profile and any valid profile updates (name, email), updating the profile should persist the changes to the database, and querying the profile should return the updated values.

**Validates: Requirements 9.5**

### Property 17: Data Synchronization After Operations

*For any* create or update operation (product, order, profile), immediately querying the backend should return the newly created or updated data.

**Validates: Requirements 10.1**

## Error Handling

### Client-Side Validation Errors

**Product Form Validation**:
- Empty required fields → Display inline error message
- Invalid price (≤ 0) → Display "Price must be greater than 0"
- Invalid stock (< 0) → Display "Stock cannot be negative"
- No categories selected → Display "At least one category must be selected"
- No images uploaded → Display "At least one image is required"

**Error Display**:
- Inline errors appear below the relevant form field
- Error text in red color
- Form submission disabled until all errors resolved

### Network Errors

**API Request Failures**:
```typescript
try {
  const { data, error } = await itemService.createItem(productData);
  if (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to Create Product',
      text2: error,
    });
    return;
  }
  // Success handling
} catch (error) {
  Toast.show({
    type: 'error',
    text1: 'Network Error',
    text2: 'Please check your connection and try again',
  });
}
```

**Retry Mechanism**:
- Display "Retry" button on network errors
- Preserve form data during retry
- Show loading indicator during retry attempt

### Image Upload Errors

**Upload Failure Handling**:
```typescript
async function uploadImageWithRetry(uri: string, productId: string): Promise<string> {
  const maxRetries = 3;
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { url, error } = await itemService.uploadImage(uri, 'image/jpeg', productId);
    
    if (url) {
      return url;
    }
    
    lastError = error || 'Unknown error';
    
    if (attempt < maxRetries) {
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Failed to upload image after ${maxRetries} attempts: ${lastError}`);
}
```

**Error Display**:
- Show error toast with specific image that failed
- Allow individual image retry
- Don't block form submission if some images uploaded successfully

### Database Constraint Errors

**Multi-Category Constraint**:
- Database enforces at least one category per product
- If deletion would leave product with no categories, show error
- Client-side validation prevents this scenario

**Duplicate SKU Error**:
```typescript
if (error.message.includes('duplicate key value violates unique constraint')) {
  setErrors({ sku: 'This SKU already exists' });
  Toast.show({
    type: 'error',
    text1: 'Duplicate SKU',
    text2: 'Please use a unique SKU for this product',
  });
}
```

### Authentication Errors

**Session Expiration**:
```typescript
// Global error handler
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear local state
    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
});
```

**Permission Errors**:
- If user lacks admin permissions, show error and redirect to login
- Check admin role on app launch

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
**Property Tests**: Verify universal properties across all inputs using randomized data

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/React Native property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `// Feature: admin-mobile-app-improvements, Property N: [property text]`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: admin-mobile-app-improvements, Property 3: Multi-Category Round Trip
test('saving and loading product preserves categories', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // Random category IDs
      async (categoryIds) => {
        // Create product with categories
        const product = await createTestProduct({ categoryIds });
        
        // Load product categories
        const loadedCategories = await loadProductCategories(product.id);
        
        // Should match original categories
        expect(new Set(loadedCategories)).toEqual(new Set(categoryIds));
        
        // Cleanup
        await deleteTestProduct(product.id);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus Areas

**Product Form Validation**:
- Test each validation rule with specific invalid inputs
- Test combination of multiple validation errors
- Test validation passes with all valid inputs

**Dashboard Calculations**:
- Test with empty database (all counts should be 0)
- Test with single product/order
- Test with multiple products/orders
- Test low stock threshold (stock = 9, stock = 10, stock = 11)

**Multi-Category Operations**:
- Test creating product with single category
- Test creating product with multiple categories
- Test updating product categories (add, remove, replace)
- Test deleting all categories is prevented

**Image Upload**:
- Test single image upload
- Test multiple image upload
- Test image removal
- Test maximum image limit enforcement

**Order Status Updates**:
- Test each valid status transition
- Test status update persistence
- Test pending order count updates after status change

**Search and Filtering**:
- Test search with exact match
- Test search with partial match
- Test search case-insensitivity
- Test category filter with products in multiple categories
- Test empty search results

### Integration Testing

**End-to-End Flows**:
1. Create product flow: Navigate to form → Fill all fields → Select categories → Upload images → Submit → Verify in list
2. Edit product flow: Select product → Modify fields → Update categories → Save → Verify changes
3. Order management flow: View orders → Filter by status → Open details → Update status → Verify update
4. Dashboard flow: Load dashboard → Verify stats → Tap recent order → Verify navigation

**Service Integration**:
- Test itemService.createItem with real Supabase connection
- Test itemService.updateItem with real Supabase connection
- Test orderService.getAllOrders with real Supabase connection
- Test orderService.updateOrderStatus with real Supabase connection

### Test Data Generators

**Product Generator**:
```typescript
function generateRandomProduct(): Partial<Item> {
  return {
    name: `Test Product ${Math.random().toString(36).substring(7)}`,
    description: 'Test description',
    price: Math.floor(Math.random() * 1000) + 1,
    stock_quantity: Math.floor(Math.random() * 100),
    sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    is_featured: Math.random() > 0.5,
    is_active: true,
  };
}
```

**Category Generator**:
```typescript
function generateRandomCategories(count: number): string[] {
  const allCategories = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5'];
  return allCategories.slice(0, count);
}
```

**Order Generator**:
```typescript
function generateRandomOrder(): Partial<Order> {
  return {
    order_number: `ORD${Date.now()}`,
    user_id: 'test-user-id',
    status: ['pending', 'confirmed', 'preparing'][Math.floor(Math.random() * 3)] as OrderStatus,
    subtotal: Math.floor(Math.random() * 1000),
    total: Math.floor(Math.random() * 1000),
  };
}
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 17 correctness properties implemented
- **Integration Test Coverage**: All major user flows covered
- **Edge Case Coverage**: All validation rules and error conditions tested

### Continuous Testing

**Pre-commit Hooks**:
- Run unit tests before commit
- Run linting and type checking

**CI/CD Pipeline**:
- Run full test suite on pull requests
- Run property tests with 100 iterations
- Generate coverage reports
- Block merge if tests fail or coverage drops

## Implementation Notes

### Existing Code Reuse

**Services**:
- Use `itemService` from `src/services/item.service.ts` for all product operations
- Use `orderService` from `src/services/order.service.ts` for all order operations
- Use existing `supabase` client for direct database queries (product_categories table)

**Types**:
- Reuse existing `Item`, `Order`, `Category` types from `src/types`
- Extend types as needed for form state management

**Components**:
- Reuse existing UI components where available
- Create new components following existing patterns

### Multi-Category Implementation Details

**Database Schema** (already exists):
```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);
```

**Key Implementation Points**:
1. Always use transactions when updating categories to ensure consistency
2. Delete all existing categories before inserting new ones (simpler than diff)
3. Validate at least one category selected before allowing save
4. Use the existing `itemService.getCategories()` to load available categories

### Performance Considerations

**Pagination**:
- Load products and orders in pages of 20 items
- Implement infinite scroll for better UX
- Cache loaded pages to reduce API calls

**Image Optimization**:
- Compress images before upload (max 1MB per image)
- Generate thumbnails for list views
- Lazy load images in lists

**Dashboard Optimization**:
- Cache dashboard data for 5 minutes
- Refresh only on pull-to-refresh or explicit navigation
- Load stats in parallel with Promise.all()

### Security Considerations

**Authentication**:
- Verify admin role on app launch
- Check authentication state before each API call
- Handle session expiration gracefully

**Data Validation**:
- Validate all inputs client-side before submission
- Rely on backend validation as final authority
- Sanitize user inputs to prevent injection

**File Upload**:
- Validate file types (only images allowed)
- Limit file sizes (max 5MB per image)
- Use Supabase storage security policies

### Accessibility

**Screen Reader Support**:
- Add accessibility labels to all interactive elements
- Provide meaningful descriptions for images
- Announce state changes (loading, errors, success)

**Touch Targets**:
- Minimum 44x44 points for all touchable elements
- Adequate spacing between interactive elements

**Color Contrast**:
- Ensure text meets WCAG AA standards
- Don't rely solely on color for status indication
- Use icons alongside color for status badges

### Platform-Specific Considerations

**iOS**:
- Use iOS-style navigation patterns
- Handle safe area insets properly
- Request photo library permissions

**Android**:
- Use Material Design components
- Handle back button navigation
- Request storage permissions

**Both Platforms**:
- Test on multiple screen sizes
- Handle keyboard avoiding views
- Support both portrait and landscape orientations
