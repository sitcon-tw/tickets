/**
 * TwSMS API response structure
 */
export interface TwSMSResponse {
	code: string;
	text: string;
	msgid?: string;
}

/**
 * SMS delivery status response
 */
export interface TwSMSStatusResponse {
	code: string;
	text: string;
	statuscode?: string;
	statustext?: string;
	donetime?: string;
}

/**
 * SMS send result
 */
export interface SMSSendResult {
	success: boolean;
	msgid: string;
	code: string;
	text: string;
}

/**
 * SMS send options
 */
export interface SMSSendOptions {
	[key: string]: string | number | undefined;
}

/**
 * Supported locales for verification codes
 */
export type Locale = "zh-Hant" | "zh-Hans" | "en";
