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
	};
	success?: boolean;
}
