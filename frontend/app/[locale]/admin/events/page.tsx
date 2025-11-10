"use client";

import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import type { Event } from "@/lib/types/api";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

export default function EventsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [events, setEvents] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [activeTab, setActiveTab] = useState<"en" | "zh-Hant" | "zh-Hans">("en");

	const [nameEn, setNameEn] = useState("");
	const [nameZhHant, setNameZhHant] = useState("");
	const [nameZhHans, setNameZhHans] = useState("");
	const [descEn, setDescEn] = useState("");
	const [descZhHant, setDescZhHant] = useState("");
	const [descZhHans, setDescZhHans] = useState("");
	const [plainDescEn, setPlainDescEn] = useState("");
	const [plainDescZhHant, setPlainDescZhHant] = useState("");
	const [plainDescZhHans, setPlainDescZhHans] = useState("");
	const [ogImage, setOgImage] = useState("");

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Event Management" },
		addEvent: { "zh-Hant": "新增活動", "zh-Hans": "新增活动", en: "Add Event" },
		editEvent: { "zh-Hant": "編輯活動", "zh-Hans": "编辑活动", en: "Edit Event" },
		eventName: { "zh-Hant": "活動名稱", "zh-Hans": "活动名称", en: "Event Name" },
		description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
		plainDescription: { "zh-Hant": "純文字描述（用於 Metadata）", "zh-Hans": "纯文字描述（用於 Metadata）", en: "Plain Description (Use for Metadata)" },
		ogImage: { "zh-Hant": "OG 圖片網址", "zh-Hans": "OG 图片网址", en: "OG Image URL" },
		location: { "zh-Hant": "地點", "zh-Hans": "地点", en: "Location" },
		startDate: { "zh-Hant": "活動開始日期", "zh-Hans": "活动开始日期", en: "Event Start Date" },
		endDate: { "zh-Hant": "結束日期", "zh-Hans": "结束日期", en: "End Date" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		empty: { "zh-Hant": "沒有活動", "zh-Hans": "没有活动", en: "No events" },
		active: { "zh-Hant": "進行中", "zh-Hans": "进行中", en: "Active" },
		upcoming: { "zh-Hant": "尚未開始", "zh-Hans": "尚未开始", en: "Upcoming" },
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

	const openModal = (event: Event | null = null) => {
		setEditingEvent(event);

		if (event) {
			const name = typeof event.name === "object" ? event.name : { en: event.name };
			const desc = typeof event.description === "object" ? event.description : { en: event.description || "" };
			const plainDesc = typeof event.plainDescription === "object" ? event.plainDescription : { en: event.plainDescription || "" };

			setNameEn(name.en || "");
			setNameZhHant(name["zh-Hant"] || "");
			setNameZhHans(name["zh-Hans"] || "");
			setDescEn(desc.en || "");
			setDescZhHant(desc["zh-Hant"] || "");
			setDescZhHans(desc["zh-Hans"] || "");
			setPlainDescEn(plainDesc.en || "");
			setPlainDescZhHant(plainDesc["zh-Hant"] || "");
			setPlainDescZhHans(plainDesc["zh-Hans"] || "");
			setOgImage(event.ogImage || "");
		} else {
			setNameEn("");
			setNameZhHant("");
			setNameZhHans("");
			setDescEn("");
			setDescZhHant("");
			setDescZhHans("");
			setPlainDescEn("");
			setPlainDescZhHant("");
			setPlainDescZhHans("");
			setOgImage("");
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
		setPlainDescEn("");
		setPlainDescZhHant("");
		setPlainDescZhHans("");
		setOgImage("");
	};

	async function saveEvent(e: React.FormEvent<HTMLFormElement>) {
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
			plainDescription: {
				en: plainDescEn,
				"zh-Hant": plainDescZhHant,
				"zh-Hans": plainDescZhHans
			},
			ogImage: ogImage || undefined,
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
			showAlert("保存失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	async function deleteEvent(eventId: string) {
		if (!confirm("確定要刪除這個活動嗎？")) return;

		try {
			await adminEventsAPI.delete(eventId);
			await loadEvents();
		} catch (error) {
			showAlert("刪除失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	function computeStatus(event: Event) {
		const now = new Date();
		if (event.startDate && new Date(event.startDate) > now) {
			return { label: t.upcoming, class: "pending" };
		}
		if (event.endDate && new Date(event.endDate) < now) {
			return { label: t.ended, class: "ended" };
		}
		return { label: t.active, class: "active" };
	}

	function formatDateTime(dt?: string) {
		if (!dt) return "";
		try {
			const d = new Date(dt);
			return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
		} catch {
			return dt;
		}
	}

	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	return (
		<>
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
												<div className="flex gap-2 flex-wrap">
													<Button variant="secondary" size="sm" onClick={() => openModal(event)}>
														{t.edit}
													</Button>
													<Button variant="destructive" size="sm" onClick={() => deleteEvent(event.id)}>
														{t.delete}
													</Button>
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

				<section className="mt-8 text-center">
					<Button onClick={() => openModal()}>
						+ {t.addEvent}
					</Button>
				</section>

				{showModal && (
					<div className="admin-modal-overlay" onClick={closeModal}>
					<div className="admin-modal" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{editingEvent ? t.editEvent : t.addEvent}</h2>
							<Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
								✕
							</Button>
						</div>
						<form onSubmit={saveEvent}>
								<div className="flex flex-col gap-4 p-6">
									{/* Language Tabs */}
									<div className="flex gap-2 border-b-2 border-gray-700 dark:border-gray-800 mb-4">
										{[
											{ key: "en" as const, label: "English" },
											{ key: "zh-Hant" as const, label: "繁體中文" },
											{ key: "zh-Hans" as const, label: "简体中文" }
										].map(tab => (
											<Button
												key={tab.key}
												type="button"
												variant="ghost"
												onClick={() => setActiveTab(tab.key)}
												className={`px-4 py-2 rounded-none transition-all duration-200 ${
													activeTab === tab.key
														? "bg-gray-600 dark:bg-gray-700 border-b-2 border-blue-500 dark:border-blue-400 text-gray-100 dark:text-gray-200 font-bold"
														: "text-gray-400 dark:text-gray-500 font-normal"
												}`}
											>
												{tab.label}
											</Button>
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
												<textarea value={descEn} onChange={e => setDescEn(e.target.value)} className="admin-input" rows={6} />
												{descEn && (
													<div className="mt-2 p-3 border border-gray-600 dark:border-gray-700 rounded bg-gray-800 dark:bg-gray-900">
														<div className="text-sm font-bold mb-2 text-gray-300 dark:text-gray-400">Preview:</div>
														<MarkdownContent content={descEn} />
													</div>
												)}
											</div>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.plainDescription} (English)</label>
												<textarea
													value={plainDescEn}
													onChange={e => setPlainDescEn(e.target.value)}
													className="admin-input"
													rows={4}
													placeholder="Plain text description without markdown formatting"
												/>
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
												<label className="admin-form-label">{t.description} (繁體中文，Markdown)</label>
												<textarea value={descZhHant} onChange={e => setDescZhHant(e.target.value)} className="admin-input" rows={6} />
												{descZhHant && (
													<div className="mt-2 p-3 border border-gray-600 dark:border-gray-700 rounded bg-gray-800 dark:bg-gray-900">
														<div className="text-sm font-bold mb-2 text-gray-300 dark:text-gray-400">Preview:</div>
														<MarkdownContent content={descZhHant} />
													</div>
												)}
											</div>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.plainDescription} (繁體中文)</label>
												<textarea value={plainDescZhHant} onChange={e => setPlainDescZhHant(e.target.value)} className="admin-input" rows={4} placeholder="純文字描述，不含 Markdown 格式" />
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
												<label className="admin-form-label">{t.description} (简体中文，Markdown)</label>
												<textarea value={descZhHans} onChange={e => setDescZhHans(e.target.value)} className="admin-input" rows={6} />
												{descZhHans && (
													<div className="mt-2 p-3 border border-gray-600 dark:border-gray-700 rounded bg-gray-800 dark:bg-gray-900">
														<div className="text-sm font-bold mb-2 text-gray-300 dark:text-gray-400">Preview:</div>
														<MarkdownContent content={descZhHans} />
													</div>
												)}
											</div>
											<div className="admin-form-group">
												<label className="admin-form-label">{t.plainDescription} (简体中文)</label>
												<textarea value={plainDescZhHans} onChange={e => setPlainDescZhHans(e.target.value)} className="admin-input" rows={4} placeholder="纯文字描述，不含 Markdown 格式" />
											</div>
										</>
									)}
									<div className="admin-form-group">
										<label className="admin-form-label">{t.ogImage}</label>
										<input type="url" value={ogImage} onChange={e => setOgImage(e.target.value)} className="admin-input" placeholder="https://example.com/image.jpg" />
									</div>
									<div className="admin-form-group">
										<label className="admin-form-label">{t.location}</label>
										<input name="location" type="text" defaultValue={editingEvent?.location || ""} className="admin-input" />
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
								<Button type="submit" variant="default">
									{t.save}
								</Button>
								<Button type="button" variant="secondary" onClick={closeModal}>
									{t.cancel}
								</Button>
							</div>
						</form>
						</div>
					</div>
				)}
			</main>
		</>
	);
}
