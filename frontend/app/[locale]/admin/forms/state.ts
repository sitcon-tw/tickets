import type { Event, Ticket } from "@sitcontix/types";
import type { FieldFilterState, Question } from "./types";

export type FormsState = {
	questions: Question[];
	/** JSON snapshot of the last loaded/saved questions; compared to detect unsaved changes. */
	baseline: string;
	selectedId: string | null;
	eventTickets: Ticket[];
	allEvents: Event[];
	isLoading: boolean;
	loadError: string | null;
	isSaving: boolean;
};

export type FormsAction =
	| { type: "loadStarted" }
	| { type: "loadSucceeded"; questions: Question[] }
	| { type: "loadFailed"; message: string }
	| { type: "ticketsLoaded"; tickets: Ticket[] }
	| { type: "eventsLoaded"; events: Event[] }
	| { type: "setSaving"; value: boolean }
	| { type: "select"; id: string | null }
	| { type: "replaceQuestions"; questions: Question[] }
	| { type: "insertQuestion"; question: Question; index: number }
	| { type: "updateQuestion"; id: string; updates: Partial<Question> }
	| { type: "deleteQuestion"; id: string }
	| { type: "moveQuestion"; from: number; to: number }
	| { type: "idsSaved"; idMap: Record<string, string> };

export const initialFormsState: FormsState = {
	questions: [],
	baseline: "[]",
	selectedId: null,
	eventTickets: [],
	allEvents: [],
	isLoading: true,
	loadError: null,
	isSaving: false
};

export function snapshotQuestions(questions: Question[]) {
	return JSON.stringify(questions);
}

export function remapFilters(filters: FieldFilterState | undefined, idMap: Record<string, string>): FieldFilterState | undefined {
	if (!filters) return filters;
	return {
		...filters,
		conditions: filters.conditions.map(condition => (condition.fieldId && idMap[condition.fieldId] ? { ...condition, fieldId: idMap[condition.fieldId] } : condition))
	};
}

export function formsReducer(state: FormsState, action: FormsAction): FormsState {
	switch (action.type) {
		case "loadStarted":
			return { ...initialFormsState, allEvents: state.allEvents };
		case "loadSucceeded": {
			const keepSelection = state.selectedId !== null && action.questions.some(q => q.id === state.selectedId);
			return {
				...state,
				questions: action.questions,
				baseline: snapshotQuestions(action.questions),
				selectedId: keepSelection ? state.selectedId : (action.questions[0]?.id ?? null),
				isLoading: false,
				loadError: null
			};
		}
		case "loadFailed":
			return { ...state, isLoading: false, loadError: action.message };
		case "ticketsLoaded":
			return { ...state, eventTickets: action.tickets };
		case "eventsLoaded":
			return { ...state, allEvents: action.events };
		case "setSaving":
			return { ...state, isSaving: action.value };
		case "select":
			return { ...state, selectedId: action.id };
		case "replaceQuestions":
			return { ...state, questions: action.questions, selectedId: action.questions[0]?.id ?? null };
		case "insertQuestion": {
			const questions = [...state.questions];
			questions.splice(action.index, 0, action.question);
			return { ...state, questions, selectedId: action.question.id };
		}
		case "updateQuestion":
			return { ...state, questions: state.questions.map(q => (q.id === action.id ? { ...q, ...action.updates } : q)) };
		case "deleteQuestion": {
			const index = state.questions.findIndex(q => q.id === action.id);
			if (index === -1) return state;
			const questions = state.questions.filter(q => q.id !== action.id);
			const selectedId = state.selectedId === action.id ? (questions[Math.min(index, questions.length - 1)]?.id ?? null) : state.selectedId;
			return { ...state, questions, selectedId };
		}
		case "moveQuestion": {
			if (action.from === action.to || action.from < 0 || action.to < 0 || action.from >= state.questions.length || action.to >= state.questions.length) return state;
			const questions = [...state.questions];
			const [moved] = questions.splice(action.from, 1);
			questions.splice(action.to, 0, moved);
			return { ...state, questions };
		}
		case "idsSaved":
			return {
				...state,
				questions: state.questions.map(q => ({ ...q, id: action.idMap[q.id] ?? q.id, filters: remapFilters(q.filters, action.idMap) })),
				selectedId: state.selectedId ? (action.idMap[state.selectedId] ?? state.selectedId) : null
			};
	}
}
