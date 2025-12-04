import type { Event, Ticket } from "./database";

export interface EmailSender {
	email: string;
	name: string;
}

export interface EmailRecipient {
	email: string;
}

export interface TargetAudienceFilters {
	eventIds?: string[];
	ticketIds?: string[];
	registrationStatuses?: string[];
	hasReferrals?: boolean;
	registeredAfter?: string;
	registeredBefore?: string;
	emailDomains?: string[];
	roles?: string[];
	isReferrer?: boolean;
}

export interface RecipientData {
	email: string;
	id: string;
	formData?: string | null;
	event?: Partial<Event>;
	ticket?: Partial<Ticket>;
}

export interface EmailCampaignContent {
	subject: string;
	content: string;
}

export interface CampaignResult {
	success: boolean;
	sentCount: number;
	failedCount: number;
	totalRecipients: number;
}
