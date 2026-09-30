import { toDateTimeLocalString } from "@/lib/utils/timezone";
import type { Event } from "@sitcontix/types";

export type EventTab = "info" | "en" | "zh-Hant" | "zh-Hans";
export type EventLanguage = "en" | "zh-Hant" | "zh-Hans";

export type EventFormTextField =
	| "nameEn"
	| "nameZhHant"
	| "nameZhHans"
	| "descEn"
	| "descZhHant"
	| "descZhHans"
	| "plainDescEn"
	| "plainDescZhHant"
	| "plainDescZhHans"
	| "locationTextEn"
	| "locationTextZhHant"
	| "locationTextZhHans"
	| "eventStartTime"
	| "eventEndTime"
	| "editDeadline"
	| "mapLink"
	| "slug"
	| "ogImage"
	| "opassEventId";

export type EventFormState = Record<EventFormTextField, string> & {
	hideEvent: boolean;
	useOpass: boolean;
};

export type EventFormErrors = Partial<Record<EventFormTextField, string>>;

export type EventsPageState = {
	events: Event[];
	isLoading: boolean;
	isSaving: boolean;
	showModal: boolean;
	editingEvent: Event | null;
	activeTab: EventTab;
	form: EventFormState;
	/** Becomes true after the first failed/attempted submit so validation messages show live from then on. */
	submitAttempted: boolean;
	/** Error returned by the server on the last save attempt. */
	submitError: string | null;
};

export type EventsPageAction =
	| { type: "eventsLoaded"; events: Event[] }
	| { type: "setLoading"; value: boolean }
	| { type: "setSaving"; value: boolean }
	| { type: "openModal"; event: Event | null }
	| { type: "closeModal" }
	| { type: "setActiveTab"; value: EventTab }
	| { type: "setFormText"; field: EventFormTextField; value: string }
	| { type: "setFormBoolean"; field: "hideEvent" | "useOpass"; value: boolean }
	| { type: "submitRejected"; tab: EventTab | null }
	| { type: "setSubmitError"; value: string | null };

export const initialEventFormState: EventFormState = {
	nameEn: "",
	nameZhHant: "",
	nameZhHans: "",
	descEn: "",
	descZhHant: "",
	descZhHans: "",
	plainDescEn: "",
	plainDescZhHant: "",
	plainDescZhHans: "",
	locationTextEn: "",
	locationTextZhHant: "",
	locationTextZhHans: "",
	eventStartTime: "",
	eventEndTime: "",
	editDeadline: "",
	mapLink: "",
	slug: "",
	ogImage: "",
	opassEventId: "",
	hideEvent: false,
	useOpass: true
};

export const initialEventsPageState: EventsPageState = {
	events: [],
	isLoading: true,
	isSaving: false,
	showModal: false,
	editingEvent: null,
	activeTab: "info",
	form: initialEventFormState,
	submitAttempted: false,
	submitError: null
};

export function formStateFromEvent(event: Event | null): EventFormState {
	if (!event) return initialEventFormState;

	const name = event.name && typeof event.name === "object" ? event.name : { en: event.name || "" };
	const desc = event.description && typeof event.description === "object" ? event.description : { en: event.description || "" };
	const plainDesc = event.plainDescription && typeof event.plainDescription === "object" ? event.plainDescription : { en: event.plainDescription || "" };
	const locText = event.locationText && typeof event.locationText === "object" ? event.locationText : { en: "" };

	return {
		nameEn: name.en || "",
		nameZhHant: name["zh-Hant"] || "",
		nameZhHans: name["zh-Hans"] || "",
		descEn: desc.en || "",
		descZhHant: desc["zh-Hant"] || "",
		descZhHans: desc["zh-Hans"] || "",
		plainDescEn: plainDesc.en || "",
		plainDescZhHant: plainDesc["zh-Hant"] || "",
		plainDescZhHans: plainDesc["zh-Hans"] || "",
		locationTextEn: locText.en || "",
		locationTextZhHant: locText["zh-Hant"] || "",
		locationTextZhHans: locText["zh-Hans"] || "",
		mapLink: event.mapLink || "",
		slug: event.slug || "",
		eventStartTime: event.startDate ? toDateTimeLocalString(event.startDate) : "",
		eventEndTime: event.endDate ? toDateTimeLocalString(event.endDate) : "",
		editDeadline: event.editDeadline ? toDateTimeLocalString(event.editDeadline) : "",
		ogImage: event.ogImage || "",
		hideEvent: event.hideEvent || false,
		useOpass: event.useOpass ?? true,
		opassEventId: event.opassEventId || ""
	};
}

export function eventsPageReducer(state: EventsPageState, action: EventsPageAction): EventsPageState {
	switch (action.type) {
		case "eventsLoaded":
			return { ...state, events: action.events };
		case "setLoading":
			return { ...state, isLoading: action.value };
		case "setSaving":
			return { ...state, isSaving: action.value };
		case "openModal":
			return { ...state, showModal: true, editingEvent: action.event, activeTab: "info", form: formStateFromEvent(action.event), submitAttempted: false, submitError: null };
		case "closeModal":
			return { ...state, showModal: false, editingEvent: null, activeTab: "info", form: initialEventFormState, submitAttempted: false, submitError: null };
		case "setActiveTab":
			return { ...state, activeTab: action.value };
		case "setFormText":
			return { ...state, form: { ...state.form, [action.field]: action.value } };
		case "setFormBoolean":
			return { ...state, form: { ...state.form, [action.field]: action.value } };
		case "submitRejected":
			return { ...state, submitAttempted: true, submitError: null, activeTab: action.tab ?? state.activeTab };
		case "setSubmitError":
			return { ...state, submitError: action.value };
	}
}

export function isFormDirty(form: EventFormState, editingEvent: Event | null) {
	const original = formStateFromEvent(editingEvent);
	return (Object.keys(original) as (keyof EventFormState)[]).some(key => original[key] !== form[key]);
}

export const fieldTab: Record<EventFormTextField, EventTab> = {
	nameEn: "en",
	descEn: "en",
	plainDescEn: "en",
	locationTextEn: "en",
	nameZhHant: "zh-Hant",
	descZhHant: "zh-Hant",
	plainDescZhHant: "zh-Hant",
	locationTextZhHant: "zh-Hant",
	nameZhHans: "zh-Hans",
	descZhHans: "zh-Hans",
	plainDescZhHans: "zh-Hans",
	locationTextZhHans: "zh-Hans",
	eventStartTime: "info",
	eventEndTime: "info",
	editDeadline: "info",
	mapLink: "info",
	slug: "info",
	ogImage: "info",
	opassEventId: "info"
};

export type ValidationMessages = {
	nameRequired: string;
	slugInvalid: string;
	urlInvalid: string;
	startRequired: string;
	endRequired: string;
	endBeforeStart: string;
	deadlineAfterStart: string;
};

function isHttpUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function validateEventForm(form: EventFormState, messages: ValidationMessages): EventFormErrors {
	const errors: EventFormErrors = {};

	if (!form.nameEn.trim()) errors.nameEn = messages.nameRequired;

	const slug = form.slug.trim();
	if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = messages.slugInvalid;

	if (form.ogImage.trim() && !isHttpUrl(form.ogImage.trim())) errors.ogImage = messages.urlInvalid;
	if (form.mapLink.trim() && !isHttpUrl(form.mapLink.trim())) errors.mapLink = messages.urlInvalid;

	if (!form.eventStartTime) errors.eventStartTime = messages.startRequired;
	if (!form.eventEndTime) errors.eventEndTime = messages.endRequired;
	// "yyyy-MM-ddTHH:mm" strings compare correctly as text
	if (form.eventStartTime && form.eventEndTime && form.eventStartTime >= form.eventEndTime) errors.eventEndTime = messages.endBeforeStart;
	if (form.editDeadline && form.eventStartTime && form.editDeadline >= form.eventStartTime) errors.editDeadline = messages.deadlineAfterStart;

	return errors;
}

/** Order used to pick the first tab that contains an error. */
export const tabOrder: EventTab[] = ["info", "en", "zh-Hant", "zh-Hans"];

export function tabsWithErrors(errors: EventFormErrors): Set<EventTab> {
	return new Set((Object.keys(errors) as EventFormTextField[]).map(field => fieldTab[field]));
}
