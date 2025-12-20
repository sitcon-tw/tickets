const TWSMS_API_BASE = "https://api.twsms.com/json";

import type { Locale, SMSSendOptions, SMSSendResult, TwSMSResponse, TwSMSStatusResponse } from "../types/sms";

export async function sendSMS(phoneNumber: string, message: string, options: SMSSendOptions = {}): Promise<SMSSendResult> {
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
		...Object.fromEntries(Object.entries(options).map(([k, v]) => [k, String(v)]))
	});

	const response = await fetch(`${TWSMS_API_BASE}/sms_send.php?${params.toString()}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		}
	});

	const data = (await response.json()) as TwSMSResponse;

	if (data.code !== "00000") {
		throw new Error(`TwSMS API Error: ${data.code} - ${data.text}`);
	}

	return {
		success: true,
		msgid: data.msgid || "",
		code: data.code,
		text: data.text
	};
}

export async function querySMSStatus(phoneNumber: string, msgid: string): Promise<TwSMSStatusResponse> {
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

	const response = await fetch(`${TWSMS_API_BASE}/sms_query.php?${params.toString()}`, {
		method: "GET"
	});

	const data = (await response.json()) as TwSMSStatusResponse;

	return {
		code: data.code,
		text: data.text,
		statuscode: data.statuscode,
		statustext: data.statustext,
		donetime: data.donetime
	};
}

export function generateVerificationCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string, code: string, locale: Locale = "zh-Hant"): Promise<SMSSendResult> {
	const messages: Record<Locale, string> = {
		"zh-Hant": `[SITCONTIX] 您的驗證碼是：${code}\n此驗證碼將在 10 分鐘後過期。`,
		"zh-Hans": `[SITCONTIX] 您的验证码是：${code}\n此验证码将在 10 分钟后过期。`,
		en: `[SITCONTIX] Your verification code is: ${code}\nThis code will expire in 10 minutes.`
	};

	const message = messages[locale] || messages["zh-Hant"];

	return await sendSMS(phoneNumber, message, {
		expirytime: 600 // 10 minutes
	});
}

export const TWSMS_ERROR_CODES: Record<string, string> = {
	"00000": "Success",
	"00011": "Account error",
	"00012": "Password error",
	"00020": "Insufficient credits",
	"00041": "API not enabled",
	"00100": "Invalid phone number format",
	"00110": "No message content"
};

export const TWSMS_STATUS_CODES: Record<string, string> = {
	DELIVRD: "Successfully delivered",
	EXPIRED: "Message expired",
	UNDELIV: "Undeliverable",
	ACCEPTD: "Being received",
	REJECTD: "Rejected",
	REJERROR: "Blocked by keyword filter",
	REJMOBIL: "User opted out of advertising SMS"
};
