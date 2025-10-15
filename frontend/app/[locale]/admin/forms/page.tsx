"use client";

import AdminNav from "@/components/AdminNav";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketFormFieldsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { Ticket, TicketFormField } from "@/lib/types/api";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
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
	help?: string;
	options?: Array<{
		en: string;
		"zh-Hant"?: string;
		"zh-Hans"?: string;
	}>;
	showIf?: ShowIf;
};

export default function FormsPage() {
	const locale = useLocale();
	const searchParams = useSearchParams();
	const { showAlert } = useAlert();

	const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [allTickets, setAllTickets] = useState<Ticket[]>([]);
	const [copyFromTicketId, setCopyFromTicketId] = useState<string>("");
	const [originalFieldIds, setOriginalFieldIds] = useState<string[]>([]);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Form" },
		ticketLabel: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
		backToTickets: { "zh-Hant": "返回票種列表", "zh-Hans": "返回票种列表", en: "Back to Tickets" },
		noTicket: { "zh-Hant": "未指定票種", "zh-Hans": "未指定票种", en: "No ticket specified" },
		addQuestion: { "zh-Hant": "新增問題", "zh-Hans": "新增问题", en: "Add Question" },
		save: { "zh-Hant": "儲存表單", "zh-Hans": "保存表单", en: "Save Form" },
		copyFrom: { "zh-Hant": "複製其他票種表單", "zh-Hans": "复制其他票种表单", en: "Copy from other ticket" },
		selectTicket: { "zh-Hant": "選擇票種...", "zh-Hans": "选择票种...", en: "Select ticket..." },
		copySuccess: { "zh-Hant": "已成功複製表單！", "zh-Hans": "已成功复制表单！", en: "Form copied successfully!" }
	});

	const loadTicket = useCallback(async () => {
		const ticketId = searchParams.get("ticket");

		if (!ticketId) {
			console.error("No ticket ID provided");
			return;
		}

		try {
			const response = await adminTicketsAPI.getById(ticketId);
			if (response.success && response.data) {
				setCurrentTicket(response.data);
			}
		} catch (error) {
			console.error("Failed to load ticket:", error);
		}
	}, [searchParams]);

	const loadAllTickets = useCallback(async () => {
		if (!currentTicket?.eventId) return;

		try {
			const response = await adminTicketsAPI.getAll({ eventId: currentTicket.eventId });
			if (response.success) {
				setAllTickets((response.data || []).filter(t => t.id !== currentTicket.id));
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		}
	}, [currentTicket?.eventId, currentTicket?.id]);

	const loadFormFields = useCallback(async () => {
		if (!currentTicket?.id) return;

		try {
			const response = await adminTicketFormFieldsAPI.getAll({ ticketId: currentTicket.id });

			if (response.success) {
				const loadedFields = (response.data || []).map((field: TicketFormField) => {
					let options: Array<{ en: string; "zh-Hant"?: string; "zh-Hans"?: string }> = [];

					const fieldWithOptions = field as TicketFormField & { options?: unknown };
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
						help: field.helpText || "",
						options
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
	}, [currentTicket?.id]);

	async function copyFormFromTicket(sourceTicketId: string) {
		if (!sourceTicketId) return;

		try {
			const response = await adminTicketFormFieldsAPI.getAll({ ticketId: sourceTicketId });

			if (response.success && response.data) {
				const copiedQuestions = response.data.map((field: TicketFormField) => {
					let options: Array<{ en: string; "zh-Hant"?: string; "zh-Hans"?: string }> = [];

					const fieldWithOptions = field as TicketFormField & { options?: unknown };
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
						label: field.description || fieldName,
						labelEn: nameObj.en || "",
						labelZhHant: nameObj["zh-Hant"] || "",
						labelZhHans: nameObj["zh-Hans"] || "",
						type: field.type,
						required: field.required || false,
						help: field.helpText || "",
						options
					};
				});

				setQuestions(copiedQuestions);
				setCopyFromTicketId("");
				showAlert(t.copySuccess, "success");
			}
		} catch (error) {
			console.error("Failed to copy form:", error);
			showAlert("複製失敗: " + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	async function saveForm() {
		if (!currentTicket?.id) {
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
				description: q.label,
				type: q.type as "text" | "textarea" | "select" | "checkbox" | "radio",
				required: q.required,
				helpText: q.help,
				values: q.options,
				order: index
			}));

			const currentFieldIds = questions.map(q => q.id).filter(id => !id.startsWith("temp-"));

			const deletedFieldIds = originalFieldIds.filter(originalId => !currentFieldIds.includes(originalId));

			for (const fieldId of deletedFieldIds) {
				await adminTicketFormFieldsAPI.delete(fieldId);
			}

			for (const fieldData of formFieldsData) {
				const data = {
					ticketId: currentTicket.id,
					order: fieldData.order,
					type: fieldData.type,
					name: fieldData.name,
					description: fieldData.description,
					placeholder: "",
					required: fieldData.required,
					validater: "",
					values: fieldData.values
				};

				if (fieldData.id) {
					await adminTicketFormFieldsAPI.update(fieldData.id, data);
				} else {
					await adminTicketFormFieldsAPI.create(data);
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
		e.currentTarget.style.opacity = "0.4";
	};

	function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
		e.currentTarget.style.opacity = "1";
	};

	function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	async function handleDrop(e: React.DragEvent<HTMLDivElement>, dropIndex: number) {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));

		if (dragIndex === dropIndex) return;

		const newQuestions = [...questions];
		const draggedItem = newQuestions[dragIndex];

		newQuestions.splice(dragIndex, 1);
		newQuestions.splice(dropIndex, 0, draggedItem);

		setQuestions(newQuestions);

		if (currentTicket?.id) {
			try {
				const fieldOrders = newQuestions.map((q, index) => ({
					id: q.id,
					order: index
				}));

				await adminTicketFormFieldsAPI.reorder(currentTicket.id, { fieldOrders });
			} catch (error) {
				console.error("Failed to reorder fields:", error);
				showAlert("重新排序失敗: " + (error instanceof Error ? error.message : String(error)), "error");
				await loadFormFields();
			}
		}
	};
	
	useEffect(() => {
		loadTicket();

		if (currentTicket?.id) {
			loadFormFields();
			loadAllTickets();
		}

	}, [currentTicket?.id, loadFormFields, loadAllTickets, loadTicket]);

	if (!searchParams.get("ticket")) {
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
						<button className="admin-button primary" onClick={() => (window.location.href = `/${locale}/admin/tickets`)}>
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
			<main>
				<div style={{ marginBottom: "1.5rem" }}>
					<button className="admin-button secondary" onClick={() => (window.location.href = `/${locale}/admin/tickets`)} style={{ marginBottom: "1rem" }}>
						← {t.backToTickets}
					</button>
					<h1 className="text-3xl font-bold">{t.title}</h1>
					<div className="h-8" />
					{currentTicket && (
						<div className="admin-stat-card" style={{ marginTop: "1rem" }}>
							<div className="admin-stat-label">{t.ticketLabel}</div>
							<div className="admin-stat-value" style={{ fontSize: "1.5rem" }}>
								{typeof currentTicket.name === "object" ? currentTicket.name["en"] || Object.values(currentTicket.name)[0] : currentTicket.name}
							</div>
							{currentTicket.description && <div style={{ marginTop: "0.5rem", opacity: 0.7, fontSize: "0.9rem" }}>{typeof currentTicket.description === "object" ? currentTicket.description["en"] || Object.values(currentTicket.description)[0] : currentTicket.description}</div>}
						</div>
					)}
				</div>
				<div
					id="form-editor"
					style={{
						maxWidth: "960px",
						margin: "1rem auto 4rem"
					}}
				>
					{allTickets.length > 0 && (
						<div className="admin-form-group" style={{ marginBottom: "1.5rem" }}>
							<label className="admin-form-label">{t.copyFrom}</label>
							<select
								value={copyFromTicketId}
								onChange={e => {
									const ticketId = e.target.value;
									if (ticketId && confirm("確定要複製該票種的表單嗎？這會取代目前的表單內容。")) {
										copyFormFromTicket(ticketId);
									} else {
										setCopyFromTicketId("");
									}
								}}
								className="admin-select"
							>
								<option value="">{t.selectTicket}</option>
								{allTickets.map(ticket => (
									<option key={ticket.id} value={ticket.id}>
										{typeof ticket.name === "object" ? ticket.name["en"] || Object.values(ticket.name)[0] : ticket.name}
									</option>
								))}
							</select>
						</div>
					)}
					<div
						id="questions"
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							margin: "1rem 0"
						}}
					>
						{questions.length === 0 && (
							<div
								className="admin-empty"
								style={{
									fontStyle: "italic",
									padding: "2rem",
									border: "1px dashed var(--color-gray-600)",
									borderRadius: "8px"
								}}
							>
								尚無問題
							</div>
						)}
						{questions.map((q, index) => (
							<div
								key={q.id}
								data-id={q.id}
								draggable
								onDragStart={e => handleDragStart(e, index)}
								onDragEnd={handleDragEnd}
								onDragOver={handleDragOver}
								onDrop={e => handleDrop(e, index)}
								style={{
									background: "var(--color-gray-800)",
									border: "1px solid var(--color-gray-700)",
									borderRadius: "12px",
									padding: "1rem 1.25rem",
									display: "grid",
									gridTemplateColumns: "32px 1fr auto",
									gap: "12px",
									alignItems: "start",
									position: "relative",
									transition: "all 0.15s ease",
									boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
									cursor: "move"
								}}
							>
								<div
									style={{
										cursor: "grab",
										userSelect: "none",
										fontSize: "1.1rem",
										lineHeight: "1",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "#999"
									}}
									title="Drag to reorder"
								>
									☰
								</div>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "6px"
									}}
								>
									<div
										style={{
											display: "flex",
											gap: "8px",
											flexWrap: "wrap",
											alignItems: "center"
										}}
									>
										<label
											style={{
												fontSize: "0.7rem",
												textTransform: "uppercase",
												letterSpacing: "0.05em",
												color: "var(--color-gray-400)",
												fontWeight: 500
											}}
										>
											EN
										</label>
										<input
											type="text"
											value={q.labelEn || ""}
											placeholder="English Label"
											onChange={e => updateQuestion(q.id, { labelEn: e.target.value, label: e.target.value })}
											className="admin-input"
											style={{
												fontSize: "0.85rem",
												minWidth: "120px",
												padding: "0.5rem 0.7rem"
											}}
										/>
										<label
											style={{
												fontSize: "0.7rem",
												textTransform: "uppercase",
												letterSpacing: "0.05em",
												color: "var(--color-gray-400)",
												fontWeight: 500
											}}
										>
											繁
										</label>
										<input
											type="text"
											value={q.labelZhHant || ""}
											placeholder="繁體中文"
											onChange={e => updateQuestion(q.id, { labelZhHant: e.target.value })}
											className="admin-input"
											style={{
												fontSize: "0.85rem",
												minWidth: "100px",
												padding: "0.5rem 0.7rem"
											}}
										/>
										<label
											style={{
												fontSize: "0.7rem",
												textTransform: "uppercase",
												letterSpacing: "0.05em",
												color: "var(--color-gray-400)",
												fontWeight: 500
											}}
										>
											簡
										</label>
										<input
											type="text"
											value={q.labelZhHans || ""}
											placeholder="简体中文"
											onChange={e => updateQuestion(q.id, { labelZhHans: e.target.value })}
											className="admin-input"
											style={{
												fontSize: "0.85rem",
												minWidth: "100px",
												padding: "0.5rem 0.7rem"
											}}
										/>
										<label
											style={{
												fontSize: "0.7rem",
												textTransform: "uppercase",
												letterSpacing: "0.05em",
												color: "var(--color-gray-400)",
												fontWeight: 500
											}}
										>
											種類
										</label>
										<select
											value={q.type}
											onChange={e => updateQuestion(q.id, { type: e.target.value })}
											className="admin-select"
											style={{
												width: "140px",
												fontSize: "0.85rem",
												padding: "0.5rem 0.7rem"
											}}
										>
											{["text", "email", "phone", "textarea", "select", "radio", "checkbox"].map(t => (
												<option key={t} value={t}>
													{t}
												</option>
											))}
										</select>
										<button
											type="button"
											onClick={() => updateQuestion(q.id, { required: !q.required })}
											className="admin-button small"
											style={{
												background: q.required ? "var(--color-gray-600)" : "var(--color-gray-800)",
												border: `1px solid ${q.required ? "var(--color-gray-500)" : "var(--color-gray-700)"}`,
												fontSize: "0.7rem",
												padding: "0.35rem 0.7rem"
											}}
										>
											{q.required ? "必填" : "選填"}
										</button>
										<button
											type="button"
											onClick={() => deleteQuestion(q.id)}
											className="admin-button small danger"
											style={{
												fontSize: "0.7rem",
												padding: "0.35rem 0.7rem"
											}}
										>
											✕
										</button>
									</div>
									<div
										style={{
											display: "flex",
											gap: "8px",
											flexWrap: "wrap",
											alignItems: "center"
										}}
									>
										<label
											style={{
												fontSize: "0.7rem",
												textTransform: "uppercase",
												letterSpacing: "0.05em",
												color: "var(--color-gray-400)",
												fontWeight: 500
											}}
										>
											說明
										</label>
										<input
											type="text"
											value={q.help || ""}
											placeholder="說明文字 (選填)"
											onChange={e => updateQuestion(q.id, { help: e.target.value })}
											className="admin-input"
											style={{
												fontSize: "0.85rem",
												minWidth: "160px",
												padding: "0.5rem 0.7rem"
											}}
										/>
									</div>
									{["select", "radio", "checkbox"].includes(q.type) && (
										<div>
											<div
												style={{
													marginTop: "0.5rem",
													padding: "0.75rem",
													border: "1px dashed var(--color-gray-600)",
													borderRadius: "8px",
													background: "var(--color-gray-900)",
													display: "flex",
													flexDirection: "column",
													gap: "0.5rem"
												}}
											>
												{(q.options || []).map((opt, i) => (
													<div
														key={i}
														style={{
															display: "flex",
															gap: "0.5rem",
															alignItems: "center",
															flexWrap: "wrap"
														}}
													>
														<span style={{ cursor: "grab", color: "var(--color-gray-500)" }} title="Drag option">
															⋮⋮
														</span>
														<input
															type="text"
															value={typeof opt === "object" ? opt.en || "" : opt}
															placeholder="EN"
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
															style={{ minWidth: "120px", fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
														/>
														<input
															type="text"
															value={typeof opt === "object" ? opt["zh-Hant"] || "" : ""}
															placeholder="繁"
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
															style={{ minWidth: "100px", fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
														/>
														<input
															type="text"
															value={typeof opt === "object" ? opt["zh-Hans"] || "" : ""}
															placeholder="簡"
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
															style={{ minWidth: "100px", fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
														/>
														<button
															type="button"
															onClick={() => {
																const newOptions = [...(q.options || [])];
																newOptions.splice(i, 1);
																updateQuestion(q.id, { options: newOptions });
															}}
															className="admin-button small secondary"
															style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}
														>
															刪除
														</button>
													</div>
												))}
												<button
													type="button"
													onClick={() => {
														const newOptions = [...(q.options || []), { en: "", "zh-Hant": "", "zh-Hans": "" }];
														updateQuestion(q.id, { options: newOptions });
													}}
													className="admin-button small secondary"
													style={{
														fontSize: "0.7rem",
														padding: "0.4rem 0.7rem",
														alignSelf: "flex-start"
													}}
												>
													+ 新增選項
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
					<div
						style={{
							display: "flex",
							gap: "0.75rem",
							marginTop: "1rem"
						}}
					>
						<button id="add-question" type="button" onClick={addQuestion} className="admin-button secondary">
							+ {t.addQuestion}
						</button>
						<button id="save-form" type="button" onClick={saveForm} className="admin-button success">
							💾 {t.save}
						</button>
					</div>
				</div>
			</main>
		</>
	);
}
