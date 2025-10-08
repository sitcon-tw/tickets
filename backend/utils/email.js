import { MailtrapClient } from "mailtrap";
import prisma from "#config/database.js";

const client = new MailtrapClient({
	token: process.env.MAILTRAP_TOKEN,
});

export const sendRegistrationConfirmation = async (registration, event, qrCodeUrl) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCON 2026",
		};

		const recipients = [
			{
				email: registration.email,
			}
		];

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${event.name}】報名確認 Registration Confirmation`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>報名確認</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2c3e50;">報名確認 Registration Confirmation</h1>
					</div>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h2 style="color: #2c3e50; margin-top: 0;">活動資訊 Event Information</h2>
						<p><strong>活動名稱 Event Name:</strong> ${event.name}</p>
						<p><strong>活動時間 Event Date:</strong> ${new Date(event.startDate).toLocaleDateString('zh-TW')} - ${new Date(event.endDate).toLocaleDateString('zh-TW')}</p>
						<p><strong>活動地點 Location:</strong> ${event.location || '待公布 TBA'}</p>
					</div>

					<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h2 style="color: #2c3e50; margin-top: 0;">報名資訊 Registration Information</h2>
						<p><strong>報名編號 Order Number:</strong> ${registration.id}</p>
						<p><strong>報到碼 Check-in Code:</strong> ${registration.referralCode}</p>
						<p><strong>報名狀態 Status:</strong> 已確認 Confirmed</p>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<h3>報到 QR Code</h3>
						<img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; height: auto; border: 1px solid #ddd; padding: 10px; background: white;">
						<p style="font-size: 12px; color: #666;">請於活動當日出示此 QR Code 進行報到<br>Please present this QR code for check-in on the event day</p>
					</div>

					<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
						<p style="margin: 0;"><strong>重要提醒 Important Notice:</strong></p>
						<p style="margin: 5px 0 0 0;">請保存此信件作為報名憑證。如需修改報名資料，請至官網使用「編輯報名」功能。</p>
						<p style="margin: 5px 0 0 0;">Please keep this email as your registration proof. To edit your registration, please use the "Edit Registration" function on our website.</p>
					</div>

					<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							此為系統自動發送信件，請勿直接回覆<br>
							This is an automated email, please do not reply directly
						</p>
					</div>
				</body>
				</html>
			`,
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
			name: process.env.MAIL_FROM_NAME || "SITCON 2026",
		};

		const recipients = [
			{
				email: email,
			}
		];

		const editUrl = `${process.env.FRONTEND_URI || 'http://localhost:4321'}/edit/${editToken}`;

		await client.send({
			from: sender,
			to: recipients,
			subject: `【${event.name}】報名資料編輯連結 Registration Edit Link`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>報名資料編輯連結</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2c3e50;">報名資料編輯連結</h1>
						<h2 style="color: #2c3e50;">Registration Edit Link</h2>
					</div>
					
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
						<h3 style="color: #2c3e50; margin-top: 0;">活動資訊 Event Information</h3>
						<p><strong>活動名稱 Event Name:</strong> ${event.name}</p>
					</div>

					<div style="text-align: center; margin: 30px 0;">
						<a href="${editUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
							編輯報名資料 Edit Registration
						</a>
					</div>

					<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
						<p style="margin: 0;"><strong>安全提醒 Security Notice:</strong></p>
						<ul style="margin: 10px 0 0 20px; padding: 0;">
							<li>此連結僅供您個人使用 This link is for your personal use only</li>
							<li>連結有效期限為 30 分鐘 Link is valid for 30 minutes</li>
							<li>如非您本人申請，請忽略此信件 If you did not request this, please ignore this email</li>
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
			`,
		});

		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		return false;
	}
};

export const sendMagicLink = async (email, magicLink) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCON 2026",
		};

		const recipients = [
			{
				email: email,
			}
		];

		await client.send({
			from: sender,
			to: recipients,
			subject: `【SITCON 2026】登入連結 Login Link`,
			html: `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Sign In to Your Account</title>
				<style>
					/* Reset styles */
					body, table, td, p, a, li, blockquote {
						-webkit-text-size-adjust: 100%;
						-ms-text-size-adjust: 100%;
					}
					
					table, td {
						mso-table-lspace: 0pt;
						mso-table-rspace: 0pt;
					}
					
					img {
						-ms-interpolation-mode: bicubic;
						border: 0;
						height: auto;
						line-height: 100%;
						outline: none;
						text-decoration: none;
					}
					
					/* Client-specific styles */
					body {
						height: 100% !important;
						margin: 0 !important;
						padding: 0 !important;
						width: 100% !important;
						background-color: #f4f4f4;
						font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
					}
					
					/* Prevent auto-linking */
					a[x-apple-data-detectors] {
						color: inherit !important;
						text-decoration: none !important;
						font-size: inherit !important;
						font-family: inherit !important;
						font-weight: inherit !important;
						line-height: inherit !important;
					}
					
					/* Mobile styles */
					@media only screen and (max-width: 600px) {
						.mobile-padding {
							padding-left: 20px !important;
							padding-right: 20px !important;
						}
						
						.mobile-center {
							text-align: center !important;
						}
						
						.button {
							width: 100% !important;
							padding: 15px 0 !important;
						}
					}
				</style>
			</head>
			<body>
				<!-- Wrapper table for better email client compatibility -->
				<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
					<tr>
						<td align="center" style="padding: 40px 0;">
							
							<!-- Main container -->
							<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
								
								<!-- Header -->
								<tr>
									<td align="center" style="padding: 40px 40px 20px 40px;" class="mobile-padding">
										<!-- Logo placeholder - replace with your logo -->
										<div style="width: 60px; height: 60px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
											<img src="https://sitcon.org/branding/assets/logos/logo.svg" alt="Logo" style="height: 60px;">
										</div>
										<h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1f2937; line-height: 1.2;">
											Sign in to your account
										</h1>
									</td>
								</tr>
								
								<!-- Content -->
								<tr>
									<td style="padding: 0 40px;" class="mobile-padding">
										<p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.5;">
											Hi there! Click the button below to securely sign in to your account. This link will expire in <strong>15 minutes</strong> for your security.
										</p>
									</td>
								</tr>
								
								<!-- Magic Link Button -->
								<tr>
									<td align="center" style="padding: 0 40px 32px 40px;" class="mobile-padding">
										<table border="0" cellspacing="0" cellpadding="0">
											<tr>
												<td style="border-radius: 8px; background-color: #77B55A;">
													<a href="${magicLink}" target="_blank" style="display: inline-block; padding: 16px 32px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;" class="button">
														Sign In Securely
													</a>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								
								<!-- Alternative link -->
								<tr>
									<td style="padding: 0 40px 32px 40px; border-top: 1px solid #e5e7eb;" class="mobile-padding">
										<p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
											If the button doesn't work, copy and paste this link into your browser:
										</p>
										<p style="margin: 8px 0 0 0; word-break: break-all;">
											<a href="${magicLink}" style="color: #77B55A; text-decoration: none; font-size: 14px;">
												${magicLink}
											</a>
										</p>
									</td>
								</tr>
								
								<!-- Security notice -->
								<tr>
									<td style="padding: 40px 40px 40px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;" class="mobile-padding">
										<div style="padding: 20px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
											<p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
												<strong>Security reminder:</strong> If you didn't request this sign-in link, please ignore this email. Never share this link with anyone else.
											</p>
										</div>
										
										<p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.4;">
											This link was sent to <strong>${email}</strong> and will expire in 15 minutes. 
											<br>If you have any questions, contact <a href="mailto:contact@sitcon.org">contact@sitcon.org</a>.
										</p>
									</td>
								</tr>
								
							</table>
							
							<!-- Footer -->
							<table border="0" cellpadding="0" cellspacing="0" width="600" style="margin-top: 20px;">
								<tr>
									<td align="center" style="padding: 20px;">
										<p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.4;">
											© SITCON 2026
											<br>
										</p>
									</td>
								</tr>
							</table>
							
						</td>
					</tr>
				</table>
			</body>
			</html>
			`,
		});

		return true;
	} catch (error) {
		console.error("Email sending error:", error);
		return false;
	}
};
/**
 * Calculate recipients based on target audience filters
 */
export const calculateRecipients = async (targetAudience) => {
	try {
		const where = {};

		// Parse targetAudience if it's a string
		const filters = typeof targetAudience === 'string'
			? JSON.parse(targetAudience)
			: targetAudience;

		if (!filters) {
			// If no filters, return all registrations
			const allRegistrations = await prisma.registration.findMany({
				where: { status: 'confirmed' },
				select: { email: true, id: true, formData: true },
				distinct: ['email']
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
			where.status = 'confirmed';
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
				const emailDomain = r.email.split('@')[1];
				return filters.emailDomains.includes(emailDomain);
			});
		}

		// Filter by user roles
		if (filters.roles && filters.roles.length > 0) {
			registrations = registrations.filter(r =>
				r.user && filters.roles.includes(r.user.role)
			);
		}

		// Filter by isReferrer
		if (filters.isReferrer !== undefined) {
			const referrerIds = await prisma.referral.findMany({
				select: { registrationId: true }
			});
			const referrerIdSet = new Set(referrerIds.map(r => r.registrationId));

			registrations = registrations.filter(r =>
				filters.isReferrer ? referrerIdSet.has(r.id) : !referrerIdSet.has(r.id)
			);
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
	const formData = typeof data.formData === 'string'
		? JSON.parse(data.formData)
		: data.formData || {};

	// Replace common variables
	result = result.replace(/\{\{email\}\}/g, data.email || '');
	result = result.replace(/\{\{name\}\}/g, formData.name || '');
	result = result.replace(/\{\{eventName\}\}/g, data.event?.name || '');
	result = result.replace(/\{\{ticketName\}\}/g, data.ticket?.name || '');
	result = result.replace(/\{\{registrationId\}\}/g, data.id || '');

	return result;
};

/**
 * Send campaign email to recipients
 */
export const sendCampaignEmail = async (campaign, recipients) => {
	try {
		const sender = {
			email: process.env.MAILTRAP_SENDER_EMAIL || "noreply@sitcon.org",
			name: process.env.MAIL_FROM_NAME || "SITCON 2026",
		};

		let sentCount = 0;
		let failedCount = 0;

		// Send emails in batches to avoid rate limits
		const batchSize = 10;
		for (let i = 0; i < recipients.length; i += batchSize) {
			const batch = recipients.slice(i, i + batchSize);

			const promises = batch.map(async (recipient) => {
				try {
					const personalizedContent = replaceTemplateVariables(
						campaign.content,
						recipient
					);

					await client.send({
						from: sender,
						to: [{ email: recipient.email }],
						subject: campaign.subject,
						html: personalizedContent,
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
