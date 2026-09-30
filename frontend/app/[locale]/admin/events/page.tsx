"use client";

import { useConfirm } from "@/components/admin/ConfirmProvider";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { SearchInput } from "@/components/admin/SearchInput";
import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import { formatDateTime as formatDateTimeUTC8, fromDateTimeLocalString } from "@/lib/utils/timezone";
import type { Event } from "@sitcontix/types";
import { CalendarDays, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createEventsColumns, type EventStatus, type EventWithStatus } from "./columns";
import { EventEditorDialog } from "./EventEditorDialog";
import { eventsPageReducer, type EventFormErrors, initialEventsPageState, isFormDirty, tabOrder, tabsWithErrors, validateEventForm } from "./event-form";

type StatusFilter = "all" | EventStatus;

function formatEventDateTime(dt?: Date | null) {
	if (!dt) return "";
	try {
		return formatDateTimeUTC8(dt);
	} catch {
		return "";
	}
}

function localizedText(value: Event["name"] | Event["locationText"] | undefined, locale: string) {
	if (!value) return "";
	if (typeof value !== "object") return String(value);
	return value[locale] || value["en"] || Object.values(value).find(Boolean) || "";
}

function computeStatus(event: Event, now: Date): EventStatus {
	if (event.startDate && new Date(event.startDate) > now) return "upcoming";
	if (event.endDate && new Date(event.endDate) < now) return "ended";
	return "active";
}

export default function EventsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();

	const [state, dispatch] = useReducer(eventsPageReducer, initialEventsPageState);
	const { events, isLoading, isSaving, showModal, editingEvent, activeTab, form, submitAttempted, submitError } = state;

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const loadRequestRef = useRef(0);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Event Management" },
		pageDescription: {
			"zh-Hant": "建立與管理所有活動。變更會立即反映在左側的活動選單。",
			"zh-Hans": "创建与管理所有活动。变更会立即反映在左侧的活动菜单。",
			en: "Create and manage all events. Changes show up in the sidebar event switcher right away."
		},
		addEvent: { "zh-Hant": "新增活動", "zh-Hans": "新增活动", en: "Add Event" },
		editEvent: { "zh-Hant": "編輯活動", "zh-Hans": "编辑活动", en: "Edit Event" },
		dialogDescription: {
			"zh-Hant": "請切換分頁填寫各語言內容；標示 * 的欄位為必填。",
			"zh-Hans": "请切换分页填写各语言内容；标示 * 的栏位为必填。",
			en: "Use the tabs to fill in each language. Fields marked * are required."
		},
		eventInfo: { "zh-Hant": "活動資訊", "zh-Hans": "活动资讯", en: "Event Info" },
		eventName: { "zh-Hant": "活動名稱", "zh-Hans": "活动名称", en: "Event Name" },
		description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
		plainDescription: { "zh-Hant": "Metadata 純文字描述", "zh-Hans": "Metadata 纯文字描述", en: "Plaintext Description for Metadata" },
		slug: { "zh-Hant": "自訂網址 Slug", "zh-Hans": "自定义网址 Slug", en: "Custom URL Slug" },
		slugHint: {
			"zh-Hant": "選填。僅可使用小寫字母、數字和連字號，留空則使用活動 ID 後 6 碼。活動網址：",
			"zh-Hans": "选填。仅可使用小写字母、数字和连字号，留空则使用活动 ID 后 6 位。活动网址：",
			en: "Optional. Lowercase letters, numbers and hyphens only; leave empty to use the last 6 characters of the event ID. Event URL:"
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
			"zh-Hant": "選填。填入地圖連結（如 Google Maps）後，地點名稱會顯示為可點擊的超連結。地點名稱請在各語言分頁填寫。",
			"zh-Hans": "选填。填入地图链接（如 Google Maps）后，地点名称会显示为可点击的超链接。地点名称请在各语言分页填写。",
			en: "Optional. If a map link (e.g., Google Maps) is provided, the location name will be displayed as a clickable hyperlink. Fill in the location name in each language tab."
		},
		startDate: { "zh-Hant": "活動開始時間", "zh-Hans": "活动开始时间", en: "Event Start" },
		endDate: { "zh-Hant": "活動結束時間", "zh-Hans": "活动结束时间", en: "Event End" },
		editDeadline: { "zh-Hant": "編輯截止時間", "zh-Hans": "编辑截止时间", en: "Edit Deadline" },
		editDeadlineHint: {
			"zh-Hant": "報名者可以編輯表單的截止時間。若未設定，則以票種販售截止時間或活動開始時間為準。必須早於活動開始時間。",
			"zh-Hans": "报名者可以编辑表单的截止时间。若未设定，则以票种销售截止时间或活动开始时间为准。必须早于活动开始时间。",
			en: "Deadline for attendees to edit their registration form. If not set, falls back to ticket sale end date or event start date. Must be before event start date."
		},
		timezoneHint: { "zh-Hant": "所有時間皆為 UTC+8（台北時間）。", "zh-Hans": "所有时间均为 UTC+8（台北时间）。", en: "All times are in UTC+8 (Taipei time)." },
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
		sectionBasic: { "zh-Hant": "基本設定", "zh-Hans": "基本设置", en: "Basics" },
		sectionSchedule: { "zh-Hant": "時間", "zh-Hans": "时间", en: "Schedule" },
		sectionLocation: { "zh-Hant": "地點", "zh-Hans": "地点", en: "Location" },
		sectionOptions: { "zh-Hant": "其他選項", "zh-Hans": "其他选项", en: "Options" },
		sectionLanguage: { "zh-Hant": "語言內容", "zh-Hans": "语言内容", en: "Language content" },
		requiredLanguageHint: { "zh-Hant": "此語言的活動名稱為必填。", "zh-Hans": "此语言的活动名称为必填。", en: "The event name is required in this language." },
		optionalLanguageHint: {
			"zh-Hant": "選填。未填寫時，此語言的訪客可能會看到其他語言的內容。",
			"zh-Hans": "选填。未填写时，此语言的访客可能会看到其他语言的内容。",
			en: "Optional. If left empty, visitors in this language may see content from another language."
		},
		tabHasErrors: { "zh-Hant": "此分頁有需要修正的欄位", "zh-Hans": "此分页有需要修正的栏位", en: "This tab has fields to fix" },
		tabFilled: { "zh-Hant": "已填寫活動名稱", "zh-Hans": "已填写活动名称", en: "Event name filled in" },
		fixErrors: { "zh-Hant": "有 {count} 個欄位需要修正，請檢查下列分頁：", "zh-Hans": "有 {count} 个栏位需要修正，请检查下列分页：", en: "{count} field(s) need attention. Please check these tabs:" },
		fixErrorsToast: { "zh-Hant": "尚有欄位未正確填寫，請檢查標示的分頁", "zh-Hans": "尚有栏位未正确填写，请检查标示的分页", en: "Some fields need attention. Check the highlighted tabs." },
		nameRequired: { "zh-Hant": "請填寫英文活動名稱", "zh-Hans": "请填写英文活动名称", en: "Please enter the English event name" },
		slugInvalid: {
			"zh-Hant": "僅可使用小寫字母、數字和連字號（例如：sitcon-2026）",
			"zh-Hans": "仅可使用小写字母、数字和连字号（例如：sitcon-2026）",
			en: "Only lowercase letters, numbers, and hyphens (e.g., sitcon-2026)"
		},
		urlInvalid: {
			"zh-Hant": "請輸入有效的網址（以 http:// 或 https:// 開頭）",
			"zh-Hans": "请输入有效的网址（以 http:// 或 https:// 开头）",
			en: "Enter a valid URL starting with http:// or https://"
		},
		startRequired: { "zh-Hant": "請選擇活動開始時間", "zh-Hans": "请选择活动开始时间", en: "Please choose the event start time" },
		endRequired: { "zh-Hant": "請選擇活動結束時間", "zh-Hans": "请选择活动结束时间", en: "Please choose the event end time" },
		endBeforeStart: { "zh-Hant": "結束時間必須晚於開始時間", "zh-Hans": "结束时间必须晚于开始时间", en: "End time must be after the start time" },
		deadlineAfterStart: { "zh-Hant": "編輯截止時間必須早於活動開始時間", "zh-Hans": "编辑截止时间必须早于活动开始时间", en: "Edit deadline must be before the event start time" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		viewPage: { "zh-Hant": "開啟活動頁面", "zh-Hans": "打开活动页面", en: "Open public page" },
		copyLink: { "zh-Hant": "複製活動連結", "zh-Hans": "复制活动链接", en: "Copy event link" },
		linkCopied: { "zh-Hant": "已複製活動連結", "zh-Hans": "已复制活动链接", en: "Event link copied" },
		copyFailed: { "zh-Hant": "無法複製，請手動複製", "zh-Hans": "无法复制，请手动复制", en: "Could not copy, please copy it manually" },
		hidden: { "zh-Hant": "已隱藏", "zh-Hans": "已隐藏", en: "Hidden" },
		name: { "zh-Hant": "活動名稱", "zh-Hans": "活动名称", en: "Event Name" },
		location: { "zh-Hant": "地點", "zh-Hans": "地点", en: "Location" },
		startDateColumn: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start" },
		endDateColumn: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End" },
		active: { "zh-Hant": "進行中", "zh-Hans": "进行中", en: "Active" },
		upcoming: { "zh-Hant": "尚未開始", "zh-Hans": "尚未开始", en: "Upcoming" },
		ended: { "zh-Hant": "已結束", "zh-Hans": "已结束", en: "Ended" },
		allStatuses: { "zh-Hant": "所有狀態", "zh-Hans": "所有状态", en: "All statuses" },
		searchPlaceholder: { "zh-Hant": "搜尋活動名稱或 Slug", "zh-Hans": "搜索活动名称或 Slug", en: "Search by name or slug" },
		clearSearch: { "zh-Hant": "清除搜尋", "zh-Hans": "清除搜索", en: "Clear search" },
		noMatch: { "zh-Hant": "沒有符合條件的活動", "zh-Hans": "没有符合条件的活动", en: "No events match your filters" },
		emptyTitle: { "zh-Hant": "還沒有任何活動", "zh-Hans": "还没有任何活动", en: "No events yet" },
		emptyDescription: {
			"zh-Hant": "建立第一個活動，即可開始設定票種與報名表單。",
			"zh-Hans": "创建第一个活动，即可开始设置票种与报名表单。",
			en: "Create your first event to start setting up tickets and registration forms."
		},
		loadFailed: { "zh-Hant": "載入活動失敗", "zh-Hans": "载入活动失败", en: "Failed to load events" },
		saveFailed: { "zh-Hant": "儲存失敗", "zh-Hans": "保存失败", en: "Save failed" },
		deleteFailed: { "zh-Hant": "刪除失敗", "zh-Hans": "删除失败", en: "Delete failed" },
		unknownError: { "zh-Hant": "發生未知的錯誤", "zh-Hans": "发生未知的错误", en: "An unknown error occurred" },
		createdSuccess: { "zh-Hant": "活動已建立", "zh-Hans": "活动已创建", en: "Event created" },
		updatedSuccess: { "zh-Hant": "活動已更新", "zh-Hans": "活动已更新", en: "Event updated" },
		deletedSuccess: { "zh-Hant": "活動已刪除", "zh-Hans": "活动已删除", en: "Event deleted" },
		deleteTitle: { "zh-Hant": "刪除活動", "zh-Hans": "删除活动", en: "Delete event" },
		deleteDescription: {
			"zh-Hant": "確定要刪除「{name}」嗎？此操作無法復原。已有報名資料的活動無法刪除。",
			"zh-Hans": "确定要删除「{name}」吗？此操作无法复原。已有报名数据的活动无法删除。",
			en: 'Delete "{name}"? This cannot be undone. Events that already have registrations cannot be deleted.'
		},
		discardTitle: { "zh-Hant": "放棄未儲存的變更？", "zh-Hans": "放弃未保存的变更？", en: "Discard unsaved changes?" },
		discardDescription: {
			"zh-Hant": "關閉後，您在此表單填寫的內容將會遺失。",
			"zh-Hans": "关闭后，您在此表单填写的内容将会丢失。",
			en: "If you close now, what you entered in this form will be lost."
		},
		discard: { "zh-Hant": "放棄變更", "zh-Hans": "放弃变更", en: "Discard changes" },
		keepEditing: { "zh-Hant": "繼續編輯", "zh-Hans": "继续编辑", en: "Keep editing" }
	});

	const validationMessages = useMemo(
		() => ({
			nameRequired: t.nameRequired,
			slugInvalid: t.slugInvalid,
			urlInvalid: t.urlInvalid,
			startRequired: t.startRequired,
			endRequired: t.endRequired,
			endBeforeStart: t.endBeforeStart,
			deadlineAfterStart: t.deadlineAfterStart
		}),
		[t.nameRequired, t.slugInvalid, t.urlInvalid, t.startRequired, t.endRequired, t.endBeforeStart, t.deadlineAfterStart]
	);

	const errors = useMemo(() => validateEventForm(form, validationMessages), [form, validationMessages]);
	const visibleErrors: EventFormErrors = submitAttempted ? errors : {};

	const loadEvents = useCallback(
		async (showSkeleton: boolean) => {
			const requestId = ++loadRequestRef.current;
			if (showSkeleton) dispatch({ type: "setLoading", value: true });
			try {
				const response = await adminEventsAPI.getAll();
				if (requestId !== loadRequestRef.current) return;
				if (!response.success) throw new Error(response.message || t.unknownError);
				dispatch({ type: "eventsLoaded", events: response.data || [] });
			} catch (error) {
				if (requestId !== loadRequestRef.current) return;
				console.error("Failed to load events:", error);
				showAlert(`${t.loadFailed}: ${error instanceof Error ? error.message : String(error)}`, "error");
			} finally {
				if (requestId === loadRequestRef.current) dispatch({ type: "setLoading", value: false });
			}
		},
		[showAlert, t.loadFailed, t.unknownError]
	);

	useEffect(() => {
		void loadEvents(true);
	}, [loadEvents]);

	const openModal = useCallback((event: Event | null = null) => {
		dispatch({ type: "openModal", event });
	}, []);

	const requestClose = useCallback(async () => {
		if (isSaving) return;
		if (isFormDirty(form, editingEvent)) {
			const discard = await confirm({ title: t.discardTitle, description: t.discardDescription, destructive: true, confirmLabel: t.discard, cancelLabel: t.keepEditing });
			if (!discard) return;
		}
		dispatch({ type: "closeModal" });
	}, [confirm, editingEvent, form, isSaving, t.discard, t.discardDescription, t.discardTitle, t.keepEditing]);

	async function saveEvent(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (isSaving) return;

		const errorTabs = tabsWithErrors(errors);
		if (errorTabs.size > 0) {
			const targetTab = errorTabs.has(activeTab) ? activeTab : (tabOrder.find(tab => errorTabs.has(tab)) ?? activeTab);
			dispatch({ type: "submitRejected", tab: targetTab });
			showAlert(t.fixErrorsToast, "error");
			window.setTimeout(() => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus(), 50);
			return;
		}

		dispatch({ type: "setSaving", value: true });
		dispatch({ type: "setSubmitError", value: null });

		const slug = form.slug.trim();
		const mapLink = form.mapLink.trim();
		const ogImage = form.ogImage.trim();
		const opassEventId = form.opassEventId.trim();

		const data = {
			name: {
				en: form.nameEn.trim(),
				"zh-Hant": form.nameZhHant.trim(),
				"zh-Hans": form.nameZhHans.trim()
			},
			description: {
				en: form.descEn,
				"zh-Hant": form.descZhHant,
				"zh-Hans": form.descZhHans
			},
			plainDescription: {
				en: form.plainDescEn,
				"zh-Hant": form.plainDescZhHant,
				"zh-Hans": form.plainDescZhHans
			},
			locationText: {
				en: form.locationTextEn.trim(),
				"zh-Hant": form.locationTextZhHant.trim(),
				"zh-Hans": form.locationTextZhHans.trim()
			},
			mapLink: mapLink || undefined,
			slug: slug || undefined,
			ogImage: ogImage || undefined,
			startDate: fromDateTimeLocalString(form.eventStartTime),
			endDate: fromDateTimeLocalString(form.eventEndTime),
			editDeadline: form.editDeadline ? fromDateTimeLocalString(form.editDeadline) : null,
			hideEvent: form.hideEvent,
			useOpass: form.useOpass,
			opassEventId: opassEventId || null
		};

		try {
			if (editingEvent) {
				// Send "" / null (not undefined) so that clearing these fields actually clears them on the server
				const response = await adminEventsAPI.update(editingEvent.id, { ...data, slug: slug || null, mapLink, ogImage });
				if (!response.success) throw new Error(response.message || t.unknownError);
				showAlert(t.updatedSuccess, "success");
			} else {
				const response = await adminEventsAPI.create(data);
				if (!response.success) throw new Error(response.message || t.unknownError);
				showAlert(t.createdSuccess, "success");
			}
			dispatch({ type: "closeModal" });
			window.dispatchEvent(new Event("eventListChanged"));
			void loadEvents(false);
		} catch (error) {
			dispatch({ type: "setSubmitError", value: error instanceof Error ? error.message : String(error) });
			showAlert(`${t.saveFailed}: ${error instanceof Error ? error.message : String(error)}`, "error");
		} finally {
			dispatch({ type: "setSaving", value: false });
		}
	}

	const deleteEvent = useCallback(
		async (event: Event) => {
			const name = localizedText(event.name, locale) || event.id;
			const confirmed = await confirm({ title: t.deleteTitle, description: t.deleteDescription.replace("{name}", name), destructive: true });
			if (!confirmed) return;

			try {
				const response = await adminEventsAPI.delete(event.id);
				if (!response.success) throw new Error(response.message || t.unknownError);
				showAlert(t.deletedSuccess, "success");
				window.dispatchEvent(new Event("eventListChanged"));
				void loadEvents(false);
			} catch (error) {
				showAlert(`${t.deleteFailed}: ${error instanceof Error ? error.message : String(error)}`, "error");
			}
		},
		[confirm, loadEvents, locale, showAlert, t.deleteDescription, t.deleteFailed, t.deleteTitle, t.deletedSuccess, t.unknownError]
	);

	const getPublicPath = useCallback((identifier: string) => `/${locale}/${identifier}`, [locale]);

	const copyLink = useCallback(
		async (identifier: string) => {
			try {
				await navigator.clipboard.writeText(`${window.location.origin}${getPublicPath(identifier)}`);
				showAlert(t.linkCopied, "success", 2500);
			} catch {
				showAlert(t.copyFailed, "error");
			}
		},
		[getPublicPath, showAlert, t.copyFailed, t.linkCopied]
	);

	const statusLabels = useMemo<Record<EventStatus, string>>(() => ({ upcoming: t.upcoming, active: t.active, ended: t.ended }), [t.upcoming, t.active, t.ended]);

	const eventsWithStatus = useMemo((): EventWithStatus[] => {
		const now = new Date();
		return events.map(event => {
			const status = computeStatus(event, now);
			return {
				...event,
				status,
				statusLabel: statusLabels[status],
				displayName: localizedText(event.name, locale),
				displayLocation: localizedText(event.locationText, locale),
				identifier: event.slug || event.id.slice(-6),
				formattedStartDate: formatEventDateTime(event.startDate),
				formattedEndDate: formatEventDateTime(event.endDate)
			};
		});
	}, [events, locale, statusLabels]);

	const filteredEvents = useMemo(() => {
		const query = search.trim().toLowerCase();
		return eventsWithStatus.filter(event => {
			if (statusFilter !== "all" && event.status !== statusFilter) return false;
			if (!query) return true;
			const names = event.name && typeof event.name === "object" ? Object.values(event.name) : [];
			return [event.displayName, event.identifier, event.id, ...names].some(value => value?.toLowerCase().includes(query));
		});
	}, [eventsWithStatus, search, statusFilter]);

	const columns = useMemo(
		() =>
			createEventsColumns({
				onEdit: openModal,
				onDelete: deleteEvent,
				onCopyLink: copyLink,
				getPublicUrl: getPublicPath,
				t: {
					name: t.name,
					slug: t.slug,
					location: t.location,
					startDate: t.startDateColumn,
					endDate: t.endDateColumn,
					status: t.status,
					actions: t.actions,
					edit: t.edit,
					delete: t.delete,
					viewPage: t.viewPage,
					copyLink: t.copyLink,
					hidden: t.hidden
				}
			}),
		[openModal, deleteEvent, copyLink, getPublicPath, t.name, t.slug, t.location, t.startDateColumn, t.endDateColumn, t.status, t.actions, t.edit, t.delete, t.viewPage, t.copyLink, t.hidden]
	);

	const hasNoEvents = !isLoading && events.length === 0;

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.pageDescription}
				actions={
					<Button variant="primary" onClick={() => openModal()}>
						<Plus className="size-4" />
						{t.addEvent}
					</Button>
				}
			/>

			{!hasNoEvents && (
				<AdminToolbar>
					<SearchInput value={search} onChange={setSearch} placeholder={t.searchPlaceholder} clearLabel={t.clearSearch} />
					<Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusFilter)}>
						<SelectTrigger className="w-full sm:w-44" aria-label={t.status}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t.allStatuses}</SelectItem>
							<SelectItem value="upcoming">{t.upcoming}</SelectItem>
							<SelectItem value="active">{t.active}</SelectItem>
							<SelectItem value="ended">{t.ended}</SelectItem>
						</SelectContent>
					</Select>
				</AdminToolbar>
			)}

			<DataTable
				columns={columns}
				data={filteredEvents}
				isLoading={isLoading}
				getRowId={row => row.id}
				emptyMessage={t.noMatch}
				emptyState={
					hasNoEvents ? (
						<EmptyState
							icon={CalendarDays}
							title={t.emptyTitle}
							description={t.emptyDescription}
							action={
								<Button variant="primary" onClick={() => openModal()}>
									<Plus className="size-4" />
									{t.addEvent}
								</Button>
							}
						/>
					) : undefined
				}
			/>

			<EventEditorDialog
				open={showModal}
				editingEvent={editingEvent}
				activeTab={activeTab}
				form={form}
				errors={visibleErrors}
				submitError={submitError}
				isSaving={isSaving}
				slugPreviewBase={`/${locale}`}
				t={t}
				dispatch={dispatch}
				onSubmit={saveEvent}
				onRequestClose={requestClose}
			/>
		</main>
	);
}
