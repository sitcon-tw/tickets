"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import MarkdownContent from "@/components/MarkdownContent";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import { formatDateTime as formatDateTimeUTC8, fromDateTimeLocalString, toDateTimeLocalString } from "@/lib/utils/timezone";
import type { Event } from "@sitcontix/types";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createEventsColumns, type EventWithStatus } from "./columns";

interface EventLanguageFieldsProps {
	eventName: string;
	description: string;
	plainDescription: string;
	locationText: string;
	language: string;
	languageLabel: string;
	onNameChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onPlainDescriptionChange: (value: string) => void;
	onLocationTextChange: (value: string) => void;
	required?: boolean;
	tt: {
		eventName: string;
		description: string;
		plainDescription: string;
		locationText: string;
		preview: string;
	};
}

function EventLanguageFields({
	eventName,
	description,
	plainDescription,
	locationText,
	language,
	languageLabel,
	onNameChange,
	onDescriptionChange,
	onPlainDescriptionChange,
	onLocationTextChange,
	required = false,
	tt
}: EventLanguageFieldsProps) {
	const placeholders = {
		en: {
			plainDesc: "Plain text description without markdown formatting",
			locationText: "e.g., Academia Sinica Humanities and Social Sciences Building"
		},
		"zh-Hant": {
			plainDesc: "純文字描述，不含 Markdown 格式",
			locationText: "例如：中央研究院人文社會科學館"
		},
		"zh-Hans": {
			plainDesc: "纯文字描述，不含 Markdown 格式",
			locationText: "例如：中央研究院人文社会科学馆"
		}
	};

	const placeholder = placeholders[language as keyof typeof placeholders] || placeholders.en;

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor={`name-${language}`}>
					{tt.eventName} ({languageLabel}) {required && "*"}
				</Label>
				<Input id={`name-${language}`} type="text" required={required} value={eventName} onChange={e => onNameChange(e.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor={`desc-${language}`}>
					{tt.description} ({languageLabel}, Markdown)
				</Label>
				<Textarea id={`desc-${language}`} value={description} onChange={e => onDescriptionChange(e.target.value)} rows={6} />
				{description && (
					<div className="mt-2 p-3 border rounded-md bg-muted">
						<div className="text-xs font-semibold mb-2 text-muted-foreground">{tt.preview}</div>
						<MarkdownContent content={description} />
					</div>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor={`plainDesc-${language}`}>
					{tt.plainDescription} ({languageLabel})
				</Label>
				<Textarea id={`plainDesc-${language}`} value={plainDescription} onChange={e => onPlainDescriptionChange(e.target.value)} rows={4} placeholder={placeholder.plainDesc} />
			</div>
			<div className="space-y-2">
				<Label htmlFor={`locationText-${language}`}>
					{tt.locationText} ({languageLabel})
				</Label>
				<Input id={`locationText-${language}`} type="text" value={locationText} onChange={e => onLocationTextChange(e.target.value)} placeholder={placeholder.locationText} />
			</div>
		</div>
	);
}

export default function EventsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [events, setEvents] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [activeTab, setActiveTab] = useState<"info" | "en" | "zh-Hant" | "zh-Hans">("info");

	const [nameEn, setNameEn] = useState("");
	const [nameZhHant, setNameZhHant] = useState("");
	const [nameZhHans, setNameZhHans] = useState("");
	const [descEn, setDescEn] = useState("");
	const [descZhHant, setDescZhHant] = useState("");
	const [descZhHans, setDescZhHans] = useState("");
	const [plainDescEn, setPlainDescEn] = useState("");
	const [plainDescZhHant, setPlainDescZhHant] = useState("");
	const [plainDescZhHans, setPlainDescZhHans] = useState("");
	const [locationTextEn, setLocationTextEn] = useState("");
	const [locationTextZhHant, setLocationTextZhHant] = useState("");
	const [locationTextZhHans, setLocationTextZhHans] = useState("");
	const [eventStartTime, setEventStartTime] = useState("");
	const [eventEndTime, setEventEndTime] = useState("");
	const [editDeadline, setEditDeadline] = useState("");
	const [mapLink, setMapLink] = useState("");
	const [slug, setSlug] = useState("");
	const [ogImage, setOgImage] = useState("");
	const [hideEvent, setHideEvent] = useState(false);
	const [useOpass, setUseOpass] = useState(true);
	const [opassEventId, setOpassEventId] = useState("");

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Event Management" },
		addEvent: { "zh-Hant": "新增活動", "zh-Hans": "新增活动", en: "Add Event" },
		editEvent: { "zh-Hant": "編輯活動", "zh-Hans": "编辑活动", en: "Edit Event" },
		eventInfo: { "zh-Hant": "活動資訊", "zh-Hans": "活动资讯", en: "Event Info" },
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
			"zh-Hant": "請將圖片上傳至 Imgur 或 GitHub，並將圖片連結貼於此處。建議尺寸：2400x800。",
			"zh-Hans": "请将图片上传至 Imgur 或 GitHub，并将图片链接贴于此处。建议尺寸：2400x800。",
			en: "Please upload the image to Imgur or GitHub and paste the image link here. Recommended size: 2400x800."
		},
		locationText: { "zh-Hant": "地點名稱", "zh-Hans": "地点名称", en: "Location Name" },
		mapLink: { "zh-Hant": "地圖連結", "zh-Hans": "地图链接", en: "Map Link" },
		mapLinkHint: {
			"zh-Hant": "選填。填入地圖連結（如 Google Maps）後，地點名稱會顯示為可點擊的超連結。",
			"zh-Hans": "选填。填入地图链接（如 Google Maps）后，地点名称会显示为可点击的超链接。",
			en: "Optional. If a map link (e.g., Google Maps) is provided, the location name will be displayed as a clickable hyperlink."
		},
		startDate: { "zh-Hant": "活動開始日期", "zh-Hans": "活动开始日期", en: "Event Start Date" },
		endDate: { "zh-Hant": "結束日期", "zh-Hans": "结束日期", en: "End Date" },
		editDeadline: { "zh-Hant": "編輯截止時間", "zh-Hans": "编辑截止时间", en: "Edit Deadline" },
		editDeadlineHint: {
			"zh-Hant": "報名者可以編輯表單的截止時間。若未設定，則以票種販售截止時間或活動開始時間為準。必須早於活動開始時間。",
			"zh-Hans": "报名者可以编辑表单的截止时间。若未设定，则以票种销售截止时间或活动开始时间为准。必须早于活动开始时间。",
			en: "Deadline for attendees to edit their registration form. If not set, falls back to ticket sale end date or event start date. Must be before event start date."
		},
		hideEvent: { "zh-Hant": "在活動列表中隱藏", "zh-Hans": "在活动列表中隐藏", en: "Hide in Event List" },
		hideEventHint: {
			"zh-Hant": "勾選後，此活動不會顯示在首頁活動列表中，但仍可透過網址直接存取",
			"zh-Hans": "勾选后，此活动不会显示在首页活动列表中，但仍可透过网址直接访问",
			en: "If checked, this event will not appear in the homepage event list, but can still be accessed directly via URL"
		},
		useOpass: { "zh-Hant": "使用 OPass", "zh-Hans": "使用 OPass", en: "Use OPass" },
		useOpassHint: {
			"zh-Hant": "勾選後，報名成功頁面的 QR Code 彈窗會顯示 OPass app 連結",
			"zh-Hans": "勾选后，报名成功页面的 QR Code 弹窗会显示 OPass app 链接",
			en: "If checked, the QR code popup will show the OPass app link"
		},
		opassEventId: { "zh-Hant": "OPass 活動 ID", "zh-Hans": "OPass 活动 ID", en: "OPass Event ID" },
		opassEventIdHint: {
			"zh-Hant": "OPass 活動 ID，用於產生 OPass app 連結",
			"zh-Hans": "OPass 活动 ID，用于生成 OPass app 链接",
			en: "OPass Event ID, used to generate OPass app link"
		},
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

	function formatDateTime(dt?: Date | null) {
		if (!dt) return "";
		try {
			return formatDateTimeUTC8(dt);
		} catch {
			return "";
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
			const name = event.name && typeof event.name === "object" ? event.name : { en: event.name || "" };
			const desc = event.description && typeof event.description === "object" ? event.description : { en: event.description || "" };
			const plainDesc = event.plainDescription && typeof event.plainDescription === "object" ? event.plainDescription : { en: event.plainDescription || "" };
			const locText = event.locationText && typeof event.locationText === "object" ? event.locationText : { en: "" };

			setNameEn(name.en || "");
			setNameZhHant(name["zh-Hant"] || "");
			setNameZhHans(name["zh-Hans"] || "");
			setDescEn(desc.en || "");
			setDescZhHant(desc["zh-Hant"] || "");
			setDescZhHans(desc["zh-Hans"] || "");
			setPlainDescEn(plainDesc.en || "");
			setPlainDescZhHant(plainDesc["zh-Hant"] || "");
			setPlainDescZhHans(plainDesc["zh-Hans"] || "");
			setLocationTextEn(locText.en || "");
			setLocationTextZhHant(locText["zh-Hant"] || "");
			setLocationTextZhHans(locText["zh-Hans"] || "");
			setMapLink(event.mapLink || "");
			setSlug(event.slug || "");

			setEventStartTime(event.startDate ? toDateTimeLocalString(event.startDate) : "");
			setEventEndTime(event.endDate ? toDateTimeLocalString(event.endDate) : "");
			setEditDeadline(event.editDeadline ? toDateTimeLocalString(event.editDeadline) : "");
			setOgImage(event.ogImage || "");
			setHideEvent(event.hideEvent || false);
			setUseOpass(event.useOpass ?? true);
			setOpassEventId(event.opassEventId || "");
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
			setLocationTextEn("");
			setLocationTextZhHant("");
			setLocationTextZhHans("");
			setMapLink("");
			setSlug("");
			setOgImage("");
			setEventStartTime("");
			setEventEndTime("");
			setEditDeadline("");
			setHideEvent(false);
			setUseOpass(true);
			setOpassEventId("");
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
		setLocationTextEn("");
		setLocationTextZhHant("");
		setLocationTextZhHans("");
		setMapLink("");
		setSlug("");
		setOgImage("");
		setEventStartTime("");
		setEventEndTime("");
		setEditDeadline("");
		setHideEvent(false);
		setUseOpass(true);
		setOpassEventId("");
	};

	async function saveEvent(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsSaving(true);

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
			locationText: {
				en: locationTextEn,
				"zh-Hant": locationTextZhHant,
				"zh-Hans": locationTextZhHans
			},
			mapLink: mapLink || undefined,
			slug: slug || undefined,
			ogImage: ogImage || undefined,
			startDate: eventStartTime ? fromDateTimeLocalString(eventStartTime) : new Date(),
			endDate: eventEndTime ? fromDateTimeLocalString(eventEndTime) : new Date(),
			editDeadline: editDeadline ? fromDateTimeLocalString(editDeadline) : null,
			hideEvent,
			useOpass,
			opassEventId: opassEventId || null
		};

		try {
			if (editingEvent) {
				await adminEventsAPI.update(editingEvent.id, data);
			} else {
				await adminEventsAPI.create(data);
			}
			await loadEvents();
			closeModal();
			window.dispatchEvent(new Event("eventListChanged"));
		} catch (error) {
			showAlert("保存失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			setIsSaving(false);
		}
	}

	async function deleteEvent(eventId: string) {
		if (!confirm("確定要刪除這個活動嗎？")) return;

		try {
			await adminEventsAPI.delete(eventId);
			await loadEvents();
			window.dispatchEvent(new Event("eventListChanged"));
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
				displayName: event.name && typeof event.name === "object" ? event.name[locale] || event.name["en"] || Object.values(event.name)[0] : event.name || "",
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
							<Tabs value={activeTab} onValueChange={value => setActiveTab(value as "info" | "en" | "zh-Hant" | "zh-Hans")}>
								<TabsList className="grid w-full grid-cols-4">
									<TabsTrigger value="info">{t.eventInfo}</TabsTrigger>
									<TabsTrigger value="en">English</TabsTrigger>
									<TabsTrigger value="zh-Hant">繁體中文</TabsTrigger>
									<TabsTrigger value="zh-Hans">简体中文</TabsTrigger>
								</TabsList>

								<TabsContent value="info" className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="slug">{t.slug}</Label>
										<Input id="slug" type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="sitcon-2026" pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" title={t.slugTitle} />
										<p className="text-xs text-muted-foreground">{t.slugHint}</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ogImage">{t.ogImage}</Label>
										<Input id="ogImage" type="url" value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://raw.githubusercontent.com/sitcon-tw/...webp" pattern="https?://.+" />
										<p className="text-xs text-muted-foreground">{t.ogImageHint}</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="mapLink">{t.mapLink}</Label>
										<Input id="mapLink" type="url" value={mapLink} onChange={e => setMapLink(e.target.value)} placeholder="https://maps.app.goo.gl/z3Kyzeu1dK29DLfv6" />
										<p className="text-xs text-muted-foreground">{t.mapLinkHint}</p>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="startDate">{t.startDate}</Label>
											<Input id="startDate" name="startDate" type="datetime-local" value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} />
										</div>
										<div className="space-y-2">
											<Label htmlFor="endDate">{t.endDate}</Label>
											<Input id="endDate" name="endDate" type="datetime-local" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} />
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="editDeadline">{t.editDeadline}</Label>
										<Input id="editDeadline" type="datetime-local" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
										<p className="text-xs text-muted-foreground">{t.editDeadlineHint}</p>
									</div>
									<div className="space-y-4">
										<div className="flex items-start space-x-2">
											<Checkbox id="hideEvent" checked={hideEvent} onCheckedChange={checked => setHideEvent(checked === true)} />
											<div className="grid gap-1.5 leading-none">
												<Label htmlFor="hideEvent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
													{t.hideEvent}
												</Label>
												<p className="text-xs text-muted-foreground">{t.hideEventHint}</p>
											</div>
										</div>
										<div className="flex items-start space-x-2">
											<Checkbox id="useOpass" checked={useOpass} onCheckedChange={checked => setUseOpass(checked === true)} />
											<div className="grid gap-1.5 leading-none">
												<Label htmlFor="useOpass" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
													{t.useOpass}
												</Label>
												<p className="text-xs text-muted-foreground">{t.useOpassHint}</p>
											</div>
										</div>
										{useOpass && (
											<div className="space-y-2 pl-6">
												<Label htmlFor="opassEventId">{t.opassEventId}</Label>
												<Input id="opassEventId" type="text" value={opassEventId} onChange={e => setOpassEventId(e.target.value)} placeholder="sitcon-2026" />
												<p className="text-xs text-muted-foreground">{t.opassEventIdHint}</p>
											</div>
										)}
									</div>
								</TabsContent>

								<TabsContent value="en" className="space-y-4">
									<EventLanguageFields
										eventName={nameEn}
										description={descEn}
										plainDescription={plainDescEn}
										locationText={locationTextEn}
										language="en"
										languageLabel="English"
										onNameChange={setNameEn}
										onDescriptionChange={setDescEn}
										onPlainDescriptionChange={setPlainDescEn}
										onLocationTextChange={setLocationTextEn}
										required={true}
										tt={{
											eventName: t.eventName,
											description: t.description,
											plainDescription: t.plainDescription,
											locationText: t.locationText,
											preview: t.preview
										}}
									/>
								</TabsContent>

								<TabsContent value="zh-Hant" className="space-y-4">
									<EventLanguageFields
										eventName={nameZhHant}
										description={descZhHant}
										plainDescription={plainDescZhHant}
										locationText={locationTextZhHant}
										language="zh-Hant"
										languageLabel="繁體中文"
										onNameChange={setNameZhHant}
										onDescriptionChange={setDescZhHant}
										onPlainDescriptionChange={setPlainDescZhHant}
										onLocationTextChange={setLocationTextZhHant}
										tt={{
											eventName: t.eventName,
											description: t.description,
											plainDescription: t.plainDescription,
											locationText: t.locationText,
											preview: t.preview
										}}
									/>
								</TabsContent>

								<TabsContent value="zh-Hans" className="space-y-4">
									<EventLanguageFields
										eventName={nameZhHans}
										description={descZhHans}
										plainDescription={plainDescZhHans}
										locationText={locationTextZhHans}
										language="zh-Hans"
										languageLabel="简体中文"
										onNameChange={setNameZhHans}
										onDescriptionChange={setDescZhHans}
										onPlainDescriptionChange={setPlainDescZhHans}
										onLocationTextChange={setLocationTextZhHans}
										tt={{
											eventName: t.eventName,
											description: t.description,
											plainDescription: t.plainDescription,
											locationText: t.locationText,
											preview: t.preview
										}}
									/>
								</TabsContent>
							</Tabs>

							<DialogFooter>
								<Button type="button" variant="outline" onClick={closeModal}>
									{t.cancel}
								</Button>
								<Button type="submit" variant="default" isLoading={isSaving}>
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
