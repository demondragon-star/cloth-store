/**
 * Error Handler Utility
 * Provides user-friendly error messages and logging
 */

export interface ErrorInfo {
    title: string;
    message: string;
    isRecoverable: boolean;
    action?: string;
}

/**
 * Converts technical errors into user-friendly messages
 * @param error - The error object or message
 * @returns User-friendly error information
 */
export function getUserFriendlyError(error: any): ErrorInfo {
    const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
    
    // Rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        return {
            title: 'Too Many Requests',
            message: 'Please wait a moment and try again. The app is temporarily limiting requests.',
            isRecoverable: true,
            action: 'Wait and retry',
        };
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Please check your internet connection and try again.',
            isRecoverable: true,
            action: 'Check connection',
        };
    }
    
    // Authentication errors
    if (errorMessage.includes('Invalid login credentials')) {
        return {
            title: 'Login Failed',
            message: 'The email or password you entered is incorrect.',
            isRecoverable: true,
            action: 'Try again',
        };
    }
    
    if (errorMessage.includes('Email not confirmed')) {
        return {
            title: 'Email Not Verified',
            message: 'Please check your email and verify your account before logging in.',
            isRecoverable: true,
            action: 'Check email',
        };
    }
    
    // Session errors
    if (errorMessage.includes('session') || errorMessage.includes('token')) {
        return {
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            isRecoverable: true,
            action: 'Log in again',
        };
    }
    
    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        return {
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            isRecoverable: false,
            action: 'Contact support',
        };
    }
    
    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return {
            title: 'Invalid Input',
            message: 'Please check your input and try again.',
            isRecoverable: true,
            action: 'Fix input',
        };
    }
    
    // Default error
    return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again later.',
        isRecoverable: true,
        action: 'Try again',
    };
}

/**
 * Logs errors with context for debugging
 * @param context - Where the error occurred
 * @param error - The error object
 * @param additionalInfo - Any additional context
 */
export function logError(
    context: string,
    error: any,
    additionalInfo?: Record<string, any>
) {
    const timestamp = new Date().toISOString();
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    console.error(`[${timestamp}] Error in ${context}:`, {
        message: errorMessage,
        error,
        ...additionalInfo,
    });
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, Bugsnag, etc.
}

/**
 * Checks if an error is a rate limit error
 * @param error - The error to check
 * @returns True if it's a rate limit error
 */
export function isRateLimitError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        error?.status === 429
    );
}

/**
 * Checks if an error is a network error
 * @param error - The error to check
 * @returns True if it's a network error
 */
export function isNetworkError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('connection') ||
        error?.code === 'NETWORK_ERROR'
    );
}
