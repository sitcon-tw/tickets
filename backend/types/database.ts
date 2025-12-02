/**
 * Database model type definitions
 * Based on Prisma schema models
 */

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	permissions: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Event {
	id: string;
	name: string;
	description: string | null;
	location: string | null;
	startDate: Date;
	endDate: Date;
	ogImage: string | null;
	landingPage: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Registration {
	id: string;
	userId: string;
	eventId: string;
	ticketId: string;
	invitationCodeId: string | null;
	referralCodeId: string | null;
	formData: string;
	status: RegistrationStatus;
	tags: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Ticket {
	id: string;
	eventId: string;
	name: string;
	description: string | null;
	price: number;
	quantity: number;
	sold: number;
	saleStart: Date | null;
	saleEnd: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface InvitationCode {
	id: string;
	ticketId: string;
	code: string;
	name: string | null;
	usageLimit: number | null;
	usedCount: number;
	validFrom: Date | null;
	validUntil: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Referral {
	id: string;
	eventId: string;
	userId: string;
	code: string;
	description: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ReferralUsage {
	id: string;
	referralId: string;
	eventId: string;
	userId: string;
	usedAt: Date;
}

export type EmailCampaignStatus = 'draft' | 'sent' | 'scheduled';

export interface EmailCampaign {
	id: string;
	name: string;
	subject: string;
	content: string;
	eventId: string | null;
	targetAudience: string | null;
	status: EmailCampaignStatus;
	scheduledAt: Date | null;
	sentAt: Date | null;
	recipientCount: number;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export type EventFormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';

export interface EventFormFields {
	id: string;
	eventId: string;
	order: number;
	type: EventFormFieldType;
	validater: string | null;
	name: string;
	description: string;
	placeholder: string | null;
	required: boolean;
	values: string | null;
}

/**
 * @deprecated Use EventFormFields instead
 */
export type TicketFromFields = EventFormFields;
