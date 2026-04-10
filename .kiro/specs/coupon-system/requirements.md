# Coupon System - Requirements

## Feature Overview
A comprehensive coupon and discount code system that allows admins to create various types of coupons and users to apply them during checkout with intelligent validation rules.

## User Stories

### As an Admin:
1. I want to create different types of coupons (first order, cart value-based, party/event coupons)
2. I want to set discount amounts for each coupon (₹50, ₹100, ₹200, etc.)
3. I want to set usage limits (one-time use per user, total usage limit)
4. I want to set validity periods (start date, end date)
5. I want to set minimum cart value requirements
6. I want to view coupon usage statistics
7. I want to activate/deactivate coupons
8. I want to generate unique coupon codes automatically

### As a User:
1. I want to see available coupons I can use
2. I want to apply a coupon code at checkout
3. I want to see the discount applied to my order
4. I want to know why a coupon is not applicable (clear error messages)
5. I want to unlock coupons based on my cart value
6. I want to see first-order coupons if I'm a new customer

## Acceptance Criteria

### 1. Coupon Types
**1.1 First Order Coupons**
- Only applicable to users with zero previous orders
- System checks user's order history
- If user has ≥1 order, coupon is not applicable
- Clear message: "This coupon is only for first-time orders"

**1.2 Cart Value-Based Coupons**
- Unlocked when cart total reaches minimum amount
- Example: Cart ≥ ₹1500 → Unlock ₹50 or ₹100 coupon
- Visual indicator showing progress to unlock
- Auto-suggest applicable coupons

**1.3 Party/Event Coupons**
- Special occasion coupons (festivals, sales events)
- Can have custom validity periods
- Can be combined with other rules

**1.4 General Coupons**
- Standard discount coupons
- No special restrictions
- Can have minimum cart value

### 2. Coupon Properties
**2.1 Required Fields**
- Coupon Code (unique, alphanumeric, 6-12 characters)
- Discount Type (fixed amount or percentage)
- Discount Value (₹50, ₹100, ₹200, or 10%, 20%, etc.)
- Coupon Type (first_order, cart_value, party, general)
- Valid From (start date)
- Valid Until (end date)
- Is Active (boolean)

**2.2 Optional Fields**
- Minimum Cart Value (₹0 = no minimum)
- Maximum Discount (for percentage coupons)
- Usage Limit Per User (default: 1)
- Total Usage Limit (total times coupon can be used)
- Description (user-facing description)

### 3. Validation Rules
**3.1 Single Coupon Per Order**
- Only one coupon can be applied per order
- If user tries to apply second coupon, show error
- User can remove current coupon and apply different one

**3.2 One-Time Use Per User**
- Each user can use a specific coupon only once
- System tracks coupon usage per user
- Check `coupon_usage` table before applying

**3.3 First Order Validation**
- Query user's order count
- If count > 0, reject first-order coupons
- Show message: "This coupon is only for first-time customers"

**3.4 Cart Value Validation**
- Check if cart total ≥ minimum required value
- Show message: "Add ₹X more to use this coupon"
- Update validation as cart changes

**3.5 Date Validation**
- Check if current date is within valid period
- Show message: "This coupon has expired" or "This coupon is not yet active"

**3.6 Active Status**
- Only active coupons can be applied
- Inactive coupons show "This coupon is no longer available"

**3.7 Usage Limit Validation**
- Check if user has already used this coupon
- Check if total usage limit reached
- Show appropriate error messages

### 4. User Interface

**4.1 Checkout Screen - Coupon Input**
- Input field for coupon code
- "Apply" button
- "Remove" button (when coupon applied)
- Display applied discount amount
- Show error messages inline

**4.2 Available Coupons Section**
- List of applicable coupons for current cart
- Show discount amount
- Show minimum cart value requirement
- "Apply" button for each coupon
- Visual indicator for locked/unlocked coupons

**4.3 Cart Value Progress**
- Progress bar showing cart value vs. unlock threshold
- "Add ₹X more to unlock Y% discount"
- Visual feedback as cart value increases

**4.4 Order Summary**
- Subtotal
- Coupon Discount (- ₹X)
- Shipping
- Tax
- **Total**

### 5. Admin Interface

**5.1 Coupon Management Screen**
- List all coupons (active/inactive)
- Create new coupon button
- Edit/Delete coupon actions
- Toggle active status
- View usage statistics

**5.2 Create/Edit Coupon Form**
- All coupon fields
- Validation for required fields
- Preview of coupon
- Save/Cancel buttons

**5.3 Coupon Statistics**
- Total uses
- Total discount given
- Users who used coupon
- Revenue impact

### 6. Database Schema

**6.1 Coupons Table**
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(12) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'fixed' or 'percentage'
  discount_value DECIMAL(10,2) NOT NULL,
  coupon_type VARCHAR(20) NOT NULL, -- 'first_order', 'cart_value', 'party', 'general'
  min_cart_value DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2), -- for percentage coupons
  usage_limit_per_user INTEGER DEFAULT 1,
  total_usage_limit INTEGER,
  current_usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**6.2 Coupon Usage Table**
```sql
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id) -- Ensures one use per user
);
```

**6.3 Indexes**
```sql
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
```

### 7. Business Logic

**7.1 Coupon Application Flow**
1. User enters coupon code
2. System validates coupon exists and is active
3. System checks date validity
4. System checks user eligibility (first order, usage limit)
5. System checks cart value requirement
6. System calculates discount amount
7. System applies discount to order
8. System updates UI with discount

**7.2 Discount Calculation**
- **Fixed Amount**: Direct subtraction (₹50, ₹100, ₹200)
- **Percentage**: (cart_value × percentage) capped at max_discount
- Discount cannot exceed cart subtotal
- Discount applied before tax and shipping

**7.3 Coupon Usage Tracking**
- Record usage when order is placed (not when applied)
- Increment coupon usage count
- Create coupon_usage record
- Link to order for tracking

### 8. Error Messages

**8.1 User-Friendly Messages**
- "Invalid coupon code"
- "This coupon has expired"
- "This coupon is only for first-time customers"
- "Add ₹X more to your cart to use this coupon"
- "You have already used this coupon"
- "This coupon is no longer available"
- "Only one coupon can be applied per order"

### 9. Edge Cases

**9.1 Cart Value Changes**
- If cart value drops below minimum after applying coupon, remove coupon
- Show notification: "Coupon removed: Cart value below minimum"

**9.2 Coupon Expiry During Session**
- If coupon expires while in cart, remove on checkout attempt
- Show notification: "Coupon has expired and was removed"

**9.3 Concurrent Usage**
- Handle race conditions for usage limits
- Use database transactions for atomic operations

**9.4 Order Cancellation**
- If order is cancelled, decrement usage count
- Allow user to reuse coupon (if within limits)

### 10. Security Considerations

**10.1 Code Generation**
- Generate unique, random codes
- Avoid predictable patterns
- Check for profanity/offensive words

**10.2 Validation**
- Server-side validation for all rules
- Prevent client-side manipulation
- Rate limiting on coupon application attempts

**10.3 Audit Trail**
- Log all coupon applications
- Track who created/modified coupons
- Monitor for abuse patterns

## Non-Functional Requirements

### Performance
- Coupon validation should complete in < 500ms
- Support 1000+ concurrent coupon applications
- Efficient database queries with proper indexing

### Scalability
- Support 10,000+ active coupons
- Handle 100,000+ coupon usage records
- Optimize for high-traffic sale events

### Usability
- Clear, intuitive UI for both admin and users
- Helpful error messages
- Visual feedback for all actions

### Reliability
- 99.9% uptime for coupon system
- Graceful degradation if service unavailable
- Proper error handling and logging

## Success Metrics

### User Engagement
- % of orders using coupons
- Average discount per order
- Coupon application success rate

### Business Impact
- Revenue with vs. without coupons
- Customer acquisition cost reduction
- Repeat purchase rate for coupon users

### System Performance
- Coupon validation response time
- Error rate
- System availability

## Future Enhancements

### Phase 2 Features
- Referral coupons (share with friends)
- Loyalty points integration
- Stackable coupons (with rules)
- Auto-apply best coupon
- Coupon recommendations based on cart
- A/B testing for coupon effectiveness
- Bulk coupon generation
- Coupon categories/tags
- Advanced analytics dashboard

## Dependencies

### Technical
- Supabase database
- React Native app
- Admin web interface

### Business
- Pricing strategy approval
- Marketing team coordination
- Customer support training

## Timeline Estimate

### Phase 1 (MVP)
- Database schema: 1 day
- Backend validation logic: 2 days
- User checkout integration: 2 days
- Admin coupon management: 2 days
- Testing: 2 days
- **Total: ~9 days**

### Phase 2 (Enhancements)
- Advanced features: 5 days
- Analytics: 3 days
- **Total: ~8 days**

## Status
📋 **REQUIREMENTS DEFINED** - Ready for design phase
