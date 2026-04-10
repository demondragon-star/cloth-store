/**
 * Property-Based Tests for Admin Dashboard
 * Feature: admin-mobile-app-improvements
 * 
 * These tests verify the correctness properties of the dashboard data calculations
 * using property-based testing with fast-check.
 */

import * as fc from 'fast-check';

// Mock types matching the actual data structures
interface Order {
    id: string;
    order_number: string;
    total: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
    created_at: string;
    user?: {
        full_name?: string;
        email?: string;
    };
}

interface Product {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}

// Dashboard calculation functions (extracted from the component logic)
function calculateDashboardStats(orders: Order[], products: Product[]) {
    const totalOrders = orders.length;
    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
        .reduce((sum, order) => sum + order.total, 0);
    const totalProducts = products.length;

    return {
        totalOrders,
        totalRevenue,
        totalProducts,
    };
}

function getRecentOrders(orders: Order[], count: number = 5): Order[] {
    return orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, count);
}

function getLowStockProducts(products: Product[], threshold: number = 10): Product[] {
    return products.filter(p => p.stock_quantity < threshold);
}

// Arbitraries (generators) for property-based testing
const orderArbitrary = fc.record({
    id: fc.uuid(),
    order_number: fc.string({ minLength: 5, maxLength: 10 }),
    total: fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }),
    status: fc.constantFrom('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'),
    created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
    user: fc.option(fc.record({
        full_name: fc.option(fc.string({ minLength: 3, maxLength: 50 })),
        email: fc.option(fc.emailAddress()),
    }), { nil: undefined }),
}) as fc.Arbitrary<Order>;

const productArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 100 }),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
    stock_quantity: fc.integer({ min: 0, max: 1000 }),
}) as fc.Arbitrary<Product>;

describe('Admin Dashboard Property Tests', () => {
    // Feature: admin-mobile-app-improvements, Property 5: Dashboard Product Count Accuracy
    // **Validates: Requirements 4.1**
    describe('Property 5: Dashboard Product Count Accuracy', () => {
        test('total product count should equal the actual number of products', () => {
            fc.assert(
                fc.property(
                    fc.array(productArbitrary, { minLength: 0, maxLength: 100 }),
                    (products) => {
                        const stats = calculateDashboardStats([], products);
                        expect(stats.totalProducts).toBe(products.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('product count should be 0 for empty product list', () => {
            const stats = calculateDashboardStats([], []);
            expect(stats.totalProducts).toBe(0);
        });

        test('product count should be consistent regardless of product properties', () => {
            fc.assert(
                fc.property(
                    fc.array(productArbitrary, { minLength: 1, maxLength: 50 }),
                    (products) => {
                        const stats1 = calculateDashboardStats([], products);
                        const stats2 = calculateDashboardStats([], products);
                        expect(stats1.totalProducts).toBe(stats2.totalProducts);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // Feature: admin-mobile-app-improvements, Property 6: Dashboard Order Count and Revenue Accuracy
    // **Validates: Requirements 4.1**
    describe('Property 6: Dashboard Order Count and Revenue Accuracy', () => {
        test('total order count should equal the actual number of orders', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 0, maxLength: 100 }),
                    (orders) => {
                        const stats = calculateDashboardStats(orders, []);
                        expect(stats.totalOrders).toBe(orders.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('total revenue should equal sum of non-cancelled/refunded order totals', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 0, maxLength: 100 }),
                    (orders) => {
                        const stats = calculateDashboardStats(orders, []);
                        const expectedRevenue = orders
                            .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
                            .reduce((sum, order) => sum + order.total, 0);
                        
                        // Use toBeCloseTo for floating point comparison
                        expect(stats.totalRevenue).toBeCloseTo(expectedRevenue, 2);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('revenue should be 0 when all orders are cancelled or refunded', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 1, maxLength: 20 }),
                    (orders) => {
                        const cancelledOrders: Order[] = orders.map((o, index) => ({
                            ...o,
                            status: (index % 2 === 0 ? 'cancelled' : 'refunded') as Order['status'],
                        }));
                        const stats = calculateDashboardStats(cancelledOrders, []);
                        expect(stats.totalRevenue).toBe(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('revenue should never be negative', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 0, maxLength: 100 }),
                    (orders) => {
                        const stats = calculateDashboardStats(orders, []);
                        expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // Feature: admin-mobile-app-improvements, Property 7: Recent Orders Sorting
    // **Validates: Requirements 4.2**
    describe('Property 7: Recent Orders Sorting', () => {
        test('recent orders should be sorted by created_at in descending order', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 2, maxLength: 50 }),
                    (orders) => {
                        const recentOrders = getRecentOrders(orders, 5);
                        
                        // Check that orders are sorted in descending order
                        for (let i = 0; i < recentOrders.length - 1; i++) {
                            const current = new Date(recentOrders[i].created_at).getTime();
                            const next = new Date(recentOrders[i + 1].created_at).getTime();
                            expect(current).toBeGreaterThanOrEqual(next);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('recent orders should contain at most 5 orders', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 0, maxLength: 100 }),
                    (orders) => {
                        const recentOrders = getRecentOrders(orders, 5);
                        expect(recentOrders.length).toBeLessThanOrEqual(5);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('recent orders should contain all orders when total is less than 5', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 0, maxLength: 4 }),
                    (orders) => {
                        const recentOrders = getRecentOrders(orders, 5);
                        expect(recentOrders.length).toBe(orders.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('recent orders should contain exactly 5 orders when total is greater than 5', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 6, maxLength: 100 }),
                    (orders) => {
                        const recentOrders = getRecentOrders(orders, 5);
                        expect(recentOrders.length).toBe(5);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('most recent order should have the latest created_at timestamp', () => {
            fc.assert(
                fc.property(
                    fc.array(orderArbitrary, { minLength: 1, maxLength: 50 }),
                    (orders) => {
                        const recentOrders = getRecentOrders(orders, 5);
                        if (recentOrders.length > 0) {
                            const mostRecentTimestamp = new Date(recentOrders[0].created_at).getTime();
                            const maxTimestamp = Math.max(...orders.map(o => new Date(o.created_at).getTime()));
                            expect(mostRecentTimestamp).toBe(maxTimestamp);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // Feature: admin-mobile-app-improvements, Property 8: Low Stock Product Filtering
    // **Validates: Requirements 4.3**
    describe('Property 8: Low Stock Product Filtering', () => {
        test('low stock products should only include products with stock < 10', () => {
            fc.assert(
                fc.property(
                    fc.array(productArbitrary, { minLength: 0, maxLength: 100 }),
                    (products) => {
                        const lowStock = getLowStockProducts(products, 10);
                        
                        // All returned products should have stock < 10
                        lowStock.forEach(product => {
                            expect(product.stock_quantity).toBeLessThan(10);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('low stock products should include all products with stock < 10', () => {
            fc.assert(
                fc.property(
                    fc.array(productArbitrary, { minLength: 0, maxLength: 100 }),
                    (products) => {
                        const lowStock = getLowStockProducts(products, 10);
                        const expectedLowStock = products.filter(p => p.stock_quantity < 10);
                        
                        expect(lowStock.length).toBe(expectedLowStock.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('low stock products should be empty when all products have stock >= 10', () => {
            fc.assert(
                fc.property(
                    fc.array(productArbitrary, { minLength: 1, maxLength: 50 }),
                    (products) => {
                        const wellStockedProducts = products.map(p => ({
                            ...p,
                            stock_quantity: p.stock_quantity + 10, // Ensure all have stock >= 10
                        }));
                        const lowStock = getLowStockProducts(wellStockedProducts, 10);
                        expect(lowStock.length).toBe(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('products with stock = 0 should be included in low stock', () => {
            fc.assert(
                fc.property(
                    fc.array(productArbitrary, { minLength: 1, maxLength: 20 }),
                    (products) => {
                        const productsWithZeroStock = products.map(p => ({
                            ...p,
                            stock_quantity: 0,
                        }));
                        const lowStock = getLowStockProducts(productsWithZeroStock, 10);
                        expect(lowStock.length).toBe(productsWithZeroStock.length);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('products with stock = 9 should be included in low stock', () => {
            const product: Product = {
                id: '123',
                name: 'Test Product',
                price: 10,
                stock_quantity: 9,
            };
            const lowStock = getLowStockProducts([product], 10);
            expect(lowStock).toContainEqual(product);
        });

        test('products with stock = 10 should NOT be included in low stock', () => {
            const product: Product = {
                id: '123',
                name: 'Test Product',
                price: 10,
                stock_quantity: 10,
            };
            const lowStock = getLowStockProducts([product], 10);
            expect(lowStock).not.toContainEqual(product);
        });
    });
});
