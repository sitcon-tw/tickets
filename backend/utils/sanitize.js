/**
 * @fileoverview Input sanitization utilities to prevent XSS attacks
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML string
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHtml = dirty => {
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
 * @param {string} dirty - Potentially unsafe text string
 * @returns {string} - Sanitized text string
 */
export const sanitizeText = dirty => {
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
 * @param {Object} obj - Object to sanitize
 * @param {boolean} allowHtml - Whether to allow safe HTML tags
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (obj, allowHtml = false) => {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(item => sanitizeObject(item, allowHtml));
	}

	const sanitized = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			sanitized[key] = allowHtml ? sanitizeHtml(value) : sanitizeText(value);
		} else if (typeof value === "object" && value !== null) {
			sanitized[key] = sanitizeObject(value, allowHtml);
		} else {
			sanitized[key] = value;
		}
	}
	return sanitized;
};
