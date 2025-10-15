"use client";

import AdminNav from "@/components/AdminNav";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import type { Event } from "@/lib/types/api";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/contexts/AlertContext";

export default function EventsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [events, setEvents] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [activeTab, setActiveTab] = useState<"en" | "zh-Hant" | "zh-Hans">("en");

	// Multi-language form state
	const [nameEn, setNameEn] = useState("");
	const [nameZhHant, setNameZhHant] = useState("");
	const [nameZhHans, setNameZhHans] = useState("");
	const [descEn, setDescEn] = useState("");
	const [descZhHant, setDescZhHant] = useState("");
	const [descZhHans, setDescZhHans] = useState("");

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Event Management" },
		addEvent: { "zh-Hant": "新增活動", "zh-Hans": "新增活动", en: "Add Event" },
		editEvent: { "zh-Hant": "編輯活動", "zh-Hans": "编辑活动", en: "Edit Event" },
		eventName: { "zh-Hant": "活動名稱", "zh-Hans": "活动名称", en: "Event Name" },
		description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
		location: { "zh-Hant": "地點", "zh-Hans": "地点", en: "Location" },
		startDate: { "zh-Hant": "開始日期", "zh-Hans": "开始日期", en: "Start Date" },
		endDate: { "zh-Hant": "結束日期", "zh-Hans": "结束日期", en: "End Date" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		empty: { "zh-Hant": "沒有活動", "zh-Hans": "没有活动", en: "No events" },
		active: { "zh-Hant": "進行中", "zh-Hans": "进行中", en: "Active" },
		upcoming: { "zh-Hant": "即將開始", "zh-Hans": "即将开始", en: "Upcoming" },
		ended: { "zh-Hant": "已結束", "zh-Hans": "已结束", en: "Ended" },
		createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" }
	});

	const loadEvents = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success) {
				setEvents(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	const openModal = (event: Event | null = null) => {
		setEditingEvent(event);

		if (event) {
			// Load all languages
			const name = typeof event.name === "object" ? event.name : { en: event.name };
			const desc = typeof event.description === "object" ? event.description : { en: event.description || "" };

			setNameEn(name.en || "");
			setNameZhHant(name["zh-Hant"] || "");
			setNameZhHans(name["zh-Hans"] || "");
			setDescEn(desc.en || "");
			setDescZhHant(desc["zh-Hant"] || "");
			setDescZhHans(desc["zh-Hans"] || "");
		} else {
			// Clear all fields for new event
			setNameEn("");
			setNameZhHant("");
			setNameZhHans("");
			setDescEn("");
			setDescZhHant("");
			setDescZhHans("");
		}

		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setEditingEvent(null);
		setNameEn("");
		setNameZhHant("");
		setNameZhHans("");
		setDescEn("");
		setDescZhHant("");
		setDescZhHans("");
	};

	const saveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const startDateStr = formData.get("startDate") as string;
		const endDateStr = formData.get("endDate") as string;

		const data = {
			name: {
				en: nameEn,
				"zh-Hant": nameZhHant,
				"zh-Hans": nameZhHans
			},
			description: {
				en: descEn,
				"zh-Hant": descZhHant,
				"zh-Hans": descZhHans
			},
			location: (formData.get("location") as string) || "",
			startDate: startDateStr ? new Date(startDateStr).toISOString() : new Date().toISOString(),
			endDate: endDateStr ? new Date(endDateStr).toISOString() : new Date().toISOString()
		};

		try {
			if (editingEvent) {
				await adminEventsAPI.update(editingEvent.id, data);
			} else {
				await adminEventsAPI.create(data);
			}
			await loadEvents();
			closeModal();
		} catch (error) {
			showAlert("保存失敗: " + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const deleteEvent = async (eventId: string) => {
		if (!confirm("確定要刪除這個活動嗎？")) return;

		try {
			await adminEventsAPI.delete(eventId);
			await loadEvents();
		} catch (error) {
			showAlert("刪除失敗: " + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const computeStatus = (event: Event) => {
		const now = new Date();
		if (event.startDate && new Date(event.startDate) > now) {
			return { label: t.upcoming, class: "pending" };
		}
		if (event.endDate && new Date(event.endDate) < now) {
			return { label: t.ended, class: "ended" };
		}
		return { label: t.active, class: "active" };
	};

	const formatDateTime = (dt?: string) => {
		if (!dt) return "";
		try {
			const d = new Date(dt);
			return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
		} catch {
			return dt;
		}
	};

	return (
		<>
			<AdminNav />
			<main>
				<h1 className="text-3xl font-bold">{t.title}</h1>
				<div className="h-8" />

				<section>
					<div className="admin-table-container">
						{isLoading && (
							<div className="admin-loading">
								<PageSpinner size={48} />
								<p>{t.loading}</p>
							</div>
						)}
						{!isLoading && events.length === 0 && <div className="admin-empty">{t.empty}</div>}
						{!isLoading && events.length > 0 && (
							<table className="admin-table">
								<thead>
									<tr>
										<th>{t.eventName}</th>
										<th>{t.location}</th>
										<th>{t.startDate}</th>
										<th>{t.endDate}</th>
										<th>{t.status}</th>
										<th>{t.actions}</th>
									</tr>
								</thead>
								<tbody>
									{events.map(event => {
										const status = computeStatus(event);
										return (
											<tr key={event.id}>
												<td>{typeof event.name === "object" ? event.name[locale] || event.name["en"] || Object.values(event.name)[0] : event.name}</td>
												<td>{event.location}</td>
												<td>{formatDateTime(event.startDate)}</td>
												<td>{formatDateTime(event.endDate)}</td>
												<td>
													<span className={`status-badge ${status.class}`}>{status.label}</span>
												</td>
												<td>
													<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
														<button className="admin-button small secondary" onClick={() => openModal(event)}>
															{t.edit}
														</button>
														<button className="admin-button small danger" onClick={() => deleteEvent(event.id)}>
															{t.delete}
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				</section>

				<section style={{ marginTop: "2rem", textAlign: "center" }}>
					<button className="admin-button primary" onClick={() => openModal()}>
						+ {t.addEvent}
					</button>
				</section>

				{showModal && (
					<div className="admin-modal-overlay" onClick={closeModal}>
						<div className="admin-modal" onClick={e => e.stopPropagation()}>
							<div className="admin-modal-header">
								<h2 className="admin-modal-title">{editingEvent ? t.editEvent : t.addEvent}</h2>
								<button className="admin-modal-close" onClick={closeModal}>
									✕
								</button>
							</div>
							<form onSubmit={saveEvent}>
								<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
									{/* Language Tabs */}
									<div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid var(--color-gray-700)", marginBottom: "1rem" }}>
										{[
											{ key: "en" as const, label: "English" },
											{ key: "zh-Hant" as const, label: "繁體中文" },
											{ key: "zh-Hans" as const, label: "简体中文" }
										].map(tab => (
											<button
												key={tab.key}
												type="button"
												onClick={() => setActiveTab(tab.key)}
												style={{
													padding: "0.5rem 1rem",
													background: activeTab === tab.key ? "var(--color-gray-600)" : "transparent",
													border: "none",
													borderBottom: activeTab === tab.key ? "2px solid var(--color-blue-500)" : "none",
													color: activeTab === tab.key ? "var(--color-gray-100)" : "var(--color-gray-400)",
													cursor: "pointer",
													fontWeight: activeTab === tab.key ? "bold" : "normal",
													transition: "all 0.2s"
												}}
											>
												{tab.label}
											</button>
										))}
									</div>

									{/* English Fields */}
									{activeTab === "en" && (
										<>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.eventName} (English) *</label>
												<input type="text" required value={nameEn} onChange={e => setNameEn(e.target.value)} className="admin-input" />
											</div>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.description} (English, Markdown)</label>
												<textarea value={descEn} onChange={e => setDescEn(e.target.value)} className="admin-textarea" rows={6} />
												{descEn && (
													<div style={{ marginTop: "0.5rem", padding: "0.75rem", border: "1px solid var(--color-gray-600)", borderRadius: "4px", backgroundColor: "var(--color-gray-750)" }}>
														<div style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--color-gray-300)" }}>Preview:</div>
														<MarkdownContent content={descEn} />
													</div>
												)}
											</div>
										</>
									)}

									{/* Traditional Chinese Fields */}
									{activeTab === "zh-Hant" && (
										<>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.eventName} (繁體中文)</label>
												<input type="text" value={nameZhHant} onChange={e => setNameZhHant(e.target.value)} className="admin-input" />
											</div>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.description} (繁體中文, Markdown)</label>
												<textarea value={descZhHant} onChange={e => setDescZhHant(e.target.value)} className="admin-textarea" rows={6} />
												{descZhHant && (
													<div style={{ marginTop: "0.5rem", padding: "0.75rem", border: "1px solid var(--color-gray-600)", borderRadius: "4px", backgroundColor: "var(--color-gray-750)" }}>
														<div style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--color-gray-300)" }}>Preview:</div>
														<MarkdownContent content={descZhHant} />
													</div>
												)}
											</div>
										</>
									)}

									{/* Simplified Chinese Fields */}
									{activeTab === "zh-Hans" && (
										<>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.eventName} (简体中文)</label>
												<input type="text" value={nameZhHans} onChange={e => setNameZhHans(e.target.value)} className="admin-input" />
											</div>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.description} (简体中文, Markdown)</label>
												<textarea value={descZhHans} onChange={e => setDescZhHans(e.target.value)} className="admin-textarea" rows={6} />
												{descZhHans && (
													<div style={{ marginTop: "0.5rem", padding: "0.75rem", border: "1px solid var(--color-gray-600)", borderRadius: "4px", backgroundColor: "var(--color-gray-750)" }}>
														<div style={{ fontSize: "0.875rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--color-gray-300)" }}>Preview:</div>
														<MarkdownContent content={descZhHans} />
													</div>
												)}
											</div>
										</>
									)}
									<div className="admin-form-group">
										<label className="admin-form-label">{t.location}</label>
										<input name="location" type="text" defaultValue={editingEvent?.location || ""} className="admin-input" />
									</div>
									<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.startDate}</label>
											<input name="startDate" type="datetime-local" defaultValue={editingEvent?.startDate ? new Date(editingEvent.startDate).toISOString().slice(0, 16) : ""} className="admin-input" />
										</div>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.endDate}</label>
											<input name="endDate" type="datetime-local" defaultValue={editingEvent?.endDate ? new Date(editingEvent.endDate).toISOString().slice(0, 16) : ""} className="admin-input" />
										</div>
									</div>
								</div>
								<div className="admin-modal-actions">
									<button type="submit" className="admin-button warning">
										{t.save}
									</button>
									<button type="button" className="admin-button secondary" onClick={closeModal}>
										{t.cancel}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</>
	);
}
