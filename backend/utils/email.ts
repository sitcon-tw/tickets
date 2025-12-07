import prisma from "#config/database";
import fs from "fs/promises";
import type { MailtrapClient } from "mailtrap";
import path from "path";
import { fileURLToPath } from "url";
import type { Event, Registration, Ticket } from "../types/database";
import type { CampaignResult, EmailCampaignContent, EmailRecipient, EmailSender, RecipientData, TargetAudienceFilters } from "../types/email";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let client: MailtrapClient | null = null;

async function getMailtrapClient(): Promise<MailtrapClient> {
	if (!client) {
		const { MailtrapClient } = await import("mailtrap");
		client = new MailtrapClient({
			token: process.env.MAILTRAP_TOKEN!
		});
	}
	return client;
}

// this already finished, only need to edit the template
export const sendMagicLink = async (email: string, magicLink: string): Promise<boolean> => {
	try {
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
		const client = await getMailtrapClient();
		const sender: EmailSender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};
		const recipients: EmailRecipient[] = [
			{
				email: email
			}
		];
		const templatePath = path.join(__dirname, "../email-templates/magic-link.html");
		let template = await fs.readFile(templatePath, "utf-8");
		let html = template.replace(/\{\{magicLink\}\}/g, magicLink).replace(/\{\{email\}\}/g, email);
		await client.send({
			from: sender,
			to: recipients,
			subject: `【SITCONTIX】登入連結 Login Link`,
			html
		});
		console.log(`Magic link email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error("Email sending error:", {
			email,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorCode: error && typeof error === "object" && "code" in error ? error.code : undefined,
			errorName: error instanceof Error ? error.name : undefined,
			stack: error instanceof Error ? error.stack : undefined
		});
		throw new Error(`Failed to send magic link email: ${error instanceof Error ? error.message : String(error)}`);
	}
};

// please rewrite this
export const sendRegistrationConfirmation = async (registration: Registration, event: Event, qrCodeUrl: string): Promise<boolean> => {
	try {
		const client = await getMailtrapClient();
		const sender: EmailSender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};

		const recipients: EmailRecipient[] = [
			{
				email: registration.email
			}
		];

		const templatePath = path.join(__dirname, "../email-templates/registered.html");
		let template = await fs.readFile(templatePath, "utf-8");
		let html = template
			.replace(/\{\{eventName\}\}/g, String(event.name))
			.replace(/\{\{eventStartDate\}\}/g, new Date(event.startDate).toLocaleDateString("zh-TW"))
			.replace(/\{\{eventEndDate\}\}/g, new Date(event.endDate).toLocaleDateString("zh-TW"))
			.replace(/\{\{eventLocation\}\}/g, event.location || "待公布 TBA")
			.replace(/\{\{registrationId\}\}/g, registration.id)
			.replace(/\{\{referralCode\}\}/g, "")
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

export const sendInvitationCodes = async (email: string, code: string[], message?: string): Promise<boolean> => {
	// please rewrite this
	try {
		console.log("hehe")

	} catch (error) {
		console.error("Send invitation codes error:", error);
		throw error;
	}
};

// please add cancel and invite code email functions here

export const calculateRecipients = async (targetAudience: string | TargetAudienceFilters | null): Promise<RecipientData[]> => {
	try {
		const where: Record<string, unknown> = {};

		const filters: TargetAudienceFilters | null = typeof targetAudience === "string" ? JSON.parse(targetAudience) : targetAudience;

		if (!filters) {
			const allRegistrations = await prisma.registration.findMany({
				where: { status: "confirmed" },
				select: { email: true, id: true, formData: true },
				distinct: ["email"]
			});
			return allRegistrations as RecipientData[];
		}

		if (filters.eventIds && filters.eventIds.length > 0) {
			where.eventId = { in: filters.eventIds };
		}

		if (filters.ticketIds && filters.ticketIds.length > 0) {
			where.ticketId = { in: filters.ticketIds };
		}

		if (filters.registrationStatuses && filters.registrationStatuses.length > 0) {
			where.status = { in: filters.registrationStatuses };
		} else {
			where.status = "confirmed";
		}

		if (filters.hasReferrals !== undefined) {
			if (filters.hasReferrals) {
				where.referredBy = { not: null };
			} else {
				where.referredBy = null;
			}
		}

		if (filters.registeredAfter) {
			where.createdAt = where.createdAt && typeof where.createdAt === "object" ? { ...where.createdAt, gte: new Date(filters.registeredAfter) } : { gte: new Date(filters.registeredAfter) };
		}
		if (filters.registeredBefore) {
			where.createdAt = where.createdAt && typeof where.createdAt === "object" ? { ...where.createdAt, lte: new Date(filters.registeredBefore) } : { lte: new Date(filters.registeredBefore) };
		}

		let registrations = await prisma.registration.findMany({
			where,
			include: {
				user: { select: { email: true, role: true } },
				event: true,
				ticket: true
			}
		});

		if (filters.emailDomains && filters.emailDomains.length > 0) {
			registrations = registrations.filter(r => {
				const emailDomain = r.email.split("@")[1];
				return filters.emailDomains!.includes(emailDomain);
			});
		}

		if (filters.roles && filters.roles.length > 0) {
			registrations = registrations.filter(r => r.user && filters.roles!.includes(r.user.role));
		}

		if (filters.isReferrer !== undefined) {
			const referrerIds = await prisma.referral.findMany({
				select: { registrationId: true }
			});
			const referrerIdSet = new Set(referrerIds.map(r => r.registrationId));

			registrations = registrations.filter(r => (filters.isReferrer ? referrerIdSet.has(r.id) : !referrerIdSet.has(r.id)));
		}

		const uniqueEmails = new Map<string, RecipientData>();
		registrations.forEach(r => {
			if (!uniqueEmails.has(r.email)) {
				uniqueEmails.set(r.email, {
					email: r.email,
					id: r.id,
					formData: r.formData,
					event: r.event as Partial<Event>,
					ticket: r.ticket as Partial<Ticket>
				});
			}
		});

		return Array.from(uniqueEmails.values());
	} catch (error) {
		console.error("Error calculating recipients:", error);
		throw error;
	}
};

const replaceTemplateVariables = (content: string, data: RecipientData): string => {
	let result = content;

	const formData = typeof data.formData === "string" ? JSON.parse(data.formData) : data.formData || {};

	result = result.replace(/\{\{email\}\}/g, data.email || "");
	result = result.replace(/\{\{name\}\}/g, formData.name || "");
	result = result.replace(/\{\{eventName\}\}/g, data.event?.name ? String(data.event.name) : "");
	result = result.replace(/\{\{ticketName\}\}/g, data.ticket?.name ? String(data.ticket.name) : "");
	result = result.replace(/\{\{registrationId\}\}/g, data.id || "");

	return result;
};

export const sendCampaignEmail = async (campaign: EmailCampaignContent, recipients: RecipientData[]): Promise<CampaignResult> => {
	try {
		const client = await getMailtrapClient();
		const sender: EmailSender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCONTIX"
		};

		let sentCount = 0;
		let failedCount = 0;

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
					return { success: false, email: recipient.email, error: error instanceof Error ? error.message : String(error) };
				}
			});

			await Promise.all(promises);

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