"use client";

import { useConfirm } from "@/components/admin/ConfirmProvider";
import { EmptyState } from "@/components/admin/EmptyState";
import AdminHeader from "@/components/AdminHeader";
import { SortableDataTable } from "@/components/data-table/sortable-data-table";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminSponsorsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { getLocalizedText } from "@/lib/utils/localization";
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { SponsorWithStats } from "@sitcontix/types";
import { CalendarDays, Download, Handshake, Plus, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { createSponsorsColumns, formatCtr, type SponsorDisplay } from "./columns";
import { SponsorFormDialog } from "./SponsorFormDialog";

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function csvCell(value: string | number) {
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

type SponsorsPageState = {
	sponsors: SponsorWithStats[];
	isLoading: boolean;
	loadError: string | null;
	showModal: boolean;
	editingSponsor: SponsorWithStats | null;
	isSorting: boolean;
};

type SponsorsPageAction =
	| { type: "eventChanged" }
	| { type: "loadStarted" }
	| { type: "sponsorsLoaded"; sponsors: SponsorWithStats[] }
	| { type: "loadFailed"; message: string }
	| { type: "sponsorsReordered"; sponsors: SponsorWithStats[] }
	| { type: "openModal"; sponsor: SponsorWithStats | null }
	| { type: "setModalOpen"; value: boolean }
	| { type: "setSorting"; value: boolean };

const initialSponsorsPageState: SponsorsPageState = {
	sponsors: [],
	isLoading: false,
	loadError: null,
	showModal: false,
	editingSponsor: null,
	isSorting: false
};

function sponsorsPageReducer(state: SponsorsPageState, action: SponsorsPageAction): SponsorsPageState {
	switch (action.type) {
		case "eventChanged":
			return { ...initialSponsorsPageState };
		case "loadStarted":
			return { ...state, isLoading: true, loadError: null };
		case "sponsorsLoaded":
			return { ...state, sponsors: action.sponsors, isLoading: false, loadError: null };
		case "loadFailed":
			return { ...state, isLoading: false, loadError: action.message };
		case "sponsorsReordered":
			return { ...state, sponsors: action.sponsors };
		case "openModal":
			return { ...state, editingSponsor: action.sponsor, showModal: true };
		case "setModalOpen":
			return { ...state, showModal: action.value };
		case "setSorting":
			return { ...state, isSorting: action.value };
	}
}

function StatTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border bg-card p-4">
			<div className="text-xs font-medium text-muted-foreground">{label}</div>
			<div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
		</div>
	);
}

export default function SponsorsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const eventId = useSelectedEventId();

	const [state, dispatch] = useReducer(sponsorsPageReducer, initialSponsorsPageState);
	const { sponsors, isLoading, loadError, showModal, editingSponsor, isSorting } = state;
	const [isExporting, setIsExporting] = useState(false);

	const requestRef = useRef(0);
	const eventIdRef = useRef(eventId);
	const savingOrderRef = useRef(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "廠商廣告", "zh-Hans": "厂商广告", en: "Sponsors" },
		description: {
			"zh-Hant": "管理活動頁面上的廠商 Logo。點擊 Logo 會彈出廠商介紹，並自動統計曝光與點擊。拖曳左側手把（或使用上下箭頭）可調整顯示順序。",
			"zh-Hans": "管理活动页面上的厂商 Logo。点击 Logo 会弹出厂商介绍，并自动统计曝光与点击。拖曳左侧手柄（或使用上下箭头）可调整显示顺序。",
			en: "Manage the sponsor logos on the event page. Clicking a logo opens the sponsor's introduction, and impressions and clicks are tracked automatically. Drag the handle (or use the arrows) to change the order."
		},
		addSponsor: { "zh-Hant": "新增廠商", "zh-Hans": "新增厂商", en: "Add Sponsor" },
		exportCsv: { "zh-Hant": "匯出每日數據 (CSV)", "zh-Hans": "导出每日数据 (CSV)", en: "Export daily data (CSV)" },
		exportFailed: { "zh-Hant": "匯出失敗：", "zh-Hans": "导出失败：", en: "Could not export: " },
		logo: { "zh-Hant": "Logo", "zh-Hans": "Logo", en: "Logo" },
		sponsor: { "zh-Hant": "廠商", "zh-Hans": "厂商", en: "Sponsor" },
		placements: { "zh-Hant": "顯示位置", "zh-Hans": "显示位置", en: "Placement" },
		slotRegistration: { "zh-Hant": "票券區之後", "zh-Hans": "票券区之后", en: "After tickets" },
		slotEventInfo: { "zh-Hant": "活動資訊之後", "zh-Hans": "活动资讯之后", en: "After event info" },
		impressions: { "zh-Hant": "曝光數", "zh-Hans": "曝光数", en: "Impressions" },
		clicks: { "zh-Hant": "點擊數", "zh-Hans": "点击数", en: "Clicks" },
		ctr: { "zh-Hant": "點擊率 (CTR)", "zh-Hans": "点击率 (CTR)", en: "CTR" },
		linkClicks: { "zh-Hant": "官網點擊", "zh-Hans": "官网点击", en: "Website clicks" },
		date: { "zh-Hant": "日期", "zh-Hans": "日期", en: "Date" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		hidden: { "zh-Hant": "已隱藏", "zh-Hans": "已隐藏", en: "Hidden" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		moveUp: { "zh-Hant": "上移", "zh-Hans": "上移", en: "Move up" },
		moveDown: { "zh-Hant": "下移", "zh-Hans": "下移", en: "Move down" },
		totalImpressions: { "zh-Hant": "總曝光數", "zh-Hans": "总曝光数", en: "Total impressions" },
		totalClicks: { "zh-Hant": "總點擊數", "zh-Hans": "总点击数", en: "Total clicks" },
		noEventTitle: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Select an event first" },
		noEventDescription: {
			"zh-Hant": "從左側選單選擇一個活動後，即可管理它的廠商 Logo。",
			"zh-Hans": "从左侧菜单选择一个活动后，即可管理它的厂商 Logo。",
			en: "Pick an event from the sidebar to manage its sponsor logos."
		},
		emptyTitle: { "zh-Hant": "還沒有任何廠商", "zh-Hans": "还没有任何厂商", en: "No sponsors yet" },
		emptyDescription: {
			"zh-Hant": "新增第一個廠商，它的 Logo 會顯示在活動頁面上。",
			"zh-Hans": "新增第一个厂商，它的 Logo 会显示在活动页面上。",
			en: "Add your first sponsor and its logo will appear on the event page."
		},
		loadFailedTitle: { "zh-Hant": "無法載入廠商", "zh-Hans": "无法加载厂商", en: "Could not load sponsors" },
		retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
		deleteTitle: { "zh-Hant": "刪除廠商", "zh-Hans": "删除厂商", en: "Delete sponsor" },
		deleteConfirm: {
			"zh-Hant": "確定要刪除「{name}」嗎？此廠商的曝光與點擊數據也會一併刪除，且無法復原。若只是暫時不想顯示，請改用編輯中的「隱藏」。",
			"zh-Hans": "确定要删除「{name}」吗？此厂商的曝光与点击数据也会一并删除，且无法复原。若只是暂时不想显示，请改用编辑中的「隐藏」。",
			en: 'Delete "{name}"? Its impression and click data will be deleted too and this cannot be undone. To hide it temporarily, untick "Show on the event page" in its settings instead.'
		},
		deleted: { "zh-Hant": "廠商已刪除", "zh-Hans": "厂商已删除", en: "Sponsor deleted" },
		deleteFailed: { "zh-Hant": "刪除失敗：", "zh-Hans": "删除失败：", en: "Could not delete: " },
		orderSaved: { "zh-Hant": "廠商順序已更新", "zh-Hans": "厂商顺序已更新", en: "Sponsor order updated" },
		reorderFailed: { "zh-Hant": "更新順序失敗，已還原：", "zh-Hans": "更新顺序失败，已还原：", en: "Could not save the new order, changes were reverted: " },
		dragInstructions: {
			"zh-Hant": "按空白鍵或 Enter 拿起廠商，使用上下方向鍵移動，再按空白鍵放下，或按 Esc 取消。",
			"zh-Hans": "按空格键或 Enter 拿起厂商，使用上下方向键移动，再按空格键放下，或按 Esc 取消。",
			en: "Press space or enter to pick up a sponsor, use the up and down arrow keys to move it, then press space to drop it or escape to cancel."
		},
		announcePickedUp: { "zh-Hant": "已拿起「{name}」。", "zh-Hans": "已拿起「{name}」。", en: 'Picked up "{name}".' },
		announceMoved: { "zh-Hant": "「{name}」移動到「{over}」的位置。", "zh-Hans": "「{name}」移动到「{over}」的位置。", en: '"{name}" moved to the position of "{over}".' },
		announceDropped: { "zh-Hant": "「{name}」已放下。", "zh-Hans": "「{name}」已放下。", en: '"{name}" dropped.' },
		announceCancelled: { "zh-Hant": "已取消移動「{name}」。", "zh-Hans": "已取消移动「{name}」。", en: 'Moving "{name}" cancelled.' }
	});

	useEffect(() => {
		eventIdRef.current = eventId;
	}, [eventId]);

	const loadSponsors = useCallback(async (targetEventId: string, { silent = false }: { silent?: boolean } = {}) => {
		const requestId = ++requestRef.current;
		if (!silent) dispatch({ type: "loadStarted" });

		try {
			const response = await adminSponsorsAPI.getAll(targetEventId);
			if (requestRef.current !== requestId) return;
			if (!response.success) throw new Error(response.message);
			dispatch({ type: "sponsorsLoaded", sponsors: [...(response.data || [])].sort((a, b) => a.order - b.order) });
		} catch (error) {
			if (requestRef.current !== requestId) return;
			console.error("Failed to load sponsors:", error);
			dispatch({ type: "loadFailed", message: errorMessage(error) });
		}
	}, []);

	const invalidateRequests = useCallback(() => {
		requestRef.current++;
	}, []);

	// Reload whenever the selected event changes. Bumping the request counter on cleanup makes late responses for the previous event get ignored.
	useEffect(() => {
		dispatch({ type: "eventChanged" });
		if (!eventId) return;

		void loadSponsors(eventId);
		return invalidateRequests;
	}, [eventId, loadSponsors, invalidateRequests]);

	const refreshSponsors = useCallback(async () => {
		if (eventIdRef.current) await loadSponsors(eventIdRef.current, { silent: true });
	}, [loadSponsors]);

	const openModal = useCallback((sponsor: SponsorWithStats | null = null) => {
		dispatch({ type: "openModal", sponsor });
	}, []);

	const nameOf = useCallback((sponsor: SponsorWithStats) => getLocalizedText(sponsor.name, locale), [locale]);

	const deleteSponsor = useCallback(
		async (sponsor: SponsorWithStats) => {
			const confirmed = await confirm({ title: t.deleteTitle, description: t.deleteConfirm.replace("{name}", nameOf(sponsor)), destructive: true });
			if (!confirmed) return;

			try {
				const response = await adminSponsorsAPI.delete(sponsor.id);
				if (!response.success) throw new Error(response.message);
				showAlert(t.deleted, "success");
			} catch (error) {
				showAlert(t.deleteFailed + errorMessage(error), "error");
				return;
			}
			await refreshSponsors();
		},
		[confirm, nameOf, refreshSponsors, showAlert, t.deleteConfirm, t.deleteFailed, t.deleteTitle, t.deleted]
	);

	const persistOrder = useCallback(
		async (previous: SponsorWithStats[], next: SponsorWithStats[]) => {
			const targetEventId = eventIdRef.current;
			if (!targetEventId) return;
			const reordered = next.map((sponsor, index) => ({ ...sponsor, order: index }));
			dispatch({ type: "sponsorsReordered", sponsors: reordered });

			savingOrderRef.current = true;
			dispatch({ type: "setSorting", value: true });
			try {
				const response = await adminSponsorsAPI.reorder(targetEventId, { sponsors: reordered.map(sponsor => ({ id: sponsor.id, order: sponsor.order })) });
				if (!response.success) throw new Error(response.message);
				if (eventIdRef.current === targetEventId) showAlert(t.orderSaved, "success");
			} catch (error) {
				// Roll back the optimistic update, unless the user has switched event in the meantime.
				if (eventIdRef.current === targetEventId) dispatch({ type: "sponsorsReordered", sponsors: previous });
				showAlert(t.reorderFailed + errorMessage(error), "error");
			} finally {
				savingOrderRef.current = false;
				dispatch({ type: "setSorting", value: false });
			}
		},
		[showAlert, t.orderSaved, t.reorderFailed]
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id || savingOrderRef.current) return;

		const oldIndex = sponsors.findIndex(sponsor => sponsor.id === active.id);
		const newIndex = sponsors.findIndex(sponsor => sponsor.id === over.id);
		if (oldIndex === -1 || newIndex === -1) return;

		void persistOrder(sponsors, arrayMove(sponsors, oldIndex, newIndex));
	}

	const moveSponsor = useCallback(
		(sponsor: SponsorWithStats, direction: -1 | 1) => {
			if (savingOrderRef.current) return;
			const oldIndex = sponsors.findIndex(item => item.id === sponsor.id);
			const newIndex = oldIndex + direction;
			if (oldIndex === -1 || newIndex < 0 || newIndex >= sponsors.length) return;

			void persistOrder(sponsors, arrayMove(sponsors, oldIndex, newIndex));
		},
		[persistOrder, sponsors]
	);

	const announcements = useMemo((): Announcements => {
		const label = (id: string | number) => {
			const sponsor = sponsors.find(item => item.id === id);
			return sponsor ? nameOf(sponsor) : String(id);
		};
		return {
			onDragStart: ({ active }) => t.announcePickedUp.replace("{name}", label(active.id)),
			onDragOver: ({ active, over }) => (over ? t.announceMoved.replace("{name}", label(active.id)).replace("{over}", label(over.id)) : undefined),
			onDragEnd: ({ active }) => t.announceDropped.replace("{name}", label(active.id)),
			onDragCancel: ({ active }) => t.announceCancelled.replace("{name}", label(active.id))
		};
	}, [sponsors, nameOf, t.announcePickedUp, t.announceMoved, t.announceDropped, t.announceCancelled]);

	const exportCsv = useCallback(async () => {
		if (!eventId || isExporting) return;
		setIsExporting(true);
		try {
			const response = await adminSponsorsAPI.getDailyStats(eventId);
			if (!response.success) throw new Error(response.message);

			const placementLabels = { after_registration: t.slotRegistration, after_event_info: t.slotEventInfo };
			const names = new Map(sponsors.map(sponsor => [sponsor.id, nameOf(sponsor)]));
			const header = [t.date, t.sponsor, t.placements, t.impressions, t.clicks, t.ctr, t.linkClicks];
			const rows = response.data.map(row => [
				row.date,
				names.get(row.sponsorId) ?? row.sponsorId,
				placementLabels[row.placement],
				row.impressions,
				row.clicks,
				formatCtr(row.clicks, row.impressions),
				row.linkClicks
			]);
			// The BOM makes Excel open the file as UTF-8, so Chinese sponsor names are not garbled.
			const csv = "﻿" + [header, ...rows].map(line => line.map(csvCell).join(",")).join("\r\n");

			const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
			const link = document.createElement("a");
			link.href = url;
			link.download = `sponsors-${new Date().toISOString().slice(0, 10)}.csv`;
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			showAlert(t.exportFailed + errorMessage(error), "error");
		} finally {
			setIsExporting(false);
		}
	}, [eventId, isExporting, nameOf, showAlert, sponsors, t.slotRegistration, t.slotEventInfo, t.date, t.sponsor, t.placements, t.impressions, t.clicks, t.ctr, t.linkClicks, t.exportFailed]);

	const sponsorsDisplay = useMemo((): SponsorDisplay[] => sponsors.map(sponsor => ({ ...sponsor, displayName: nameOf(sponsor) })), [sponsors, nameOf]);

	const totals = useMemo(
		() =>
			sponsors.reduce(
				(sum, sponsor) => ({ impressions: sum.impressions + sponsor.stats.impressions, clicks: sum.clicks + sponsor.stats.clicks, linkClicks: sum.linkClicks + sponsor.stats.linkClicks }),
				{ impressions: 0, clicks: 0, linkClicks: 0 }
			),
		[sponsors]
	);

	const columns = useMemo(
		() =>
			createSponsorsColumns({
				onEdit: openModal,
				onDelete: deleteSponsor,
				onMove: moveSponsor,
				count: sponsors.length,
				busy: isSorting,
				t: {
					logo: t.logo,
					sponsor: t.sponsor,
					placements: t.placements,
					impressions: t.impressions,
					clicks: t.clicks,
					ctr: t.ctr,
					linkClicks: t.linkClicks,
					actions: t.actions,
					hidden: t.hidden,
					edit: t.edit,
					delete: t.delete,
					moveUp: t.moveUp,
					moveDown: t.moveDown,
					placementLabels: { after_registration: t.slotRegistration, after_event_info: t.slotEventInfo }
				}
			}),
		[
			openModal,
			deleteSponsor,
			moveSponsor,
			sponsors.length,
			isSorting,
			t.logo,
			t.sponsor,
			t.placements,
			t.impressions,
			t.clicks,
			t.ctr,
			t.linkClicks,
			t.actions,
			t.hidden,
			t.edit,
			t.delete,
			t.moveUp,
			t.moveDown,
			t.slotRegistration,
			t.slotEventInfo
		]
	);

	const addButton = (
		<Button variant="primary" onClick={() => openModal()} disabled={!eventId || isSorting}>
			<Plus className="size-4" />
			{t.addSponsor}
		</Button>
	);

	const exportButton = (
		<Button variant="outline" onClick={() => void exportCsv()} disabled={!eventId || sponsors.length === 0} isLoading={isExporting}>
			<Download className="size-4" />
			{t.exportCsv}
		</Button>
	);

	let content: ReactNode;
	if (!eventId) {
		content = <EmptyState icon={CalendarDays} title={t.noEventTitle} description={t.noEventDescription} />;
	} else if (loadError && sponsors.length === 0) {
		content = (
			<EmptyState
				icon={Handshake}
				title={t.loadFailedTitle}
				description={loadError}
				action={
					<Button variant="outline" onClick={() => void loadSponsors(eventId)}>
						<RefreshCw className="size-4" />
						{t.retry}
					</Button>
				}
			/>
		);
	} else if (!isLoading && sponsors.length === 0) {
		content = <EmptyState icon={Handshake} title={t.emptyTitle} description={t.emptyDescription} action={addButton} />;
	} else if (isLoading && sponsors.length === 0) {
		content = (
			<div className="space-y-3 rounded-xl border bg-card p-4" aria-busy="true">
				{Array.from({ length: 4 }, (_, index) => (
					<div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
				))}
			</div>
		);
	} else {
		content = (
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<StatTile label={t.totalImpressions} value={totals.impressions.toLocaleString()} />
					<StatTile label={t.totalClicks} value={totals.clicks.toLocaleString()} />
					<StatTile label={t.ctr} value={formatCtr(totals.clicks, totals.impressions)} />
					<StatTile label={t.linkClicks} value={totals.linkClicks.toLocaleString()} />
				</div>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
					modifiers={[restrictToVerticalAxis]}
					accessibility={{ announcements, screenReaderInstructions: { draggable: t.dragInstructions } }}
				>
					<SortableContext items={sponsors.map(sponsor => sponsor.id)} strategy={verticalListSortingStrategy}>
						<SortableDataTable columns={columns} data={sponsorsDisplay} isLoading={isLoading} />
					</SortableContext>
				</DndContext>
			</div>
		);
	}

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.description}
				actions={
					<>
						{exportButton}
						{addButton}
					</>
				}
			/>

			{content}

			<SponsorFormDialog open={showModal} sponsor={editingSponsor} eventId={eventId} onOpenChange={value => dispatch({ type: "setModalOpen", value })} onSaved={refreshSponsors} />
		</main>
	);
}
