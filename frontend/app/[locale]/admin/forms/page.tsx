"use client";

import AdminNav from "@/components/AdminNav";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventFormFieldsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { Event, EventFormField, FieldFilter, Ticket } from "@/lib/types/api";
import { Save, Plus, GripVertical, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

type ShowIf = {
	sourceId: string;
	values: string[];
};

type Question = {
	id: string;
	label: string;
	labelEn?: string;
	labelZhHant?: string;
	labelZhHans?: string;
	type: string;
	required: boolean;
	description?: string;
	validater?: string;
	options?: Array<{
		en: string;
		"zh-Hant"?: string;
		"zh-Hans"?: string;
	}>;
	showIf?: ShowIf;
	filters?: FieldFilter;
};

export default function FormsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [allEvents, setAllEvents] = useState<Event[]>([]);
	const [copyFromEventId, setCopyFromEventId] = useState<string>("");
	const [originalFieldIds, setOriginalFieldIds] = useState<string[]>([]);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);
	const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(null);
	const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
	const [eventTickets, setEventTickets] = useState<Ticket[]>([]);

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
		validatorPlaceholder: { "zh-Hant": "例如: ^[A-Z0-9]+$ (選填)", "zh-Hans": "例如: ^[A-Z0-9]+$ (选填)", en: "e.g., ^[A-Z0-9]+$ (optional)" },
		useValidator: { "zh-Hant": "使用此正規表達式驗證輸入內容", "zh-Hans": "使用此正则表达式验证输入内容", en: "Use this regex to validate input" },
		formFields: { "zh-Hant": "表單欄位", "zh-Hans": "表单栏位", en: "Form Fields" },
		fieldName: { "zh-Hant": "欄位名稱", "zh-Hans": "栏位名称", en: "Field Name" },
		fieldSettings: { "zh-Hant": "欄位設定", "zh-Hans": "栏位设定", en: "Field Settings" },
		fieldType: { "zh-Hant": "欄位類型", "zh-Hans": "栏位类型", en: "Field Type" },
		fieldRequired: { "zh-Hant": "必填", "zh-Hans": "必填", en: "Required" },
		fieldOptional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
		deleteField: { "zh-Hant": "刪除欄位", "zh-Hans": "删除栏位", en: "Delete Field" },
		additionalSettings: { "zh-Hant": "其他設定", "zh-Hans": "其他设定", en: "Additional Settings" },
		fieldDescription: { "zh-Hant": "說明文字（選填）", "zh-Hans": "说明文字（选填）", en: "Description (optional)" },
		optionSettings: { "zh-Hant": "選項設定", "zh-Hans": "选项设定", en: "Option Settings" },
		newOption: { "zh-Hant": "新選項", "zh-Hans": "新选项", en: "New Option" },
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
		deleteCondition: { "zh-Hant": "刪除條件", "zh-Hans": "删除条件", en: "Delete Condition" }
	});

	const fieldTypes = [
		{ value: "text", label: t.typeText },
		{ value: "textarea", label: t.typeTextarea },
		{ value: "select", label: t.typeSelect },
		{ value: "radio", label: t.typeRadio },
		{ value: "checkbox", label: t.typeCheckbox }
	];

	const loadEvent = useCallback(async () => {
		if (!currentEventId) {
			console.error("No event ID available");
			return;
		}

		try {
			const response = await adminEventsAPI.getById(currentEventId);
			if (response.success && response.data) {
				setCurrentEvent(response.data);
			}
		} catch (error) {
			console.error("Failed to load event:", error);
		}
	}, [currentEventId]);

	const loadAllEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success) {
				setAllEvents((response.data || []).filter(e => e.id !== currentEvent?.id));
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, [currentEvent?.id]);

	const loadEventTickets = useCallback(async () => {
		if (!currentEvent?.id) return;

		try {
			const response = await adminTicketsAPI.getAll({ eventId: currentEvent.id });
			if (response.success) {
				setEventTickets(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		}
	}, [currentEvent?.id]);

	const loadFormFields = useCallback(async () => {
		if (!currentEvent?.id) return;

		try {
			const response = await adminEventFormFieldsAPI.getAll({ eventId: currentEvent.id });

			if (response.success) {
				const loadedFields = (response.data || []).map((field: EventFormField) => {
					let options: Array<{ en: string; "zh-Hant"?: string; "zh-Hans"?: string }> = [];

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
											en: label["en"] || optWithLabel.value || "",
											"zh-Hant": label["zh-Hant"] || "",
											"zh-Hans": label["zh-Hans"] || ""
										};
									}
								}
								const optRecord = opt as Record<string, string>;
								return {
									en: optRecord["en"] || "",
									"zh-Hant": optRecord["zh-Hant"] || "",
									"zh-Hans": optRecord["zh-Hans"] || ""
								};
							}
							return { en: String(opt), "zh-Hant": "", "zh-Hans": "" };
						});
					} else if (rawOptions && typeof rawOptions === "string") {
						try {
							const parsed = JSON.parse(rawOptions);
							if (Array.isArray(parsed)) {
								options = parsed.map((opt: unknown) => (typeof opt === "string" ? { en: opt, "zh-Hant": "", "zh-Hans": "" } : (opt as { en: string; "zh-Hant"?: string; "zh-Hans"?: string })));
							}
						} catch {
							console.warn("Failed to parse field values as JSON:", rawOptions);
						}
					}

					const fieldName = typeof field.name === "object" ? field.name["en"] || Object.values(field.name)[0] : field.name;

					const nameObj = typeof field.name === "object" ? field.name : { en: fieldName };

					return {
						id: field.id,
						label: field.description || fieldName,
						labelEn: nameObj.en || "",
						labelZhHant: nameObj["zh-Hant"] || "",
						labelZhHans: nameObj["zh-Hans"] || "",
						type: field.type,
						required: field.required || false,
						description: field.description || "",
						validater: field.validater || "",
						options,
						filters: field.filters || undefined
					};
				});

				setQuestions(loadedFields);
				setOriginalFieldIds(loadedFields.map((f: Question) => f.id).filter((id: string) => !id.startsWith("temp-")));
			} else {
				throw new Error(response.message || "Failed to load form fields");
			}
		} catch (error) {
			console.error("Failed to load form fields:", error);
		}
	}, [currentEvent?.id]);

	async function copyFormFromEvent(sourceEventId: string) {
		if (!sourceEventId) return;

		try {
			const response = await adminEventFormFieldsAPI.getAll({ eventId: sourceEventId });

			if (response.success && response.data) {
				const copiedQuestions = response.data.map((field: EventFormField) => {
					let options: Array<{ en: string; "zh-Hant"?: string; "zh-Hans"?: string }> = [];

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
											en: label["en"] || optWithLabel.value || "",
											"zh-Hant": label["zh-Hant"] || "",
											"zh-Hans": label["zh-Hans"] || ""
										};
									}
								}
								const optRecord = opt as Record<string, string>;
								return {
									en: optRecord["en"] || "",
									"zh-Hant": optRecord["zh-Hant"] || "",
									"zh-Hans": optRecord["zh-Hans"] || ""
								};
							}
							return { en: String(opt), "zh-Hant": "", "zh-Hans": "" };
						});
					} else if (rawOptions && typeof rawOptions === "string") {
						try {
							const parsed = JSON.parse(rawOptions);
							if (Array.isArray(parsed)) {
								options = parsed.map((opt: unknown) => (typeof opt === "string" ? { en: opt, "zh-Hant": "", "zh-Hans": "" } : (opt as { en: string; "zh-Hant"?: string; "zh-Hans"?: string })));
							}
						} catch {
							console.warn("Failed to parse field values as JSON:", rawOptions);
						}
					}

					const fieldName = typeof field.name === "object" ? field.name["en"] || Object.values(field.name)[0] : field.name;
					const nameObj = typeof field.name === "object" ? field.name : { en: fieldName };

					return {
						id: "temp-" + crypto.randomUUID(),
						label: fieldName,
						labelEn: nameObj.en || "",
						labelZhHant: nameObj["zh-Hant"] || "",
						labelZhHans: nameObj["zh-Hans"] || "",
						type: field.type,
						required: field.required || false,
						description: field.description || "",
						validater: field.validater || "",
						filters: field.filters || undefined,
						options
					};
				});

				setQuestions(copiedQuestions);
				setCopyFromEventId("");
				showAlert(t.copySuccess, "success");
			}
		} catch (error) {
			console.error("Failed to copy form:", error);
			showAlert("複製失敗: " + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	async function saveForm() {
		if (!currentEvent?.id) {
			showAlert("無法保存：未找到票種", "error");
			return;
		}

		try {
			const formFieldsData = questions.map((q, index) => ({
				id: q.id.startsWith("temp-") ? undefined : q.id,
				name: {
					en: q.labelEn || q.label,
					"zh-Hant": q.labelZhHant || "",
					"zh-Hans": q.labelZhHans || ""
				},
				description: q.description,
				type: q.type as "text" | "textarea" | "select" | "checkbox" | "radio",
				required: q.required,
				validater: q.validater || "",
				values: q.options,
				filters: q.filters || null,
				order: index
			}));

			const currentFieldIds = questions.map(q => q.id).filter(id => !id.startsWith("temp-"));

			const deletedFieldIds = originalFieldIds.filter(originalId => !currentFieldIds.includes(originalId));

			for (const fieldId of deletedFieldIds) {
				await adminEventFormFieldsAPI.delete(fieldId);
			}

			for (const fieldData of formFieldsData) {
				const data = {
					eventId: currentEvent.id,
					order: fieldData.order,
					type: fieldData.type,
					name: fieldData.name,
					description: fieldData.description,
					placeholder: "",
					required: fieldData.required,
					validater: fieldData.validater || "",
					values: fieldData.values,
					filters: fieldData.filters || undefined,
				};

				if (fieldData.id) {
					await adminEventFormFieldsAPI.update(fieldData.id, data);
				} else {
					await adminEventFormFieldsAPI.create(data);
				}
			}

			await loadFormFields();

			showAlert("表單已保存！", "success");
		} catch (error) {
			console.error("Failed to save form:", error);
			showAlert("保存失敗: " + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	function addQuestion() {
		setQuestions([
			...questions,
			{
				id: "temp-" + crypto.randomUUID(),
				label: "New Question",
				labelEn: "New Question",
				labelZhHant: "新問題",
				labelZhHans: "新问题",
				type: "text",
				required: false
			}
		]);
	};

	function updateQuestion(id: string, updates: Partial<Question>) {
		setQuestions(questions.map(q => (q.id === id ? { ...q, ...updates } : q)));
	};

	function deleteQuestion(id: string) {
		setQuestions(questions.filter(q => q.id !== id));
	};

	function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
		e.dataTransfer.setData("dragIndex", index.toString());
		setDraggedIndex(index);
	};

	function handleDragEnd() {
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";

		if (draggedIndex !== null && draggedIndex !== index) {
			setDragOverIndex(index);
		}
	};

	function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		setDragOverIndex(null);
	};

	async function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));

		setDraggedIndex(null);
		setDragOverIndex(null);

		if (dragIndex === dropIndex) return;

		const newQuestions = [...questions];
		const draggedItem = newQuestions[dragIndex];

		newQuestions.splice(dragIndex, 1);
		newQuestions.splice(dropIndex, 0, draggedItem);

		setQuestions(newQuestions);

		if (currentEvent?.id) {
			try {
				const fieldOrders = newQuestions.map((q, index) => ({
					id: q.id,
					order: index
				}));

				await adminEventFormFieldsAPI.reorder(currentEvent.id, { fieldOrders });
			} catch (error) {
				console.error("Failed to reorder fields:", error);
				showAlert("重新排序失敗: " + (error instanceof Error ? error.message : String(error)), "error");
				await loadFormFields();
			}
		}
	};

	function handleOptionDragStart(e: React.DragEvent<HTMLSpanElement>, questionId: string, optionIndex: number) {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("optionIndex", optionIndex.toString());
		setDraggedOptionIndex(optionIndex);
		setDraggedQuestionId(questionId);
	};

	function handleOptionDragEnd(e: React.DragEvent<HTMLDivElement>) {
		e.stopPropagation();
		setDraggedOptionIndex(null);
		setDragOverOptionIndex(null);
		setDraggedQuestionId(null);
	};

	function handleOptionDragOver(e: React.DragEvent<HTMLDivElement>, optionIndex: number) {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";

		if (draggedOptionIndex !== null && draggedOptionIndex !== optionIndex) {
			setDragOverOptionIndex(optionIndex);
		}
	};

	function handleOptionDragLeave(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		setDragOverOptionIndex(null);
	};

	function handleOptionDrop(e: React.DragEvent<HTMLDivElement>, questionId: string, dropIndex: number) {
		e.preventDefault();
		e.stopPropagation();
		const dragIndex = parseInt(e.dataTransfer.getData("optionIndex"));

		setDraggedOptionIndex(null);
		setDragOverOptionIndex(null);
		setDraggedQuestionId(null);

		if (dragIndex === dropIndex) return;

		const question = questions.find(q => q.id === questionId);
		if (!question || !question.options) return;

		const newOptions = [...question.options];
		const draggedOption = newOptions[dragIndex];

		newOptions.splice(dragIndex, 1);
		newOptions.splice(dropIndex, 0, draggedOption);

		updateQuestion(questionId, { options: newOptions });
	};

	useEffect(() => {
		const handleEventChange = (e: CustomEvent) => {
			setCurrentEventId(e.detail.eventId);
		};

		window.addEventListener("selectedEventChanged", handleEventChange as EventListener);

		const savedEventId = localStorage.getItem("selectedEventId");
		if (savedEventId) {
			setCurrentEventId(savedEventId);
		}

		return () => {
			window.removeEventListener("selectedEventChanged", handleEventChange as EventListener);
		};
	}, []);
	
	useEffect(() => {
		if (currentEventId) {
			loadEvent();
		}
	}, [currentEventId, loadEvent]);

	useEffect(() => {
		if (currentEvent?.id) {
			loadFormFields();
			loadAllEvents();
			loadEventTickets();
		}
	}, [currentEvent?.id, loadFormFields, loadAllEvents, loadEventTickets]);

	if (!currentEventId) {
		return (
			<>
				<AdminNav />
				<main>
					<h1 className="text-3xl font-bold">{t.title}</h1>
					<div className="h-8" />
					<div className="admin-empty" style={{ padding: "4rem 2rem" }}>
						{t.noTicket}
					</div>
					<div style={{ textAlign: "center", marginTop: "1rem" }}>
						<button className="admin-button primary" onClick={() => (window.location.href = `/${locale}/admin/events`)}>
							{t.backToTickets}
						</button>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<AdminNav />
			<main style={{ minHeight: "100vh", padding: "1.5rem 1rem" }}>
				<div
					id="form-editor"
					style={{
						maxWidth: "900px",
						margin: "0 auto"
					}}
				>
					{/* Header Section */}
					<div style={{
						marginBottom: "1.5rem",
						paddingBottom: "1rem",
						borderBottom: "1px solid var(--color-gray-700)"
					}}>
						<h1 style={{
							fontSize: "1.5rem",
							fontWeight: "600",
							marginBottom: "0.25rem",
							color: "var(--color-gray-100)"
						}}>
							{t.title}
						</h1>
						<p style={{
							fontSize: "0.875rem",
							color: "var(--color-gray-400)",
							margin: 0
						}}>
							{t.formInfo}
						</p>
					</div>

					{/* Copy From Event Section */}
					{allEvents.length > 0 && (
						<div style={{
							background: "var(--color-gray-800)",
							border: "1px solid var(--color-gray-700)",
							borderRadius: "8px",
							padding: "1rem",
							marginBottom: "1.5rem"
						}}>
							<label style={{
								display: "block",
								fontSize: "0.9rem",
								fontWeight: "600",
								color: "var(--color-gray-300)",
								marginBottom: "0.75rem"
							}}>
								{t.copyFrom}
							</label>
							<select
								value={copyFromEventId}
								onChange={e => {
									const eventId = e.target.value;
									if (eventId && confirm("確定要複製該活動的表單嗎？這會取代目前的表單內容。")) {
										copyFormFromEvent(eventId);
									} else {
										setCopyFromEventId("");
									}
								}}
								className="admin-select"
								style={{
									width: "100%",
									maxWidth: "400px"
								}}
							>
								<option value="">{t.selectEvent}</option>
								{allEvents.map(event => (
									<option key={event.id} value={event.id}>
										{typeof event.name === "object" ? event.name["en"] || Object.values(event.name)[0] : event.name}
									</option>
								))}
							</select>
						</div>
					)}
					{/* Questions List */}
					<div style={{ marginBottom: "1.5rem" }}>
						<div style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "1rem"
						}}>
							<h2 style={{
								fontSize: "1rem",
								fontWeight: "600",
								color: "var(--color-gray-200)",
								margin: 0
							}}>
								{t.formFields}
							</h2>
							<span style={{
								fontSize: "0.8rem",
								color: "var(--color-gray-400)",
								background: "var(--color-gray-800)",
								padding: "0.25rem 0.6rem",
								borderRadius: "4px",
								border: "1px solid var(--color-gray-700)"
							}}>
								{questions.length} {t.howManyFields}
							</span>
						</div>

						<div
							id="questions"
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "12px"
							}}
						>
							{questions.length === 0 && (
								<div
									style={{
										textAlign: "center",
										padding: "2rem 1.5rem",
										border: "1px dashed var(--color-gray-700)",
										borderRadius: "8px",
										background: "var(--color-gray-800)"
									}}
								>
									<p style={{
										fontSize: "0.9rem",
										color: "var(--color-gray-400)",
										margin: "0 0 0.5rem 0"
									}}>
										{t.currentlyNoFormFields}
									</p>
									<p style={{
										fontSize: "0.8rem",
										color: "var(--color-gray-500)",
										margin: 0
									}}>
										{t.clickNewToAdd}
									</p>
								</div>
							)}
						{questions.map((q, index) => {
							const isDragging = draggedIndex === index;
							const isDropTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

							return (
								<div
									key={q.id}
									data-id={q.id}
									onDragOver={e => handleDragOver(e, index)}
									onDragLeave={handleDragLeave}
									onDrop={e => handleDrop(e, index)}
									style={{
										background: isDragging ? "var(--color-gray-800)" : "var(--color-gray-800)",
										border: isDropTarget ? "2px solid var(--color-primary)" : "1px solid var(--color-gray-700)",
										borderRadius: "8px",
										padding: "1rem",
										display: "flex",
										gap: "0.75rem",
										position: "relative",
										transition: "all 0.2s ease",
										boxShadow: isDragging
											? "0 4px 12px rgba(0, 0, 0, 0.3)"
											: isDropTarget
											? "0 4px 12px rgba(var(--color-primary-rgb, 99, 102, 241), 0.3)"
											: "none",
										opacity: isDragging ? 0.6 : 1,
										transform: isDragging ? "scale(1.01)" : "scale(1)",
										cursor: "default"
									}}
								>
									{/* Drag Handle */}
									<div
										draggable
										onDragStart={e => handleDragStart(e, index)}
										onDragEnd={handleDragEnd}
										style={{
											cursor: "grab",
											userSelect: "none",
											display: "flex",
											alignItems: "flex-start",
											justifyContent: "center",
											color: isDragging ? "var(--color-primary)" : "var(--color-gray-600)",
											transition: "color 0.2s ease",
											padding: "0.5rem 0.25rem",
											touchAction: "none",
											flexShrink: 0
										}}
										title="拖曳以重新排序"
										onMouseDown={(e) => {
											e.currentTarget.style.cursor = "grabbing";
										}}
										onMouseUp={(e) => {
											e.currentTarget.style.cursor = "grab";
										}}
									>
										<GripVertical size={20} />
									</div>

									{/* Field Number Badge */}
									<div style={{
										position: "absolute",
										top: "0.75rem",
										right: "0.75rem",
										background: "var(--color-gray-700)",
										color: "var(--color-gray-400)",
										fontSize: "0.7rem",
										fontWeight: "600",
										padding: "0.2rem 0.5rem",
										borderRadius: "4px"
									}}>
										#{index + 1}
									</div>
								{/* Main Content Area */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "1rem",
										flex: 1,
										paddingRight: "3rem"
									}}
								>
									{/* Field Names Section */}
									<div>
										<div style={{
											fontSize: "0.75rem",
											fontWeight: "600",
											color: "var(--color-gray-500)",
											marginBottom: "0.5rem",
											textTransform: "uppercase",
											letterSpacing: "0.05em"
										}}>
											{t.fieldName}
										</div>
										<div
											style={{
												display: "grid",
												gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
												gap: "0.6rem"
											}}
										>
											<div>
												<label style={{
													display: "block",
													fontSize: "0.7rem",
													color: "var(--color-gray-500)",
													marginBottom: "0.3rem",
													fontWeight: "500"
												}}>
													EN
												</label>
												<input
													type="text"
													value={q.labelEn || ""}
													placeholder="English Label"
													onChange={e => updateQuestion(q.id, { labelEn: e.target.value, label: e.target.value })}
													className="admin-input"
													style={{
														width: "100%",
														fontSize: "0.875rem",
														padding: "0.5rem 0.65rem"
													}}
												/>
											</div>
											<div>
												<label style={{
													display: "block",
													fontSize: "0.7rem",
													color: "var(--color-gray-500)",
													marginBottom: "0.3rem",
													fontWeight: "500"
												}}>
													繁體中文
												</label>
												<input
													type="text"
													value={q.labelZhHant || ""}
													placeholder="繁體中文標籤"
													onChange={e => updateQuestion(q.id, { labelZhHant: e.target.value })}
													className="admin-input"
													style={{
														width: "100%",
														fontSize: "0.875rem",
														padding: "0.5rem 0.65rem"
													}}
												/>
											</div>
											<div>
												<label style={{
													display: "block",
													fontSize: "0.7rem",
													color: "var(--color-gray-500)",
													marginBottom: "0.3rem",
													fontWeight: "500"
												}}>
													简体中文
												</label>
												<input
													type="text"
													value={q.labelZhHans || ""}
													placeholder="简体中文标签"
													onChange={e => updateQuestion(q.id, { labelZhHans: e.target.value })}
													className="admin-input"
													style={{
														width: "100%",
														fontSize: "0.875rem",
														padding: "0.5rem 0.65rem"
													}}
												/>
											</div>
										</div>
									</div>

									{/* Field Configuration Section */}
									<div>
										<div style={{
											fontSize: "0.75rem",
											fontWeight: "600",
											color: "var(--color-gray-500)",
											marginBottom: "0.5rem",
											textTransform: "uppercase",
											letterSpacing: "0.05em"
										}}>
											{t.fieldSettings}
										</div>
										<div style={{
											display: "flex",
											gap: "0.6rem",
											flexWrap: "wrap",
											alignItems: "flex-end"
										}}>
											<div>
												<label style={{
													display: "block",
													fontSize: "0.7rem",
													color: "var(--color-gray-500)",
													marginBottom: "0.3rem",
													fontWeight: "500"
												}}>
													{t.fieldType}
												</label>
												<select
													value={q.type}
													onChange={e => updateQuestion(q.id, { type: e.target.value })}
													className="admin-select"
													style={{
														minWidth: "140px",
														fontSize: "0.875rem",
														padding: "0.5rem 0.65rem"
													}}
												>
													{fieldTypes.map(ft => (
														<option key={ft.value} value={ft.value}>
															{ft.label}
														</option>
													))}
												</select>
											</div>

											<div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-end" }}>
												<button
													type="button"
													onClick={() => updateQuestion(q.id, { required: !q.required })}
													className="admin-button"
													style={{
														background: q.required ? "var(--color-primary)" : "var(--color-gray-700)",
														border: `1px solid ${q.required ? "var(--color-primary)" : "var(--color-gray-600)"}`,
														color: q.required ? "white" : "var(--color-gray-300)",
														fontSize: "0.8rem",
														padding: "0.5rem 0.75rem",
														fontWeight: q.required ? "600" : "500",
														transition: "all 0.2s ease"
													}}
												>
													{q.required ? t.fieldRequired : t.fieldOptional}
												</button>
												<button
													type="button"
													onClick={() => deleteQuestion(q.id)}
													className="admin-button danger"
													style={{
														fontSize: "0.8rem",
														padding: "0.5rem 0.75rem",
														background: "var(--color-gray-700)",
														border: "1px solid var(--color-gray-600)",
														color: "var(--color-red-400)"
													}}
													title={t.deleteField}
												>
													{t.deleteField}
												</button>
											</div>
										</div>
									</div>

									{/* Additional Settings Section */}
									<div>
										<div style={{
											fontSize: "0.75rem",
											fontWeight: "600",
											color: "var(--color-gray-500)",
											marginBottom: "0.5rem",
											textTransform: "uppercase",
											letterSpacing: "0.05em"
										}}>
											{t.additionalSettings}
										</div>
										<div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
											<div>
												<label style={{
													display: "block",
													fontSize: "0.7rem",
													color: "var(--color-gray-500)",
													marginBottom: "0.3rem",
													fontWeight: "500"
												}}>
													{t.description}
												</label>
												<input
													type="text"
													value={q.description || ""}
													placeholder="向使用者說明此欄位的用途..."
													onChange={e => updateQuestion(q.id, { description: e.target.value })}
													className="admin-input"
													style={{
														width: "100%",
														fontSize: "0.875rem",
														padding: "0.5rem 0.65rem"
													}}
												/>
											</div>

											{(q.type === "text" || q.type === "textarea") && (
												<div>
													<label style={{
														display: "block",
														fontSize: "0.7rem",
														color: "var(--color-gray-500)",
														marginBottom: "0.3rem",
														fontWeight: "500"
													}}>
														{t.validator}
													</label>
													<input
														type="text"
														value={q.validater || ""}
														placeholder={t.validatorPlaceholder}
														onChange={e => updateQuestion(q.id, { validater: e.target.value })}
														className="admin-input"
														style={{
															width: "100%",
															fontSize: "0.8rem",
															padding: "0.5rem 0.65rem",
															fontFamily: "monospace",
															background: "var(--color-gray-900)",
															border: "1px solid var(--color-gray-700)"
														}}
													/>
													<p style={{
														fontSize: "0.7rem",
														color: "var(--color-gray-500)",
														marginTop: "0.3rem",
														marginBottom: 0
													}}>
														{t.useValidator}
													</p>
												</div>
											)}
										</div>
									</div>
									{["select", "radio", "checkbox"].includes(q.type) && (
										<div>
											<div style={{
												fontSize: "0.75rem",
												fontWeight: "600",
												color: "var(--color-gray-500)",
												marginBottom: "0.5rem",
												textTransform: "uppercase",
												letterSpacing: "0.05em"
											}}>
												{t.optionSettings}
											</div>
											<div
												style={{
													padding: "0.75rem",
													border: "1px solid var(--color-gray-700)",
													borderRadius: "8px",
													background: "var(--color-gray-900)",
													display: "flex",
													flexDirection: "column",
													gap: "0.6rem"
												}}
											>
												{(q.options || []).map((opt, i) => {
													const isOptionDragging = draggedQuestionId === q.id && draggedOptionIndex === i;
													const isOptionDropTarget = draggedQuestionId === q.id && dragOverOptionIndex === i && draggedOptionIndex !== null && draggedOptionIndex !== i;

													return (
													<div
														key={i}
														onDragOver={e => handleOptionDragOver(e, i)}
														onDragLeave={handleOptionDragLeave}
														onDrop={e => handleOptionDrop(e, q.id, i)}
														style={{
															display: "flex",
															gap: "0.5rem",
															alignItems: "stretch",
															padding: "0.5rem",
															borderRadius: "6px",
															background: isOptionDragging ? "var(--color-gray-800)" : isOptionDropTarget ? "var(--color-gray-750)" : "var(--color-gray-800)",
															border: isOptionDropTarget ? "1px solid var(--color-primary)" : "1px solid var(--color-gray-700)",
															opacity: isOptionDragging ? 0.6 : 1,
															transition: "all 0.2s ease",
															boxShadow: isOptionDropTarget ? "0 0 0 2px rgba(var(--color-primary-rgb, 99, 102, 241), 0.1)" : "none"
														}}
													>
														<div style={{
															display: "flex",
															alignItems: "center",
															gap: "0.5rem"
														}}>
															<span
																draggable
																onDragStart={e => handleOptionDragStart(e, q.id, i)}
																onDragEnd={handleOptionDragEnd}
																style={{
																	cursor: "grab",
																	color: isOptionDragging ? "var(--color-primary)" : "var(--color-gray-600)",
																	userSelect: "none",
																	padding: "0.25rem",
																	display: "flex",
																	alignItems: "center"
																}}
																title="拖曳以重新排序選項"
																onMouseDown={(e) => {
																	e.currentTarget.style.cursor = "grabbing";
																}}
																onMouseUp={(e) => {
																	e.currentTarget.style.cursor = "grab";
																}}
															>
																⋮⋮
															</span>
															<span style={{
																fontSize: "0.75rem",
																color: "var(--color-gray-500)",
																fontWeight: "600",
																minWidth: "1.5rem"
															}}>
																{i + 1}
															</span>
														</div>
														<div style={{
															display: "grid",
															gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
															gap: "0.5rem",
															flex: 1
														}}>
															<input
																type="text"
																value={typeof opt === "object" ? opt.en || "" : opt}
																placeholder="English"
																onChange={e => {
																	const newOptions = [...(q.options || [])];
																	if (typeof newOptions[i] === "object") {
																		newOptions[i] = { ...(newOptions[i] as { en: string; "zh-Hant"?: string; "zh-Hans"?: string }), en: e.target.value };
																	} else {
																		newOptions[i] = { en: e.target.value };
																	}
																	updateQuestion(q.id, { options: newOptions });
																}}
																className="admin-input"
																style={{
																	fontSize: "0.8rem",
																	padding: "0.45rem 0.6rem",
																	background: "var(--color-gray-950)"
																}}
															/>
															<input
																type="text"
																value={typeof opt === "object" ? opt["zh-Hant"] || "" : ""}
																placeholder="繁體中文"
																onChange={e => {
																	const newOptions = [...(q.options || [])];
																	if (typeof newOptions[i] === "object") {
																		newOptions[i] = { ...(newOptions[i] as { en: string; "zh-Hant"?: string; "zh-Hans"?: string }), "zh-Hant": e.target.value };
																	} else {
																		newOptions[i] = { en: typeof opt === "string" ? opt : "", "zh-Hant": e.target.value };
																	}
																	updateQuestion(q.id, { options: newOptions });
																}}
																className="admin-input"
																style={{
																	fontSize: "0.8rem",
																	padding: "0.45rem 0.6rem",
																	background: "var(--color-gray-950)"
																}}
															/>
															<input
																type="text"
																value={typeof opt === "object" ? opt["zh-Hans"] || "" : ""}
																placeholder="简体中文"
																onChange={e => {
																	const newOptions = [...(q.options || [])];
																	if (typeof newOptions[i] === "object") {
																		newOptions[i] = { ...(newOptions[i] as { en: string; "zh-Hant"?: string; "zh-Hans"?: string }), "zh-Hans": e.target.value };
																	} else {
																		newOptions[i] = { en: typeof opt === "string" ? opt : "", "zh-Hans": e.target.value };
																	}
																	updateQuestion(q.id, { options: newOptions });
																}}
																className="admin-input"
																style={{
																	fontSize: "0.8rem",
																	padding: "0.45rem 0.6rem",
																	background: "var(--color-gray-950)"
																}}
															/>
														</div>
														<button
															type="button"
															onClick={() => {
																const newOptions = [...(q.options || [])];
																newOptions.splice(i, 1);
																updateQuestion(q.id, { options: newOptions });
															}}
															className="admin-button"
															style={{
																fontSize: "0.75rem",
																padding: "0.45rem 0.65rem",
																background: "var(--color-gray-950)",
																border: "1px solid var(--color-gray-800)",
																color: "var(--color-red-400)",
																flexShrink: 0
															}}
															title="刪除此選項"
														>
															<X />
														</button>
													</div>
													);
												})}
												<button
													type="button"
													onClick={() => {
														const newOptions = [...(q.options || []), { en: "", "zh-Hant": "", "zh-Hans": "" }];
														updateQuestion(q.id, { options: newOptions });
													}}
													className="admin-button"
													style={{
														fontSize: "0.8rem",
														padding: "0.5rem 0.75rem",
														background: "var(--color-gray-800)",
														border: "1px dashed var(--color-gray-700)",
														color: "var(--color-gray-400)",
														width: "100%",
														justifyContent: "center",
														display: "flex",
														alignItems: "center",
														gap: "0.4rem"
													}}
												>
													<span style={{ fontSize: "1rem" }}><Plus /></span> {t.newOption}
												</button>
											</div>
										</div>
									)}

									{/* Display Filters Section */}
									<div>
										<div style={{
											fontSize: "0.75rem",
											fontWeight: "600",
											color: "var(--color-gray-500)",
											marginBottom: "0.5rem",
											textTransform: "uppercase",
											letterSpacing: "0.05em"
										}}>
											{t.displayFilters}
										</div>
										<div style={{
											padding: "0.75rem",
											border: "1px solid var(--color-gray-700)",
											borderRadius: "8px",
											background: "var(--color-gray-900)",
											display: "flex",
											flexDirection: "column",
											gap: "0.75rem"
										}}>
											{/* Enable filters toggle */}
											<label style={{
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
												cursor: "pointer",
												userSelect: "none"
											}}>
												<input
													type="checkbox"
													checked={q.filters?.enabled || false}
													onChange={(e) => {
														updateQuestion(q.id, {
															filters: {
																enabled: e.target.checked,
																action: q.filters?.action || "display",
																operator: q.filters?.operator || "and",
																conditions: q.filters?.conditions || []
															}
														});
													}}
													style={{
														width: "1rem",
														height: "1rem",
														cursor: "pointer"
													}}
												/>
												<span style={{
													fontSize: "0.85rem",
													fontWeight: "500",
													color: "var(--color-gray-300)"
												}}>
													{t.enableFilters}
												</span>
											</label>

											{q.filters?.enabled && (
												<>
													{/* Filter action and operator */}
													<div style={{
														display: "flex",
														gap: "0.6rem",
														flexWrap: "wrap"
													}}>
														<div style={{ flex: "1", minWidth: "200px" }}>
															<label style={{
																display: "block",
																fontSize: "0.7rem",
																color: "var(--color-gray-500)",
																marginBottom: "0.3rem",
																fontWeight: "500"
															}}>
																{t.filterAction}
															</label>
															<select
																value={q.filters.action}
																onChange={(e) => {
																	updateQuestion(q.id, {
																		filters: {
																			...q.filters!,
																			action: e.target.value as "display" | "hide"
																		}
																	});
																}}
																className="admin-select"
																style={{
																	width: "100%",
																	fontSize: "0.875rem",
																	padding: "0.5rem 0.65rem"
																}}
															>
																<option value="display">{t.actionDisplay}</option>
																<option value="hide">{t.actionHide}</option>
															</select>
														</div>

														<div style={{ flex: "1", minWidth: "200px" }}>
															<label style={{
																display: "block",
																fontSize: "0.7rem",
																color: "var(--color-gray-500)",
																marginBottom: "0.3rem",
																fontWeight: "500"
															}}>
																{t.filterOperator}
															</label>
															<select
																value={q.filters.operator}
																onChange={(e) => {
																	updateQuestion(q.id, {
																		filters: {
																			...q.filters!,
																			operator: e.target.value as "and" | "or"
																		}
																	});
																}}
																className="admin-select"
																style={{
																	width: "100%",
																	fontSize: "0.875rem",
																	padding: "0.5rem 0.65rem"
																}}
															>
																<option value="and">{t.operatorAnd}</option>
																<option value="or">{t.operatorOr}</option>
															</select>
														</div>
													</div>

													{/* Conditions list */}
													<div style={{
														display: "flex",
														flexDirection: "column",
														gap: "0.6rem"
													}}>
														{(q.filters.conditions || []).map((condition, condIndex) => (
															<div key={condIndex} style={{
																padding: "0.6rem",
																background: "var(--color-gray-800)",
																border: "1px solid var(--color-gray-700)",
																borderRadius: "6px",
																display: "flex",
																flexDirection: "column",
																gap: "0.5rem"
															}}>
																{/* Condition type selector */}
																<div style={{
																	display: "flex",
																	gap: "0.5rem",
																	alignItems: "flex-start"
																}}>
																	<div style={{ flex: 1 }}>
																		<label style={{
																			display: "block",
																			fontSize: "0.7rem",
																			color: "var(--color-gray-500)",
																			marginBottom: "0.3rem",
																			fontWeight: "500"
																		}}>
																			{t.conditionType}
																		</label>
																		<select
																			value={condition.type}
																			onChange={(e) => {
																				const newConditions = [...(q.filters!.conditions || [])];
																				newConditions[condIndex] = {
																					type: e.target.value as "ticket" | "field" | "time"
																				};
																				updateQuestion(q.id, {
																					filters: {
																						...q.filters!,
																						conditions: newConditions
																					}
																				});
																			}}
																			className="admin-select"
																			style={{
																				width: "100%",
																				fontSize: "0.8rem",
																				padding: "0.45rem 0.6rem"
																			}}
																		>
																			<option value="ticket">{t.typeTicket}</option>
																			<option value="field">{t.typeField}</option>
																			<option value="time">{t.typeTime}</option>
																		</select>
																	</div>

																	<button
																		type="button"
																		onClick={() => {
																			const newConditions = [...(q.filters!.conditions || [])];
																			newConditions.splice(condIndex, 1);
																			updateQuestion(q.id, {
																				filters: {
																					...q.filters!,
																					conditions: newConditions
																				}
																			});
																		}}
																		className="admin-button"
																		style={{
																			fontSize: "0.75rem",
																			padding: "0.45rem 0.65rem",
																			background: "var(--color-gray-950)",
																			border: "1px solid var(--color-gray-800)",
																			color: "var(--color-red-400)",
																			flexShrink: 0,
																			marginTop: "1.4rem"
																		}}
																		title={t.deleteCondition}
																	>
																		<X size={14} />
																	</button>
																</div>

																{/* Condition-specific fields */}
																{condition.type === "ticket" && (
																	<div>
																		<label style={{
																			display: "block",
																			fontSize: "0.7rem",
																			color: "var(--color-gray-500)",
																			marginBottom: "0.3rem",
																			fontWeight: "500"
																		}}>
																			{t.selectTicket}
																		</label>
																		<select
																			value={condition.ticketId || ""}
																			onChange={(e) => {
																				const newConditions = [...(q.filters!.conditions || [])];
																				newConditions[condIndex] = {
																					...condition,
																					ticketId: e.target.value
																				};
																				updateQuestion(q.id, {
																					filters: {
																						...q.filters!,
																						conditions: newConditions
																					}
																				});
																			}}
																			className="admin-select"
																			style={{
																				width: "100%",
																				fontSize: "0.8rem",
																				padding: "0.45rem 0.6rem"
																			}}
																		>
																			<option value="">{t.selectTicket}...</option>
																			{eventTickets.map((ticket) => (
																				<option key={ticket.id} value={ticket.id}>
																					{typeof ticket.name === "object" ? ticket.name["en"] || Object.values(ticket.name)[0] : ticket.name}
																				</option>
																			))}
																		</select>
																	</div>
																)}

																{condition.type === "field" && (
																	<>
																		<div>
																			<label style={{
																				display: "block",
																				fontSize: "0.7rem",
																				color: "var(--color-gray-500)",
																				marginBottom: "0.3rem",
																				fontWeight: "500"
																			}}>
																				{t.selectField}
																			</label>
																			<select
																				value={condition.fieldId || ""}
																				onChange={(e) => {
																					const newConditions = [...(q.filters!.conditions || [])];
																					newConditions[condIndex] = {
																						...condition,
																						fieldId: e.target.value
																					};
																					updateQuestion(q.id, {
																						filters: {
																							...q.filters!,
																							conditions: newConditions
																						}
																					});
																				}}
																				className="admin-select"
																				style={{
																					width: "100%",
																					fontSize: "0.8rem",
																					padding: "0.45rem 0.6rem"
																				}}
																			>
																				<option value="">{t.selectField}...</option>
																				{questions.filter(field => field.id !== q.id).map((field) => (
																					<option key={field.id} value={field.id}>
																						{field.labelEn || field.label}
																					</option>
																				))}
																			</select>
																		</div>

																		<div style={{
																			display: "flex",
																			gap: "0.5rem"
																		}}>
																			<div style={{ flex: 1 }}>
																				<label style={{
																					display: "block",
																					fontSize: "0.7rem",
																					color: "var(--color-gray-500)",
																					marginBottom: "0.3rem",
																					fontWeight: "500"
																				}}>
																					{t.fieldOperator}
																				</label>
																				<select
																					value={condition.operator || "equals"}
																					onChange={(e) => {
																						const newConditions = [...(q.filters!.conditions || [])];
																						newConditions[condIndex] = {
																							...condition,
																							operator: e.target.value as "equals" | "filled" | "notFilled"
																						};
																						updateQuestion(q.id, {
																							filters: {
																								...q.filters!,
																								conditions: newConditions
																							}
																						});
																					}}
																					className="admin-select"
																					style={{
																						width: "100%",
																						fontSize: "0.8rem",
																						padding: "0.45rem 0.6rem"
																					}}
																				>
																					<option value="equals">{t.operatorEquals}</option>
																					<option value="filled">{t.operatorFilled}</option>
																					<option value="notFilled">{t.operatorNotFilled}</option>
																				</select>
																			</div>

																			{condition.operator === "equals" && (
																				<div style={{ flex: 1 }}>
																					<label style={{
																						display: "block",
																						fontSize: "0.7rem",
																						color: "var(--color-gray-500)",
																						marginBottom: "0.3rem",
																						fontWeight: "500"
																					}}>
																						{t.fieldValue}
																					</label>
																					<input
																						type="text"
																						value={condition.value || ""}
																						placeholder={t.fieldValue}
																						onChange={(e) => {
																							const newConditions = [...(q.filters!.conditions || [])];
																							newConditions[condIndex] = {
																								...condition,
																								value: e.target.value
																							};
																							updateQuestion(q.id, {
																								filters: {
																									...q.filters!,
																									conditions: newConditions
																								}
																							});
																						}}
																						className="admin-input"
																						style={{
																							width: "100%",
																							fontSize: "0.8rem",
																							padding: "0.45rem 0.6rem"
																						}}
																					/>
																				</div>
																			)}
																		</div>
																	</>
																)}

																{condition.type === "time" && (
																	<>
																		<div>
																			<label style={{
																				display: "block",
																				fontSize: "0.7rem",
																				color: "var(--color-gray-500)",
																				marginBottom: "0.3rem",
																				fontWeight: "500"
																			}}>
																				{t.startTime}
																			</label>
																			<input
																				type="datetime-local"
																				value={condition.startTime || ""}
																				onChange={(e) => {
																					const newConditions = [...(q.filters!.conditions || [])];
																					newConditions[condIndex] = {
																						...condition,
																						startTime: e.target.value
																					};
																					updateQuestion(q.id, {
																						filters: {
																							...q.filters!,
																							conditions: newConditions
																						}
																					});
																				}}
																				className="admin-input"
																				style={{
																					width: "100%",
																					fontSize: "0.8rem",
																					padding: "0.45rem 0.6rem"
																				}}
																			/>
																		</div>

																		<div>
																			<label style={{
																				display: "block",
																				fontSize: "0.7rem",
																				color: "var(--color-gray-500)",
																				marginBottom: "0.3rem",
																				fontWeight: "500"
																			}}>
																				{t.endTime}
																			</label>
																			<input
																				type="datetime-local"
																				value={condition.endTime || ""}
																				onChange={(e) => {
																					const newConditions = [...(q.filters!.conditions || [])];
																					newConditions[condIndex] = {
																						...condition,
																						endTime: e.target.value
																					};
																					updateQuestion(q.id, {
																						filters: {
																							...q.filters!,
																							conditions: newConditions
																						}
																					});
																				}}
																				className="admin-input"
																				style={{
																					width: "100%",
																					fontSize: "0.8rem",
																					padding: "0.45rem 0.6rem"
																				}}
																			/>
																		</div>
																	</>
																)}
															</div>
														))}

														{/* Add condition button */}
														<button
															type="button"
															onClick={() => {
																const newConditions = [...(q.filters!.conditions || []), { type: "ticket" as const }];
																updateQuestion(q.id, {
																	filters: {
																		...q.filters!,
																		conditions: newConditions
																	}
																});
															}}
															className="admin-button"
															style={{
																fontSize: "0.8rem",
																padding: "0.5rem 0.75rem",
																background: "var(--color-gray-800)",
																border: "1px dashed var(--color-gray-700)",
																color: "var(--color-gray-400)",
																width: "100%",
																justifyContent: "center",
																display: "flex",
																alignItems: "center",
																gap: "0.4rem"
															}}
														>
															<span style={{ fontSize: "1rem" }}><Plus /></span> {t.addCondition}
														</button>
													</div>
												</>
											)}
										</div>
									</div>
								</div>
							</div>
						);
						})}
						</div>
					</div>

					{/* Action Buttons */}
					<div style={{
						position: "sticky",
						bottom: 0,
						background: "var(--color-gray-900)",
						padding: "1rem 0",
						marginTop: "1.5rem",
						display: "flex",
						gap: "0.75rem",
						justifyContent: "center",
						borderTop: "1px solid var(--color-gray-700)"
					}}>
						<button
							id="add-question"
							type="button"
							onClick={addQuestion}
							className="admin-button"
							style={{
								fontSize: "0.9rem",
								padding: "0.65rem 1.25rem",
								background: "var(--color-gray-700)",
								border: "1px solid var(--color-gray-600)",
								color: "var(--color-gray-200)",
								display: "flex",
								alignItems: "center",
								gap: "0.4rem",
								fontWeight: "500"
							}}
						>
							<Plus size={18} /> {t.addQuestion}
						</button>
						<button
							id="save-form"
							type="button"
							onClick={saveForm}
							className="admin-button"
							style={{
								fontSize: "0.9rem",
								padding: "0.65rem 1.25rem",
								border: "1px solid var(--color-primary)",
								color: "white",
								display: "flex",
								alignItems: "center",
								gap: "0.4rem",
								fontWeight: "600",
								boxShadow: "0 2px 8px rgba(var(--color-primary-rgb, 99, 102, 241), 0.25)"
							}}
						>
							<Save size={18} /> {t.save}
						</button>
					</div>
				</div>
			</main>
		</>
	);
}
