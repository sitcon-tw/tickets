const TWSMS_API_BASE = "https://api.twsms.com/json";

import { SpanStatusCode } from "@opentelemetry/api";
import { TwSMSResponseSchema, type Locale, type SMSSendOptions, type SMSSendResult, type TwSMSStatusResponse } from "@sitcontix/types";
import { tracer } from "./tracing";

export async function sendSMS(phoneNumber: string, message: string, options: SMSSendOptions = {}): Promise<SMSSendResult> {
	// Mask phone number for security (show only last 4 digits)
	const maskedPhone = phoneNumber.length > 4 ? `****${phoneNumber.slice(-4)}` : "****";

	const span = tracer.startSpan("sms.send", {
		attributes: {
			"sms.recipient.masked": maskedPhone,
			"sms.message.length": message.length,
			"sms.provider": "twsms"
		}
	});

	try {
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

		span.addEvent("twsms.api.request");

		const response = await fetch(`${TWSMS_API_BASE}/sms_send.php?${params.toString()}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});

		span.setAttribute("http.status_code", response.status);

		const data = TwSMSResponseSchema.parse(await response.json());

		span.setAttribute("sms.api.code", data.code);
		span.setAttribute("sms.msgid", data.msgid || "");

		if (data.code !== "00000") {
			span.addEvent("twsms.api.error", {
				"error.code": data.code,
				"error.message": data.text
			});
			throw new Error(`TwSMS API Error: ${data.code} - ${data.text}`);
		}

		span.setStatus({ code: SpanStatusCode.OK });

		return {
			success: true,
			msgid: data.msgid?.toString() || "",
			code: data.code,
			text: data.text
		};
	} catch (error) {
		span.recordException(error as Error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: "Failed to send SMS"
		});
		throw error;
	} finally {
		span.end();
	}
}

export async function querySMSStatus(phoneNumber: string, msgid: string): Promise<TwSMSStatusResponse> {
	// Mask phone number for security
	const maskedPhone = phoneNumber.length > 4 ? `****${phoneNumber.slice(-4)}` : "****";

	const span = tracer.startSpan("sms.query_status", {
		attributes: {
			"sms.recipient.masked": maskedPhone,
			"sms.msgid": msgid,
			"sms.provider": "twsms"
		}
	});

	try {
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

		span.addEvent("twsms.api.status_query");

		const response = await fetch(`${TWSMS_API_BASE}/sms_query.php?${params.toString()}`, {
			method: "GET"
		});

		span.setAttribute("http.status_code", response.status);

		const data = (await response.json()) as TwSMSStatusResponse;

		span.setAttribute("sms.api.code", data.code);
		span.setAttribute("sms.status.code", data.statuscode || "");
		span.setAttribute("sms.status.text", data.statustext || "");

		span.setStatus({ code: SpanStatusCode.OK });

		return {
			code: data.code,
			text: data.text,
			statuscode: data.statuscode,
			statustext: data.statustext,
			donetime: data.donetime
		};
	} catch (error) {
		span.recordException(error as Error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: "Failed to query SMS status"
		});
		throw error;
	} finally {
		span.end();
	}
}

export function generateVerificationCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string, code: string, locale: Locale = "zh-Hant"): Promise<SMSSendResult> {
	// Mask phone number for security
	const maskedPhone = phoneNumber.length > 4 ? `****${phoneNumber.slice(-4)}` : "****";

	const span = tracer.startSpan("sms.send_verification_code", {
		attributes: {
			"sms.recipient.masked": maskedPhone,
			"sms.type": "verification_code",
			"sms.locale": locale,
			"sms.code.length": code.length
		}
	});

	try {
		const messages: Record<Locale, string> = {
			"zh-Hant": `[SITCONTIX] 您的驗證碼是：${code}\n此驗證碼將在 10 分鐘後過期。(twsms)`,
			"zh-Hans": `[SITCONTIX] 您的验证码是：${code}\n此验证码将在 10 分钟后过期。(twsms)`,
			en: `[SITCONTIX] Your verification code is: ${code}\nThis code will expire in 10 minutes. (twsms)`
		};

		const message = messages[locale] || messages["zh-Hant"];

		const result = await sendSMS(phoneNumber, message, {
			expirytime: 600 // 10 minutes
		});

		span.setStatus({ code: SpanStatusCode.OK });

		return result;
	} catch (error) {
		span.recordException(error as Error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: "Failed to send verification code"
		});
		throw error;
	} finally {
		span.end();
	}
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
