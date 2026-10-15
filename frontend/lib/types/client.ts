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

/** A non-2xx response from the API; `status` is the HTTP status code. */
export class HttpError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

/** An error response from the API that carries the server's structured details (e.g. per-field validation codes). */
export class ApiResponseError extends HttpError {
	readonly code?: string;
	readonly details?: unknown;

	constructor(message: string, status: number, code?: string, details?: unknown) {
		super(message, status);
		this.name = "ApiResponseError";
		this.code = code;
		this.details = details;
	}
}

/** Whether `error` is an API response with the given HTTP status. */
export function isHttpStatus(error: unknown, status: number): boolean {
	return error instanceof HttpError && error.status === status;
}
