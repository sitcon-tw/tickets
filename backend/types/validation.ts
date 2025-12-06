/**
 * Validation type definitions
 */

/**
 * A validation function that returns true if valid, or error message if invalid
 */
export type ValidationRule = (value: any) => boolean | string;

export interface ValidationSchema {
	[field: string]: ValidationRule[];
}

export interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string[]>;
}

export interface FormValidationRules {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp | string;
	email?: string;
	phone?: string;
	min?: number;
	max?: number;
	options?: string[];
	customMessage?: string;
}

export interface FieldValidationError {
	field: string;
	messages: string[];
}
