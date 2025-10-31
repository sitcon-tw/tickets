/**
 * TwSMS (Taiwan SMS) API Integration
 * API Documentation: https://api.twsms.com/
 */

const TWSMS_API_BASE = "https://api.twsms.com/json";

/**
 * Send SMS using TwSMS API
 * @param {string} phoneNumber - Phone number (09xxxxxxxx for Taiwan, country code + number for international)
 * @param {string} message - SMS content (UTF8 or BIG5 encoding)
 * @param {object} options - Optional parameters
 * @returns {Promise<object>} API response
 */
export async function sendSMS(phoneNumber, message, options = {}) {
	const username = process.env.TWSMS_USERNAME;
	const password = process.env.TWSMS_PASSWORD;

	if (!username || !password) {
		throw new Error("TWSMS credentials not configured. Please set TWSMS_USERNAME and TWSMS_PASSWORD environment variables.");
	}

	// Validate phone number format (Taiwan mobile: 09xxxxxxxx)
	if (!phoneNumber.match(/^09\d{8}$/) && !phoneNumber.match(/^\+\d{10,15}$/)) {
		throw new Error("Invalid phone number format. Use 09xxxxxxxx for Taiwan or +[country code][number] for international.");
	}

	const params = new URLSearchParams({
		username,
		password,
		mobile: phoneNumber,
		message: message,
		...options
	});

	try {
		const response = await fetch(`${TWSMS_API_BASE}/sms_send.php?${params.toString()}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});

		const data = await response.json();

		// Check for errors
		if (data.code !== "00000") {
			throw new Error(`TwSMS API Error: ${data.code} - ${data.text}`);
		}

		return {
			success: true,
			msgid: data.msgid,
			code: data.code,
			text: data.text
		};
	} catch (error) {
		console.error("Failed to send SMS:", error);
		throw error;
	}
}

/**
 * Query SMS delivery status
 * @param {string} phoneNumber - Phone number used when sending
 * @param {string} msgid - Message ID from send API
 * @returns {Promise<object>} Delivery status
 */
export async function querySMSStatus(phoneNumber, msgid) {
	const username = process.env.TWSMS_USERNAME;
	const password = process.env.TWSMS_PASSWORD;

	if (!username || !password) {
		throw new Error("TWSMS credentials not configured");
	}

	const params = new URLSearchParams({
		username,
		password,
		mobile: phoneNumber,
		msgid
	});

	try {
		const response = await fetch(`${TWSMS_API_BASE}/sms_query.php?${params.toString()}`, {
			method: "GET"
		});

		const data = await response.json();

		return {
			code: data.code,
			text: data.text,
			statuscode: data.statuscode,
			statustext: data.statustext,
			donetime: data.donetime
		};
	} catch (error) {
		console.error("Failed to query SMS status:", error);
		throw error;
	}
}

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
export function generateVerificationCode() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send a verification code via SMS
 * @param {string} phoneNumber - Phone number to send to
 * @param {string} code - Verification code
 * @param {string} locale - Language locale (zh-Hant, zh-Hans, en)
 * @returns {Promise<object>} API response
 */
export async function sendVerificationCode(phoneNumber, code, locale = "zh-Hant") {
	const messages = {
		"zh-Hant": `[SITCON] 您的驗證碼是：${code}\n此驗證碼將在 10 分鐘後過期。(twsms)`,
		"zh-Hans": `[SITCON] 您的验证码是：${code}\n此验证码将在 10 分钟后过期。(twsms)`,
		en: `[SITCON] Your verification code is: ${code}\nThis code will expire in 10 minutes. (twsms)`
	};

	const message = messages[locale] || messages["zh-Hant"];

	return await sendSMS(phoneNumber, message, {
		expirytime: 600 // 10 minutes
	});
}

/**
 * Error codes reference for TwSMS API
 */
export const TWSMS_ERROR_CODES = {
	"00000": "Success",
	"00011": "Account error",
	"00012": "Password error",
	"00020": "Insufficient credits",
	"00041": "API not enabled",
	"00100": "Invalid phone number format",
	"00110": "No message content"
};

/**
 * Delivery status codes
 */
export const TWSMS_STATUS_CODES = {
	DELIVRD: "Successfully delivered",
	EXPIRED: "Message expired",
	UNDELIV: "Undeliverable",
	ACCEPTD: "Being received",
	REJECTD: "Rejected",
	REJERROR: "Blocked by keyword filter",
	REJMOBIL: "User opted out of advertising SMS"
};
