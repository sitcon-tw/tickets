/**
 * @fileoverview Input sanitization utilities to prevent XSS attacks
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (dirty: any): any => {
	if (typeof dirty !== "string") {
		return dirty;
	}
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
		ALLOWED_ATTR: ["href", "target"]
	});
};

/**
 * Sanitize plain text input by removing any HTML tags
 * @param dirty - Potentially unsafe text string
 * @returns Sanitized text string
 */
export const sanitizeText = (dirty: any): any => {
	if (typeof dirty !== "string") {
		return dirty;
	}
	return DOMPurify.sanitize(dirty, {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: []
	});
};

/**
 * Recursively sanitize an object's string values
 * @param obj - Object to sanitize
 * @param allowHtml - Whether to allow safe HTML tags
 * @returns Sanitized object
 */
export const sanitizeObject = <T = any>(obj: T, allowHtml: boolean = false): T => {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(item => sanitizeObject(item, allowHtml)) as T;
	}

	const sanitized: any = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			sanitized[key] = allowHtml ? sanitizeHtml(value) : sanitizeText(value);
		} else if (typeof value === "object" && value !== null) {
			sanitized[key] = sanitizeObject(value, allowHtml);
		} else {
			sanitized[key] = value;
		}
	}
	return sanitized as T;
};
