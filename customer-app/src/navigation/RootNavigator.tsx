// Main navigation setup
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../constants/theme';
import { Badge } from '../components';
import { useAuthStore, useCartStore } from '../store';
import { useSupportBadge } from '../hooks/useSupportBadge';
import type { RootStackParamList, BottomTabParamList } from '../types';

// Import Screens
import {
    OnboardingScreen,
    LoginScreen,
    RegisterScreen,
    ForgotPasswordScreen,
    HomeScreen,
    CategoriesScreen,
    CartScreen,
    ProfileScreen,
    WishlistScreen,
    ItemDetailScreen,
    SearchScreen,
    CheckoutScreen,
    PaymentScreen,
    NotificationsScreen,
    OrderHistoryScreen,
    OrderDetailScreen,
    CategoryItemsScreen,
    EditProfileScreen,
    SettingsScreen,
    HelpScreen,
    AddressesScreen,
    AddAddressScreen,
    ChatScreen,
    WriteReviewScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Tab Navigator
const TabNavigator: React.FC = () => {
    const { itemCount } = useCartStore();
    const { unreadSupportCount } = useSupportBadge();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
                        case 'Categories': iconName = focused ? 'grid' : 'grid-outline'; break;
                        case 'Cart': iconName = focused ? 'cart' : 'cart-outline'; break;
                        case 'Orders': iconName = focused ? 'receipt' : 'receipt-outline'; break;
                        case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
                        default: iconName = 'ellipse-outline';
                    }

                    if (route.name === 'Cart') {
                        return (
                            <Badge count={itemCount} size="small">
                                <Ionicons name={iconName} size={size} color={color} />
                            </Badge>
                        );
                    }

                    if (route.name === 'Profile' && unreadSupportCount > 0) {
                        return (
                            <Badge count={unreadSupportCount} size="small">
                                <Ionicons name={iconName} size={size} color={color} />
                            </Badge>
                        );
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray[400],
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: FONT_WEIGHT.semibold,
                    marginTop: -2,
                    marginBottom: Platform.OS === 'ios' ? 0 : 4,
                },
                tabBarItemStyle: {
                    paddingTop: 6,
                },
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 84 : 62,
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 12,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Categories" component={CategoriesScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Orders" component={OrderHistoryScreen} options={{ title: 'Orders' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

// Auth Stack Navigator
const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
    );
};

// Root Navigator
export const RootNavigator: React.FC = () => {
    const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {/* AUTHENTICATION FLOW */}
                {!hasCompletedOnboarding ? (
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : !isAuthenticated ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    /* USER INTERFACE - Show shopping interface for regular users */
                    <>
                        {/* Main Tab Navigator */}
                        <Stack.Screen name="Main" component={TabNavigator} />

                        {/* Product Screens */}
                        <Stack.Screen
                            name="ItemDetail"
                            component={ItemDetailScreen}
                            options={{ animation: 'slide_from_bottom' }}
                        />
                        <Stack.Screen
                            name="Search"
                            component={SearchScreen}
                            options={{ animation: 'fade' }}
                        />
                        <Stack.Screen
                            name="CategoryItems"
                            component={CategoryItemsScreen}
                        />

                        {/* Checkout & Payment Screens */}
                        <Stack.Screen name="Checkout" component={CheckoutScreen} />
                        <Stack.Screen
                            name="Payment"
                            component={PaymentScreen as any}
                            options={{ animation: 'slide_from_bottom' }}
                        />

                        {/* Order Screens */}
                        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />

                        {/* Wishlist Screen */}
                        <Stack.Screen name="Wishlist" component={WishlistScreen} />

                        {/* Profile Screens */}
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Help" component={HelpScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
                        <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ animation: 'slide_from_bottom' }} />
                        <Stack.Screen name="Addresses" component={AddressesScreen} />
                        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
                        <Stack.Screen
                            name="EditAddress"
                            component={AddAddressScreen}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
