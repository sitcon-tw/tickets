"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
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
import type { Ticket } from "@/lib/types/api";
import { LanguageFieldsProps } from "@/lib/types/pages";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createTicketsColumns, type TicketDisplay } from "./columns";

function LanguageFields({ ticketName, description, plainDescription, language, languageLabel, onNameChange, onDescriptionChange, onPlainDescriptionChange, required = false, t }: LanguageFieldsProps) {
	const placeholders = {
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

	const placeholder = placeholders[language as keyof typeof placeholders] || placeholders.en;

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor={`name-${language}`}>
					{t.ticketName} ({languageLabel}) {required && "*"}
				</Label>
				<Input id={`name-${language}`} type="text" required={required} value={ticketName} onChange={e => onNameChange(e.target.value)} />
			</div>
			<div className="space-y-2">
				<Label htmlFor={`desc-${language}`}>
					{t.description} ({languageLabel}, Markdown)
				</Label>
				<Textarea id={`desc-${language}`} value={description} onChange={e => onDescriptionChange(e.target.value)} rows={4} />
				{description && (
					<div className="mt-2 p-3 border rounded-md bg-muted">
						<div className="text-xs font-semibold mb-2 text-muted-foreground">{t.preview}</div>
						<MarkdownContent content={description} />
					</div>
				)}
			</div>
			<div className="space-y-2">
				<Label htmlFor={`plainDesc-${language}`}>
					{t.plainDescription} ({languageLabel})
				</Label>
				<Textarea id={`plainDesc-${language}`} value={plainDescription} onChange={e => onPlainDescriptionChange(e.target.value)} rows={3} placeholder={placeholder.plainDesc} />
			</div>
		</div>
	);
}

export default function TicketsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
	const [activeTab, setActiveTab] = useState<"info" | "en" | "zh-Hant" | "zh-Hans">("info");
	const [showLinkModal, setShowLinkModal] = useState(false);
	const [selectedTicketForLink, setSelectedTicketForLink] = useState<Ticket | null>(null);
	const [inviteCode, setInviteCode] = useState("");
	const [refCode, setRefCode] = useState("");

	const [nameEn, setNameEn] = useState("");
	const [nameZhHant, setNameZhHant] = useState("");
	const [nameZhHans, setNameZhHans] = useState("");
	const [descEn, setDescEn] = useState("");
	const [descZhHant, setDescZhHant] = useState("");
	const [descZhHans, setDescZhHans] = useState("");
	const [plainDescEn, setPlainDescEn] = useState("");
	const [plainDescZhHant, setPlainDescZhHant] = useState("");
	const [plainDescZhHans, setPlainDescZhHans] = useState("");
	const [requireInviteCode, setRequireInviteCode] = useState(false);
	const [requireSmsVerification, setRequireSmsVerification] = useState(false);
	const [hidden, setHidden] = useState(false);

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
		linkDescription: { "zh-Hant": "產生此票種的直接連結，可選擇性加入邀請碼和推薦碼。", "zh-Hans": "生成此票种的直接链接，可选择性加入邀请码和推荐码。", en: "Generate a direct link to this ticket with optional invite and referral codes." }
	});

	const loadTickets = useCallback(async () => {
		if (!currentEventId) return;

		try {
			const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
			if (response.success) {
				setTickets(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		} finally {
		}
	}, [currentEventId]);

	function openModal(ticket: Ticket | null = null) {
		setEditingTicket(ticket);

		if (ticket) {
			const name = typeof ticket.name === "object" ? ticket.name : { en: ticket.name };
			const desc = typeof ticket.description === "object" ? ticket.description : { en: ticket.description || "" };
			const plainDesc = typeof ticket.plainDescription === "object" ? ticket.plainDescription : { en: ticket.plainDescription || "" };

			setNameEn(name.en || "");
			setNameZhHant(name["zh-Hant"] || "");
			setNameZhHans(name["zh-Hans"] || "");
			setDescEn(desc.en || "");
			setDescZhHant(desc["zh-Hant"] || "");
			setDescZhHans(desc["zh-Hans"] || "");
			setPlainDescEn(plainDesc.en || "");
			setPlainDescZhHant(plainDesc["zh-Hant"] || "");
			setPlainDescZhHans(plainDesc["zh-Hans"] || "");
			setRequireInviteCode(ticket.requireInviteCode || false);
			setRequireSmsVerification(ticket.requireSmsVerification || false);
			setHidden(ticket.hidden || false);
		} else {
			setRequireInviteCode(false);
			setRequireSmsVerification(false);
			setHidden(false);
		}

		setShowModal(true);
	}

	function closeModal() {
		setShowModal(false);
		setEditingTicket(null);
		setNameEn("");
		setNameZhHant("");
		setNameZhHans("");
		setDescEn("");
		setDescZhHant("");
		setDescZhHans("");
		setPlainDescEn("");
		setPlainDescZhHant("");
		setPlainDescZhHans("");
		setRequireInviteCode(false);
		setRequireSmsVerification(false);
		setHidden(false);
	}

	async function saveTicket(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!currentEventId) return;

		const formData = new FormData(e.currentTarget);
		const saleStartStr = formData.get("saleStart") as string;
		const saleEndStr = formData.get("saleEnd") as string;

		const data: {
			eventId: string;
			name: { en: string; "zh-Hant": string; "zh-Hans": string };
			description: { en: string; "zh-Hant": string; "zh-Hans": string };
			plainDescription: { en: string; "zh-Hant": string; "zh-Hans": string };
			price: number;
			quantity: number;
			requireInviteCode: boolean;
			requireSmsVerification: boolean;
			hidden: boolean;
			saleStart?: string;
			saleEnd?: string;
		} = {
			eventId: currentEventId,
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
			price: parseInt(formData.get("price") as string) || 0,
			quantity: parseInt(formData.get("quantity") as string) || 0,
			requireInviteCode: requireInviteCode,
			requireSmsVerification: requireSmsVerification,
			hidden: hidden
		};

		if (saleStartStr) {
			data.saleStart = new Date(saleStartStr).toISOString();
		}
		if (saleEndStr) {
			data.saleEnd = new Date(saleEndStr).toISOString();
		}

		try {
			if (editingTicket) {
				await adminTicketsAPI.update(editingTicket.id, data);
			} else {
				await adminTicketsAPI.create(data);
			}
			await loadTickets();
			closeModal();
		} catch (error) {
			showAlert("保存失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	async function deleteTicket(ticketId: string) {
		if (!confirm("確定要刪除這個票種嗎？")) return;

		try {
			await adminTicketsAPI.delete(ticketId);
			await loadTickets();
		} catch (error) {
			showAlert("刪除失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	function computeStatus(ticket: Ticket) {
		const now = new Date();
		if (ticket.saleStart && new Date(ticket.saleStart) > now) {
			return { label: t.notStarted, class: "pending" };
		}
		if (ticket.saleEnd && new Date(ticket.saleEnd) < now) {
			return { label: t.ended, class: "ended" };
		}
		return { label: t.selling, class: "active" };
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

	const ticketsWithStatus = useMemo((): TicketDisplay[] => {
		return tickets.map(ticket => {
			const status = computeStatus(ticket);
			return {
				...ticket,
				displayName: typeof ticket.name === "object" ? ticket.name[locale] || ticket.name["en"] || Object.values(ticket.name)[0] : ticket.name,
				formattedSaleStart: formatDateTime(ticket.saleStart),
				formattedSaleEnd: formatDateTime(ticket.saleEnd),
				statusLabel: status.label,
				statusClass: status.class
			};
		});
	}, [tickets, locale, computeStatus]);

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
	function openLinkBuilder(ticket: Ticket) {
		setSelectedTicketForLink(ticket);
		setInviteCode("");
		setRefCode("");
		setShowLinkModal(true);
	}

	function generateDirectLink() {
		if (!selectedTicketForLink || !currentEventId) return "";

		const eventSlug = currentEventId.slice(-6);
		let link = `/${locale}/${eventSlug}/ticket/${selectedTicketForLink.id}`;

		const params = new URLSearchParams();
		if (inviteCode.trim()) {
			params.append("inv", inviteCode.trim());
		}
		if (refCode.trim()) {
			params.append("ref", refCode.trim());
		}

		if (params.toString()) {
			link += `?${params.toString()}`;
		}

		return `${window.location.origin}${link}`;
	}

	async function copyToClipboard() {
		const link = generateDirectLink();
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
				<DataTable columns={columns} data={ticketsWithStatus} />
			</section>

			<section className="mt-8 text-center">
				<Button onClick={() => openModal()}>+ {t.addTicket}</Button>
			</section>

			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
					<DialogHeader>
						<DialogTitle>{editingTicket ? t.editTicket : t.addTicket}</DialogTitle>
					</DialogHeader>
					<form onSubmit={saveTicket} className="space-y-4">
						<Tabs value={activeTab} onValueChange={value => setActiveTab(value as "info" | "en" | "zh-Hant" | "zh-Hans")}>
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="info">{t.ticketInfo}</TabsTrigger>
								<TabsTrigger value="en">English</TabsTrigger>
								<TabsTrigger value="zh-Hant">繁體中文</TabsTrigger>
								<TabsTrigger value="zh-Hans">简体中文</TabsTrigger>
							</TabsList>

							<TabsContent value="info" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="price">{t.price}</Label>
										<Input id="price" name="price" type="number" min="0" defaultValue={editingTicket?.price || 0} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="quantity">{t.quantity}</Label>
										<Input id="quantity" name="quantity" type="number" min="0" defaultValue={editingTicket?.quantity || 0} />
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="saleStart">{t.startTime}</Label>
										<Input id="saleStart" name="saleStart" type="datetime-local" defaultValue={editingTicket?.saleStart ? new Date(editingTicket.saleStart).toISOString().slice(0, 16) : ""} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="saleEnd">{t.endTime}</Label>
										<Input id="saleEnd" name="saleEnd" type="datetime-local" defaultValue={editingTicket?.saleEnd ? new Date(editingTicket.saleEnd).toISOString().slice(0, 16) : ""} />
									</div>
								</div>

								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Checkbox id="requireInviteCode" checked={requireInviteCode} onChange={e => setRequireInviteCode(e.target.checked)} />
										<Label htmlFor="requireInviteCode" className="font-normal cursor-pointer">
											{t.requireInviteCode}
										</Label>
									</div>
									<div className="flex items-center gap-2">
										<Checkbox id="requireSmsVerification" checked={requireSmsVerification} onChange={e => setRequireSmsVerification(e.target.checked)} />
										<Label htmlFor="requireSmsVerification" className="font-normal cursor-pointer">
											{t.requireSmsVerification}
										</Label>
									</div>
									<div className="flex items-center gap-2">
										<Checkbox id="hidden" checked={hidden} onChange={e => setHidden(e.target.checked)} />
										<Label htmlFor="hidden" className="font-normal cursor-pointer">
											{t.hideTicket}
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
									onNameChange={setNameEn}
								onDescriptionChange={setDescEn}
								onPlainDescriptionChange={setPlainDescEn}
								required={true}
								t={{
									ticketName: t.ticketName,
									description: t.description,
									plainDescription: t.plainDescription,
									preview: t.preview
								}}
							/>
							</TabsContent>

							<TabsContent value="zh-Hant" className="space-y-4">
								<LanguageFields
									ticketName={nameZhHant}
									description={descZhHant}
									plainDescription={plainDescZhHant}
									language="zh-Hant"
									languageLabel="繁體中文"
									onNameChange={setNameZhHant}
								onDescriptionChange={setDescZhHant}
								onPlainDescriptionChange={setPlainDescZhHant}
								t={{
									ticketName: t.ticketName,
									description: t.description,
									plainDescription: t.plainDescription,
									preview: t.preview
								}}
							/>
							</TabsContent>

							<TabsContent value="zh-Hans" className="space-y-4">
								<LanguageFields
									ticketName={nameZhHans}
									description={descZhHans}
									plainDescription={plainDescZhHans}
									language="zh-Hans"
									languageLabel="简体中文"
									onNameChange={setNameZhHans}
								onDescriptionChange={setDescZhHans}
								onPlainDescriptionChange={setPlainDescZhHans}
								t={{
									ticketName: t.ticketName,
									description: t.description,
									plainDescription: t.plainDescription,
									preview: t.preview
								}}
							/>
							</TabsContent>
						</Tabs>

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

			<Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{t.linkBuilder}</DialogTitle>
						<DialogDescription>Generate a direct link to this ticket with optional invite and referral codes.</DialogDescription>
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
								<Input id="generatedLink" type="text" value={generateDirectLink()} readOnly className="flex-1 font-mono text-sm" />
								<Button onClick={copyToClipboard}>{t.copyLink}</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setShowLinkModal(false)}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
