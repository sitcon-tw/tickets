"use client";

import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventFormFieldsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { toDateTimeLocalString } from "@/lib/utils/timezone";
import type { Event, EventFormField, FieldFilter, Ticket } from "@sitcontix/types";
import { ChevronDown, ChevronUp, GripVertical, Plus, Save, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { DisplayFiltersSection } from "./filter-editor";

type ShowIf = {
	sourceId: string;
	values: string[];
};

export type FilterConditionState = {
	type: "ticket" | "field" | "time";
	ticketId?: string;
	fieldId?: string;
	operator?: "equals" | "filled" | "notFilled";
	value?: string;
	startTime?: string;
	endTime?: string;
};

type FieldFilterState = Omit<FieldFilter, "conditions"> & {
	conditions: FilterConditionState[];
};

export type Question = {
	id: string;
	label: string;
	labelEn?: string;
	labelZhHant?: string;
	labelZhHans?: string;
	type: string;
	required: boolean;
	description?: string;
	descriptionEn?: string;
	descriptionZhHant?: string;
	descriptionZhHans?: string;
	validater?: string;
	options?: Array<{
		id?: string;
		en: string;
		"zh-Hant"?: string;
		"zh-Hans"?: string;
	}>;
	prompts?: Record<string, string[]>;
	showIf?: ShowIf;
	filters?: FieldFilterState;
	enableOther?: boolean;
};

type FormsState = {
	questions: Question[];
	allEvents: Event[];
	copyFromEventId: string;
	draggedIndex: number | null;
	dragOverIndex: number | null;
	draggedOptionIndex: number | null;
	dragOverOptionIndex: number | null;
	draggedQuestionId: string | null;
	eventTickets: Ticket[];
	collapsedItems: Set<string>;
	isSaving: boolean;
};

type FormsAction =
	| { type: "allEventsLoaded"; events: Event[] }
	| { type: "eventTicketsLoaded"; tickets: Ticket[] }
	| { type: "formFieldsLoaded"; questions: Question[] }
	| { type: "formCopied"; questions: Question[] }
	| { type: "setCopyFromEventId"; value: string }
	| { type: "setSaving"; value: boolean }
	| { type: "addQuestion"; question: Question }
	| { type: "updateQuestion"; id: string; updates: Partial<Question> }
	| { type: "deleteQuestion"; id: string }
	| { type: "toggleCollapse"; id: string }
	| { type: "expandAll" }
	| { type: "collapseAll" }
	| { type: "fieldDragStarted"; index: number }
	| { type: "fieldDragOver"; index: number }
	| { type: "fieldDragCleared" }
	| { type: "questionsReordered"; questions: Question[] }
	| { type: "optionDragStarted"; questionId: string; optionIndex: number }
	| { type: "optionDragOver"; optionIndex: number }
	| { type: "optionDragCleared" };

const initialFormsState: FormsState = {
	questions: [],
	allEvents: [],
	copyFromEventId: "",
	draggedIndex: null,
	dragOverIndex: null,
	draggedOptionIndex: null,
	dragOverOptionIndex: null,
	draggedQuestionId: null,
	eventTickets: [],
	collapsedItems: new Set(),
	isSaving: false
};

function formsReducer(state: FormsState, action: FormsAction): FormsState {
	switch (action.type) {
		case "allEventsLoaded":
			return { ...state, allEvents: action.events };
		case "eventTicketsLoaded":
			return { ...state, eventTickets: action.tickets };
		case "formFieldsLoaded":
			return {
				...state,
				questions: action.questions,
				collapsedItems: new Set(action.questions.map(f => f.id))
			};
		case "formCopied":
			return { ...state, questions: action.questions, copyFromEventId: "" };
		case "setCopyFromEventId":
			return { ...state, copyFromEventId: action.value };
		case "setSaving":
			return { ...state, isSaving: action.value };
		case "addQuestion":
			return { ...state, questions: [...state.questions, action.question] };
		case "updateQuestion":
			return { ...state, questions: state.questions.map(q => (q.id === action.id ? { ...q, ...action.updates } : q)) };
		case "deleteQuestion":
			return { ...state, questions: state.questions.filter(q => q.id !== action.id) };
		case "toggleCollapse": {
			const collapsedItems = new Set(state.collapsedItems);
			if (collapsedItems.has(action.id)) {
				collapsedItems.delete(action.id);
			} else {
				collapsedItems.add(action.id);
			}
			return { ...state, collapsedItems };
		}
		case "expandAll":
			return { ...state, collapsedItems: new Set() };
		case "collapseAll":
			return { ...state, collapsedItems: new Set(state.questions.map(q => q.id)) };
		case "fieldDragStarted":
			return { ...state, draggedIndex: action.index };
		case "fieldDragOver":
			return { ...state, dragOverIndex: action.index };
		case "fieldDragCleared":
			return { ...state, draggedIndex: null, dragOverIndex: null };
		case "questionsReordered":
			return { ...state, questions: action.questions };
		case "optionDragStarted":
			return { ...state, draggedQuestionId: action.questionId, draggedOptionIndex: action.optionIndex };
		case "optionDragOver":
			return { ...state, dragOverOptionIndex: action.optionIndex };
		case "optionDragCleared":
			return {
				...state,
				draggedOptionIndex: null,
				dragOverOptionIndex: null,
				draggedQuestionId: null
			};
	}
}

function useFormsPageView() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const currentEventId = useSelectedEventId();
	const originalFieldIdsRef = useRef<string[]>([]);
	const [state, dispatch] = useReducer(formsReducer, initialFormsState);
	const { questions, allEvents, copyFromEventId, draggedIndex, dragOverIndex, draggedOptionIndex, dragOverOptionIndex, draggedQuestionId, eventTickets, collapsedItems, isSaving } = state;

	const t = getTranslations(locale, {
		title: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Form" },
		eventLabel: { "zh-Hant": "活動", "zh-Hans": "活动", en: "Event" },
		backToEvents: { "zh-Hant": "返回活動列表", "zh-Hans": "返回活动列表", en: "Back to Events" },
		noEvent: { "zh-Hant": "未指定活動", "zh-Hans": "未指定活动", en: "No event specified" },
		addQuestion: { "zh-Hant": "新增問題", "zh-Hans": "新增问题", en: "Add Question" },
		save: { "zh-Hant": "儲存表單", "zh-Hans": "保存表单", en: "Save Form" },
		copyFrom: { "zh-Hant": "複製其他活動表單", "zh-Hans": "复制其他活动表单", en: "Copy from other event" },
		selectEvent: { "zh-Hant": "選擇活動...", "zh-Hans": "选择活动...", en: "Select event..." },
		copySuccess: { "zh-Hant": "已成功複製表單！", "zh-Hans": "已成功复制表单！", en: "Form copied successfully!" },
		formInfo: { "zh-Hant": "此表單適用於本活動的所有票種", "zh-Hans": "此表单适用于本活动的所有票种", en: "This form applies to all tickets in this event" },
		typeText: { "zh-Hant": "文字輸入", "zh-Hans": "文字输入", en: "Text Input" },
		typeTextarea: { "zh-Hant": "多行文字", "zh-Hans": "多行文字", en: "Textarea" },
		typeSelect: { "zh-Hant": "下拉選單", "zh-Hans": "下拉选单", en: "Dropdown" },
		typeRadio: { "zh-Hant": "單選按鈕", "zh-Hans": "单选按钮", en: "Radio Buttons" },
		typeCheckbox: { "zh-Hant": "勾選框", "zh-Hans": "勾选框", en: "Checkbox" },
		validator: { "zh-Hant": "驗證正規表達式", "zh-Hans": "验证正则表达式", en: "Validation Regex" },
		validatorPlaceholder: { "zh-Hant": "例如：^[A-Z0-9]+$ (選填)", "zh-Hans": "例如：^[A-Z0-9]+$ (选填)", en: "e.g., ^[A-Z0-9]+$ (optional)" },
		useValidator: { "zh-Hant": "使用此正規表達式驗證輸入內容", "zh-Hans": "使用此正则表达式验证输入内容", en: "Use this regex to validate input" },
		enableOther: { "zh-Hant": "允許「其他」選項", "zh-Hans": "允许「其他」选项", en: "Enable 'Other' Option" },
		enableOtherDescription: { "zh-Hant": "使用者可選擇「其他」並輸入自訂內容", "zh-Hans": "使用者可选择「其他」并输入自订内容", en: "Users can select 'Other' and enter custom text" },
		formFields: { "zh-Hant": "表單欄位", "zh-Hans": "表单栏位", en: "Form Fields" },
		fieldName: { "zh-Hant": "欄位名稱", "zh-Hans": "栏位名称", en: "Field Name" },
		fieldSettings: { "zh-Hant": "欄位設定", "zh-Hans": "栏位设定", en: "Field Settings" },
		fieldType: { "zh-Hant": "欄位類型", "zh-Hans": "栏位类型", en: "Field Type" },
		fieldRequired: { "zh-Hant": "必填", "zh-Hans": "必填", en: "Required" },
		fieldOptional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
		deleteField: { "zh-Hant": "刪除欄位", "zh-Hans": "删除栏位", en: "Delete Field" },
		additionalSettings: { "zh-Hant": "其他設定", "zh-Hans": "其他设定", en: "Additional Settings" },
		fieldDescription: { "zh-Hant": "說明文字（使用者可見，支援 Markdown）", "zh-Hans": "说明文字（使用者可见，支援 Markdown）", en: "Description (User-visible, Markdown supported)" },
		optionSettings: { "zh-Hant": "選項設定", "zh-Hans": "选项设定", en: "Option Settings" },
		newOption: { "zh-Hant": "新選項", "zh-Hans": "新选项", en: "New Option" },
		promptSettings: { "zh-Hant": "自動完成提示設定", "zh-Hans": "自动完成提示设定", en: "Autocomplete Prompts" },
		promptDescription: {
			"zh-Hant": "設定文字輸入框的自動完成提示，每行一個提示（使用者輸入時會顯示建議）",
			"zh-Hans": "设定文字输入框的自动完成提示，每行一个提示（使用者输入时会显示建议）",
			en: "Configure autocomplete prompts for text input, one per line (suggestions shown as user types)"
		},
		howManyFields: { "zh-Hant": "個欄位", "zh-Hans": "个栏位", en: "fields" },
		currentlyNoFormFields: { "zh-Hant": "目前尚無表單欄位", "zh-Hans": "目前尚无表单栏位", en: "There are currently no form fields" },
		clickNewToAdd: { "zh-Hant": "點擊下方「新增問題」按鈕開始建立表單", "zh-Hans": "点击下方「新增问题」按钮开始建立表单", en: "Click the button below to add a new question" },
		displayFilters: { "zh-Hant": "顯示條件", "zh-Hans": "显示条件", en: "Display Conditions" },
		enableFilters: { "zh-Hant": "啟用條件過濾", "zh-Hans": "启用条件过滤", en: "Enable Conditional Display" },
		filterAction: { "zh-Hant": "符合條件時", "zh-Hans": "符合条件时", en: "When conditions match" },
		actionDisplay: { "zh-Hant": "顯示此欄位", "zh-Hans": "显示此栏位", en: "Display field" },
		actionHide: { "zh-Hant": "隱藏此欄位", "zh-Hans": "隐藏此栏位", en: "Hide field" },
		filterOperator: { "zh-Hant": "條件連接", "zh-Hans": "条件连接", en: "Logic Operator" },
		operatorAnd: { "zh-Hant": "全部符合 (AND)", "zh-Hans": "全部符合 (AND)", en: "All match (AND)" },
		operatorOr: { "zh-Hant": "任一符合 (OR)", "zh-Hans": "任一符合 (OR)", en: "Any match (OR)" },
		addCondition: { "zh-Hant": "新增條件", "zh-Hans": "新增条件", en: "Add Condition" },
		conditionType: { "zh-Hant": "條件類型", "zh-Hans": "条件类型", en: "Condition Type" },
		typeTicket: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
		typeField: { "zh-Hant": "欄位值", "zh-Hans": "栏位值", en: "Field Value" },
		typeTime: { "zh-Hant": "時間", "zh-Hans": "时间", en: "Time" },
		selectTicket: { "zh-Hant": "選擇票種", "zh-Hans": "选择票种", en: "Select Ticket" },
		selectField: { "zh-Hant": "選擇欄位", "zh-Hans": "选择栏位", en: "Select Field" },
		fieldOperator: { "zh-Hant": "條件", "zh-Hans": "条件", en: "Condition" },
		operatorEquals: { "zh-Hant": "等於", "zh-Hans": "等于", en: "Equals" },
		operatorFilled: { "zh-Hant": "已填寫", "zh-Hans": "已填写", en: "Filled" },
		operatorNotFilled: { "zh-Hant": "未填寫", "zh-Hans": "未填写", en: "Not Filled" },
		fieldValue: { "zh-Hant": "欄位值", "zh-Hans": "栏位值", en: "Field Value" },
		startTime: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start Time" },
		endTime: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End Time" },
		deleteCondition: { "zh-Hant": "刪除條件", "zh-Hans": "删除条件", en: "Delete Condition" },
		expandAll: { "zh-Hant": "展開全部", "zh-Hans": "展开全部", en: "Expand All" },
		collapseAll: { "zh-Hant": "收起全部", "zh-Hans": "收起全部", en: "Collapse All" }
	});

	const fieldTypes = [
		{ value: "text", label: t.typeText },
		{ value: "textarea", label: t.typeTextarea },
		{ value: "select", label: t.typeSelect },
		{ value: "radio", label: t.typeRadio },
		{ value: "checkbox", label: t.typeCheckbox }
	];

	const loadAllEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success) {
				dispatch({ type: "allEventsLoaded", events: (response.data || []).filter(e => e.id !== currentEventId) });
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, [currentEventId]);

	const loadEventTickets = useCallback(async () => {
		if (!currentEventId) return;

		try {
			const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
			if (response.success) {
				dispatch({ type: "eventTicketsLoaded", tickets: response.data || [] });
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		}
	}, [currentEventId]);

	const loadFormFields = useCallback(async () => {
		if (!currentEventId) return;

		try {
			const response = await adminEventFormFieldsAPI.getAll({ eventId: currentEventId });

			if (response.success) {
				const loadedFields: Question[] = (response.data || []).map((field: EventFormField): Question => {
					let options: Array<{ id?: string; en: string; "zh-Hant"?: string; "zh-Hans"?: string }> = [];
					let prompts: Record<string, string[]> = {};

					const fieldWithOptions = field as EventFormField & { options?: unknown };
					const rawOptions = fieldWithOptions.options || field.values;

					if (rawOptions && Array.isArray(rawOptions)) {
						options = rawOptions.map((opt: unknown) => {
							if (typeof opt === "object" && opt !== null) {
								if ("label" in opt) {
									const optWithLabel = opt as { label: unknown; value?: string };
									if (typeof optWithLabel.label === "object" && optWithLabel.label !== null) {
										const label = optWithLabel.label as Record<string, string>;
										return {
											id: crypto.randomUUID(),
											en: label["en"] || optWithLabel.value || "",
											"zh-Hant": label["zh-Hant"] || "",
											"zh-Hans": label["zh-Hans"] || ""
										};
									}
								}
								const optRecord = opt as Record<string, string>;
								return {
									id: crypto.randomUUID(),
									en: optRecord["en"] || "",
									"zh-Hant": optRecord["zh-Hant"] || "",
									"zh-Hans": optRecord["zh-Hans"] || ""
								};
							}
							return { id: crypto.randomUUID(), en: String(opt), "zh-Hant": "", "zh-Hans": "" };
						});
					} else if (rawOptions && typeof rawOptions === "string") {
						try {
							const parsed = JSON.parse(rawOptions);
							if (Array.isArray(parsed)) {
								options = parsed.map((opt: unknown) =>
									typeof opt === "string"
										? { id: crypto.randomUUID(), en: opt, "zh-Hant": "", "zh-Hans": "" }
										: { id: crypto.randomUUID(), ...(opt as { en: string; "zh-Hant"?: string; "zh-Hans"?: string }) }
								);
							}
						} catch {
							console.warn("Failed to parse field values as JSON:", rawOptions);
						}
					}

					const rawPrompts = field.prompts;
					if (rawPrompts && typeof rawPrompts === "object" && !Array.isArray(rawPrompts)) {
						prompts = rawPrompts as Record<string, string[]>;
					} else if (rawPrompts && typeof rawPrompts === "string") {
						try {
							const parsed = JSON.parse(rawPrompts);
							if (typeof parsed === "object" && !Array.isArray(parsed)) {
								prompts = parsed as Record<string, string[]>;
							}
						} catch {
							console.warn("Failed to parse field prompts as JSON:", rawPrompts);
						}
					}

					const fieldName = field.name && typeof field.name === "object" ? field.name["en"] || Object.values(field.name)[0] : field.name || "";
					const nameObj = field.name && typeof field.name === "object" ? field.name : { en: fieldName };

					const descriptionObj = field.description && typeof field.description === "object" && field.description !== null ? field.description : {};

					// Convert Date to string for state management
					const filters: FieldFilterState | undefined = field.filters
						? {
								...field.filters,
								conditions: field.filters.conditions.map(condition => ({
									...condition,
									startTime: condition.startTime instanceof Date ? toDateTimeLocalString(condition.startTime) : condition.startTime,
									endTime: condition.endTime instanceof Date ? toDateTimeLocalString(condition.endTime) : condition.endTime
								}))
							}
						: undefined;

					return {
						id: field.id,
						label: fieldName,
						labelEn: nameObj.en || "",
						labelZhHant: nameObj["zh-Hant"] || "",
						labelZhHans: nameObj["zh-Hans"] || "",
						type: field.type,
						required: field.required || false,
						description: typeof field.description === "string" ? field.description : "",
						descriptionEn: descriptionObj.en || "",
						descriptionZhHant: descriptionObj["zh-Hant"] || "",
						descriptionZhHans: descriptionObj["zh-Hans"] || "",
						validater: field.validater || "",
						options,
						prompts,
						filters,
						enableOther: field.enableOther || false
					};
				});

				dispatch({ type: "formFieldsLoaded", questions: loadedFields });
				originalFieldIdsRef.current = loadedFields.flatMap((f: Question) => (f.id.startsWith("temp-") ? [] : [f.id]));
			} else {
				throw new Error(response.message || "Failed to load form fields");
			}
		} catch (error) {
			console.error("Failed to load form fields:", error);
		}
	}, [currentEventId]);

	async function copyFormFromEvent(sourceEventId: string) {
		if (!sourceEventId) return;

		try {
			const response = await adminEventFormFieldsAPI.getAll({ eventId: sourceEventId });

			if (response.success && response.data) {
				const copiedQuestions: Question[] = response.data.map((field: EventFormField): Question => {
					let options: Array<{ id?: string; en: string; "zh-Hant"?: string; "zh-Hans"?: string }> = [];
					let prompts: Record<string, string[]> = {};

					const fieldWithOptions = field as EventFormField & { options?: unknown };
					const rawOptions = fieldWithOptions.options || field.values;

					if (rawOptions && Array.isArray(rawOptions)) {
						options = rawOptions.map((opt: unknown) => {
							if (typeof opt === "object" && opt !== null) {
								if ("label" in opt) {
									const optWithLabel = opt as { label: unknown; value?: string };
									if (typeof optWithLabel.label === "object" && optWithLabel.label !== null) {
										const label = optWithLabel.label as Record<string, string>;
										return {
											id: crypto.randomUUID(),
											en: label["en"] || optWithLabel.value || "",
											"zh-Hant": label["zh-Hant"] || "",
											"zh-Hans": label["zh-Hans"] || ""
										};
									}
								}
								const optRecord = opt as Record<string, string>;
								return {
									id: crypto.randomUUID(),
									en: optRecord["en"] || "",
									"zh-Hant": optRecord["zh-Hant"] || "",
									"zh-Hans": optRecord["zh-Hans"] || ""
								};
							}
							return { id: crypto.randomUUID(), en: String(opt), "zh-Hant": "", "zh-Hans": "" };
						});
					} else if (rawOptions && typeof rawOptions === "string") {
						try {
							const parsed = JSON.parse(rawOptions);
							if (Array.isArray(parsed)) {
								options = parsed.map((opt: unknown) =>
									typeof opt === "string"
										? { id: crypto.randomUUID(), en: opt, "zh-Hant": "", "zh-Hans": "" }
										: { id: crypto.randomUUID(), ...(opt as { en: string; "zh-Hant"?: string; "zh-Hans"?: string }) }
								);
							}
						} catch {
							console.warn("Failed to parse field values as JSON:", rawOptions);
						}
					}

					const rawPrompts = field.prompts;
					if (rawPrompts && typeof rawPrompts === "object" && !Array.isArray(rawPrompts)) {
						prompts = rawPrompts as Record<string, string[]>;
					} else if (rawPrompts && typeof rawPrompts === "string") {
						try {
							const parsed = JSON.parse(rawPrompts);
							if (typeof parsed === "object" && !Array.isArray(parsed)) {
								prompts = parsed as Record<string, string[]>;
							}
						} catch {
							console.warn("Failed to parse field prompts as JSON:", rawPrompts);
						}
					}

					const fieldName = field.name && typeof field.name === "object" ? field.name["en"] || Object.values(field.name)[0] : field.name || "";
					const nameObj = field.name && typeof field.name === "object" ? field.name : { en: fieldName };

					// Parse description as localized object
					const descriptionObj = field.description && typeof field.description === "object" && field.description !== null ? field.description : {};

					// Convert Date to string for state management
					const filters: FieldFilterState | undefined = field.filters
						? {
								...field.filters,
								conditions: field.filters.conditions.map(condition => ({
									...condition,
									startTime: condition.startTime instanceof Date ? toDateTimeLocalString(condition.startTime) : condition.startTime,
									endTime: condition.endTime instanceof Date ? toDateTimeLocalString(condition.endTime) : condition.endTime
								}))
							}
						: undefined;

					return {
						id: "temp-" + crypto.randomUUID(),
						label: fieldName,
						labelEn: nameObj.en || "",
						labelZhHant: nameObj["zh-Hant"] || "",
						labelZhHans: nameObj["zh-Hans"] || "",
						type: field.type,
						required: field.required || false,
						description: typeof field.description === "string" ? field.description : "",
						descriptionEn: descriptionObj.en || "",
						descriptionZhHant: descriptionObj["zh-Hant"] || "",
						descriptionZhHans: descriptionObj["zh-Hans"] || "",
						validater: field.validater || "",
						filters,
						options,
						prompts,
						enableOther: field.enableOther || false
					};
				});

				dispatch({ type: "formCopied", questions: copiedQuestions });
				showAlert(t.copySuccess, "success");
			}
		} catch (error) {
			console.error("Failed to copy form:", error);
			showAlert("複製失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	async function saveForm() {
		if (!currentEventId) {
			showAlert("無法保存：未找到票種", "error");
			return;
		}

		try {
			dispatch({ type: "setSaving", value: true });
			const formFieldsData = questions.map((q, index) => {
				// Convert string back to Date for API submission
				const filters: FieldFilter | null = q.filters
					? {
							...q.filters,
							conditions: q.filters.conditions.map(condition => ({
								...condition,
								startTime: condition.startTime ? new Date(condition.startTime) : undefined,
								endTime: condition.endTime ? new Date(condition.endTime) : undefined
							}))
						}
					: null;

				return {
					id: q.id.startsWith("temp-") ? undefined : q.id,
					name: {
						en: q.labelEn || q.label,
						"zh-Hant": q.labelZhHant || "",
						"zh-Hans": q.labelZhHans || ""
					},
					description: {
						en: q.descriptionEn || "",
						"zh-Hant": q.descriptionZhHant || "",
						"zh-Hans": q.descriptionZhHans || ""
					},
					type: q.type as "text" | "textarea" | "select" | "checkbox" | "radio",
					required: q.required,
					validater: q.validater || "",
					values: q.options?.map(({ id: _id, ...option }) => option),
					prompts: q.prompts,
					filters,
					enableOther: q.type === "radio" ? q.enableOther || false : undefined,
					order: index
				};
			});

			const currentFieldIds = new Set(questions.flatMap(q => (q.id.startsWith("temp-") ? [] : [q.id])));

			const deletedFieldIds = originalFieldIdsRef.current.filter(originalId => !currentFieldIds.has(originalId));

			await Promise.all([
				...deletedFieldIds.map(fieldId => adminEventFormFieldsAPI.delete(fieldId)),
				...formFieldsData.map(fieldData => {
					const data = {
						eventId: currentEventId,
						order: fieldData.order,
						type: fieldData.type,
						name: fieldData.name,
						description: fieldData.description,
						placeholder: "",
						required: fieldData.required,
						validater: fieldData.validater || "",
						values: fieldData.values,
						prompts: fieldData.prompts,
						filters: fieldData.filters || undefined,
						enableOther: fieldData.enableOther
					};

					if (fieldData.id) {
						return adminEventFormFieldsAPI.update(fieldData.id, data);
					}
					return adminEventFormFieldsAPI.create(data);
				})
			]);

			await loadFormFields();

			showAlert("表單已儲存！", "success");
		} catch (error) {
			console.error("Failed to save form:", error);
			showAlert("儲存失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			dispatch({ type: "setSaving", value: false });
		}
	}

	function addQuestion() {
		dispatch({
			type: "addQuestion",
			question: {
				id: "temp-" + crypto.randomUUID(),
				label: "New Question",
				labelEn: "New Question",
				labelZhHant: "新問題",
				labelZhHans: "新问题",
				type: "text",
				required: false
			}
		});
	}

	function updateQuestion(id: string, updates: Partial<Question>) {
		dispatch({ type: "updateQuestion", id, updates });
	}

	function updateQuestionOption(question: Question, optionIndex: number, updates: Partial<{ en: string; "zh-Hant": string; "zh-Hans": string }>) {
		const newOptions = [...(question.options || [])];
		const currentOption = newOptions[optionIndex];
		newOptions[optionIndex] = {
			id: currentOption?.id || crypto.randomUUID(),
			en: currentOption?.en || "",
			"zh-Hant": currentOption?.["zh-Hant"] || "",
			"zh-Hans": currentOption?.["zh-Hans"] || "",
			...updates
		};
		updateQuestion(question.id, { options: newOptions });
	}

	function addQuestionOption(question: Question) {
		const newOptions = [...(question.options || []), { id: crypto.randomUUID(), en: "", "zh-Hant": "", "zh-Hans": "" }];
		updateQuestion(question.id, { options: newOptions });
	}

	function deleteQuestion(id: string) {
		dispatch({ type: "deleteQuestion", id });
	}

	function toggleCollapse(id: string) {
		dispatch({ type: "toggleCollapse", id });
	}

	function expandAll() {
		dispatch({ type: "expandAll" });
	}

	function collapseAll() {
		dispatch({ type: "collapseAll" });
	}

	function handleDragStart(e: React.DragEvent<HTMLElement>, index: number) {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
		e.dataTransfer.setData("dragIndex", index.toString());
		dispatch({ type: "fieldDragStarted", index });
	}

	function handleDragEnd() {
		dispatch({ type: "fieldDragCleared" });
	}

	function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";

		if (draggedIndex !== null && draggedIndex !== index) {
			dispatch({ type: "fieldDragOver", index });
		}
	}

	function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		dispatch({ type: "fieldDragCleared" });
	}

	async function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));

		dispatch({ type: "fieldDragCleared" });

		if (dragIndex === dropIndex) return;

		const newQuestions = [...questions];
		const draggedItem = newQuestions[dragIndex];

		newQuestions.splice(dragIndex, 1);
		newQuestions.splice(dropIndex, 0, draggedItem);

		dispatch({ type: "questionsReordered", questions: newQuestions });

		if (currentEventId) {
			try {
				const fieldOrders = newQuestions.map((q, index) => ({
					id: q.id,
					order: index
				}));

				await adminEventFormFieldsAPI.reorder(currentEventId, { fieldOrders });
			} catch (error) {
				console.error("Failed to reorder fields:", error);
				showAlert("重新排序失敗：" + (error instanceof Error ? error.message : String(error)), "error");
				await loadFormFields();
			}
		}
	}

	function handleOptionDragStart(e: React.DragEvent<HTMLElement>, questionId: string, optionIndex: number) {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("optionIndex", optionIndex.toString());
		dispatch({ type: "optionDragStarted", questionId, optionIndex });
	}

	function handleOptionDragEnd(e: React.DragEvent<HTMLElement>) {
		e.stopPropagation();
		dispatch({ type: "optionDragCleared" });
	}

	function handleOptionDragOver(e: React.DragEvent<HTMLDivElement>, optionIndex: number) {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";

		if (draggedOptionIndex !== null && draggedOptionIndex !== optionIndex) {
			dispatch({ type: "optionDragOver", optionIndex });
		}
	}

	function handleOptionDragLeave(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		dispatch({ type: "optionDragCleared" });
	}

	function handleOptionDrop(e: React.DragEvent<HTMLDivElement>, questionId: string, dropIndex: number) {
		e.preventDefault();
		e.stopPropagation();
		const dragIndex = parseInt(e.dataTransfer.getData("optionIndex"));

		dispatch({ type: "optionDragCleared" });

		if (dragIndex === dropIndex) return;

		const question = questions.find(q => q.id === questionId);
		if (!question || !question.options) return;

		const newOptions = [...question.options];
		const draggedOption = newOptions[dragIndex];

		newOptions.splice(dragIndex, 1);
		newOptions.splice(dropIndex, 0, draggedOption);

		updateQuestion(questionId, { options: newOptions });
	}

	useEffect(() => {
		if (currentEventId) {
			loadFormFields();
			loadAllEvents();
			loadEventTickets();
		}
	}, [currentEventId, loadFormFields, loadAllEvents, loadEventTickets]);

	if (!currentEventId) {
		return (
			<>
				<main>
					<AdminHeader title={t.title} />
					<div className="admin-empty p-16">{t.noTicket}</div>
					<div className="text-center mt-4">
						<Button onClick={() => (window.location.href = `/${locale}/admin/events`)}>{t.backToTickets}</Button>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<main className="p-6 md:p-4">
				<div id="form-editor" className="max-w-[900px] mx-auto">
					<AdminHeader title={t.title} description={t.formInfo} />

					{/* Copy From Event Section */}
					{allEvents.length > 0 && (
						<div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
							<Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.copyFrom}</Label>
							<Select
								value={copyFromEventId}
								onValueChange={value => {
									if (value && confirm("確定要複製該活動的表單嗎？這會取代目前的表單內容。")) {
										copyFormFromEvent(value);
									} else {
										dispatch({ type: "setCopyFromEventId", value: "" });
									}
								}}
							>
								<SelectTrigger className="w-full max-w-[400px]">
									<SelectValue placeholder={t.selectEvent} />
								</SelectTrigger>
								<SelectContent>
									{allEvents.map(event => (
										<SelectItem key={event.id} value={event.id}>
											{event.name && typeof event.name === "object" ? event.name["en"] || Object.values(event.name)[0] : event.name || ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{/* Questions List */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
							<h2 className="text-base font-semibold text-gray-800 dark:text-gray-400 m-0">{t.formFields}</h2>
							<div className="flex items-center gap-2">
								{questions.length > 0 && (
									<>
										<Button type="button" onClick={expandAll} variant="secondary" className="text-xs py-1.5 px-3">
											{t.expandAll}
										</Button>
										<Button type="button" onClick={collapseAll} variant="secondary" className="text-xs py-1.5 px-3">
											{t.collapseAll}
										</Button>
									</>
								)}
								<span className="text-xs text-gray-800 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 py-1 px-2.5 rounded border dark:border-gray-700">
									{questions.length} {t.howManyFields}
								</span>
							</div>
						</div>

						<div id="questions" className="flex flex-col gap-3">
							{questions.length === 0 && (
								<div className="text-center py-8 px-6 border border-dashed border-gray-400 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
									<p className="text-sm text-gray-600 dark:text-gray-400 m-0 mb-2">{t.currentlyNoFormFields}</p>
									<p className="text-xs text-gray-500 dark:text-gray-500 m-0">{t.clickNewToAdd}</p>
								</div>
							)}
							{questions.map((q, index) => {
								const isDragging = draggedIndex === index;
								const isDropTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;
								const isCollapsed = collapsedItems.has(q.id);

								return (
									<div
										key={q.id}
										data-id={q.id}
										onDragOver={e => handleDragOver(e, index)}
										onDragLeave={handleDragLeave}
										onDrop={e => handleDrop(e, index)}
										className={`bg-white dark:bg-gray-900 border rounded-lg p-4 flex gap-3 relative transition-all duration-200 ${
											isDragging ? "opacity-60 scale-[1.01] shadow-[0_4px_12px_rgba(0,0,0,0.3)]" : ""
										} ${isDropTarget ? "border-primary border-2 shadow-[0_4px_12px_rgba(var(--color-primary-rgb,99,102,241),0.3)]" : "border-gray-300 dark:border-gray-700"}`}
									>
										{/* Drag Handle */}
										<button
											type="button"
											draggable
											onDragStart={e => handleDragStart(e, index)}
											onDragEnd={handleDragEnd}
											className={`cursor-grab select-none flex items-start justify-center transition-colors duration-200 py-2 px-1 touch-none shrink-0 bg-transparent border-0 ${
												isDragging ? "text-primary" : "text-gray-400 dark:text-gray-600"
											}`}
											title="拖曳以重新排序"
											onMouseDown={e => {
												e.currentTarget.style.cursor = "grabbing";
											}}
											onMouseUp={e => {
												e.currentTarget.style.cursor = "grab";
											}}
										>
											<GripVertical size={20} />
										</button>{" "}
										{/* Field Number Badge */}
										<div className="absolute top-3 right-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[0.7rem] font-semibold py-[0.2rem] px-2 rounded">#{index + 1}</div>
										{/* Collapse/Expand Button */}
										<button
											type="button"
											onClick={() => toggleCollapse(q.id)}
											className="absolute top-3 right-12 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
											title={isCollapsed ? "Expand" : "Collapse"}
										>
											{isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
										</button>
										{/* Main Content Area */}
										<div className="flex flex-col gap-4 flex-1 pr-12">
											{/* Summary Header - Always Visible */}
											<button type="button" className="cursor-pointer text-left w-full" onClick={() => toggleCollapse(q.id)}>
												<div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
													{(locale === "zh-Hant" && q.labelZhHant) || (locale === "zh-Hans" && q.labelZhHans) || q.labelEn || q.label || "Untitled Field"}
												</div>
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													{fieldTypes.find(ft => ft.value === q.type)?.label || q.type} • {q.required ? t.fieldRequired : t.fieldOptional}
												</div>
											</button>

											{/* Collapsible Content */}
											{!isCollapsed && (
												<>
													{/* Field Names Section */}
													<div>
														<div className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-wider">{t.fieldName}</div>
														<div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
															<div>
																<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">EN</Label>
																<Input
																	type="text"
																	value={q.labelEn || ""}
																	placeholder="English Label"
																	onChange={e => updateQuestion(q.id, { labelEn: e.target.value, label: e.target.value })}
																	className="w-full text-sm"
																/>
															</div>
															<div>
																<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">繁體中文</Label>
																<Input
																	type="text"
																	value={q.labelZhHant || ""}
																	placeholder="繁體中文標籤"
																	onChange={e => updateQuestion(q.id, { labelZhHant: e.target.value })}
																	className="w-full text-sm"
																/>
															</div>
															<div>
																<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">简体中文</Label>
																<Input
																	type="text"
																	value={q.labelZhHans || ""}
																	placeholder="简体中文标签"
																	onChange={e => updateQuestion(q.id, { labelZhHans: e.target.value })}
																	className="w-full text-sm"
																/>
															</div>
														</div>
													</div>

													{/* Field Configuration Section */}
													<div>
														<div className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-wider">{t.fieldSettings}</div>
														<div className="flex gap-2.5 flex-wrap items-end">
															<div>
																<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.fieldType}</Label>
																<Select value={q.type} onValueChange={value => updateQuestion(q.id, { type: value })}>
																	<SelectTrigger className="min-w-[140px] text-sm">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		{fieldTypes.map(ft => (
																			<SelectItem key={ft.value} value={ft.value}>
																				{ft.label}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															</div>

															<div className="flex gap-1.5 items-end">
																<Button type="button" onClick={() => updateQuestion(q.id, { required: !q.required })} variant={q.required ? "default" : "secondary"} className="text-xs py-2 px-3">
																	{q.required ? t.fieldRequired : t.fieldOptional}
																</Button>
																<Button type="button" onClick={() => deleteQuestion(q.id)} className="text-xs py-2 px-3" variant="destructive" title={t.deleteField}>
																	{t.deleteField}
																</Button>
															</div>
														</div>
													</div>

													{/* Additional Settings Section */}
													<div>
														<div className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-wider">{t.additionalSettings}</div>
														<div className="flex flex-col gap-2.5">
															<div>
																<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.fieldDescription}</Label>
																<div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
																	<div>
																		<Label className="block text-[0.65rem] text-gray-500 dark:text-gray-600 mb-1 font-normal">EN</Label>
																		<Textarea
																			value={q.descriptionEn || ""}
																			placeholder="English description (Markdown supported)"
																			onChange={e => updateQuestion(q.id, { descriptionEn: e.target.value })}
																			className="w-full text-sm min-h-20"
																		/>
																	</div>
																	<div>
																		<Label className="block text-[0.65rem] text-gray-500 dark:text-gray-600 mb-1 font-normal">繁體中文</Label>
																		<Textarea
																			value={q.descriptionZhHant || ""}
																			placeholder="繁體中文描述（支援 Markdown）"
																			onChange={e => updateQuestion(q.id, { descriptionZhHant: e.target.value })}
																			className="w-full text-sm min-h-20"
																		/>
																	</div>
																	<div>
																		<Label className="block text-[0.65rem] text-gray-500 dark:text-gray-600 mb-1 font-normal">简体中文</Label>
																		<Textarea
																			value={q.descriptionZhHans || ""}
																			placeholder="简体中文描述（支持 Markdown）"
																			onChange={e => updateQuestion(q.id, { descriptionZhHans: e.target.value })}
																			className="w-full text-sm min-h-20"
																		/>
																	</div>
																</div>
															</div>

															{(q.type === "text" || q.type === "textarea") && (
																<div>
																	<Label className="block text-[0.7rem] text-gray-600 dark:text-gray-500 mb-1.5 font-medium">{t.validator}</Label>
																	<Input
																		type="text"
																		value={q.validater || ""}
																		placeholder={t.validatorPlaceholder}
																		onChange={e => updateQuestion(q.id, { validater: e.target.value })}
																		className="w-full text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
																	/>
																	<p className="text-[0.7rem] text-gray-600 dark:text-gray-500 mt-1.5 mb-0">{t.useValidator}</p>
																</div>
															)}
															{q.type === "radio" && (
																<div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
																	<Checkbox
																		id={`enableOther-${q.id}`}
																		checked={q.enableOther || false}
																		onCheckedChange={checked => updateQuestion(q.id, { enableOther: !!checked })}
																		className="mt-0.5"
																	/>
																	<div className="flex-1">
																		<Label htmlFor={`enableOther-${q.id}`} className="text-xs font-semibold text-blue-900 dark:text-blue-100 cursor-pointer">
																			{t.enableOther}
																		</Label>
																		<p className="text-[0.7rem] text-blue-700 dark:text-blue-300 mt-1">{t.enableOtherDescription}</p>
																	</div>
																</div>
															)}
														</div>
													</div>
													{["select", "radio", "checkbox"].includes(q.type) && (
														<div>
															<div className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-wider">{t.optionSettings}</div>
															<div className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col gap-2.5">
																{(q.options || []).map((opt, i) => {
																	const isOptionDragging = draggedQuestionId === q.id && draggedOptionIndex === i;
																	const isOptionDropTarget = draggedQuestionId === q.id && dragOverOptionIndex === i && draggedOptionIndex !== null && draggedOptionIndex !== i;

																	return (
																		<div
																			key={opt.id}
																			onDragOver={e => handleOptionDragOver(e, i)}
																			onDragLeave={handleOptionDragLeave}
																			onDrop={e => handleOptionDrop(e, q.id, i)}
																			className={`flex gap-2 items-stretch p-2 rounded-md transition-all ${
																				isOptionDragging
																					? "bg-gray-200 dark:bg-gray-800 opacity-60"
																					: isOptionDropTarget
																						? "bg-gray-100 dark:bg-(--color-gray-750) border border-primary shadow-[0_0_0_2px_rgba(99,102,241,0.1)]"
																						: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
																			}`}
																		>
																			<div className="flex items-center gap-2">
																				<button
																					type="button"
																					draggable
																					onDragStart={e => handleOptionDragStart(e, q.id, i)}
																					onDragEnd={handleOptionDragEnd}
																					className={`cursor-grab ${isOptionDragging ? "text-primary" : "text-gray-400 dark:text-gray-600"} select-none p-1 flex items-center bg-transparent border-0`}
																					title="拖曳以重新排序選項"
																					onMouseDown={e => {
																						e.currentTarget.style.cursor = "grabbing";
																					}}
																					onMouseUp={e => {
																						e.currentTarget.style.cursor = "grab";
																					}}
																				>
																					⋮⋮
																				</button>
																				<span className="text-xs text-gray-600 dark:text-gray-500 font-semibold min-w-6">{i + 1}</span>
																			</div>
																			<div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 flex-1">
																				<Input
																					type="text"
																					value={typeof opt === "object" ? opt.en || "" : opt}
																					placeholder="English"
																					onChange={e => updateQuestionOption(q, i, { en: e.target.value })}
																					className="text-xs bg-gray-100 dark:bg-gray-950"
																				/>
																				<Input
																					type="text"
																					value={typeof opt === "object" ? opt["zh-Hant"] || "" : ""}
																					placeholder="繁體中文"
																					onChange={e => updateQuestionOption(q, i, { "zh-Hant": e.target.value })}
																					className="text-xs bg-gray-100 dark:bg-gray-950"
																				/>
																				<Input
																					type="text"
																					value={typeof opt === "object" ? opt["zh-Hans"] || "" : ""}
																					placeholder="简体中文"
																					onChange={e => updateQuestionOption(q, i, { "zh-Hans": e.target.value })}
																					className="text-xs bg-gray-100 dark:bg-gray-950"
																				/>
																			</div>
																			<Button
																				type="button"
																				onClick={() => {
																					const newOptions = [...(q.options || [])];
																					newOptions.splice(i, 1);
																					updateQuestion(q.id, { options: newOptions });
																				}}
																				className="text-xs py-[0.45rem] px-2.5 bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 text-red-600 dark:text-red-400 shrink-0"
																				title="刪除此選項"
																			>
																				<X />
																			</Button>
																		</div>
																	);
																})}
																<Button
																	type="button"
																	onClick={() => addQuestionOption(q)}
																	className="text-xs py-2 px-3 bg-white dark:bg-gray-800 border border-dashed border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-400 w-full flex justify-center items-center gap-1.5"
																>
																	<span className="text-base">
																		<Plus />
																	</span>{" "}
																	{t.newOption}
																</Button>
															</div>
														</div>
													)}

													{/* Prompts Section for text inputs */}
													{q.type === "text" && (
														<div>
															<div className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-2 uppercase tracking-wider">{t.promptSettings}</div>
															<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.promptDescription}</p>
															<div className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col gap-3">
																<div className="grid grid-cols-3 gap-3">
																	<div>
																		<Label htmlFor={`prompts-en-${q.id}`} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
																			English
																		</Label>
																		<Textarea
																			id={`prompts-en-${q.id}`}
																			value={(q.prompts?.en || []).join("\n")}
																			onChange={e => {
																				const lines = e.target.value.split("\n");
																				updateQuestion(q.id, { prompts: { ...(q.prompts || {}), en: lines } });
																			}}
																			placeholder="Option 1&#10;Option 2&#10;Option 3"
																			className="text-xs bg-gray-100 dark:bg-gray-950 min-h-[120px]"
																		/>
																	</div>
																	<div>
																		<Label htmlFor={`prompts-zh-hant-${q.id}`} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
																			繁體中文
																		</Label>
																		<Textarea
																			id={`prompts-zh-hant-${q.id}`}
																			value={(q.prompts?.["zh-Hant"] || []).join("\n")}
																			onChange={e => {
																				const lines = e.target.value.split("\n");
																				updateQuestion(q.id, { prompts: { ...(q.prompts || {}), "zh-Hant": lines } });
																			}}
																			placeholder="選項 1&#10;選項 2&#10;選項 3"
																			className="text-xs bg-gray-100 dark:bg-gray-950 min-h-[120px]"
																		/>
																	</div>
																	<div>
																		<Label htmlFor={`prompts-zh-hans-${q.id}`} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
																			简体中文
																		</Label>
																		<Textarea
																			id={`prompts-zh-hans-${q.id}`}
																			value={(q.prompts?.["zh-Hans"] || []).join("\n")}
																			onChange={e => {
																				const lines = e.target.value.split("\n");
																				updateQuestion(q.id, { prompts: { ...(q.prompts || {}), "zh-Hans": lines } });
																			}}
																			placeholder="选项 1&#10;选项 2&#10;选项 3"
																			className="text-xs bg-gray-100 dark:bg-gray-950 min-h-[120px]"
																		/>
																	</div>
																</div>
															</div>
														</div>
													)}

													{/* Display Filters Section */}
													<DisplayFiltersSection question={q} questions={questions} eventTickets={eventTickets} t={t} updateQuestion={updateQuestion} />
												</>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="sticky bottom-0 bg-white dark:bg-gray-900 py-4 mt-6 flex gap-3 justify-center border-t border-gray-300 dark:border-gray-700">
						<Button
							id="add-question"
							type="button"
							onClick={addQuestion}
							className="text-[0.9rem] py-2.5 px-5 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 flex items-center gap-2 font-medium"
						>
							<Plus size={18} /> {t.addQuestion}
						</Button>
						<Button
							id="save-form"
							type="button"
							onClick={saveForm}
							className="text-[0.9rem] py-2.5 px-5 border border-primary text-black dark:text-white flex items-center gap-2 font-semibold shadow-[0_2px_8px_rgba(var(--color-primary-rgb,99,102,241),0.25)]"
							isLoading={isSaving}
						>
							<Save size={18} /> {t.save}
						</Button>
					</div>
				</div>
			</main>
		</>
	);
}

export default function FormsPage() {
	return useFormsPageView();
}
