import prisma from "#config/database.js";
import fs from "fs/promises";
import { MailtrapClient } from "mailtrap";

import path from "path";
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const client = new MailtrapClient({
	token: process.env.MAILTRAP_TOKEN
});

export const sendRegistrationConfirmation = async (registration, event, qrCodeUrl) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};

		const recipients = [
			{
				email: registration.email
			}
		];

		// Load and render template using JS string replacement
		const templatePath = path.join(__dirname, "../email-templates/registration-confirmation.html");
		let template = await fs.readFile(templatePath, "utf-8");
		let html = template
			.replace(/\{\{eventName\}\}/g, event.name)
			.replace(/\{\{eventStartDate\}\}/g, new Date(event.startDate).toLocaleDateString("zh-TW"))
			.replace(/\{\{eventEndDate\}\}/g, new Date(event.endDate).toLocaleDateString("zh-TW"))
			.replace(/\{\{eventLocation\}\}/g, event.location || "待公布 TBA")
			.replace(/\{\{registrationId\}\}/g, registration.id)
			.replace(/\{\{referralCode\}\}/g, registration.referralCode || "")
			.replace(/\{\{qrCodeUrl\}\}/g, qrCodeUrl || "");

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${event.name}】報名確認 Registration Confirmation`,
			html
		});
		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		return false;
	}
};

export const sendEditLink = async (email, editToken, event) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};

		const recipients = [
			{
				email: email
			}
		];

		const editUrl = `${process.env.FRONTEND_URI || "http://localhost:4321"}/edit/${editToken}`;

		// Load and render template using JS string replacement
		const templatePath = path.join(__dirname, "../email-templates/edit-link.html");
		let template = await fs.readFile(templatePath, "utf-8");
		let html = template.replace(/\{\{eventName\}\}/g, event.name).replace(/\{\{editUrl\}\}/g, editUrl);

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${event.name}】報名資料編輯連結 Registration Edit Link`,
			html
		});
		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		return false;
	}
};

export const sendMagicLink = async (email, magicLink) => {
	try {
		// Validate inputs
		if (!email || typeof email !== "string" || !email.includes("@")) {
			throw new Error("Invalid email address");
		}
		if (!magicLink || typeof magicLink !== "string") {
			throw new Error("Invalid magic link");
		}
		if (!process.env.MAILTRAP_TOKEN) {
			throw new Error("MAILTRAP_TOKEN is not configured");
		}
		if (!process.env.MAILTRAP_SENDER_EMAIL) {
			throw new Error("MAILTRAP_SENDER_EMAIL is not configured");
		}
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};
		const recipients = [
			{
				email: email
			}
		];
		// Load and render template using JS string replacement
		const templatePath = path.join(__dirname, "../email-templates/magic-link.html");
		let template = await fs.readFile(templatePath, "utf-8");
		let html = template.replace(/\{\{magicLink\}\}/g, magicLink).replace(/\{\{email\}\}/g, email);
		await client.send({
			from: sender,
			to: recipients,
			subject: `【SITCONTIX】登入連結 Login Link`,
			html
		});
		// Log successful email send
		console.log(`Magic link email sent successfully to ${email}`);
		return true;
	} catch (error) {
		// Enhanced error logging with more context
		console.error("Email sending error:", {
			email,
			errorMessage: error.message,
			errorCode: error.code,
			errorName: error.name,
			stack: error.stack
		});
		throw new Error(`Failed to send magic link email: ${error.message}`);
	}
};
/**
 * Calculate recipients based on target audience filters
 */
export const calculateRecipients = async targetAudience => {
	try {
		const where = {};

		// Parse targetAudience if it's a string
		const filters = typeof targetAudience === "string" ? JSON.parse(targetAudience) : targetAudience;

		if (!filters) {
			// If no filters, return all registrations
			const allRegistrations = await prisma.registration.findMany({
				where: { status: "confirmed" },
				select: { email: true, id: true, formData: true },
				distinct: ["email"]
			});
			return allRegistrations;
		}

		// Event filter
		if (filters.eventIds && filters.eventIds.length > 0) {
			where.eventId = { in: filters.eventIds };
		}

		// Ticket filter
		if (filters.ticketIds && filters.ticketIds.length > 0) {
			where.ticketId = { in: filters.ticketIds };
		}

		// Registration status filter
		if (filters.registrationStatuses && filters.registrationStatuses.length > 0) {
			where.status = { in: filters.registrationStatuses };
		} else {
			// Default to confirmed registrations only
			where.status = "confirmed";
		}

		// Referral filters
		if (filters.hasReferrals !== undefined) {
			if (filters.hasReferrals) {
				where.referredBy = { not: null };
			} else {
				where.referredBy = null;
			}
		}

		// Date range filters
		if (filters.registeredAfter) {
			where.createdAt = { ...where.createdAt, gte: new Date(filters.registeredAfter) };
		}
		if (filters.registeredBefore) {
			where.createdAt = { ...where.createdAt, lte: new Date(filters.registeredBefore) };
		}

		// Get initial registrations
		let registrations = await prisma.registration.findMany({
			where,
			include: {
				user: { select: { email: true, role: true } },
				event: true,
				ticket: true
			}
		});

		// Filter by email domains
		if (filters.emailDomains && filters.emailDomains.length > 0) {
			registrations = registrations.filter(r => {
				const emailDomain = r.email.split("@")[1];
				return filters.emailDomains.includes(emailDomain);
			});
		}

		// Filter by user roles
		if (filters.roles && filters.roles.length > 0) {
			registrations = registrations.filter(r => r.user && filters.roles.includes(r.user.role));
		}

		// Filter by isReferrer
		if (filters.isReferrer !== undefined) {
			const referrerIds = await prisma.referral.findMany({
				select: { registrationId: true }
			});
			const referrerIdSet = new Set(referrerIds.map(r => r.registrationId));

			registrations = registrations.filter(r => (filters.isReferrer ? referrerIdSet.has(r.id) : !referrerIdSet.has(r.id)));
		}

		// Deduplicate by email and return
		const uniqueEmails = new Map();
		registrations.forEach(r => {
			if (!uniqueEmails.has(r.email)) {
				uniqueEmails.set(r.email, {
					email: r.email,
					id: r.id,
					formData: r.formData,
					event: r.event,
					ticket: r.ticket
				});
			}
		});

		return Array.from(uniqueEmails.values());
	} catch (error) {
		console.error("Error calculating recipients:", error);
		throw error;
	}
};

/**
 * Replace template variables in email content
 */
const replaceTemplateVariables = (content, data) => {
	let result = content;

	// Parse formData if it's a string
	const formData = typeof data.formData === "string" ? JSON.parse(data.formData) : data.formData || {};

	// Replace common variables
	result = result.replace(/\{\{email\}\}/g, data.email || "");
	result = result.replace(/\{\{name\}\}/g, formData.name || "");
	result = result.replace(/\{\{eventName\}\}/g, data.event?.name || "");
	result = result.replace(/\{\{ticketName\}\}/g, data.ticket?.name || "");
	result = result.replace(/\{\{registrationId\}\}/g, data.id || "");

	return result;
};

/**
 * Send campaign email to recipients
 */
export const sendCampaignEmail = async (campaign, recipients) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};

		let sentCount = 0;
		let failedCount = 0;

		// Send emails in batches to avoid rate limits
		const batchSize = 10;
		for (let i = 0; i < recipients.length; i += batchSize) {
			const batch = recipients.slice(i, i + batchSize);

			const promises = batch.map(async recipient => {
				try {
					const personalizedContent = replaceTemplateVariables(campaign.content, recipient);

					await client.send({
						from: sender,
						to: [{ email: recipient.email }],
						subject: campaign.subject,
						html: personalizedContent
					});

					sentCount++;
					return { success: true, email: recipient.email };
				} catch (error) {
					console.error(`Failed to send to ${recipient.email}:`, error);
					failedCount++;
					return { success: false, email: recipient.email, error: error.message };
				}
			});

			await Promise.all(promises);

			// Small delay between batches to respect rate limits
			if (i + batchSize < recipients.length) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}

		return {
			success: true,
			sentCount,
			failedCount,
			totalRecipients: recipients.length
		};
	} catch (error) {
		console.error("Campaign email sending error:", error);
		throw error;
	}
};

/**
 * Send invitation codes via email
 */
export const sendInvitationCodes = async (email, codes, groupName) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};

		const recipients = [
			{
				email: email
			}
		];

		const codesHtml = codes.map(code => `<li style="font-family: monospace; font-size: 16px; padding: 8px; background-color: #f8f9fa; margin: 5px 0; border-radius: 4px;">${code}</li>`).join("");

		await client.send({
			from: sender,
			to: recipients,
			subject: `【SITCONTIX】邀請碼 Invitation Codes${groupName ? ` - ${groupName}` : ""}`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>邀請碼</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2c3e50;">SITCONTIX 邀請碼</h1>
						<h2 style="color: #2c3e50;">Invitation Codes</h2>
					</div>
					
					${
						groupName
							? `
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h3 style="color: #2c3e50; margin-top: 0;">邀請碼組別 Group Name</h3>
						<p><strong>${groupName}</strong></p>
					</div>
					`
							: ""
					}

					<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h3 style="color: #2c3e50; margin-top: 0;">邀請碼列表 Invitation Codes (${codes.length} 個)</h3>
						<ul style="list-style: none; padding: 0; margin: 10px 0;">
							${codesHtml}
						</ul>
					</div>

					<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
						<p style="margin: 0;"><strong>使用說明 Instructions:</strong></p>
						<ul style="margin: 10px 0 0 20px; padding: 0;">
							<li>請將邀請碼分享給需要的人員</li>
							<li>每個邀請碼僅限使用一次（除非另有設定）</li>
							<li>請妥善保管邀請碼，避免外流</li>
						</ul>
					</div>

					<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							此為系統自動發送信件，請勿直接回覆<br>
							This is an automated email, please do not reply directly
						</p>
					</div>
				</body>
				</html>
			`
		});

		return true;
	} catch (error) {
		console.error("Send invitation codes error:", error);
		throw error;
	}
};

/**
 * Send personal data deletion notification to event organizers
 */
export const sendDataDeletionNotification = async (registration, event) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: "SITCON"
		};

		// Get organizer email from environment or use a default
		const organizerEmail = process.env.ORGANIZER_EMAIL || "organizer@sitcon.org";

		const recipients = [
			{
				email: organizerEmail
			}
		];

		// Get localized event name
		const getLocalizedName = nameObj => {
			if (!nameObj || typeof nameObj !== "object") return "未命名活動";
			return nameObj["zh-Hant"] || nameObj["zh-Hans"] || nameObj["en"] || Object.values(nameObj)[0] || "未命名活動";
		};

		const eventName = getLocalizedName(event.name);

		await client.send({
			from: sender,
			to: recipients,
			subject: `報名資料異動 - ${eventName}`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>報名資料異動</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<h2 style="color: #2c3e50;">報名資料異動</h2>
					<p>Dear Sir,</p>
					
					<p>您舉辦的活動中報名人 (詳見下列) 要求刪除在 SITCON 存放的個人資料。根據台灣政府的個人資料保護法規定，我們必須刪除該筆記錄，也應告知您不可以繼續保存或持有該筆個人資料。在 SITCON 上的所有帳務相關資料仍將依法保存。</p>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #2c3e50; margin-top: 0;">刪除資料明細 Deletion Details</h3>
						<p><strong>活動名稱 Event Name:</strong> ${eventName}</p>
						<p><strong>報名編號 Registration ID:</strong> ${registration.id}</p>
						<p><strong>電子郵件 Email:</strong> ${registration.email}</p>
						<p><strong>刪除時間 Deletion Time:</strong> ${new Date().toLocaleString("zh-TW")}</p>
					</div>
					
					<p>若有任何疑問或建議，歡迎寄信到 <a href="mailto:support@kktix.com">support@kktix.com</a> 洽詢。</p>
					
					<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
					
					<p>The registrants of your event has asked us to remove his/her personal information on SITCON. We list the serial numbers below.</p>
					
					<p>According to Taiwan's Personal Information Protection Act, we have to remove the data from our service, and need to ask you to delete the related personal information that you might have been download from the service before. Also according to the law, we will still keep the information that related to transactions, include but now limited to the payments information of tickets.</p>
					
					<p>Should you have any question, please feel free to contact <a href="mailto:support@kktix.com">support@kktix.com</a>.</p>
					
					<p>Sincerely,</p>
					<p><strong>SITCON Team</strong></p>
					
					<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							此為系統自動發送信件，請勿直接回覆<br>
							This is an automated email, please do not reply directly
						</p>
					</div>
				</body>
				</html>
			`
		});

		return true;
	} catch (error) {
		console.error("Send data deletion notification error:", error);
		return false;
	}
};
