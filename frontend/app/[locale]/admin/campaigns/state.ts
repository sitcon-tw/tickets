import type { EmailCampaign, Event, Ticket } from "@sitcontix/types";

export type TargetAudienceForm = {
	eventIds: string[];
	ticketIds: string[];
	registrationStatuses: string[];
	hasReferrals: boolean | undefined;
	isReferrer: boolean | undefined;
	emailDomains: string[];
};

export type FormData = {
	name: string;
	subject: string;
	content: string;
	targetAudience: TargetAudienceForm;
};

export type Template = { id: string; name: string; description: string; content: string };
export type Recipient = { email: string; id: string };
export type PreviewTab = "html" | "recipients";
export type CreateTab = "edit" | "preview";
export type StatusFilter = "all" | EmailCampaign["status"];
export type AudienceListField = keyof Pick<TargetAudienceForm, "eventIds" | "ticketIds" | "registrationStatuses">;

export const buildTargetAudience = (ta: TargetAudienceForm) => ({
	...(ta.eventIds.length > 0 && { eventIds: ta.eventIds }),
	...(ta.ticketIds.length > 0 && { ticketIds: ta.ticketIds }),
	...(ta.registrationStatuses.length > 0 && { registrationStatuses: ta.registrationStatuses }),
	...(ta.hasReferrals !== undefined && { hasReferrals: ta.hasReferrals }),
	...(ta.isReferrer !== undefined && { isReferrer: ta.isReferrer }),
	...(ta.emailDomains.length > 0 && { emailDomains: ta.emailDomains })
});

export const INITIAL_FORM: FormData = {
	name: "",
	subject: "",
	content: "",
	targetAudience: {
		eventIds: [],
		ticketIds: [],
		registrationStatuses: [],
		hasReferrals: undefined,
		isReferrer: undefined,
		emailDomains: []
	}
};

export type CampaignsState = {
	campaigns: EmailCampaign[];
	isLoading: boolean;
	statusFilter: StatusFilter;
	showCreateModal: boolean;
	createTab: CreateTab;
	formData: FormData;
	isSaving: boolean;
	recipientCount: number | null;
	recipientList: Recipient[];
	isCalculating: boolean;
	showRecipientsModal: boolean;
	templates: Template[];
	showTemplateModal: boolean;
	showPreviewModal: boolean;
	selectedCampaign: EmailCampaign | null;
	previewHtml: string;
	previewRecipients: Recipient[];
	previewTab: PreviewTab;
	events: Event[];
	tickets: Ticket[];
};

export type CampaignsAction =
	| { type: "setCampaignsLoading"; value: boolean }
	| { type: "campaignsLoaded"; campaigns: EmailCampaign[] }
	| { type: "patchCampaign"; id: string; patch: Partial<EmailCampaign> }
	| { type: "setStatusFilter"; value: StatusFilter }
	| { type: "eventsLoaded"; events: Event[] }
	| { type: "ticketsLoaded"; tickets: Ticket[] }
	| { type: "templatesLoaded"; templates: Template[] }
	| { type: "setCreateModal"; value: boolean }
	| { type: "setCreateTab"; value: CreateTab }
	| { type: "setFormField"; field: keyof Pick<FormData, "name" | "subject" | "content">; value: string }
	| { type: "toggleTargetAudience"; field: AudienceListField; id: string; checked: boolean }
	| { type: "recipientPreviewStarted" }
	| { type: "recipientPreviewLoaded"; count: number; recipients: Recipient[] }
	| { type: "recipientPreviewFailed" }
	| { type: "setRecipientsModal"; value: boolean }
	| { type: "setSaving"; value: boolean }
	| { type: "campaignCreated" }
	| { type: "previewLoaded"; campaign: EmailCampaign; html: string; recipients: Recipient[] }
	| { type: "setPreviewModal"; value: boolean }
	| { type: "setPreviewTab"; value: PreviewTab }
	| { type: "setTemplateModal"; value: boolean }
	| { type: "templateImported"; content: string };

export const initialCampaignsState: CampaignsState = {
	campaigns: [],
	isLoading: true,
	statusFilter: "all",
	showCreateModal: false,
	createTab: "edit",
	formData: INITIAL_FORM,
	isSaving: false,
	recipientCount: null,
	recipientList: [],
	isCalculating: false,
	showRecipientsModal: false,
	templates: [],
	showTemplateModal: false,
	showPreviewModal: false,
	selectedCampaign: null,
	previewHtml: "",
	previewRecipients: [],
	previewTab: "html",
	events: [],
	tickets: []
};

export function campaignsReducer(state: CampaignsState, action: CampaignsAction): CampaignsState {
	switch (action.type) {
		case "setCampaignsLoading":
			return { ...state, isLoading: action.value };
		case "campaignsLoaded":
			return { ...state, campaigns: action.campaigns };
		case "patchCampaign":
			return { ...state, campaigns: state.campaigns.map(c => (c.id === action.id ? { ...c, ...action.patch } : c)) };
		case "setStatusFilter":
			return { ...state, statusFilter: action.value };
		case "eventsLoaded":
			return { ...state, events: action.events };
		case "ticketsLoaded":
			return { ...state, tickets: action.tickets };
		case "templatesLoaded":
			return { ...state, templates: action.templates };
		case "setCreateModal":
			return { ...state, showCreateModal: action.value, createTab: "edit" };
		case "setCreateTab":
			return { ...state, createTab: action.value };
		case "setFormField":
			return { ...state, formData: { ...state.formData, [action.field]: action.value } };
		case "toggleTargetAudience": {
			const current = state.formData.targetAudience[action.field];
			const next = action.checked ? [...current, action.id] : current.filter(x => x !== action.id);
			const targetAudience = { ...state.formData.targetAudience, [action.field]: next };
			if (action.field === "eventIds" && next.length > 0) {
				targetAudience.ticketIds = targetAudience.ticketIds.filter(ticketId => {
					const ticket = state.tickets.find(t => t.id === ticketId);
					return ticket && next.includes(ticket.eventId);
				});
			}
			return { ...state, formData: { ...state.formData, targetAudience }, recipientCount: null, recipientList: [], isCalculating: false };
		}
		case "recipientPreviewStarted":
			return { ...state, isCalculating: true };
		case "recipientPreviewLoaded":
			return { ...state, isCalculating: false, recipientCount: action.count, recipientList: action.recipients };
		case "recipientPreviewFailed":
			return { ...state, isCalculating: false };
		case "setRecipientsModal":
			return { ...state, showRecipientsModal: action.value };
		case "setSaving":
			return { ...state, isSaving: action.value };
		case "campaignCreated":
			return { ...state, showCreateModal: false, createTab: "edit", formData: INITIAL_FORM, recipientCount: null, recipientList: [], isCalculating: false };
		case "previewLoaded":
			return { ...state, previewHtml: action.html, previewRecipients: action.recipients, previewTab: "html", selectedCampaign: action.campaign, showPreviewModal: true };
		case "setPreviewModal":
			return { ...state, showPreviewModal: action.value };
		case "setPreviewTab":
			return { ...state, previewTab: action.value };
		case "setTemplateModal":
			return { ...state, showTemplateModal: action.value };
		case "templateImported":
			return { ...state, formData: { ...state.formData, content: action.content }, showTemplateModal: false };
	}
}
