import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Badge } from '../components';
import { supabase } from '../services/supabase';

import {
    AdminDashboardScreen,
    AdminOrdersScreen,
    AdminProductsScreen,
    AdminSettingsScreen,
    AdminOrderDetailsScreen,
    AdminProductDetailsScreen,
    AdminNotificationsScreen,
    ImageEditorScreen
} from '../screens/admin';
import { AdminCouponsScreen } from '../screens/admin/AdminCouponsScreen';
import { AdminCouponDetailsScreen } from '../screens/admin/AdminCouponDetailsScreen';
import { AdminSupportScreen } from '../screens/admin/AdminSupportScreen';
import { AdminChatScreen } from '../screens/admin/AdminChatScreen';

// --- Types ---
export type AdminProductsStackParamList = {
    AdminProductsList: undefined;
    AdminProductDetails: { productId?: string };
    ImageEditor: { imageUri: string; onComplete: (processedUri: string) => void };
};

export type AdminOrdersStackParamList = {
    AdminOrdersList: undefined;
    AdminOrderDetails: { orderId: string };
    AdminChat: { chatId: string; userName: string };
};

export type AdminSupportStackParamList = {
    AdminSupport: undefined;
    AdminChat: { chatId: string; userName: string };
};

export type AdminCouponsStackParamList = {
    AdminCouponsList: undefined;
    AdminCouponDetails: { couponId: string };
};

export type AdminTabParamList = {
    Dashboard: undefined;
    ProductsTab: undefined;
    OrdersTab: undefined;
    CouponsTab: undefined;
    Settings: undefined;
    Notifications: undefined;
    SupportTab: undefined;
};

// --- Product Stack ---
const ProductsStack = createNativeStackNavigator<AdminProductsStackParamList>();
const ProductsStackNavigator = () => (
    <ProductsStack.Navigator 
        screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
        }}
    >
        <ProductsStack.Screen 
            name="AdminProductsList" 
            component={AdminProductsScreen}
        />
        <ProductsStack.Screen 
            name="AdminProductDetails" 
            component={AdminProductDetailsScreen}
        />
        <ProductsStack.Screen 
            name="ImageEditor" 
            component={ImageEditorScreen as any}
            options={{ presentation: 'fullScreenModal' }}
        />
    </ProductsStack.Navigator>
);

// --- Orders Stack ---
const OrdersStack = createNativeStackNavigator<AdminOrdersStackParamList>();
const OrdersStackNavigator = () => (
    <OrdersStack.Navigator 
        screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
        }}
    >
        <OrdersStack.Screen 
            name="AdminOrdersList" 
            component={AdminOrdersScreen}
        />
        <OrdersStack.Screen 
            name="AdminOrderDetails" 
            component={AdminOrderDetailsScreen}
        />
    </OrdersStack.Navigator>
);

// --- Coupons Stack ---
const CouponsStack = createNativeStackNavigator<AdminCouponsStackParamList>();
const CouponsStackNavigator = () => (
    <CouponsStack.Navigator 
        screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
        }}
    >
        <CouponsStack.Screen 
            name="AdminCouponsList" 
            component={AdminCouponsScreen}
        />
        <CouponsStack.Screen 
            name="AdminCouponDetails" 
            component={AdminCouponDetailsScreen}
        />
    </CouponsStack.Navigator>
);

// --- Support Stack ---
const SupportStack = createNativeStackNavigator<AdminSupportStackParamList>();
const SupportStackNavigator = () => (
    <SupportStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <SupportStack.Screen name="AdminSupport" component={AdminSupportScreen} />
        <SupportStack.Screen name="AdminChat" component={AdminChatScreen} />
    </SupportStack.Navigator>
);

// --- Bottom Tab Navigator ---
const Tab = createBottomTabNavigator<AdminTabParamList>();

// Custom Tab Bar Icon with glow effect
const TabIcon = ({ name, focused, color }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {focused && (
            <View style={[tabStyles.activeGlow, { backgroundColor: color + '20' }]} />
        )}
        <Ionicons name={name} size={22} color={color} />
        {focused && <View style={[tabStyles.activeDot, { backgroundColor: color }]} />}
    </View>
);

const tabStyles = StyleSheet.create({
    activeGlow: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    },
});

// Hook to get pending and confirmed order counts via Realtime
const useOrderCounts = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [confirmedCount, setConfirmedCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Fetch initial pending count
                const { count: pending } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');
                
                // Fetch initial confirmed (to dispatch) count
                const { count: confirmed } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'confirmed');
                
                setPendingCount(pending || 0);
                setConfirmedCount(confirmed || 0);
            } catch (error) {
                console.error('Error fetching order counts:', error);
            }
        };

        fetchCounts();

        // Subscribe to changes in the orders table
        const subscription = supabase
            .channel('orders-badge-count')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    // Refetch counts on any change to orders
                    fetchCounts();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { pendingCount, confirmedCount };
};

export const AdminNavigator: React.FC = () => {
    const { pendingCount: pendingOrderCount } = useOrderCounts();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case 'Dashboard':
                            iconName = focused ? 'grid' : 'grid-outline';
                            break;
                        case 'ProductsTab':
                            iconName = focused ? 'cube' : 'cube-outline';
                            break;
                        case 'OrdersTab':
                            iconName = focused ? 'cart' : 'cart-outline';
                            break;
                        case 'CouponsTab':
                            iconName = focused ? 'pricetag' : 'pricetag-outline';
                            break;
                        case 'SupportTab':
                            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                            break;
                        case 'Settings':
                            iconName = focused ? 'settings' : 'settings-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                    }

                    if (route.name === 'OrdersTab' && pendingOrderCount > 0) {
                        return (
                            <Badge count={pendingOrderCount} size="small">
                                <TabIcon name={iconName} focused={focused} color={color} />
                            </Badge>
                        );
                    }

                    return <TabIcon name={iconName} focused={focused} color={color} />;
                },
                tabBarActiveTintColor: '#8B5CF6',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: FONT_WEIGHT.semibold,
                    marginTop: -2,
                },
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    backgroundColor: 'rgba(15,15,20,0.95)',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.06)',
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    elevation: 20,
                    display: ['ImageEditor', 'AdminChat', 'AdminProductDetails', 'AdminOrderDetails', 'AdminCouponDetails'].includes(getFocusedRouteNameFromRoute(route) as string) ? 'none' : 'flex'
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ),
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={AdminDashboardScreen}
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="ProductsTab"
                component={ProductsStackNavigator}
                options={{
                    title: 'Products',
                    tabBarLabel: 'Products',
                }}
            />
            <Tab.Screen
                name="OrdersTab"
                component={OrdersStackNavigator}
                options={{
                    title: 'Orders',
                    tabBarLabel: 'Orders',
                    tabBarBadge: pendingOrderCount > 0 ? pendingOrderCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#EF4444',
                        fontSize: 10,
                        fontWeight: FONT_WEIGHT.bold,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                    },
                }}
            />
            <Tab.Screen
                name="CouponsTab"
                component={CouponsStackNavigator}
                options={{
                    title: 'Coupons',
                    tabBarLabel: 'Coupons',
                }}
            />
            <Tab.Screen
                name="SupportTab"
                component={SupportStackNavigator}
                options={{
                    title: 'Support',
                    tabBarLabel: 'Support',
                }}
            />
            <Tab.Screen
                name="Settings"
                component={AdminSettingsScreen}
                options={{
                    title: 'Settings',
                    tabBarLabel: 'Settings',
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={AdminNotificationsScreen}
                options={{
                    title: 'Send Notifications',
                    tabBarLabel: 'Notifications',
                    tabBarButton: () => null,
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
};
