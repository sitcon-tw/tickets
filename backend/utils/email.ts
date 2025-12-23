import prisma from "#config/database";
import fs from "fs/promises";
import { MailtrapClient } from "mailtrap";
import path from "path";
import { fileURLToPath } from "url";
import type { Event, Registration, Ticket } from "@tickets/shared";
import type { CampaignResult, EmailCampaignContent, EmailRecipient, EmailSender, RecipientData, TargetAudienceFilters } from "../schemas/email";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let client: MailtrapClient | null = null;

async function getMailtrapClient(): Promise<MailtrapClient> {
	if (!client) {
		client = new MailtrapClient({
			token: process.env.MAILTRAP_TOKEN!
		});
	}
	return client;
}

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

export const sendRegistrationConfirmation = async (registration: Registration, event: Event, ticket: Ticket, ticketUrl: string): Promise<boolean> => {
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

		const formData = typeof registration.formData === "string" ? JSON.parse(registration.formData) : registration.formData || {};

		const formFields = await prisma.eventFormFields.findMany({
			where: { eventId: event.id },
			orderBy: { order: "asc" }
		});

		const fieldMap = new Map(formFields.map(field => [field.id, field]));

		const getLocalizedFieldName = (fieldId: string, locale: string = "zh-Hant"): string => {
			const field = fieldMap.get(fieldId);
			if (!field || !field.name) return fieldId;

			if (typeof field.name === "string") return field.name;
			if (typeof field.name === "object" && !Array.isArray(field.name)) {
				const nameObj = field.name as Record<string, any>;
				return nameObj[locale] || nameObj["en"] || Object.values(nameObj)[0] || fieldId;
			}
			return fieldId;
		};

		const formatFieldValue = (fieldId: string, value: any, locale: string = "zh-Hant"): string => {
			const field = fieldMap.get(fieldId);
			if (!field) return String(value);

			if (field.type === "checkbox" && Array.isArray(value)) {
				if (field.values) {
					try {
						const options = typeof field.values === "string" ? JSON.parse(field.values) : field.values;
						const localizedValues = value.map(v => {
							const option = options.find((opt: string | Record<string, string>) => {
								if (typeof opt === "object" && opt !== null) {
									return Object.values(opt).includes(v) || ("value" in opt && opt.value === v);
								}
								return opt === v;
							});

							if (option && typeof option === "object") {
								return option[locale] || option["en"] || Object.values(option)[0] || v;
							}
							return v;
						});
						return localizedValues.join(", ");
					} catch (e) {
						return value.join(", ");
					}
				}
				return value.join(", ");
			}

			if ((field.type === "select" || field.type === "radio") && field.values) {
				try {
					const options = typeof field.values === "string" ? JSON.parse(field.values) : field.values;
					const option = options.find((opt: string | Record<string, string>) => {
						if (typeof opt === "object" && opt !== null) {
							return Object.values(opt).includes(value) || ("value" in opt && opt.value === value);
						}
						return opt === value;
					});

					if (option && typeof option === "object") {
						return option[locale] || option["en"] || Object.values(option)[0] || String(value);
					}
				} catch (e) {
					return String(value);
				}
			}

			return String(value);
		};

		let formDataRows = "";
		for (const [key, value] of Object.entries(formData)) {
			const localizedName = getLocalizedFieldName(key);
			const formattedValue = formatFieldValue(key, value);

			formDataRows += `
					<tr>
						<td
							style="
								padding: 8px 0;
								background: linear-gradient(#6b7280, #6b7280);
								background-clip: text;
								-webkit-background-clip: text;
								-webkit-text-fill-color: transparent;
								color: transparent;
								font-weight: bold;
							"
						>
							${localizedName}：
						</td>
						<td style="padding: 8px 0">${formattedValue}</td>
					</tr>`;
		}

		const eventDate = new Date(event.startDate).toLocaleDateString("zh-TW");

		const getLocalizedValue = (jsonField: any, locale: string = "zh-Hant"): string => {
			if (!jsonField) return "";
			if (typeof jsonField === "string") return jsonField;
			if (typeof jsonField === "object") {
				return jsonField[locale] || jsonField["en"] || Object.values(jsonField)[0] || "";
			}
			return String(jsonField);
		};

		const eventName = getLocalizedValue(event.name);
		const ticketName = getLocalizedValue(ticket.name);
		const eventLocation = event.location || "待公布 TBA";

		const userName = await prisma.user
			.findFirst({
				where: { id: registration.userId },
				select: { name: true }
			})
			.then(user => user?.name || "");

		const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
		const eventSlugOrId = event.slug || event.id;
		const calendarIcsUrl = `${frontendUrl}/api/events/${eventSlugOrId}/calendar.ics`;
		const calendarGoogleUrl = `https://calendar.google.com/calendar/r?cid=webcal://${frontendUrl.replace(/^https?:\/\//, "")}/api/events/${eventSlugOrId}/calendar.ics`;
		let html = template
			.replace(/\{\{userName\}\}/g, userName)
			.replace(/\{\{eventName\}\}/g, eventName)
			.replace(/\{\{eventDate\}\}/g, eventDate)
			.replace(/\{\{eventLocation\}\}/g, eventLocation)
			.replace(/\{\{ticketName\}\}/g, ticketName)
			.replace(/\{\{ticketUrl\}\}/g, ticketUrl)
			.replace(/\{\{formDataRows\}\}/g, formDataRows)
			.replace(/\{\{email\}\}/g, registration.email)
			.replace(/\{\{calendarIcsUrl\}\}/g, calendarIcsUrl)
			.replace(/\{\{calendarGoogleUrl\}\}/g, calendarGoogleUrl);

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${eventName}】報名成功`,
			html
		});

		console.log(`Registration confirmation email sent successfully to ${registration.email}`);
		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		throw new Error(`Failed to send registration confirmation email: ${error instanceof Error ? error.message : String(error)}`);
	}
};

export const sendCancellationEmail = async (email: string, eventNameOrJson: string | any, buttonUrl: string): Promise<boolean> => {
	try {
		if (!email || typeof email !== "string" || !email.includes("@")) {
			throw new Error("Invalid email address");
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

		// Handle localized event name
		const getLocalizedValue = (jsonField: any, locale: string = "zh-Hant"): string => {
			if (!jsonField) return "";
			if (typeof jsonField === "string") return jsonField;
			if (typeof jsonField === "object") {
				return jsonField[locale] || jsonField["en"] || Object.values(jsonField)[0] || "";
			}
			return String(jsonField);
		};

		const eventName = getLocalizedValue(eventNameOrJson);

		const templatePath = path.join(__dirname, "../email-templates/canceled.html");
		let template = await fs.readFile(templatePath, "utf-8");
		let html = template
			.replace(/\{\{eventName\}\}/g, eventName)
			.replace(/\{\{buttonUrl\}\}/g, buttonUrl)
			.replace(/\{\{email\}\}/g, email);

		await client.send({
			from: sender,
			to: recipients,
			subject: `【SITCONTIX】你已取消報名`,
			html
		});

		console.log(`Cancellation email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		throw new Error(`Failed to send cancellation email: ${error instanceof Error ? error.message : String(error)}`);
	}
};

export const sendInvitationCode = async (
	email: string,
	code: string,
	eventNameOrJson: string | any,
	ticketNameOrJson: string | any,
	ticketUrl: string,
	validUntil: string,
	message?: string
): Promise<boolean> => {
	try {
		if (!email || typeof email !== "string" || !email.includes("@")) {
			throw new Error("Invalid email address");
		}
		if (!code || typeof code !== "string") {
			throw new Error("Invalid invitation code");
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

		const templatePath = path.join(__dirname, "../email-templates/invitation.html");
		let template = await fs.readFile(templatePath, "utf-8");

		// Handle localized fields
		const getLocalizedValue = (jsonField: any, locale: string = "zh-Hant"): string => {
			if (!jsonField) return "";
			if (typeof jsonField === "string") return jsonField;
			if (typeof jsonField === "object") {
				return jsonField[locale] || jsonField["en"] || Object.values(jsonField)[0] || "";
			}
			return String(jsonField);
		};

		const eventName = getLocalizedValue(eventNameOrJson);
		const ticketName = getLocalizedValue(ticketNameOrJson);

		let html = template
			.replace(/\{\{eventName\}\}/g, eventName)
			.replace(/\{\{invitationCode\}\}/g, code)
			.replace(/\{\{ticketName\}\}/g, ticketName)
			.replace(/\{\{ticketUrl\}\}/g, ticketUrl)
			.replace(/\{\{validUntil\}\}/g, validUntil)
			.replace(/\{\{message\}\}/g, message || "<p>感謝您！以下是您的邀請碼：</p>")
			.replace(/\{\{email\}\}/g, email);

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${eventName}】活動邀請碼`,
			html
		});

		console.log(`Invitation code email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		throw new Error(`Failed to send invitation code email: ${error instanceof Error ? error.message : String(error)}`);
	}
};

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
			sent: sentCount,
			failed: failedCount,
			sentCount,
			failedCount,
			totalRecipients: recipients.length
		};
	} catch (error) {
		console.error("Campaign email sending error:", error);
		throw error;
	}
};
