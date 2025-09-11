/**
 * @fileoverview Validation type definitions
 */

/**
 * @typedef {function(*): (boolean|string)} ValidationRule
 * A validation function that returns true if valid, or error message if invalid
 */

/**
 * @typedef {Object} ValidationSchema
 * @property {ValidationRule[]} [field] - Array of validation rules for each field
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {Object.<string, string[]>} errors - Validation errors by field
 */

/**
 * @typedef {Object} FormValidationRules
 * @property {boolean} [required] - Whether field is required
 * @property {number} [minLength] - Minimum length
 * @property {number} [maxLength] - Maximum length
 * @property {RegExp|string} [pattern] - Validation pattern
 * @property {string} [email] - Email validation
 * @property {string} [phone] - Phone validation
 * @property {number} [min] - Minimum value
 * @property {number} [max] - Maximum value
 * @property {string[]} [options] - Valid options for select/radio
 * @property {string} [customMessage] - Custom error message
 */

/**
 * @typedef {Object} FieldValidationError
 * @property {string} field - Field name
 * @property {string[]} messages - Error messages
 */

/**
 * @typedef {function(*, FormField): (boolean|string)} FormFieldValidator
 * A validation function for dynamic form fields
 */

export {}