# Coupon System - Design Document

## Overview

The coupon system enables administrators to create and manage discount coupons while allowing users to apply them during checkout. The system implements comprehensive validation rules including first-order checks, cart value requirements, date validity, and usage limits. The design follows the existing React Native + Supabase architecture with TypeScript, ensuring type safety and seamless integration with the current e-commerce application.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
├─────────────────────────────────────────────────────────────┤
│  User Screens          │         Admin Screens               │
│  - CheckoutScreen      │         - AdminCouponsScreen        │
│  - CartScreen          │         - AdminCouponDetailsScreen  │
│                        │                                     │
├─────────────────────────────────────────────────────────────┤
│                    Coupon Service Layer                      │
│  - validateCoupon()    - applyCoupon()                      │
│  - getAvailableCoupons() - createCoupon()                   │
│  - removeCoupon()      - updateCoupon()                     │
│  - trackUsage()        - deleteCoupon()                     │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Database                         │
│  - coupons table       - coupon_usage table                 │
│  - orders table        - profiles table                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Coupon Application Flow**:
   - User enters coupon code in CheckoutScreen
   - CouponService.validateCoupon() performs all validation checks
   - If valid, discount is calculated and applied to cart
   - UI updates to show discount in order summary

2. **Coupon Creation Flow**:
   - Admin fills coupon form in AdminCouponDetailsScreen
   - Form validation ensures all required fields are present
   - CouponService.createCoupon() saves to database
   - AdminCouponsScreen refreshes to show new coupon

3. **Usage Tracking Flow**:
   - When order is placed, CouponService.trackUsage() is called
   - Creates record in coupon_usage table
   - Increments current_usage_count in coupons table
   - Links usage to specific order for audit trail

## Components and Interfaces

### Database Schema

#### Coupons Table
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(12) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  coupon_type VARCHAR(20) NOT NULL CHECK (coupon_type IN ('first_order', 'cart_value', 'party', 'general')),
  min_cart_value DECIMAL(10,2) DEFAULT 0 CHECK (min_cart_value >= 0),
  max_discount DECIMAL(10,2) CHECK (max_discount IS NULL OR max_discount > 0),
  usage_limit_per_user INTEGER DEFAULT 1 CHECK (usage_limit_per_user > 0),
  total_usage_limit INTEGER CHECK (total_usage_limit IS NULL OR total_usage_limit > 0),
  current_usage_count INTEGER DEFAULT 0 CHECK (current_usage_count >= 0),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL CHECK (valid_until > valid_from),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Coupon Usage Table
```sql
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);
```

#### Indexes
```sql
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupons_type ON coupons(coupon_type);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_order ON coupon_usage(order_id);
```

### TypeScript Types

```typescript
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  coupon_type: 'first_order' | 'cart_value' | 'party' | 'general';
  min_cart_value: number;
  max_discount?: number;
  usage_limit_per_user: number;
  total_usage_limit?: number;
  current_usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  discount_amount: number;
  used_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount_amount?: number;
  coupon?: Coupon;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discount_amount: number;
}

export interface CouponStatistics {
  total_uses: number;
  total_discount_given: number;
  unique_users: number;
  revenue_impact: number;
}
```

### Coupon Service Interface

```typescript
class CouponService {
  // User-facing methods
  async validateCoupon(
    code: string, 
    userId: string, 
    cartTotal: number
  ): Promise<CouponValidationResult>;
  
  async getAvailableCoupons(
    userId: string, 
    cartTotal: number
  ): Promise<{ data: Coupon[] | null; error: string | null }>;
  
  async applyCoupon(
    code: string, 
    userId: string, 
    cartTotal: number
  ): Promise<{ data: AppliedCoupon | null; error: string | null }>;
  
  async trackUsage(
    couponId: string, 
    userId: string, 
    orderId: string, 
    discountAmount: number
  ): Promise<{ error: string | null }>;
  
  // Admin methods
  async createCoupon(
    couponData: Partial<Coupon>
  ): Promise<{ data: Coupon | null; error: string | null }>;
  
  async updateCoupon(
    couponId: string, 
    updates: Partial<Coupon>
  ): Promise<{ data: Coupon | null; error: string | null }>;
  
  async deleteCoupon(
    couponId: string
  ): Promise<{ error: string | null }>;
  
  async getCoupons(
    includeInactive?: boolean
  ): Promise<{ data: Coupon[] | null; error: string | null }>;
  
  async getCouponById(
    couponId: string
  ): Promise<{ data: Coupon | null; error: string | null }>;
  
  async getCouponStatistics(
    couponId: string
  ): Promise<{ data: CouponStatistics | null; error: string | null }>;
  
  async generateCouponCode(): Promise<string>;
  
  // Helper methods
  private async checkFirstOrder(userId: string): Promise<boolean>;
  private calculateDiscount(coupon: Coupon, cartTotal: number): number;
  private async checkUserUsage(couponId: string, userId: string): Promise<boolean>;
}
```

## Data Models

### Coupon Model

**Properties**:
- `id`: Unique identifier (UUID)
- `code`: Unique alphanumeric code (6-12 characters, uppercase)
- `description`: User-facing description of the coupon
- `discount_type`: Either 'fixed' (₹50, ₹100) or 'percentage' (10%, 20%)
- `discount_value`: Numeric value of discount
- `coupon_type`: Type of coupon (first_order, cart_value, party, general)
- `min_cart_value`: Minimum cart value required (₹0 = no minimum)
- `max_discount`: Maximum discount for percentage coupons
- `usage_limit_per_user`: How many times each user can use (default: 1)
- `total_usage_limit`: Total times coupon can be used across all users
- `current_usage_count`: Current number of times used
- `valid_from`: Start date/time for coupon validity
- `valid_until`: End date/time for coupon validity
- `is_active`: Whether coupon is currently active
- `created_by`: Admin who created the coupon
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Validation Rules**:
- Code must be unique and 6-12 characters
- Discount value must be positive
- Valid_until must be after valid_from
- Max_discount only applies to percentage coupons
- Current_usage_count cannot exceed total_usage_limit

### Coupon Usage Model

**Properties**:
- `id`: Unique identifier (UUID)
- `coupon_id`: Reference to coupon
- `user_id`: Reference to user who used coupon
- `order_id`: Reference to order where coupon was used
- `discount_amount`: Actual discount amount applied
- `used_at`: Timestamp when coupon was used

**Constraints**:
- Unique constraint on (coupon_id, user_id) ensures one use per user
- Cascade delete when coupon, user, or order is deleted

### Cart Model Extension

The existing Cart type will be extended to include coupon information:

```typescript
export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  appliedCoupon?: AppliedCoupon;  // New field
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: First Order Coupon Validation
*For any* user and any first-order coupon, the coupon should only be valid if the user has exactly zero previous orders.
**Validates: Requirements 1.1, 1.2, 1.3, 3.3**

### Property 2: Cart Value Requirement Validation
*For any* coupon with a minimum cart value requirement and any cart total, the coupon should only be valid if the cart total is greater than or equal to the minimum cart value.
**Validates: Requirements 2.1, 3.4**

### Property 3: Single Coupon Per Order
*For any* cart state, only one coupon can be applied at a time. Attempting to apply a second coupon should either replace the first or return an error indicating only one coupon is allowed.
**Validates: Requirements 3.1**

### Property 4: One-Time Use Per User
*For any* user and any coupon, if the user has already used that specific coupon, attempting to use it again should fail with an appropriate error message.
**Validates: Requirements 3.2, 3.7 (first part)**

### Property 5: Date Validity Validation
*For any* coupon and any current date/time, the coupon should only be valid if the current date/time falls within the range [valid_from, valid_until].
**Validates: Requirements 3.5, 9.2**

### Property 6: Active Status Validation
*For any* coupon, the coupon should only be applicable if its is_active flag is set to true.
**Validates: Requirements 3.6**

### Property 7: Total Usage Limit Validation
*For any* coupon with a total_usage_limit, the coupon should only be valid if current_usage_count is less than total_usage_limit.
**Validates: Requirements 3.7 (second part)**

### Property 8: Discount Calculation Correctness
*For any* coupon and cart total:
- If discount_type is 'fixed', the discount amount should equal discount_value (or cart total if discount_value > cart total)
- If discount_type is 'percentage', the discount amount should equal (cart_total × discount_value / 100), capped at max_discount if specified, and never exceeding cart total
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 9: Usage Tracking Completeness
*For any* order placed with a coupon, after the order is completed:
- A record should exist in coupon_usage table linking the coupon, user, and order
- The coupon's current_usage_count should be incremented by exactly 1
**Validates: Requirements 7.4, 7.5**

### Property 10: Cart Value Change Handling
*For any* cart with an applied coupon, if the cart total is modified such that it falls below the coupon's min_cart_value, the coupon should be automatically removed from the cart.
**Validates: Requirements 9.1**

### Property 11: Unique Coupon Code Generation
*For any* set of generated coupon codes, all codes should be unique, alphanumeric, between 6-12 characters, and exhibit sufficient randomness (no obvious sequential or predictable patterns).
**Validates: Requirements 10.1, 10.2**

## Error Handling

### Validation Error Messages

The system provides clear, user-friendly error messages for all validation failures:

```typescript
const ERROR_MESSAGES = {
  INVALID_CODE: 'Invalid coupon code',
  EXPIRED: 'This coupon has expired',
  NOT_YET_ACTIVE: 'This coupon is not yet active',
  FIRST_ORDER_ONLY: 'This coupon is only for first-time customers',
  MIN_CART_VALUE: (amount: number) => `Add ₹${amount} more to your cart to use this coupon`,
  ALREADY_USED: 'You have already used this coupon',
  INACTIVE: 'This coupon is no longer available',
  USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit',
  ONE_COUPON_ONLY: 'Only one coupon can be applied per order',
  CART_TOO_LOW: 'Cart value is below the minimum required for this coupon',
};
```

### Error Handling Strategy

1. **Validation Errors**: Return structured error responses with specific error codes and messages
2. **Database Errors**: Catch and log database errors, return generic error message to user
3. **Network Errors**: Implement retry logic with exponential backoff
4. **Race Conditions**: Use database transactions for atomic operations (usage tracking)
5. **Graceful Degradation**: If coupon service is unavailable, allow checkout without coupon

### Edge Cases

1. **Concurrent Usage**: Use database transactions to prevent race conditions when multiple users try to use a limited coupon simultaneously
2. **Order Cancellation**: Implement logic to decrement usage count and allow coupon reuse if order is cancelled
3. **Expired During Session**: Validate coupon again at checkout time, not just when applied
4. **Cart Modifications**: Re-validate coupon whenever cart total changes
5. **Timezone Handling**: Store all dates in UTC, convert to user's timezone for display

## Testing Strategy

### Dual Testing Approach

The coupon system will be validated using both unit tests and property-based tests:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific coupon validation scenarios (expired coupon, first order check)
- Error message formatting
- Database transaction handling
- UI component rendering with various states
- Integration between CouponService and CheckoutScreen

**Property-Based Tests**: Verify universal properties across all inputs
- Generate random coupons with various configurations
- Generate random users with different order histories
- Generate random cart totals
- Verify all validation rules hold for all generated inputs
- Each property test will run minimum 100 iterations

### Property-Based Testing Configuration

**Library**: fast-check (already in package.json)

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: coupon-system, Property {number}: {property_text}`
- Tests located in `__tests__/coupon-system.property.test.ts`

**Example Property Test Structure**:
```typescript
// Feature: coupon-system, Property 1: First Order Coupon Validation
it('should only validate first-order coupons for users with zero orders', () => {
  fc.assert(
    fc.property(
      fc.record({
        coupon: generateCoupon({ coupon_type: 'first_order' }),
        user: generateUser(),
        orderCount: fc.nat(),
      }),
      async ({ coupon, user, orderCount }) => {
        // Mock order count
        mockOrderCount(user.id, orderCount);
        
        const result = await couponService.validateCoupon(
          coupon.code,
          user.id,
          1000
        );
        
        if (orderCount === 0) {
          expect(result.valid).toBe(true);
        } else {
          expect(result.valid).toBe(false);
          expect(result.error).toContain('first-time customers');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

Unit tests will cover:
1. Coupon code generation uniqueness
2. Discount calculation for specific values
3. Error message formatting
4. UI component states (loading, error, success)
5. Form validation in admin screens
6. Integration with cart and checkout flow
7. Database transaction rollback on errors
8. Audit log creation for admin actions

### Integration Testing

Integration tests will verify:
1. Complete coupon application flow (user enters code → validation → discount applied)
2. Complete coupon creation flow (admin creates → saves to DB → appears in list)
3. Usage tracking flow (order placed → usage recorded → count incremented)
4. Cart value change flow (item removed → coupon invalidated → removed from cart)

### Test Data Generators

Property-based tests will use custom generators:

```typescript
// Generate random valid coupon
const generateCoupon = (overrides?: Partial<Coupon>) => 
  fc.record({
    code: fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), { minLength: 6, maxLength: 12 }),
    discount_type: fc.constantFrom('fixed', 'percentage'),
    discount_value: fc.double({ min: 1, max: 500 }),
    coupon_type: fc.constantFrom('first_order', 'cart_value', 'party', 'general'),
    min_cart_value: fc.double({ min: 0, max: 5000 }),
    valid_from: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-01-01') }),
    valid_until: fc.date({ min: new Date('2025-01-02'), max: new Date('2026-01-01') }),
    is_active: fc.boolean(),
    // ... other fields
  }).map(data => ({ ...data, ...overrides }));

// Generate random user with order history
const generateUser = () =>
  fc.record({
    id: fc.uuid(),
    orderCount: fc.nat({ max: 50 }),
  });

// Generate random cart total
const generateCartTotal = () =>
  fc.double({ min: 0, max: 10000 });
```

## UI/UX Design

### User Screens

#### CheckoutScreen - Coupon Section

**Layout**:
```
┌─────────────────────────────────────────┐
│ Have a coupon code?                     │
│ ┌─────────────────────┐  ┌──────────┐  │
│ │ Enter code          │  │  Apply   │  │
│ └─────────────────────┘  └──────────┘  │
│                                         │
│ ✓ SAVE50 applied (-₹50)    [Remove]    │
│                                         │
│ Available Coupons ▼                     │
│ ┌─────────────────────────────────────┐ │
│ │ 🎉 FIRST100                         │ │
│ │ Save ₹100 on your first order       │ │
│ │ Min. cart value: ₹1500              │ │
│ │                          [Apply]    │ │
│ ├─────────────────────────────────────┤ │
│ │ 🔒 SAVE200                          │ │
│ │ Save ₹200 on orders above ₹3000     │ │
│ │ Add ₹500 more to unlock             │ │
│ │ [Progress: ████░░░░░░ 83%]          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**States**:
- **No coupon applied**: Show input field and available coupons
- **Coupon applied**: Show applied coupon with discount amount and remove button
- **Loading**: Show spinner while validating
- **Error**: Show error message below input field in red
- **Success**: Show success message with green checkmark

**Interactions**:
- User types code and clicks Apply
- User clicks Apply on available coupon card
- User clicks Remove to remove applied coupon
- Available coupons update as cart value changes

#### Order Summary Section

```
┌─────────────────────────────────────────┐
│ Order Summary                           │
│                                         │
│ Subtotal              ₹2,500           │
│ Coupon (SAVE50)       -₹50             │
│ Shipping              ₹50              │
│ Tax                   ₹245             │
│ ─────────────────────────────────────  │
│ Total                 ₹2,745           │
└─────────────────────────────────────────┘
```

### Admin Screens

#### AdminCouponsScreen

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Coupons                              [+ Create Coupon]  │
│                                                         │
│ ┌─ Active (12) ─┬─ Inactive (5) ─┬─ Expired (8) ─┐   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ FIRST100          First Order    ₹100    Active    │ │
│ │ Used: 45/100      Valid until: Dec 31, 2024        │ │
│ │ Total discount: ₹4,500           [Edit] [Delete]   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ SAVE200           Cart Value     ₹200    Active    │ │
│ │ Used: 23/50       Valid until: Jan 15, 2025        │ │
│ │ Total discount: ₹4,600           [Edit] [Delete]   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Tabs for Active, Inactive, and Expired coupons
- Each coupon card shows key information and statistics
- Quick actions: Edit, Delete, Toggle Active
- Create button opens AdminCouponDetailsScreen

#### AdminCouponDetailsScreen

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ ← Back                    Create Coupon                 │
│                                                         │
│ Basic Information                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Coupon Code *                                       │ │
│ │ ┌─────────────────────┐  [Generate Random]         │ │
│ │ │ FIRST100            │                             │ │
│ │ └─────────────────────┘                             │ │
│ │                                                     │ │
│ │ Description                                         │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Save ₹100 on your first order                   │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Discount Configuration                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Discount Type *                                     │ │
│ │ ○ Fixed Amount    ● Percentage                      │ │
│ │                                                     │ │
│ │ Discount Value *                                    │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 100                 │ ₹                           │ │
│ │ └─────────────────────┘                             │ │
│ │                                                     │ │
│ │ Maximum Discount (for percentage)                   │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 500                 │ ₹                           │ │
│ │ └─────────────────────┘                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Coupon Type *                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ● First Order    ○ Cart Value                       │ │
│ │ ○ Party/Event    ○ General                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Requirements                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Minimum Cart Value                                  │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 1500                │ ₹                           │ │
│ │ └─────────────────────┘                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Usage Limits                                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Usage Limit Per User *                              │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 1                   │                             │ │
│ │ └─────────────────────┘                             │ │
│ │                                                     │ │
│ │ Total Usage Limit                                   │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 100                 │                             │ │
│ │ └─────────────────────┘                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Validity Period *                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Valid From                                          │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 2024-12-01          │ 📅                          │ │
│ │ └─────────────────────┘                             │ │
│ │                                                     │ │
│ │ Valid Until                                         │ │
│ │ ┌─────────────────────┐                             │ │
│ │ │ 2024-12-31          │ 📅                          │ │
│ │ └─────────────────────┘                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Status                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ Active                                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Cancel]                              [Save Coupon]    │
└─────────────────────────────────────────────────────────┘
```

**Validation**:
- Required fields marked with *
- Real-time validation as user types
- Show error messages below fields
- Disable Save button until form is valid
- Validate date range (valid_until > valid_from)
- Validate discount value > 0
- Validate usage limits > 0

### Visual Design Tokens

```typescript
const COUPON_COLORS = {
  success: '#10B981',      // Green for applied coupon
  error: '#EF4444',        // Red for errors
  warning: '#F59E0B',      // Orange for warnings
  locked: '#9CA3AF',       // Gray for locked coupons
  unlocked: '#3B82F6',     // Blue for available coupons
  background: '#F9FAFB',   // Light gray background
  border: '#E5E7EB',       // Border color
};

const COUPON_ICONS = {
  firstOrder: '🎉',
  cartValue: '🛒',
  party: '🎊',
  general: '🎁',
  locked: '🔒',
  unlocked: '✓',
};
```

## Security Considerations

### Server-Side Validation

All coupon validation must occur on the server side:
- Never trust client-side validation
- Validate coupon at application time
- Re-validate at checkout time
- Use database transactions for atomic operations

### Rate Limiting

Implement rate limiting to prevent abuse:
- Limit coupon application attempts per user (e.g., 10 per minute)
- Limit coupon code generation requests
- Monitor for suspicious patterns (rapid-fire attempts)

### Audit Trail

Log all coupon-related actions:
- Coupon creation/modification/deletion (admin actions)
- Coupon application attempts (success and failure)
- Usage tracking
- Store admin_id, timestamp, and action details

### Code Generation Security

- Use cryptographically secure random number generator
- Check generated codes against profanity list
- Ensure codes are not sequential or predictable
- Validate uniqueness before saving

## Performance Considerations

### Database Optimization

1. **Indexes**: Create indexes on frequently queried columns
   - `code` for coupon lookup
   - `is_active` for filtering active coupons
   - `valid_from, valid_until` for date range queries
   - `user_id, coupon_id` for usage checks

2. **Query Optimization**:
   - Use single query to fetch coupon with usage data
   - Cache frequently accessed coupons
   - Use database functions for complex validation

3. **Connection Pooling**: Leverage Supabase connection pooling

### Caching Strategy

- Cache active coupons list (invalidate on create/update/delete)
- Cache user's order count (invalidate on new order)
- Cache coupon validation results for short duration (30 seconds)

### Async Operations

- Audit logging should be async (don't block user flow)
- Usage tracking can be async after order confirmation
- Notification sending should be async

## Migration Strategy

### Database Migration

1. Create `coupons` table with all fields and constraints
2. Create `coupon_usage` table with foreign keys
3. Create indexes for performance
4. Add RLS policies for security
5. Create helper functions for common queries

### Data Migration

No existing data to migrate (new feature)

### Rollback Plan

If issues arise:
1. Disable coupon feature via feature flag
2. Allow existing orders with coupons to complete
3. Fix issues in staging environment
4. Re-enable feature

## Deployment Checklist

- [ ] Database migration executed successfully
- [ ] Indexes created and verified
- [ ] RLS policies tested
- [ ] CouponService unit tests passing
- [ ] Property-based tests passing
- [ ] Admin screens tested
- [ ] User screens tested
- [ ] Error handling verified
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Monitoring and logging configured

## Future Enhancements

### Phase 2 Features

1. **Referral Coupons**: Users can share coupons with friends
2. **Loyalty Points Integration**: Convert points to coupons
3. **Stackable Coupons**: Allow multiple coupons with rules
4. **Auto-Apply Best Coupon**: Automatically apply best available coupon
5. **Coupon Recommendations**: ML-based coupon suggestions
6. **A/B Testing**: Test coupon effectiveness
7. **Bulk Coupon Generation**: Generate multiple coupons at once
8. **Advanced Analytics**: Detailed coupon performance dashboard
9. **Scheduled Coupons**: Auto-activate/deactivate at specific times
10. **User-Specific Coupons**: Target specific user segments

### Technical Debt

- Consider moving validation logic to database functions for consistency
- Implement caching layer for high-traffic scenarios
- Add GraphQL subscriptions for real-time coupon updates
- Implement event sourcing for complete audit trail

## Appendix

### Database Functions

```sql
-- Function to check if user can use coupon
CREATE OR REPLACE FUNCTION can_user_use_coupon(
  p_coupon_id UUID,
  p_user_id UUID,
  p_cart_total DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_order_count INTEGER;
  v_usage_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code');
  END IF;
  
  -- Check active status
  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is no longer available');
  END IF;
  
  -- Check date validity
  IF NOW() < v_coupon.valid_from THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not yet active');
  END IF;
  
  IF NOW() > v_coupon.valid_until THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has expired');
  END IF;
  
  -- Check first order requirement
  IF v_coupon.coupon_type = 'first_order' THEN
    SELECT COUNT(*) INTO v_order_count FROM orders WHERE user_id = p_user_id;
    IF v_order_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only for first-time customers');
    END IF;
  END IF;
  
  -- Check cart value
  IF p_cart_total < v_coupon.min_cart_value THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', format('Add ₹%s more to your cart to use this coupon', v_coupon.min_cart_value - p_cart_total)
    );
  END IF;
  
  -- Check user usage
  SELECT COUNT(*) INTO v_usage_count 
  FROM coupon_usage 
  WHERE coupon_id = p_coupon_id AND user_id = p_user_id;
  
  IF v_usage_count >= v_coupon.usage_limit_per_user THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
  END IF;
  
  -- Check total usage limit
  IF v_coupon.total_usage_limit IS NOT NULL AND 
     v_coupon.current_usage_count >= v_coupon.total_usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has reached its usage limit');
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql;
```

### API Endpoints

If implementing REST API (optional):

```
POST   /api/coupons/validate
POST   /api/coupons/apply
DELETE /api/coupons/remove
GET    /api/coupons/available

Admin endpoints:
GET    /api/admin/coupons
POST   /api/admin/coupons
PUT    /api/admin/coupons/:id
DELETE /api/admin/coupons/:id
GET    /api/admin/coupons/:id/statistics
```

## Conclusion

This design provides a comprehensive, secure, and user-friendly coupon system that integrates seamlessly with the existing e-commerce application. The system implements all required validation rules, provides clear error messages, and includes robust testing strategies to ensure correctness. The modular architecture allows for easy extension and maintenance, while the property-based testing approach ensures the system behaves correctly across all possible inputs.
