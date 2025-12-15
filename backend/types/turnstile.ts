/**
 * Cloudflare Turnstile API response
 */
export interface TurnstileResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	"error-codes"?: string[];
	action?: string;
	cdata?: string;
	metadata?: {
		ephemeral_id?: string;
	};
}

/**
 * Turnstile validation options
 */
export interface TurnstileValidationOptions {
	remoteip?: string;
	idempotencyKey?: string;
	expectedAction?: string;
	expectedHostname?: string;
}

/**
 * Turnstile validation result
 */
export interface TurnstileValidationResult {
	valid: boolean;
	reason?: string;
	errors?: string[];
	expected?: string;
	received?: string;
	data?: TurnstileResponse;
	tokenAge?: number;
}
