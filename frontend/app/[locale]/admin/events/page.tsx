"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import type { Event } from "@/lib/types/api";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createEventsColumns, type EventWithStatus } from "./columns";

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
	const [slug, setSlug] = useState("");
	const [ogImage, setOgImage] = useState("");

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Event Management" },
		addEvent: { "zh-Hant": "新增活動", "zh-Hans": "新增活动", en: "Add Event" },
		editEvent: { "zh-Hant": "編輯活動", "zh-Hans": "编辑活动", en: "Edit Event" },
		eventName: { "zh-Hant": "活動名稱", "zh-Hans": "活动名称", en: "Event Name" },
		description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
		plainDescription: { "zh-Hant": "Metadata 純文字描述", "zh-Hans": "Metadata 纯文字描述", en: "Plaintext Description for Metadata" },
		slug: { "zh-Hant": "自訂網址 Slug", "zh-Hans": "自定义网址 Slug", en: "Custom URL Slug" },
		slugHint: {
			"zh-Hant": "僅可使用小寫字母、數字和連字號。留空則使用活動 ID。",
			"zh-Hans": "仅可使用小写字母、数字和连字号。留空则使用活动 ID。",
			en: "Optional. Use lowercase letters, numbers, and hyphens only. Leave empty to use event ID."
		},
		slugTitle: {
			"zh-Hant": "僅可使用小寫字母、數字和連字號（例如：sitcon-2026）",
			"zh-Hans": "仅可使用小写字母、数字和连字号（例如：sitcon-2026）",
			en: "Only lowercase letters, numbers, and hyphens (e.g., sitcon-2026)"
		},
		preview: { "zh-Hant": "預覽：", "zh-Hans": "预览：", en: "Preview:" },
		ogImage: { "zh-Hant": "封面圖片網址", "zh-Hans": "封面图片网址", en: "Cover Image URL" },
		ogImageHint: {
			"zh-Hant": "請將圖片上傳至 Imgur，並將圖片連結貼於此處。建議尺寸：1800x300。",
			"zh-Hans": "请将图片上传至 Imgur，并将图片链接贴于此处。建议尺寸：1800x300。",
			en: "Please upload the image to Imgur and paste the image link here. Recommended size: 1800x300."
		},
		location: { "zh-Hant": "地點", "zh-Hans": "地点", en: "Location" },
		locationHint: {
			"zh-Hant": "可以貼上 Google Maps 連結，系統會自動抓取地點名稱。請使用「分享」功能取得連結。若填寫的不是 Google Maps 連結，則會原樣顯示。",
			"zh-Hans": "可以贴上 Google Maps 链接，系统会自动抓取地点名称。请使用「分享」功能取得链接。若填写的不是 Google Maps 链接，则会原样显示。",
			en: "You can paste the Google Maps link, and the system will automatically fetch the location name. Please use the 'Share' feature to obtain the link. If the input is not a Google Maps link, it will be displayed as is."
		},
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
		createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" },
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." }
	});

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
			setSlug(event.slug || "");
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
			setSlug("");
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
		setSlug("");
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
			slug: slug || undefined,
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

	const eventsWithStatus = useMemo((): EventWithStatus[] => {
		return events.map(event => {
			const status = computeStatus(event);
			return {
				...event,
				statusLabel: status.label,
				statusClass: status.class,
				displayName: typeof event.name === "object" ? event.name[locale] || event.name["en"] || Object.values(event.name)[0] : event.name,
				formattedStartDate: formatDateTime(event.startDate),
				formattedEndDate: formatDateTime(event.endDate)
			};
		});
	}, [events, locale, computeStatus]);

	const columns = useMemo(
		() =>
			createEventsColumns({
				onEdit: openModal,
				onDelete: deleteEvent,
				t: { edit: t.edit, delete: t.delete }
			}),
		[t.edit, t.delete, openModal, deleteEvent]
	);
	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	return (
		<>
			<main>
				<AdminHeader title={t.title} />

				<section>
					{isLoading ? (
						<div className="admin-loading">
							<PageSpinner />
							<p>{t.loading}</p>
						</div>
					) : (
						<DataTable columns={columns} data={eventsWithStatus} />
					)}
				</section>

				<section className="mt-8 text-center">
					<Button onClick={() => openModal()}>+ {t.addEvent}</Button>
				</section>

				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
						<DialogHeader>
							<DialogTitle>{editingEvent ? t.editEvent : t.addEvent}</DialogTitle>
						</DialogHeader>
						<form onSubmit={saveEvent} className="space-y-4">
							<Tabs value={activeTab} onValueChange={value => setActiveTab(value as "en" | "zh-Hant" | "zh-Hans")}>
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="en">English</TabsTrigger>
									<TabsTrigger value="zh-Hant">繁體中文</TabsTrigger>
									<TabsTrigger value="zh-Hans">简体中文</TabsTrigger>
								</TabsList>

								<TabsContent value="en" className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="nameEn">{t.eventName} (English) *</Label>
										<Input id="nameEn" type="text" required value={nameEn} onChange={e => setNameEn(e.target.value)} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="descEn">{t.description} (English, Markdown)</Label>
										<Textarea id="descEn" value={descEn} onChange={e => setDescEn(e.target.value)} rows={6} />
										{descEn && (
											<div className="mt-2 p-3 border rounded-md bg-muted">
												<div className="text-xs font-semibold mb-2 text-muted-foreground">{t.preview}</div>
												<MarkdownContent content={descEn} />
											</div>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="plainDescEn">{t.plainDescription} (English)</Label>
										<Textarea id="plainDescEn" value={plainDescEn} onChange={e => setPlainDescEn(e.target.value)} rows={4} placeholder="Plain text description without markdown formatting" />
									</div>
								</TabsContent>

								<TabsContent value="zh-Hant" className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="nameZhHant">{t.eventName} (繁體中文)</Label>
										<Input id="nameZhHant" type="text" value={nameZhHant} onChange={e => setNameZhHant(e.target.value)} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="descZhHant">{t.description} (繁體中文，Markdown)</Label>
										<Textarea id="descZhHant" value={descZhHant} onChange={e => setDescZhHant(e.target.value)} rows={6} />
										{descZhHant && (
											<div className="mt-2 p-3 border rounded-md bg-muted">
												<div className="text-xs font-semibold mb-2 text-muted-foreground">{t.preview}</div>
												<MarkdownContent content={descZhHant} />
											</div>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="plainDescZhHant">{t.plainDescription} (繁體中文)</Label>
										<Textarea id="plainDescZhHant" value={plainDescZhHant} onChange={e => setPlainDescZhHant(e.target.value)} rows={4} placeholder="純文字描述，不含 Markdown 格式" />
									</div>
								</TabsContent>

								<TabsContent value="zh-Hans" className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="nameZhHans">{t.eventName} (简体中文)</Label>
										<Input id="nameZhHans" type="text" value={nameZhHans} onChange={e => setNameZhHans(e.target.value)} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="descZhHans">{t.description} (简体中文，Markdown)</Label>
										<Textarea id="descZhHans" value={descZhHans} onChange={e => setDescZhHans(e.target.value)} rows={6} />
										{descZhHans && (
											<div className="mt-2 p-3 border rounded-md bg-muted">
												<div className="text-xs font-semibold mb-2 text-muted-foreground">{t.preview}</div>
												<MarkdownContent content={descZhHans} />
											</div>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="plainDescZhHans">{t.plainDescription} (简体中文)</Label>
										<Textarea id="plainDescZhHans" value={plainDescZhHans} onChange={e => setPlainDescZhHans(e.target.value)} rows={4} placeholder="纯文字描述，不含 Markdown 格式" />
									</div>
								</TabsContent>
							</Tabs>

							<div className="space-y-2">
								<Label htmlFor="slug">{t.slug}</Label>
								<Input id="slug" type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="sitcon-2026" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" title={t.slugTitle} />
								<p className="text-xs text-muted-foreground">{t.slugHint}</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ogImage">{t.ogImage}</Label>
								<Input
									id="ogImage"
									type="url"
									value={ogImage}
									onChange={e => setOgImage(e.target.value)}
									placeholder="https://i.imgur.com/example.jpg"
									pattern="https://i\.imgur\.com/.+\.(jpg|jpeg|png|gif|webp)"
								/>
								<p className="text-xs text-muted-foreground">{t.ogImageHint}</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="location">{t.location}</Label>
								<Input id="location" name="location" type="text" defaultValue={editingEvent?.location || ""} placeholder="https://maps.app.goo.gl/z3Kyzeu1dK29DLfv6" />
								<p className="text-xs text-muted-foreground">{t.locationHint}</p>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="startDate">{t.startDate}</Label>
									<Input id="startDate" name="startDate" type="datetime-local" defaultValue={editingEvent?.startDate ? new Date(editingEvent.startDate).toISOString().slice(0, 16) : ""} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="endDate">{t.endDate}</Label>
									<Input id="endDate" name="endDate" type="datetime-local" defaultValue={editingEvent?.endDate ? new Date(editingEvent.endDate).toISOString().slice(0, 16) : ""} />
								</div>
							</div>

							<DialogFooter>
								<Button type="button" variant="outline" onClick={closeModal}>
									{t.cancel}
								</Button>
								<Button type="submit" variant="default">
									{t.save}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</main>
		</>
	);
}
