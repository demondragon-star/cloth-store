// Validation utilities
import { VALIDATION_CONFIG } from '../constants/config';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    if (!VALIDATION_CONFIG.emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < VALIDATION_CONFIG.minPasswordLength) {
        return { isValid: false, error: `Password must be at least ${VALIDATION_CONFIG.minPasswordLength} characters` };
    }

    if (password.length > VALIDATION_CONFIG.maxPasswordLength) {
        return { isValid: false, error: `Password must be less than ${VALIDATION_CONFIG.maxPasswordLength} characters` };
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one special character' };
    }

    return { isValid: true };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true };
};

export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
    if (!name) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (name.length < VALIDATION_CONFIG.minNameLength) {
        return { isValid: false, error: `${fieldName} must be at least ${VALIDATION_CONFIG.minNameLength} characters` };
    }

    if (name.length > VALIDATION_CONFIG.maxNameLength) {
        return { isValid: false, error: `${fieldName} must be less than ${VALIDATION_CONFIG.maxNameLength} characters` };
    }

    return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
    if (!phone) {
        return { isValid: true }; // Phone is optional
    }

    if (!VALIDATION_CONFIG.phoneRegex.test(phone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
    }

    return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
    if (!value || !value.trim()) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
};

export const validatePincode = (pincode: string): ValidationResult => {
    if (!pincode) {
        return { isValid: false, error: 'PIN code is required' };
    }

    if (!/^\d{6}$/.test(pincode)) {
        return { isValid: false, error: 'Please enter a valid 6-digit PIN code' };
    }

    return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Remove HTML tags
        .trim();
};

/**
 * Validates if a string is a valid image URL
 * @param url - The URL string to validate
 * @returns ValidationResult indicating if the URL is valid
 */
export const validateImageUrl = (url: string): ValidationResult => {
    if (!url || !url.trim()) {
        return { isValid: false, error: 'Image URL is required' };
    }

    // Check if it's a valid URL format
    try {
        const urlObj = new URL(url);
        
        // Check if protocol is http or https
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return { isValid: false, error: 'Image URL must use HTTP or HTTPS protocol' };
        }
        
        return { isValid: true };
    } catch (e) {
        return { isValid: false, error: 'Invalid URL format' };
    }
};

/**
 * Checks if a URL is a valid image URL (simpler version for quick checks)
 * @param url - The URL string to check
 * @returns boolean indicating if the URL is valid
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return false;
    }

    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
};
