// Product form validation utilities
import { Item } from '../types';

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  sku: string;
  selectedCategories: string[];
  images: { uri: string; isLocal: boolean }[];
  is_featured?: boolean;
  is_active?: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validates product form data and returns error messages for invalid fields
 * @param formData - The product form data to validate
 * @returns Object containing error messages for each invalid field
 */
export function validateProductForm(formData: ProductFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Product name is required';
  }

  // Validate description
  if (!formData.description || !formData.description.trim()) {
    errors.description = 'Description is required';
  }

  // Validate price
  const priceNum = parseFloat(formData.price);
  if (!formData.price || isNaN(priceNum)) {
    errors.price = 'Price is required';
  } else if (priceNum <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  // Validate stock
  const stockNum = parseInt(formData.stock_quantity);
  if (formData.stock_quantity === '' || isNaN(stockNum)) {
    errors.stock_quantity = 'Stock quantity is required';
  } else if (stockNum < 0) {
    errors.stock_quantity = 'Stock cannot be negative';
  }

  // Validate SKU
  if (!formData.sku || !formData.sku.trim()) {
    errors.sku = 'SKU is required';
  }

  // Validate categories
  if (!formData.selectedCategories || formData.selectedCategories.length === 0) {
    errors.categories = 'At least one category must be selected';
  }

  // Validate images
  if (!formData.images || formData.images.length === 0) {
    errors.images = 'At least one image is required';
  }

  return errors;
}

/**
 * Checks if the form has any validation errors
 * @param errors - Validation errors object
 * @returns True if there are any errors, false otherwise
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
