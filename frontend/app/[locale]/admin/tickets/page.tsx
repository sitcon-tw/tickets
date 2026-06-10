"use client";

import AdminHeader from "@/components/AdminHeader";
import { SortableDataTable } from "@/components/data-table/sortable-data-table";
import Checkbox from "@/components/input/Checkbox";
import MarkdownContent from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketsAPI } from "@/lib/api/endpoints";
import { LanguageFieldsProps } from "@/lib/types/pages";
import { formatDateTime as formatDateTimeUTC8, fromDateTimeLocalString, toDateTimeLocalString } from "@/lib/utils/timezone";
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Ticket } from "@sitcontix/types";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createTicketsColumns, type TicketDisplay } from "./columns";

const languagePlaceholders = {
	en: {
		plainDesc: "Plain text description without markdown formatting"
	},
	"zh-Hant": {
		plainDesc: "純文字描述，不含 Markdown 格式"
	},
	"zh-Hans": {
		plainDesc: "纯文字描述，不含 Markdown 格式"
	}
};

function formatTicketDateTime(dt?: Date | null) {
	if (!dt) return "";
	try {
		return formatDateTimeUTC8(dt);
	} catch {
		return "";
	}
}

function LanguageFields({
	ticketName,
	description,
	plainDescription,
	language,
	languageLabel,
	onNameChange,
	onDescriptionChange,
	onPlainDescriptionChange,
	required = false,
	tt
}: LanguageFieldsProps) {
	const placeholder = languagePlaceholders[language as keyof typeof languagePlaceholders] || languagePlaceholders.en;

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor={`name-${language}`}>
					{tt.ticketName} ({languageLabel}) {required && "*"}
				</Label>
				<Input id={`name-${language}`} type="text" required={required} value={ticketName} onChange={e => onNameChange(e.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor={`desc-${language}`}>
					{tt.description} ({languageLabel}, Markdown)
				</Label>
				<Textarea id={`desc-${language}`} value={description} onChange={e => onDescriptionChange(e.target.value)} rows={4} />
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
				<Textarea id={`plainDesc-${language}`} value={plainDescription} onChange={e => onPlainDescriptionChange(e.target.value)} rows={3} placeholder={placeholder.plainDesc} />
			</div>
		</div>
	);
}

type TicketTab = "info" | "en" | "zh-Hant" | "zh-Hans";
type TicketFormState = {
	activeTab: TicketTab;
	nameEn: string;
	nameZhHant: string;
	nameZhHans: string;
	descEn: string;
	descZhHant: string;
	descZhHans: string;
	plainDescEn: string;
	plainDescZhHant: string;
	plainDescZhHans: string;
	ticketPrice: number;
	ticketQuantity: number;
	requireInviteCode: boolean;
	requireSmsVerification: boolean;
	hidden: boolean;
	showRemaining: boolean;
	isSaving: boolean;
};

type TicketFormTextField = "nameEn" | "nameZhHant" | "nameZhHans" | "descEn" | "descZhHant" | "descZhHans" | "plainDescEn" | "plainDescZhHant" | "plainDescZhHans";
type TicketFormBooleanField = "requireInviteCode" | "requireSmsVerification" | "hidden" | "showRemaining";
type TicketFormAction =
	| { type: "reset"; value: TicketFormState }
	| { type: "setTab"; value: TicketTab }
	| { type: "setText"; field: TicketFormTextField; value: string }
	| { type: "setNumber"; field: "ticketPrice" | "ticketQuantity"; value: number }
	| { type: "setBoolean"; field: TicketFormBooleanField; value: boolean }
	| { type: "setSaving"; value: boolean };

const initialTicketFormState: TicketFormState = {
	activeTab: "info",
	nameEn: "",
	nameZhHant: "",
	nameZhHans: "",
	descEn: "",
	descZhHant: "",
	descZhHans: "",
	plainDescEn: "",
	plainDescZhHant: "",
	plainDescZhHans: "",
	ticketPrice: 0,
	ticketQuantity: 0,
	requireInviteCode: false,
	requireSmsVerification: false,
	hidden: false,
	showRemaining: true,
	isSaving: false
};

function getTicketText(value: Ticket["name"] | Ticket["description"] | Ticket["plainDescription"] | undefined) {
	return value && typeof value === "object" ? value : { en: value || "" };
}

function ticketFormStateFromTicket(ticket: Ticket | null): TicketFormState {
	if (!ticket) return initialTicketFormState;

	const name = getTicketText(ticket.name);
	const desc = getTicketText(ticket.description);
	const plainDesc = getTicketText(ticket.plainDescription);
	return {
		activeTab: "info",
		nameEn: name.en || "",
		nameZhHant: name["zh-Hant"] || "",
		nameZhHans: name["zh-Hans"] || "",
		descEn: desc.en || "",
		descZhHant: desc["zh-Hant"] || "",
		descZhHans: desc["zh-Hans"] || "",
		plainDescEn: plainDesc.en || "",
		plainDescZhHant: plainDesc["zh-Hant"] || "",
		plainDescZhHans: plainDesc["zh-Hans"] || "",
		ticketPrice: ticket.price,
		ticketQuantity: ticket.quantity,
		requireInviteCode: ticket.requireInviteCode || false,
		requireSmsVerification: ticket.requireSmsVerification || false,
		hidden: ticket.hidden || false,
		showRemaining: ticket.showRemaining !== false,
		isSaving: false
	};
}

function ticketFormReducer(state: TicketFormState, action: TicketFormAction): TicketFormState {
	switch (action.type) {
		case "reset":
			return action.value;
		case "setTab":
			return { ...state, activeTab: action.value };
		case "setText":
			return { ...state, [action.field]: action.value };
		case "setNumber":
			return { ...state, [action.field]: action.value };
		case "setBoolean":
			return { ...state, [action.field]: action.value };
		case "setSaving":
			return { ...state, isSaving: action.value };
	}
}

type TicketsPageState = {
	tickets: Ticket[];
	showModal: boolean;
	editingTicket: Ticket | null;
	showLinkModal: boolean;
	selectedTicketForLink: Ticket | null;
	inviteCode: string;
	refCode: string;
	isSorting: boolean;
};

type TicketsPageAction =
	| { type: "ticketsLoaded"; tickets: Ticket[] }
	| { type: "ticketsReordered"; tickets: Ticket[] }
	| { type: "openModal"; ticket: Ticket | null }
	| { type: "closeModal" }
	| { type: "setModalOpen"; value: boolean }
	| { type: "openLinkBuilder"; ticket: Ticket }
	| { type: "setLinkModalOpen"; value: boolean }
	| { type: "setInviteCode"; value: string }
	| { type: "setRefCode"; value: string }
	| { type: "setSorting"; value: boolean };

const initialTicketsPageState: TicketsPageState = {
	tickets: [],
	showModal: false,
	editingTicket: null,
	showLinkModal: false,
	selectedTicketForLink: null,
	inviteCode: "",
	refCode: "",
	isSorting: false
};

function ticketsPageReducer(state: TicketsPageState, action: TicketsPageAction): TicketsPageState {
	switch (action.type) {
		case "ticketsLoaded":
			return { ...state, tickets: action.tickets };
		case "ticketsReordered":
			return { ...state, tickets: action.tickets };
		case "openModal":
			return { ...state, editingTicket: action.ticket, showModal: true };
		case "closeModal":
			return { ...state, editingTicket: null, showModal: false };
		case "setModalOpen":
			return { ...state, showModal: action.value };
		case "openLinkBuilder":
			return { ...state, selectedTicketForLink: action.ticket, inviteCode: "", refCode: "", showLinkModal: true };
		case "setLinkModalOpen":
			return { ...state, showLinkModal: action.value };
		case "setInviteCode":
			return { ...state, inviteCode: action.value };
		case "setRefCode":
			return { ...state, refCode: action.value };
		case "setSorting":
			return { ...state, isSorting: action.value };
	}
}

function TicketFormDialog({
	open,
	editingTicket,
	currentEventId,
	t,
	setOpen,
	onClose,
	onSaved,
	showAlert
}: {
	open: boolean;
	editingTicket: Ticket | null;
	currentEventId: string | null;
	t: TicketTranslations;
	setOpen: (open: boolean) => void;
	onClose: () => void;
	onSaved: () => Promise<void>;
	showAlert: (message: string, type: "success" | "error" | "warning" | "info") => void;
}) {
	const [state, dispatch] = useReducer(ticketFormReducer, editingTicket, ticketFormStateFromTicket);
	const ticketSaleStartRef = useRef<Date | null>(editingTicket?.saleStart ? new Date(editingTicket.saleStart) : null);
	const ticketSaleEndRef = useRef<Date | null>(editingTicket?.saleEnd ? new Date(editingTicket.saleEnd) : null);
	const {
		activeTab,
		nameEn,
		nameZhHant,
		nameZhHans,
		descEn,
		descZhHant,
		descZhHans,
		plainDescEn,
		plainDescZhHant,
		plainDescZhHans,
		ticketPrice,
		ticketQuantity,
		requireInviteCode,
		requireSmsVerification,
		hidden,
		showRemaining,
		isSaving
	} = state;

	async function saveTicket(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!currentEventId) return;
		dispatch({ type: "setSaving", value: true });

		const data = {
			eventId: currentEventId,
			name: { en: nameEn, "zh-Hant": nameZhHant, "zh-Hans": nameZhHans },
			description: { en: descEn, "zh-Hant": descZhHant, "zh-Hans": descZhHans },
			plainDescription: { en: plainDescEn, "zh-Hant": plainDescZhHant, "zh-Hans": plainDescZhHans },
			price: ticketPrice,
			quantity: ticketQuantity,
			requireInviteCode,
			requireSmsVerification,
			hidden,
			showRemaining,
			...(ticketSaleStartRef.current && { saleStart: ticketSaleStartRef.current }),
			...(ticketSaleEndRef.current && { saleEnd: ticketSaleEndRef.current })
		};

		try {
			if (editingTicket) {
				await adminTicketsAPI.update(editingTicket.id, data);
			} else {
				await adminTicketsAPI.create(data);
			}
			await onSaved();
			onClose();
		} catch (error) {
			showAlert("?????" + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			dispatch({ type: "setSaving", value: false });
		}
	}

	const languageLabels = { ticketName: t.ticketName, description: t.description, plainDescription: t.plainDescription, preview: t.preview };

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
				<DialogHeader>
					<DialogTitle>{editingTicket ? t.editTicket : t.addTicket}</DialogTitle>
				</DialogHeader>
				<form onSubmit={saveTicket} className="space-y-4">
					<Tabs value={activeTab} onValueChange={value => dispatch({ type: "setTab", value: value as TicketTab })}>
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="info">{t.ticketInfo}</TabsTrigger>
							<TabsTrigger value="en">English</TabsTrigger>
							<TabsTrigger value="zh-Hant">????</TabsTrigger>
							<TabsTrigger value="zh-Hans">????</TabsTrigger>
						</TabsList>
						<TabsContent value="info" className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="price">{t.price}</Label>
									<Input
										id="price"
										name="price"
										type="number"
										min="0"
										defaultValue={editingTicket?.price || ticketPrice}
										onChange={e => dispatch({ type: "setNumber", field: "ticketPrice", value: parseInt(e.target.value) || 0 })}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="quantity">{t.quantity}</Label>
									<Input
										id="quantity"
										name="quantity"
										type="number"
										min="0"
										defaultValue={editingTicket?.quantity || ticketQuantity}
										onChange={e => dispatch({ type: "setNumber", field: "ticketQuantity", value: parseInt(e.target.value) || 0 })}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="saleStart">{t.startTime}</Label>
									<Input
										id="saleStart"
										name="saleStart"
										type="datetime-local"
										defaultValue={editingTicket?.saleStart ? toDateTimeLocalString(editingTicket.saleStart) : ""}
										onChange={e => {
											ticketSaleStartRef.current = e.target.value ? new Date(fromDateTimeLocalString(e.target.value)) : null;
										}}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="saleEnd">{t.endTime}</Label>
									<Input
										id="saleEnd"
										name="saleEnd"
										type="datetime-local"
										defaultValue={editingTicket?.saleEnd ? toDateTimeLocalString(editingTicket.saleEnd) : ""}
										onChange={e => {
											ticketSaleEndRef.current = e.target.value ? new Date(fromDateTimeLocalString(e.target.value)) : null;
										}}
									/>
								</div>
							</div>
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Checkbox id="requireInviteCode" checked={requireInviteCode} onChange={e => dispatch({ type: "setBoolean", field: "requireInviteCode", value: e.target.checked })} />
									<Label htmlFor="requireInviteCode" className="font-normal cursor-pointer">
										{t.requireInviteCode}
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox id="requireSmsVerification" checked={requireSmsVerification} onChange={e => dispatch({ type: "setBoolean", field: "requireSmsVerification", value: e.target.checked })} />
									<Label htmlFor="requireSmsVerification" className="font-normal cursor-pointer">
										{t.requireSmsVerification}
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox id="hidden" checked={hidden} onChange={e => dispatch({ type: "setBoolean", field: "hidden", value: e.target.checked })} />
									<Label htmlFor="hidden" className="font-normal cursor-pointer">
										{t.hideTicket}
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox id="showRemaining" checked={showRemaining} onChange={e => dispatch({ type: "setBoolean", field: "showRemaining", value: e.target.checked })} />
									<Label htmlFor="showRemaining" className="font-normal cursor-pointer">
										{t.showRemaining}
									</Label>
								</div>
							</div>
						</TabsContent>
						<TabsContent value="en" className="space-y-4">
							<LanguageFields
								ticketName={nameEn}
								description={descEn}
								plainDescription={plainDescEn}
								language="en"
								languageLabel="English"
								onNameChange={value => dispatch({ type: "setText", field: "nameEn", value })}
								onDescriptionChange={value => dispatch({ type: "setText", field: "descEn", value })}
								onPlainDescriptionChange={value => dispatch({ type: "setText", field: "plainDescEn", value })}
								required={true}
								tt={languageLabels}
							/>
						</TabsContent>
						<TabsContent value="zh-Hant" className="space-y-4">
							<LanguageFields
								ticketName={nameZhHant}
								description={descZhHant}
								plainDescription={plainDescZhHant}
								language="zh-Hant"
								languageLabel="????"
								onNameChange={value => dispatch({ type: "setText", field: "nameZhHant", value })}
								onDescriptionChange={value => dispatch({ type: "setText", field: "descZhHant", value })}
								onPlainDescriptionChange={value => dispatch({ type: "setText", field: "plainDescZhHant", value })}
								tt={languageLabels}
							/>
						</TabsContent>
						<TabsContent value="zh-Hans" className="space-y-4">
							<LanguageFields
								ticketName={nameZhHans}
								description={descZhHans}
								plainDescription={plainDescZhHans}
								language="zh-Hans"
								languageLabel="????"
								onNameChange={value => dispatch({ type: "setText", field: "nameZhHans", value })}
								onDescriptionChange={value => dispatch({ type: "setText", field: "descZhHans", value })}
								onPlainDescriptionChange={value => dispatch({ type: "setText", field: "plainDescZhHans", value })}
								tt={languageLabels}
							/>
						</TabsContent>
					</Tabs>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							{t.cancel}
						</Button>
						<Button type="submit" variant="default" isLoading={isSaving}>
							{t.save}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

type TicketTranslations = Record<string, string>;

function buildDirectLink(selectedTicket: Ticket | null, currentEventId: string | null, locale: string, inviteCode: string, refCode: string) {
	if (!selectedTicket || !currentEventId) return "";

	const eventSlug = currentEventId.slice(-6);
	let link = `/${locale}/${eventSlug}/ticket/${selectedTicket.id}`;
	const params = new URLSearchParams();
	if (inviteCode.trim()) params.append("inv", inviteCode.trim());
	if (refCode.trim()) params.append("ref", refCode.trim());
	if (params.toString()) link += `?${params.toString()}`;

	return `${window.location.origin}${link}`;
}

function LinkBuilderDialog({
	open,
	selectedTicket,
	currentEventId,
	locale,
	inviteCode,
	refCode,
	t,
	setOpen,
	setInviteCode,
	setRefCode,
	onCopy
}: {
	open: boolean;
	selectedTicket: Ticket | null;
	currentEventId: string | null;
	locale: string;
	inviteCode: string;
	refCode: string;
	t: TicketTranslations;
	setOpen: (open: boolean) => void;
	setInviteCode: (value: string) => void;
	setRefCode: (value: string) => void;
	onCopy: (link: string) => void;
}) {
	const generatedLink = buildDirectLink(selectedTicket, currentEventId, locale, inviteCode, refCode);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t.linkBuilder}</DialogTitle>
					<DialogDescription>{t.linkDescription}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="inviteCode">
							{t.inviteCode} ({t.optional})
						</Label>
						<Input id="inviteCode" type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="e.g., VIP2026A" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="refCode">
							{t.referralCode} ({t.optional})
						</Label>
						<Input id="refCode" type="text" value={refCode} onChange={e => setRefCode(e.target.value)} placeholder="e.g., ABC123" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="generatedLink">{t.generatedLink}</Label>
						<div className="flex gap-2">
							<Input id="generatedLink" type="text" value={generatedLink} readOnly className="flex-1 font-mono text-sm" />
							<Button onClick={() => onCopy(generatedLink)}>{t.copyLink}</Button>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => setOpen(false)}>
						{t.close}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function TicketsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [state, dispatch] = useReducer(ticketsPageReducer, initialTicketsPageState);
	const { tickets, showModal, editingTicket, showLinkModal, selectedTicketForLink, inviteCode, refCode, isSorting } = state;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
		ticketTypes: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Types" },
		ticketInfo: { "zh-Hant": "票種資訊", "zh-Hans": "票种资讯", en: "Ticket Info" },
		startTime: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start Time" },
		endTime: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End Time" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		quantity: { "zh-Hant": "數量", "zh-Hans": "数量", en: "Quantity" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		addTicket: { "zh-Hant": "新增票種", "zh-Hans": "新增票种", en: "Add Ticket" },
		editTicket: { "zh-Hant": "編輯票種", "zh-Hans": "编辑票种", en: "Edit Ticket" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		ticketName: { "zh-Hant": "票種名稱", "zh-Hans": "票种名称", en: "Ticket Name" },
		description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
		plainDescription: { "zh-Hant": "純文字描述（用於 Metadata）", "zh-Hans": "纯文字描述（用於 Metadata）", en: "Plain Description (Use for Metadata)" },
		price: { "zh-Hant": "價格", "zh-Hans": "价格", en: "Price" },
		requireInviteCode: { "zh-Hant": "需要邀請碼", "zh-Hans": "需要邀请码", en: "Require Invite Code" },
		requireSmsVerification: { "zh-Hant": "需要簡訊驗證", "zh-Hans": "需要简讯验证", en: "Require SMS Verification" },
		hideTicket: { "zh-Hant": "隱藏票種（不在公開頁面顯示）", "zh-Hans": "隐藏票种（不在公开页面显示）", en: "Hide ticket (not displayed on public pages)" },
		hidden: { "zh-Hant": "已隱藏", "zh-Hans": "已隐藏", en: "Hidden" },
		showRemaining: { "zh-Hant": "顯示剩餘票數", "zh-Hans": "显示剩余票数", en: "Show remaining tickets" },
		selling: { "zh-Hant": "販售中", "zh-Hans": "贩售中", en: "Selling" },
		notStarted: { "zh-Hant": "尚未開始販售", "zh-Hans": "尚未开始贩售", en: "Not Started" },
		ended: { "zh-Hant": "已結束販售", "zh-Hans": "已结束贩售", en: "Ended" },
		directLink: { "zh-Hant": "直接連結", "zh-Hans": "直接链接", en: "Direct Link" },
		linkBuilder: { "zh-Hant": "連結產生器", "zh-Hans": "链接生成器", en: "Link Builder" },
		inviteCode: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Invite Code" },
		referralCode: { "zh-Hant": "推薦碼", "zh-Hans": "推荐码", en: "Referral Code" },
		optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
		generatedLink: { "zh-Hant": "產生的連結", "zh-Hans": "生成的链接", en: "Generated Link" },
		copyLink: { "zh-Hant": "複製連結", "zh-Hans": "复制链接", en: "Copy Link" },
		copied: { "zh-Hant": "已複製！", "zh-Hans": "已复制！", en: "Copied!" },
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
		preview: { "zh-Hant": "預覽：", "zh-Hans": "预览：", en: "Preview:" },
		linkDescription: {
			"zh-Hant": "產生此票種的直接連結，可選擇性加入邀請碼和推薦碼。",
			"zh-Hans": "生成此票种的直接链接，可选择性加入邀请码和推荐码。",
			en: "Generate a direct link to this ticket with optional invite and referral codes."
		}
	});

	const loadTickets = useCallback(async () => {
		if (!currentEventId) return;

		try {
			const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
			if (response.success) {
				dispatch({ type: "ticketsLoaded", tickets: response.data || [] });
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		} finally {
		}
	}, [currentEventId]);

	const openModal = useCallback((ticket: Ticket | null = null) => {
		dispatch({ type: "openModal", ticket });
	}, []);

	const closeModal = useCallback(() => {
		dispatch({ type: "closeModal" });
	}, []);

	const deleteTicket = useCallback(
		async (ticketId: string) => {
			if (!confirm("確定要刪除這個票種嗎？")) return;

			try {
				await adminTicketsAPI.delete(ticketId);
				await loadTickets();
			} catch (error) {
				showAlert("刪除失敗：" + (error instanceof Error ? error.message : String(error)), "error");
			}
		},
		[loadTickets, showAlert]
	);

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = tickets.findIndex(t => t.id === active.id);
		const newIndex = tickets.findIndex(t => t.id === over.id);

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		const newTickets = arrayMove(tickets, oldIndex, newIndex);
		dispatch({ type: "ticketsReordered", tickets: newTickets });

		const reorderedTickets = newTickets.map((ticket, index) => ({
			id: ticket.id,
			order: index
		}));

		try {
			dispatch({ type: "setSorting", value: true });
			await adminTicketsAPI.reorder({ tickets: reorderedTickets });
			showAlert("票種順序已更新", "success");
		} catch (error) {
			showAlert("更新順序失敗：" + (error instanceof Error ? error.message : String(error)), "error");
			await loadTickets();
		} finally {
			dispatch({ type: "setSorting", value: false });
		}
	}

	const ticketsWithStatus = useMemo((): TicketDisplay[] => {
		return tickets.map(ticket => {
			const now = new Date();
			const status =
				ticket.saleStart && ticket.saleStart > now
					? { label: t.notStarted, class: "pending" }
					: ticket.saleEnd && ticket.saleEnd < now
						? { label: t.ended, class: "ended" }
						: { label: t.selling, class: "active" };
			return {
				...ticket,
				displayName: ticket.name && typeof ticket.name === "object" ? ticket.name[locale] || ticket.name["en"] || Object.values(ticket.name)[0] : ticket.name || "",
				formattedSaleStart: formatTicketDateTime(ticket.saleStart),
				formattedSaleEnd: formatTicketDateTime(ticket.saleEnd),
				statusLabel: status.label,
				statusClass: status.class
			};
		});
	}, [tickets, locale, t.ended, t.notStarted, t.selling]);

	const openLinkBuilder = useCallback((ticket: Ticket) => {
		dispatch({ type: "openLinkBuilder", ticket });
	}, []);

	const columns = useMemo(
		() =>
			createTicketsColumns({
				onEdit: openModal,
				onDelete: deleteTicket,
				onLinkBuilder: openLinkBuilder,
				t: {
					editTicket: t.editTicket,
					delete: t.delete,
					directLink: t.directLink,
					hidden: t.hidden
				}
			}),
		[t.editTicket, t.delete, t.directLink, t.hidden, openModal, deleteTicket, openLinkBuilder]
	);

	async function copyToClipboard(link: string) {
		try {
			await navigator.clipboard.writeText(link);
			showAlert(t.copied, "success");
		} catch (err) {
			console.error("Failed to copy:", err);
			showAlert("Failed to copy link", "error");
		}
	}

	useEffect(() => {
		if (currentEventId) {
			loadTickets();
		}

		const savedEventId = localStorage.getItem("selectedEventId");
		if (savedEventId) {
			setCurrentEventId(savedEventId);
		}

		const handleEventChange = (e: CustomEvent) => {
			setCurrentEventId(e.detail.eventId);
		};

		window.addEventListener("selectedEventChanged", handleEventChange as EventListener);
		return () => {
			window.removeEventListener("selectedEventChanged", handleEventChange as EventListener);
		};
	}, [currentEventId, loadTickets]);

	return (
		<main>
			<AdminHeader title={t.title} />

			<section>
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
					<SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
						<SortableDataTable columns={columns} data={ticketsWithStatus} />
					</SortableContext>
				</DndContext>
			</section>

			<section className="mt-8 text-center">
				<Button onClick={() => openModal()} disabled={isSorting}>
					+ {t.addTicket}
				</Button>
			</section>

			<TicketFormDialog
				open={showModal}
				editingTicket={editingTicket}
				currentEventId={currentEventId}
				t={t}
				setOpen={value => dispatch({ type: "setModalOpen", value })}
				onClose={closeModal}
				onSaved={loadTickets}
				showAlert={showAlert}
			/>
			<LinkBuilderDialog
				open={showLinkModal}
				selectedTicket={selectedTicketForLink}
				currentEventId={currentEventId}
				locale={locale}
				inviteCode={inviteCode}
				refCode={refCode}
				t={t}
				setOpen={value => dispatch({ type: "setLinkModalOpen", value })}
				setInviteCode={value => dispatch({ type: "setInviteCode", value })}
				setRefCode={value => dispatch({ type: "setRefCode", value })}
				onCopy={copyToClipboard}
			/>
		</main>
	);
}
