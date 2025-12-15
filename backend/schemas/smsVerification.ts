/**
 * SMS Verification schemas for Fastify routes
 */

export const smsVerificationSchemas = {
	send: {
		description: "發送簡訊驗證碼",
		tags: ["sms-verification"],
		body: {
			type: "object",
			required: ["phoneNumber", "turnstileToken"],
			properties: {
				phoneNumber: {
					type: "string",
					pattern: "^09\\d{8}$",
					description: "Taiwan phone number (09xxxxxxxx)"
				},
				locale: {
					type: "string",
					enum: ["zh-Hant", "zh-Hans", "en"],
					description: "Preferred locale for SMS message"
				},
				turnstileToken: {
					type: "string",
					description: "Cloudflare Turnstile verification token"
				}
			}
		}
	},

	verify: {
		description: "驗證簡訊驗證碼",
		tags: ["sms-verification"],
		body: {
			type: "object",
			required: ["phoneNumber", "code"],
			properties: {
				phoneNumber: {
					type: "string",
					pattern: "^09\\d{8}$",
					description: "Taiwan phone number (09xxxxxxxx)"
				},
				code: {
					type: "string",
					pattern: "^\\d{6}$",
					description: "6-digit verification code"
				}
			}
		}
	},

	status: {
		description: "取得用戶的手機驗證狀態",
		tags: ["sms-verification"]
	}
} as const;
