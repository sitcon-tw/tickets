import { z } from "zod";
import { registrationStatusSchema } from "./registration";

/**
 * Database model Zod schemas
 * Based on Prisma schema models
 */

// Enums
export const emailCampaignStatusSchema = z.enum(["draft", "sent", "scheduled"]);
export const eventFormFieldTypeSchema = z.enum(["text", "textarea", "select", "checkbox", "radio"]);
export const userRoleSchema = z.enum(["admin", "viewer", "eventAdmin"]);

// User schema
export const userSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	emailVerified: z.boolean(),
	image: z.string().nullable(),
	permissions: z.string().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Event schema
export const eventSchema = z.object({
	id: z.string(),
	slug: z.string().nullable().optional(),
	name: z.string(),
	description: z.string().nullable(),
	location: z.string().nullable(),
	startDate: z.date(),
	endDate: z.date(),
	ogImage: z.string().nullable(),
	landingPage: z.string().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Registration schema
export const registrationSchema = z.object({
	id: z.string(),
	userId: z.string(),
	eventId: z.string(),
	ticketId: z.string(),
	email: z.string().email(),
	invitationCodeId: z.string().nullable(),
	referralCodeId: z.string().nullable(),
	formData: z.string(),
	status: registrationStatusSchema,
	tags: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Ticket schema
export const ticketSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	price: z.number(),
	quantity: z.number().int(),
	sold: z.number().int(),
	saleStart: z.date().nullable(),
	saleEnd: z.date().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// InvitationCode schema
export const invitationCodeSchema = z.object({
	id: z.string(),
	ticketId: z.string(),
	code: z.string(),
	name: z.string().nullable(),
	usageLimit: z.number().int().nullable(),
	usedCount: z.number().int(),
	validFrom: z.date().nullable(),
	validUntil: z.date().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Referral schema
export const referralSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	userId: z.string(),
	code: z.string(),
	description: z.string().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ReferralUsage schema
export const referralUsageSchema = z.object({
	id: z.string(),
	referralId: z.string(),
	eventId: z.string(),
	userId: z.string(),
	usedAt: z.date(),
});

// EmailCampaign schema
export const emailCampaignSchema = z.object({
	id: z.string(),
	name: z.string(),
	subject: z.string(),
	content: z.string(),
	eventId: z.string().nullable(),
	targetAudience: z.string().nullable(),
	status: emailCampaignStatusSchema,
	scheduledAt: z.date().nullable(),
	sentAt: z.date().nullable(),
	recipientCount: z.number().int(),
	createdBy: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// EventFormFields schema
export const eventFormFieldsSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	order: z.number().int(),
	type: eventFormFieldTypeSchema,
	validater: z.string().nullable(),
	name: z.string(),
	description: z.string().nullable(),
	placeholder: z.string().nullable(),
	required: z.boolean(),
	values: z.string().nullable(),
	prompts: z.string().nullable(),
});

/**
 * Infer TypeScript types from schemas
 */
export type User = z.infer<typeof userSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Registration = z.infer<typeof registrationSchema>;
// RegistrationStatus is exported from registration.ts
export type Ticket = z.infer<typeof ticketSchema>;
export type InvitationCode = z.infer<typeof invitationCodeSchema>;
export type Referral = z.infer<typeof referralSchema>;
export type ReferralUsage = z.infer<typeof referralUsageSchema>;
export type EmailCampaign = z.infer<typeof emailCampaignSchema>;
export type EmailCampaignStatus = z.infer<typeof emailCampaignStatusSchema>;
export type EventFormFields = z.infer<typeof eventFormFieldsSchema>;
export type EventFormFieldType = z.infer<typeof eventFormFieldTypeSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * @deprecated Use EventFormFields instead
 */
export type TicketFromFields = EventFormFields;
