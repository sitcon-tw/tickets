"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import AdminHeader from "@/components/AdminHeader";
import { SortableDataTable } from "@/components/data-table/sortable-data-table";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { formatDateTime } from "@/lib/utils/timezone";
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Ticket } from "@sitcontix/types";
import { CalendarDays, Plus, RefreshCw, Ticket as TicketIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { createTicketsColumns, type TicketDisplay } from "./columns";
import { LinkBuilderDialog } from "./LinkBuilderDialog";
import { TicketFormDialog } from "./TicketFormDialog";

function formatTicketDateTime(dt?: Date | null) {
	if (!dt) return "";
	try {
		return formatDateTime(new Date(dt));
	} catch {
		return "";
	}
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

type TicketsPageState = {
	tickets: Ticket[];
	isLoading: boolean;
	loadError: string | null;
	showModal: boolean;
	editingTicket: Ticket | null;
	showLinkModal: boolean;
	selectedTicketForLink: Ticket | null;
	isSorting: boolean;
};

type TicketsPageAction =
	| { type: "eventChanged" }
	| { type: "loadStarted" }
	| { type: "ticketsLoaded"; tickets: Ticket[] }
	| { type: "loadFailed"; message: string }
	| { type: "ticketsReordered"; tickets: Ticket[] }
	| { type: "openModal"; ticket: Ticket | null }
	| { type: "setModalOpen"; value: boolean }
	| { type: "openLinkBuilder"; ticket: Ticket }
	| { type: "setLinkModalOpen"; value: boolean }
	| { type: "setSorting"; value: boolean };

const initialTicketsPageState: TicketsPageState = {
	tickets: [],
	isLoading: false,
	loadError: null,
	showModal: false,
	editingTicket: null,
	showLinkModal: false,
	selectedTicketForLink: null,
	isSorting: false
};

function ticketsPageReducer(state: TicketsPageState, action: TicketsPageAction): TicketsPageState {
	switch (action.type) {
		case "eventChanged":
			return { ...initialTicketsPageState };
		case "loadStarted":
			return { ...state, isLoading: true, loadError: null };
		case "ticketsLoaded":
			return { ...state, tickets: action.tickets, isLoading: false, loadError: null };
		case "loadFailed":
			return { ...state, isLoading: false, loadError: action.message };
		case "ticketsReordered":
			return { ...state, tickets: action.tickets };
		case "openModal":
			return { ...state, editingTicket: action.ticket, showModal: true };
		case "setModalOpen":
			return { ...state, showModal: action.value };
		case "openLinkBuilder":
			return { ...state, selectedTicketForLink: action.ticket, showLinkModal: true };
		case "setLinkModalOpen":
			return { ...state, showLinkModal: action.value };
		case "setSorting":
			return { ...state, isSorting: action.value };
	}
}

type EventInfo = { id: string; slug: string | null; startDate: Date | null };

export default function TicketsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const eventId = useSelectedEventId();

	const [state, dispatch] = useReducer(ticketsPageReducer, initialTicketsPageState);
	const { tickets, isLoading, loadError, showModal, editingTicket, showLinkModal, selectedTicketForLink, isSorting } = state;
	const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

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
		title: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
		description: {
			"zh-Hant": "管理此活動的票種、價格與販售時間。拖曳左側手把（或使用上下箭頭）可調整在公開頁面的顯示順序。",
			"zh-Hans": "管理此活动的票种、价格与贩售时间。拖曳左侧手柄（或使用上下箭头）可调整在公开页面的显示顺序。",
			en: "Manage this event's ticket types, prices and sale windows. Drag the handle (or use the arrows) to change the order shown on the public page."
		},
		addTicket: { "zh-Hant": "新增票種", "zh-Hans": "新增票种", en: "Add Ticket" },
		editTicket: { "zh-Hant": "編輯票種", "zh-Hans": "编辑票种", en: "Edit Ticket" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		ticketType: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Type" },
		price: { "zh-Hant": "價格", "zh-Hans": "价格", en: "Price" },
		free: { "zh-Hant": "免費", "zh-Hans": "免费", en: "Free" },
		saleWindow: { "zh-Hant": "販售時間", "zh-Hans": "贩售时间", en: "Sale Window" },
		noLimit: { "zh-Hant": "不限制", "zh-Hans": "不限制", en: "No limit" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		sold: { "zh-Hant": "已售 / 總數", "zh-Hans": "已售 / 总数", en: "Sold / Total" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		hidden: { "zh-Hant": "已隱藏", "zh-Hans": "已隐藏", en: "Hidden" },
		inviteOnly: { "zh-Hant": "需邀請碼", "zh-Hans": "需邀请码", en: "Invite code" },
		smsVerification: { "zh-Hant": "簡訊驗證", "zh-Hans": "短信验证", en: "SMS verify" },
		selling: { "zh-Hant": "販售中", "zh-Hans": "贩售中", en: "On sale" },
		notStarted: { "zh-Hant": "尚未開始", "zh-Hans": "尚未开始", en: "Not started" },
		ended: { "zh-Hant": "已結束", "zh-Hans": "已结束", en: "Ended" },
		soldOut: { "zh-Hant": "已售完", "zh-Hans": "已售完", en: "Sold out" },
		directLink: { "zh-Hant": "直接連結", "zh-Hans": "直接链接", en: "Direct link" },
		moveUp: { "zh-Hant": "上移", "zh-Hans": "上移", en: "Move up" },
		moveDown: { "zh-Hant": "下移", "zh-Hans": "下移", en: "Move down" },
		noEventTitle: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Select an event first" },
		noEventDescription: {
			"zh-Hant": "從左側選單選擇一個活動後，即可管理它的票種。",
			"zh-Hans": "从左侧菜单选择一个活动后，即可管理它的票种。",
			en: "Pick an event from the sidebar to manage its ticket types."
		},
		emptyTitle: { "zh-Hant": "還沒有任何票種", "zh-Hans": "还没有任何票种", en: "No ticket types yet" },
		emptyDescription: { "zh-Hant": "新增第一個票種，讓參加者可以報名。", "zh-Hans": "新增第一个票种，让参加者可以报名。", en: "Add your first ticket type so attendees can register." },
		loadFailedTitle: { "zh-Hant": "無法載入票種", "zh-Hans": "无法加载票种", en: "Could not load ticket types" },
		retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
		deleteTitle: { "zh-Hant": "刪除票種", "zh-Hans": "删除票种", en: "Delete ticket type" },
		deleteConfirm: {
			"zh-Hant": "確定要刪除「{name}」嗎？此操作無法復原；已有報名的票種無法刪除。",
			"zh-Hans": "确定要删除「{name}」吗？此操作无法复原；已有报名的票种无法删除。",
			en: 'Delete "{name}"? This cannot be undone, and ticket types that already have registrations cannot be deleted.'
		},
		deleted: { "zh-Hant": "票種已刪除", "zh-Hans": "票种已删除", en: "Ticket type deleted" },
		deleteFailed: { "zh-Hant": "刪除失敗：", "zh-Hans": "删除失败：", en: "Could not delete: " },
		orderSaved: { "zh-Hant": "票種順序已更新", "zh-Hans": "票种顺序已更新", en: "Ticket order updated" },
		reorderFailed: { "zh-Hant": "更新順序失敗，已還原：", "zh-Hans": "更新顺序失败，已还原：", en: "Could not save the new order, changes were reverted: " },
		dragInstructions: {
			"zh-Hant": "按空白鍵或 Enter 拿起票種，使用上下方向鍵移動，再按空白鍵放下，或按 Esc 取消。",
			"zh-Hans": "按空格键或 Enter 拿起票种，使用上下方向键移动，再按空格键放下，或按 Esc 取消。",
			en: "Press space or enter to pick up a ticket type, use the up and down arrow keys to move it, then press space to drop it or escape to cancel."
		},
		announcePickedUp: { "zh-Hant": "已拿起「{name}」。", "zh-Hans": "已拿起「{name}」。", en: 'Picked up "{name}".' },
		announceMoved: { "zh-Hant": "「{name}」移動到「{over}」的位置。", "zh-Hans": "「{name}」移动到「{over}」的位置。", en: '"{name}" moved to the position of "{over}".' },
		announceDropped: { "zh-Hant": "「{name}」已放下。", "zh-Hans": "「{name}」已放下。", en: '"{name}" dropped.' },
		announceCancelled: { "zh-Hant": "已取消移動「{name}」。", "zh-Hans": "已取消移动「{name}」。", en: 'Moving "{name}" cancelled.' }
	});

	useEffect(() => {
		eventIdRef.current = eventId;
	}, [eventId]);

	const loadTickets = useCallback(async (targetEventId: string, { silent = false }: { silent?: boolean } = {}) => {
		const requestId = ++requestRef.current;
		if (!silent) dispatch({ type: "loadStarted" });

		try {
			const response = await adminTicketsAPI.getAll({ eventId: targetEventId });
			if (requestRef.current !== requestId) return;
			if (!response.success) throw new Error(response.message);
			const sorted = [...(response.data || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
			dispatch({ type: "ticketsLoaded", tickets: sorted });
		} catch (error) {
			if (requestRef.current !== requestId) return;
			console.error("Failed to load tickets:", error);
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

		void loadTickets(eventId);
		return invalidateRequests;
	}, [eventId, loadTickets, invalidateRequests]);

	// The event's slug (for direct links) and start (sales must end before it).
	useEffect(() => {
		if (!eventId) return;
		let cancelled = false;

		adminEventsAPI
			.getById(eventId)
			.then(response => {
				if (cancelled || !response.success) return;
				setEventInfo({ id: eventId, slug: response.data.slug ?? null, startDate: response.data.startDate ? new Date(response.data.startDate) : null });
			})
			.catch(error => console.error("Failed to load event:", error));

		return () => {
			cancelled = true;
		};
	}, [eventId]);

	const currentEventInfo = eventInfo && eventInfo.id === eventId ? eventInfo : null;
	const eventSlug = currentEventInfo?.slug || (eventId ? eventId.slice(-6) : "");

	const refreshTickets = useCallback(async () => {
		if (eventIdRef.current) await loadTickets(eventIdRef.current, { silent: true });
	}, [loadTickets]);

	const openModal = useCallback((ticket: Ticket | null = null) => {
		dispatch({ type: "openModal", ticket });
	}, []);

	const openLinkBuilder = useCallback((ticket: Ticket) => {
		dispatch({ type: "openLinkBuilder", ticket });
	}, []);

	const deleteTicket = useCallback(
		async (ticket: Ticket) => {
			const name = getTicketName(ticket, locale);
			const confirmed = await confirm({ title: t.deleteTitle, description: t.deleteConfirm.replace("{name}", name), destructive: true });
			if (!confirmed) return;

			try {
				const response = await adminTicketsAPI.delete(ticket.id);
				if (!response.success) throw new Error(response.message);
				showAlert(t.deleted, "success");
			} catch (error) {
				showAlert(t.deleteFailed + errorMessage(error), "error");
				return;
			}
			await refreshTickets();
		},
		[confirm, locale, refreshTickets, showAlert, t.deleteConfirm, t.deleteFailed, t.deleteTitle, t.deleted]
	);

	const persistOrder = useCallback(
		async (previous: Ticket[], next: Ticket[]) => {
			const targetEventId = eventIdRef.current;
			const reordered = next.map((ticket, index) => ({ ...ticket, order: index }));
			dispatch({ type: "ticketsReordered", tickets: reordered });

			savingOrderRef.current = true;
			dispatch({ type: "setSorting", value: true });
			try {
				const response = await adminTicketsAPI.reorder({ tickets: reordered.map(ticket => ({ id: ticket.id, order: ticket.order ?? 0 })) });
				if (!response.success) throw new Error(response.message);
				if (eventIdRef.current === targetEventId) showAlert(t.orderSaved, "success");
			} catch (error) {
				// Roll back the optimistic update, unless the user has switched event in the meantime.
				if (eventIdRef.current === targetEventId) dispatch({ type: "ticketsReordered", tickets: previous });
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

		const oldIndex = tickets.findIndex(ticket => ticket.id === active.id);
		const newIndex = tickets.findIndex(ticket => ticket.id === over.id);
		if (oldIndex === -1 || newIndex === -1) return;

		void persistOrder(tickets, arrayMove(tickets, oldIndex, newIndex));
	}

	const moveTicket = useCallback(
		(ticket: Ticket, direction: -1 | 1) => {
			if (savingOrderRef.current) return;
			const oldIndex = tickets.findIndex(item => item.id === ticket.id);
			const newIndex = oldIndex + direction;
			if (oldIndex === -1 || newIndex < 0 || newIndex >= tickets.length) return;

			void persistOrder(tickets, arrayMove(tickets, oldIndex, newIndex));
		},
		[persistOrder, tickets]
	);

	const announcements = useMemo((): Announcements => {
		const nameOf = (id: string | number) => {
			const ticket = tickets.find(item => item.id === id);
			return ticket ? getTicketName(ticket, locale) : String(id);
		};
		return {
			onDragStart: ({ active }) => t.announcePickedUp.replace("{name}", nameOf(active.id)),
			onDragOver: ({ active, over }) => (over ? t.announceMoved.replace("{name}", nameOf(active.id)).replace("{over}", nameOf(over.id)) : undefined),
			onDragEnd: ({ active }) => t.announceDropped.replace("{name}", nameOf(active.id)),
			onDragCancel: ({ active }) => t.announceCancelled.replace("{name}", nameOf(active.id))
		};
	}, [tickets, locale, t.announcePickedUp, t.announceMoved, t.announceDropped, t.announceCancelled]);

	const ticketsWithStatus = useMemo((): TicketDisplay[] => {
		const now = new Date();
		return tickets.map(ticket => {
			const status =
				ticket.saleStart && new Date(ticket.saleStart) > now
					? { label: t.notStarted, tone: "info" as const }
					: ticket.saleEnd && new Date(ticket.saleEnd) < now
						? { label: t.ended, tone: "neutral" as const }
						: ticket.soldCount >= ticket.quantity
							? { label: t.soldOut, tone: "warning" as const }
							: { label: t.selling, tone: "success" as const };
			return {
				...ticket,
				displayName: getTicketName(ticket, locale),
				formattedSaleStart: formatTicketDateTime(ticket.saleStart),
				formattedSaleEnd: formatTicketDateTime(ticket.saleEnd),
				statusLabel: status.label,
				statusTone: status.tone
			};
		});
	}, [tickets, locale, t.notStarted, t.ended, t.soldOut, t.selling]);

	const columns = useMemo(
		() =>
			createTicketsColumns({
				onEdit: openModal,
				onDelete: deleteTicket,
				onLinkBuilder: openLinkBuilder,
				onMove: moveTicket,
				count: tickets.length,
				busy: isSorting,
				t: {
					ticketType: t.ticketType,
					price: t.price,
					saleWindow: t.saleWindow,
					status: t.status,
					sold: t.sold,
					actions: t.actions,
					free: t.free,
					noLimit: t.noLimit,
					hidden: t.hidden,
					inviteOnly: t.inviteOnly,
					smsVerification: t.smsVerification,
					editTicket: t.editTicket,
					delete: t.delete,
					directLink: t.directLink,
					moveUp: t.moveUp,
					moveDown: t.moveDown
				}
			}),
		[
			openModal,
			deleteTicket,
			openLinkBuilder,
			moveTicket,
			tickets.length,
			isSorting,
			t.ticketType,
			t.price,
			t.saleWindow,
			t.status,
			t.sold,
			t.actions,
			t.free,
			t.noLimit,
			t.hidden,
			t.inviteOnly,
			t.smsVerification,
			t.editTicket,
			t.delete,
			t.directLink,
			t.moveUp,
			t.moveDown
		]
	);

	const addButton = (
		<Button variant="primary" onClick={() => openModal()} disabled={!eventId || isSorting}>
			<Plus className="size-4" />
			{t.addTicket}
		</Button>
	);

	let content: ReactNode;
	if (!eventId) {
		content = <EmptyState icon={CalendarDays} title={t.noEventTitle} description={t.noEventDescription} />;
	} else if (loadError && tickets.length === 0) {
		content = (
			<EmptyState
				icon={TicketIcon}
				title={t.loadFailedTitle}
				description={loadError}
				action={
					<Button variant="outline" onClick={() => void loadTickets(eventId)}>
						<RefreshCw className="size-4" />
						{t.retry}
					</Button>
				}
			/>
		);
	} else if (!isLoading && tickets.length === 0) {
		content = <EmptyState icon={TicketIcon} title={t.emptyTitle} description={t.emptyDescription} action={addButton} />;
	} else if (isLoading && tickets.length === 0) {
		content = (
			<div className="space-y-3 rounded-xl border bg-card p-4" aria-busy="true">
				{Array.from({ length: 4 }, (_, index) => (
					<div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
				))}
			</div>
		);
	} else {
		content = (
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis]}
				accessibility={{ announcements, screenReaderInstructions: { draggable: t.dragInstructions } }}
			>
				<SortableContext items={tickets.map(ticket => ticket.id)} strategy={verticalListSortingStrategy}>
					<SortableDataTable columns={columns} data={ticketsWithStatus} isLoading={isLoading} />
				</SortableContext>
			</DndContext>
		);
	}

	return (
		<main>
			<AdminHeader title={t.title} description={t.description} actions={addButton} />

			{content}

			<TicketFormDialog
				open={showModal}
				ticket={editingTicket}
				eventId={eventId}
				eventStart={currentEventInfo?.startDate ?? null}
				onOpenChange={value => dispatch({ type: "setModalOpen", value })}
				onSaved={refreshTickets}
			/>
			<LinkBuilderDialog open={showLinkModal} ticket={selectedTicketForLink} eventSlug={eventSlug} onOpenChange={value => dispatch({ type: "setLinkModalOpen", value })} />
		</main>
	);
}

function getTicketName(ticket: Ticket, locale: string) {
	const name = ticket.name as Ticket["name"] | string | undefined;
	if (name && typeof name === "object") return name[locale] || name["en"] || Object.values(name)[0] || "";
	return name || "";
}
