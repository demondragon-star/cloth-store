# Design Document: Coupon Discovery and Notification System

## Overview

This design document outlines the architecture and implementation details for an enhanced coupon discovery and notification system. The system provides intelligent coupon suggestions through a modal interface, dynamic promotional banners on the home screen, and real-time push notifications when new coupons are created by administrators.

The system builds upon the existing coupon infrastructure (coupon.service.ts, database schema) and integrates with the existing notification service (notification.service.ts) to provide a seamless user experience for discovering and applying discount coupons.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Home Screen  │  │ Cart Screen  │  │ Notification │      │
│  │              │  │              │  │   Handler    │      │
│  │ - Banners    │  │ - Coupon     │  │              │      │
│  │ - Carousel   │  │   Modal      │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐        │
│  │         Coupon Discovery Service                 │        │
│  │  - getAvailableCoupons()                        │        │
│  │  - getActiveCouponsForBanners()                 │        │
│  │  - applyCoupon()                                │        │
│  │  - calculateRemainingAmount()                   │        │
│  └────────────────────────┬────────────────────────┘        │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ API Calls
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Backend Services                          │
├───────────────────────────┼──────────────────────────────────┤
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐        │
│  │         Supabase Database                        │        │
│  │  - coupons table                                 │        │
│  │  - coupon_usage table                            │        │
│  │  - orders table                                  │        │
│  │  - notifications table                           │        │
│  │  - push_tokens table                             │        │
│  └────────────────────────┬────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────┐        │
│  │      Admin Notification Trigger                  │        │
│  │  - Database trigger on coupon INSERT/UPDATE      │        │
│  │  - Sends push notifications via Expo             │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Coupon Modal Flow:**
1. User taps coupon input field in cart
2. Cart screen calls `getAvailableCoupons(userId, cartTotal)`
3. Service fetches user's order history and active coupons
4. Service filters coupons based on eligibility rules
5. Modal displays filtered coupons with appropriate messaging
6. User taps a coupon to apply it
7. Service validates and applies coupon to cart

**Banner Carousel Flow:**
1. Home screen loads
2. Component calls `getActiveCouponsForBanners()`
3. Service fetches all active coupons
4. Component renders carousel with auto-slide
5. User can swipe manually or wait for auto-transition
6. Tapping banner shows coupon details or copies code

**Notification Flow:**
1. Admin creates/activates coupon in admin panel
2. Database trigger detects coupon creation/activation
3. Trigger function fetches all user push tokens
4. System sends push notifications via Expo Push API
5. User receives notification on device
6. Tapping notification opens app to coupon details

## Components and Interfaces

### 1. Coupon Modal Component

**Location:** `src/components/CouponModal.tsx`

**Props Interface:**
```typescript
interface CouponModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCoupon: (coupon: Coupon) => void;
  userId: string;
  cartTotal: number;
}
```

**State:**
```typescript
interface CouponModalState {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
}
```

**Key Methods:**
- `loadCoupons()`: Fetches available coupons from service
- `handleCouponSelect(coupon)`: Validates and applies selected coupon
- `calculateRemainingAmount(coupon)`: Computes amount needed for cart-value coupons
- `renderCouponItem(coupon)`: Renders individual coupon with appropriate styling

**UI Structure:**
```
Modal
├── Header
│   ├── Title: "Available Coupons"
│   └── Close Button
├── Content (ScrollView)
│   ├── Eligible Coupons Section
│   │   └── List of applicable coupons
│   └── Locked Coupons Section
│       └── Cart-value coupons below threshold
└── Footer
    └── "No coupons available" message (if empty)
```

### 2. Coupon Banner Carousel Component

**Location:** `src/components/CouponBannerCarousel.tsx`

**Props Interface:**
```typescript
interface CouponBannerCarouselProps {
  onBannerPress?: (coupon: Coupon) => void;
  autoSlideInterval?: number; // Default: 3000ms
}
```

**State:**
```typescript
interface CarouselState {
  coupons: Coupon[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
}
```

**Key Methods:**
- `loadActiveCoupons()`: Fetches active coupons for banners
- `startAutoSlide()`: Initiates automatic banner rotation
- `stopAutoSlide()`: Pauses automatic rotation
- `handleManualSwipe(index)`: Handles user swipe gestures
- `renderBanner(coupon)`: Renders individual banner with coupon details
- `renderPaginationDots()`: Displays position indicators

**Auto-Slide Logic:**
```typescript
useEffect(() => {
  if (coupons.length > 1) {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % coupons.length);
    }, autoSlideInterval);
    
    return () => clearInterval(interval);
  }
}, [coupons.length, autoSlideInterval]);
```

### 3. Enhanced Coupon Service

**Location:** `src/services/coupon.service.ts` (extend existing)

**New Methods:**

```typescript
class CouponService {
  /**
   * Get coupons available for display in modal
   * Filters based on user eligibility and cart value
   */
  async getAvailableCouponsForModal(
    userId: string,
    cartTotal: number
  ): Promise<{
    eligible: Coupon[];
    locked: Array<Coupon & { amountNeeded: number }>;
    error: string | null;
  }>;

  /**
   * Get active coupons for banner display
   * Returns only active coupons within validity period
   */
  async getActiveCouponsForBanners(): Promise<{
    data: Coupon[] | null;
    error: string | null;
  }>;

  /**
   * Calculate remaining amount needed to unlock a cart-value coupon
   */
  calculateRemainingAmount(
    coupon: Coupon,
    currentCartTotal: number
  ): number;

  /**
   * Check if user has placed any successful orders
   * Used for first-order coupon filtering
   */
  async hasUserPlacedOrders(userId: string): Promise<boolean>;
}
```

### 4. Notification Trigger Function

**Location:** `admin-web/supabase/functions/send-coupon-notification.ts`

**Database Trigger:**
```sql
CREATE OR REPLACE FUNCTION notify_new_coupon()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if coupon is being set to active
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Call edge function to send notifications
    PERFORM net.http_post(
      url := 'https://[project-ref].supabase.co/functions/v1/send-coupon-notification',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'coupon_id', NEW.id,
        'coupon_code', NEW.code,
        'discount_type', NEW.discount_type,
        'discount_value', NEW.discount_value,
        'valid_until', NEW.valid_until
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coupon_notification_trigger
AFTER INSERT OR UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION notify_new_coupon();
```

**Edge Function Logic:**
```typescript
export async function sendCouponNotification(couponData: {
  coupon_id: string;
  coupon_code: string;
  discount_type: string;
  discount_value: number;
  valid_until: string;
}) {
  // 1. Fetch all active push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token, user_id');

  // 2. Format notification message
  const message = formatCouponNotification(couponData);

  // 3. Send push notifications in batches
  await sendPushNotificationsBatch(tokens, message);

  // 4. Create notification records in database
  await createNotificationRecords(tokens, couponData);
}
```

## Data Models

### Extended Coupon Type

```typescript
interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  coupon_type: 'first_order' | 'cart_value' | 'party' | 'general';
  min_cart_value: number;
  max_discount: number | null;
  usage_limit_per_user: number;
  total_usage_limit: number | null;
  current_usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended for modal display
interface CouponWithEligibility extends Coupon {
  isEligible: boolean;
  isLocked: boolean;
  amountNeeded?: number; // For cart-value coupons
  ineligibilityReason?: string;
}
```

### Notification Payload

```typescript
interface CouponNotificationPayload {
  title: string;
  body: string;
  data: {
    type: 'coupon_created';
    coupon_id: string;
    coupon_code: string;
    discount_type: string;
    discount_value: number;
    valid_until: string;
  };
}
```

### Banner Data

```typescript
interface BannerData {
  coupon: Coupon;
  displayText: string;
  backgroundColor: string;
  iconName: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Modal Display Trigger

*For any* user interaction with the coupon input field, the system should display the coupon modal containing available coupons.

**Validates: Requirements 1.1**

### Property 2: First-Order Coupon Exclusion

*For any* user with one or more successful orders (confirmed, preparing, out_for_delivery, or delivered status), first-order coupons should be excluded from the available coupons list.

**Validates: Requirements 1.3**

### Property 3: Cart-Value Coupon Display with Unlock Message

*For any* cart-value coupon where the current cart total is below the minimum threshold, the coupon should be displayed with a message indicating the additional amount needed to unlock it.

**Validates: Requirements 1.4**

### Property 4: Remaining Amount Calculation

*For any* cart-value coupon and current cart total below the minimum threshold, the calculated remaining amount should equal the difference between the minimum cart value and the current cart total.

**Validates: Requirements 1.5**

### Property 5: Coupon Information Completeness

*For any* coupon displayed in the modal, the rendered output should contain the coupon code, discount amount or percentage, coupon type, conditions, and expiry date.

**Validates: Requirements 1.6**

### Property 6: Coupon Application Trigger

*For any* coupon in the modal, tapping it should trigger the apply coupon function with that coupon's code.

**Validates: Requirements 1.7**

### Property 7: Comprehensive Eligibility Filtering

*For any* coupon, it should only be classified as eligible if all of the following conditions are met: active status is true, current date falls within validity period, total usage limit has not been reached, and user-specific usage limit (if applicable) has not been exceeded.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 8: Unlock Message Formatting

*For any* cart-value coupon displayed below threshold, the message should be formatted as "Add ₹X more to unlock this coupon" where X is the calculated difference rounded to the nearest integer.

**Validates: Requirements 2.6**

### Property 9: Notification Trigger on Active Coupon Creation

*For any* coupon created or updated to active status, the notification service should be triggered to send push notifications to all registered users.

**Validates: Requirements 3.1, 8.1, 8.2**

### Property 10: Notification Content Completeness

*For any* coupon notification sent, the notification payload should include the coupon code, discount details (type and value), and validity period.

**Validates: Requirements 3.2**

### Property 11: No Notification for Inactive Coupons

*For any* coupon created or updated with active status set to false, no push notifications should be sent.

**Validates: Requirements 8.3**

### Property 12: Banner Fetch on Home Screen Load

*For any* home screen load event, the system should fetch all active coupons for banner display.

**Validates: Requirements 4.1**

### Property 13: Carousel Display for Multiple Banners

*For any* set of active coupons where the count is greater than one, the system should render them as a carousel with swipe navigation enabled.

**Validates: Requirements 4.4, 4.6**

### Property 14: Pagination Dots Display

*For any* carousel with multiple banners, pagination dots should be displayed with count equal to the number of banners and the current position highlighted.

**Validates: Requirements 4.7**

### Property 15: Banner Information Completeness

*For any* banner displayed in the carousel, the rendered output should contain the coupon code, discount details, and visual design elements.

**Validates: Requirements 4.8**

### Property 16: Banner Tap Handler

*For any* banner in the carousel, tapping it should trigger either the coupon details display or clipboard copy action.

**Validates: Requirements 4.9**

### Property 17: Comprehensive Coupon Validation

*For any* coupon validation request, the validation should check expiry date against current timestamp, verify active status is true, check total usage limit, and verify per-user usage limit (if applicable).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 18: Validation Error Messages

*For any* failed coupon validation, the system should return a descriptive error message indicating the specific reason for failure.

**Validates: Requirements 5.5**

### Property 19: Validation Success Allows Application

*For any* coupon that passes all validation checks, the system should allow the coupon to be applied to the cart.

**Validates: Requirements 5.6**

### Property 20: Validation Error Display

*For any* coupon application that fails validation, the system should display the specific validation error message to the user.

**Validates: Requirements 6.6**

### Property 21: Notification Logging

*For any* notification send operation, the system should log the event with timestamp and recipient count.

**Validates: Requirements 8.5**



## Error Handling

### 1. Network Errors

**Scenario:** API requests fail due to network connectivity issues

**Handling Strategy:**
- Display user-friendly error messages
- Provide retry buttons for failed operations
- Cache coupon data locally for offline access (5-minute TTL)
- Show cached data with "offline" indicator when network is unavailable

**Implementation:**
```typescript
try {
  const { data, error } = await couponService.getAvailableCoupons(userId, cartTotal);
  if (error) throw new Error(error);
  setCoupons(data);
} catch (error) {
  // Try to load from cache
  const cachedData = await getCachedCoupons();
  if (cachedData) {
    setCoupons(cachedData);
    showOfflineIndicator();
  } else {
    showError('Unable to load coupons. Please check your connection and try again.');
  }
}
```

### 2. Validation Errors

**Scenario:** Coupon fails validation when user attempts to apply it

**Handling Strategy:**
- Display specific validation error messages from the service
- Highlight the issue (e.g., "Add ₹50 more to use this coupon")
- Keep modal open to allow user to select another coupon
- Log validation failures for analytics

**Error Messages:**
- Expired: "This coupon has expired"
- Not yet active: "This coupon is not yet active"
- First order only: "This coupon is only for first-time customers"
- Min cart value: "Add ₹X more to your cart to use this coupon"
- Usage limit reached: "You have reached the usage limit for this coupon"
- Inactive: "This coupon is no longer available"

### 3. Empty States

**Scenario:** No coupons available to display

**Handling Strategy:**
- **Modal:** Display "No coupons available at this time" message with decorative icon
- **Banner:** Hide banner section entirely or show default promotional banner
- Provide clear messaging to set user expectations

### 4. Notification Failures

**Scenario:** Push notification delivery fails

**Handling Strategy:**
- Log failed notification attempts with error details
- Implement retry logic with exponential backoff (3 attempts)
- Queue failed notifications for batch retry
- Create in-app notification records regardless of push delivery status
- Monitor notification delivery rates via analytics

**Implementation:**
```typescript
async function sendNotificationWithRetry(token: string, message: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendPushNotification(token, message);
      return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        logNotificationFailure(token, error);
        return { success: false, error };
      }
      await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
```

### 5. Race Conditions

**Scenario:** Coupon expires or reaches usage limit while user is viewing it

**Handling Strategy:**
- Perform real-time validation before applying coupon
- Show appropriate error message if coupon becomes invalid
- Refresh coupon list automatically if validation fails
- Implement optimistic UI updates with rollback on failure

### 6. Banner Auto-Slide Errors

**Scenario:** Auto-slide timer encounters errors or component unmounts

**Handling Strategy:**
- Wrap auto-slide logic in try-catch blocks
- Clean up timers on component unmount
- Fall back to manual navigation if auto-slide fails
- Log errors for debugging but don't disrupt user experience

**Implementation:**
```typescript
useEffect(() => {
  if (coupons.length <= 1) return;
  
  try {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % coupons.length);
    }, autoSlideInterval);
    
    return () => clearInterval(interval);
  } catch (error) {
    console.error('Banner auto-slide error:', error);
    // Fall back to manual navigation only
  }
}, [coupons.length, autoSlideInterval]);
```

### 7. Database Trigger Failures

**Scenario:** Notification trigger fails to execute or edge function is unavailable

**Handling Strategy:**
- Log trigger execution failures
- Implement dead letter queue for failed notifications
- Provide admin interface to manually trigger notifications
- Monitor trigger health via database logs
- Ensure coupon creation succeeds even if notification fails (non-blocking)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests:** Verify specific examples, edge cases, and error conditions
- **Property tests:** Verify universal properties across all inputs

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library:** fast-check (for TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: coupon-discovery-and-notifications, Property {number}: {property_text}`

**Example Property Test:**
```typescript
import fc from 'fast-check';

describe('Feature: coupon-discovery-and-notifications, Property 4: Remaining Amount Calculation', () => {
  it('should calculate remaining amount as difference between min cart value and current total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }), // min cart value
        fc.integer({ min: 0, max: 9999 }),    // current cart total (below min)
        (minCartValue, currentTotal) => {
          fc.pre(currentTotal < minCartValue); // Precondition
          
          const coupon = createCoupon({ min_cart_value: minCartValue });
          const remaining = calculateRemainingAmount(coupon, currentTotal);
          
          expect(remaining).toBe(minCartValue - currentTotal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Focus Areas:**
- Specific examples demonstrating correct behavior
- Edge cases (empty lists, single items, boundary values)
- Error conditions and error message formatting
- Integration between components
- UI interactions and navigation

**Example Unit Test:**
```typescript
describe('CouponModal', () => {
  it('should display "No coupons available" when coupon list is empty', async () => {
    const { getByText } = render(
      <CouponModal
        visible={true}
        onClose={jest.fn()}
        onSelectCoupon={jest.fn()}
        userId="user-123"
        cartTotal={1000}
      />
    );
    
    // Mock empty response
    jest.spyOn(couponService, 'getAvailableCouponsForModal')
      .mockResolvedValue({ eligible: [], locked: [], error: null });
    
    await waitFor(() => {
      expect(getByText('No coupons available at this time')).toBeTruthy();
    });
  });
  
  it('should format unlock message correctly for cart-value coupons', () => {
    const coupon = createCoupon({
      coupon_type: 'cart_value',
      min_cart_value: 2000
    });
    const cartTotal = 1500;
    
    const message = formatUnlockMessage(coupon, cartTotal);
    
    expect(message).toBe('Add ₹500 more to unlock this coupon');
  });
});
```

### Integration Testing

**Scenarios to Test:**
1. End-to-end coupon selection and application flow
2. Banner carousel interaction and navigation
3. Notification delivery and handling
4. Offline mode and cache behavior
5. Admin coupon creation triggering notifications

### Test Coverage Goals

- **Unit Test Coverage:** Minimum 80% code coverage
- **Property Test Coverage:** All 21 correctness properties implemented
- **Integration Test Coverage:** All critical user flows
- **Edge Case Coverage:** All identified edge cases in requirements

### Testing Tools

- **Unit Testing:** Jest + React Native Testing Library
- **Property Testing:** fast-check
- **Integration Testing:** Detox (E2E testing framework)
- **Mocking:** jest.mock() for service dependencies
- **Test Data Generation:** faker.js for realistic test data

### Continuous Testing

- Run unit tests on every commit (pre-commit hook)
- Run property tests in CI/CD pipeline
- Run integration tests before deployment
- Monitor test execution time and optimize slow tests
- Maintain test documentation and examples

## Implementation Notes

### Performance Considerations

1. **Coupon Fetching:**
   - Implement pagination for large coupon lists
   - Cache coupon data for 5 minutes to reduce API calls
   - Use React Query or SWR for automatic cache management

2. **Banner Images:**
   - Lazy load banner images
   - Preload next banner image during auto-slide
   - Use optimized image formats (WebP with fallback)
   - Implement image caching strategy

3. **Notification Batching:**
   - Send notifications in batches of 100 tokens
   - Implement rate limiting to avoid API throttling
   - Use background jobs for large notification sends

### Security Considerations

1. **Coupon Validation:**
   - Always validate coupons server-side before applying
   - Never trust client-side validation alone
   - Implement rate limiting on coupon validation endpoints

2. **Notification Triggers:**
   - Verify admin permissions before allowing coupon creation
   - Sanitize coupon data before sending in notifications
   - Implement notification spam prevention

3. **Data Privacy:**
   - Don't expose user-specific data in notifications
   - Respect user notification preferences
   - Implement opt-out mechanism for promotional notifications

### Accessibility

1. **Modal:**
   - Ensure keyboard navigation support
   - Provide screen reader labels for all interactive elements
   - Use sufficient color contrast for text and backgrounds
   - Support dynamic font sizing

2. **Banner Carousel:**
   - Provide alternative text for banner images
   - Ensure swipe gestures work with accessibility tools
   - Add pause button for auto-slide (accessibility requirement)
   - Announce banner changes to screen readers

3. **Notifications:**
   - Ensure notification text is clear and concise
   - Support notification reading by screen readers
   - Provide visual indicators for notification importance

### Monitoring and Analytics

1. **Track Key Metrics:**
   - Coupon modal open rate
   - Coupon application success rate
   - Banner interaction rate
   - Notification delivery rate
   - Notification open rate

2. **Error Monitoring:**
   - Log all API failures with context
   - Track validation failure reasons
   - Monitor notification delivery failures
   - Alert on high error rates

3. **Performance Monitoring:**
   - Track coupon fetch latency
   - Monitor banner load times
   - Measure notification delivery time
   - Track cache hit rates

## Migration and Deployment

### Database Changes

No new tables required. Existing schema supports all features:
- `coupons` table: Already exists
- `coupon_usage` table: Already exists
- `notifications` table: Already exists
- `push_tokens` table: Already exists

### New Database Objects

1. **Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION notify_new_coupon()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    PERFORM net.http_post(
      url := current_setting('app.edge_function_url') || '/send-coupon-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.service_role_key')),
      body := jsonb_build_object(
        'coupon_id', NEW.id,
        'coupon_code', NEW.code,
        'discount_type', NEW.discount_type,
        'discount_value', NEW.discount_value,
        'valid_until', NEW.valid_until
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coupon_notification_trigger
AFTER INSERT OR UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION notify_new_coupon();
```

### Deployment Steps

1. Deploy edge function for notification sending
2. Create database trigger for coupon notifications
3. Deploy mobile app updates with new components
4. Test notification flow in staging environment
5. Monitor error rates and performance metrics
6. Gradually roll out to production users

### Rollback Plan

1. Disable database trigger if notifications cause issues
2. Revert mobile app to previous version if critical bugs found
3. Fall back to manual notification sending if automated system fails
4. Maintain backward compatibility with existing coupon system

## Future Enhancements

1. **Personalized Coupon Recommendations:**
   - Use ML to recommend coupons based on user behavior
   - Show most relevant coupons first in modal

2. **Coupon Sharing:**
   - Allow users to share coupons with friends
   - Track referral-based coupon usage

3. **Gamification:**
   - Unlock special coupons through achievements
   - Implement coupon collection mechanics

4. **Advanced Targeting:**
   - Location-based coupons
   - Time-based coupons (happy hour, weekend specials)
   - User segment-specific coupons

5. **A/B Testing:**
   - Test different banner designs
   - Optimize notification messaging
   - Experiment with coupon display order
