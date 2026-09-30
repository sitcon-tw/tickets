const TWSMS_API_BASE = "https://api.twsms.com/json";
const KOT_SMS_API_BASE = process.env.KOT_SMS_API_BASE || "https://smsapi-sitcon.kot.gg";

import { SpanStatusCode, type Span } from "@opentelemetry/api";
import { TwSMSResponseSchema, type Locale, type SMSSendOptions, type SMSSendResult, type TwSMSStatusResponse } from "@sitcontix/types";
import { tracer } from "./tracing";

type SMSProvider = "twsms" | "kot";

function getSMSProvider(): SMSProvider {
	const provider = (process.env.SMS_PROVIDER || "twsms").toLowerCase();
	if (provider !== "twsms" && provider !== "kot") {
		throw new Error(`Unknown SMS_PROVIDER "${provider}". Use "twsms" or "kot".`);
	}
	return provider;
}

async function sendViaTwSMS(phoneNumber: string, message: string, options: SMSSendOptions, span: Span): Promise<SMSSendResult> {
	const username = process.env.TWSMS_USERNAME;
	const password = process.env.TWSMS_PASSWORD;

	if (!username || !password) {
		throw new Error("TWSMS credentials not configured. Please set TWSMS_USERNAME and TWSMS_PASSWORD environment variables.");
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

	return {
		success: true,
		msgid: data.msgid?.toString() || "",
		code: data.code,
		text: data.text
	};
}

async function sendViaKot(phoneNumber: string, message: string, span: Span): Promise<SMSSendResult> {
	const token = process.env.KOT_SMS_TOKEN;

	if (!token) {
		throw new Error("KOT SMS credentials not configured. Please set KOT_SMS_TOKEN environment variable.");
	}

	span.addEvent("kot.api.request");

	const response = await fetch(`${KOT_SMS_API_BASE}/send`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ phone: phoneNumber, text: message })
	});

	span.setAttribute("http.status_code", response.status);

	const body = await response.text();

	if (!response.ok) {
		span.addEvent("kot.api.error", {
			"error.code": String(response.status),
			"error.message": body.slice(0, 200)
		});
		throw new Error(`KOT SMS API Error: ${response.status} - ${body.slice(0, 200)}`);
	}

	let data: Record<string, unknown> = {};
	try {
		data = JSON.parse(body);
	} catch {
		// Response body is not JSON; a 2xx status is treated as success
	}

	const msgid = String(data.msgid ?? data.id ?? data.messageId ?? "");
	span.setAttribute("sms.msgid", msgid);

	return {
		success: true,
		msgid,
		code: String(response.status),
		text: typeof data.message === "string" ? data.message : "OK"
	};
}

export async function sendSMS(phoneNumber: string, message: string, options: SMSSendOptions = {}): Promise<SMSSendResult> {
	// Mask phone number for security (show only last 4 digits)
	const maskedPhone = phoneNumber.length > 4 ? `****${phoneNumber.slice(-4)}` : "****";

	const span = tracer.startSpan("sms.send", {
		attributes: {
			"sms.recipient.masked": maskedPhone,
			"sms.message.length": message.length
		}
	});

	try {
		const provider = getSMSProvider();
		span.setAttribute("sms.provider", provider);

		// Validate phone number format (Taiwan mobile: 09xxxxxxxx)
		if (!phoneNumber.match(/^09\d{8}$/) && !phoneNumber.match(/^\+\d{10,15}$/)) {
			throw new Error("Invalid phone number format. Use 09xxxxxxxx for Taiwan or +[country code][number] for international.");
		}

		const result = provider === "kot" ? await sendViaKot(phoneNumber, message, span) : await sendViaTwSMS(phoneNumber, message, options, span);

		span.setStatus({ code: SpanStatusCode.OK });

		return result;
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
			"zh-Hant": `[SITCONTIX] 您的驗證碼是：${code}\n此驗證碼將在 10 分鐘後過期。(${getSMSProvider() === "kot" ? "naf" : "twsms"})`,
			"zh-Hans": `[SITCONTIX] 您的验证码是：${code}\n此验证码将在 10 分钟后过期。(${getSMSProvider() === "kot" ? "naf" : "twsms"})`,
			en: `[SITCONTIX] Your verification code is: ${code}\nThis code will expire in 10 minutes. (${getSMSProvider() === "kot" ? "naf" : "twsms"})`
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
