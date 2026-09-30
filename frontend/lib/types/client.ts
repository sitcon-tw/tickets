// API Client Types

export interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	retryableStatusCodes: Set<number>;
	timeoutMs: number;
}

export interface APIError {
	message?: string;
	detail?:
		| Array<{
				loc: Array<string | number>;
				msg: string;
				type: string;
		  }>
		| string;
	error?: {
		code?: string;
		message?: string;
		details?: unknown;
	};
	success?: boolean;
}

/** An error response from the API that carries the server's structured details (e.g. per-field validation codes). */
export class ApiResponseError extends Error {
	readonly code?: string;
	readonly details?: unknown;

	constructor(message: string, code?: string, details?: unknown) {
		super(message);
		this.name = "ApiResponseError";
		this.code = code;
		this.details = details;
	}
}
