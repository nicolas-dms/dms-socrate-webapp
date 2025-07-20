/**
 * Common validation utilities for form inputs
 */

export const validators = {
  /**
   * Validate email format using RFC 5322 compliant regex
   * @param email - Email string to validate
   * @returns boolean - true if valid email format
   */
  isValidEmail: (email: string): boolean => {
    // More comprehensive email regex that matches most common email formats
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  },

  /**
   * Check if email is not empty and properly formatted
   * @param email - Email string to validate
   * @returns object with isValid boolean and error message
   */
  validateEmail: (email: string): { isValid: boolean; error?: string } => {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!validators.isValidEmail(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate verification code format (6 digits)
   * @param code - Code string to validate
   * @returns boolean - true if valid code format
   */
  isValidVerificationCode: (code: string): boolean => {
    const codeRegex = /^[0-9]{6}$/;
    return codeRegex.test(code);
  },

  /**
   * Check if verification code is properly formatted
   * @param code - Code string to validate
   * @returns object with isValid boolean and error message
   */
  validateVerificationCode: (code: string): { isValid: boolean; error?: string } => {
    if (!code || code.trim() === '') {
      return { isValid: false, error: 'Verification code is required' };
    }
    
    if (!validators.isValidVerificationCode(code)) {
      return { isValid: false, error: 'Verification code must be 6 digits' };
    }
    
    return { isValid: true };
  }
};

export default validators;
