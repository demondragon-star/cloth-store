// Main navigation setup
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store';
import { AdminNavigator } from './AdminNavigator';

// Import Screens
import {
    OnboardingScreen,
    LoginScreen,
    RegisterScreen,
    ForgotPasswordScreen,
} from '../screens';

const Stack = createNativeStackNavigator();

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
    const { isAuthenticated, hasCompletedOnboarding, profile, user } = useAuthStore();
    
    // Safety check - force admin role for this app
    const isAdmin = profile?.is_admin || profile?.role === 'owner' || profile?.role === 'admin' || user?.is_admin;

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
                ) : isAdmin ? (
                    /* ADMIN INTERFACE */
                    <Stack.Screen name="Admin" component={AdminNavigator} />
                ) : (
                    // Fallback if somehow a non-admin gets in here - send back to Auth to logout or show error
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
