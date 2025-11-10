"use client";

import AdminHeader from "@/components/AdminHeader";
import MarkdownContent from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketsAPI } from "@/lib/api/endpoints";
import type { Ticket } from "@/lib/types/api";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

export default function TicketsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
	const [activeTab, setActiveTab] = useState<"en" | "zh-Hant" | "zh-Hans">("en");
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

	const t = getTranslations(locale, {
		title: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
		ticketTypes: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Types" },
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
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" }
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
			requireInviteCode: formData.get("requireInviteCode") === "on",
			requireSmsVerification: formData.get("requireSmsVerification") === "on",
			hidden: formData.get("hidden") === "on"
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
				<div className="admin-table-container">
					<table className="admin-table">
						<thead>
							<tr>
								<th>{t.ticketTypes}</th>
								<th>{t.startTime}</th>
								<th>{t.endTime}</th>
								<th>{t.status}</th>
								<th>{t.quantity}</th>
								<th>{t.actions}</th>
							</tr>
						</thead>
						<tbody>
							{tickets.map(ticket => {
								const status = computeStatus(ticket);
								return (
									<tr key={ticket.id}>
										<td>
											{typeof ticket.name === "object" ? ticket.name[locale] || ticket.name["en"] || Object.values(ticket.name)[0] : ticket.name}
											{ticket.hidden && (
												<span className="ml-2 py-0.5 px-2 text-xs font-bold text-gray-100 dark:text-gray-200 bg-gray-600 dark:bg-gray-700 rounded border border-gray-500 dark:border-gray-600">
													{t.hidden}
												</span>
											)}
										</td>
										<td>{formatDateTime(ticket.saleStart)}</td>
										<td>{formatDateTime(ticket.saleEnd)}</td>
										<td>
											<span className={`status-badge ${status.class}`}>{status.label}</span>
										</td>
										<td>{ticket.quantity}</td>
										<td>
											<div className="flex gap-2 flex-wrap">
												<Button variant="secondary" size="sm" onClick={() => openModal(ticket)}>
													{t.editTicket}
												</Button>
												<Button size="sm" onClick={() => openLinkBuilder(ticket)}>
													{t.directLink}
												</Button>
												<Button variant="destructive" size="sm" onClick={() => deleteTicket(ticket.id)}>
													{t.delete}
												</Button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</section>

			<section className="mt-8 text-center">
				<Button onClick={() => openModal()}>
					+ {t.addTicket}
				</Button>
			</section>

			{showModal && (
				<div className="admin-modal-overlay" onClick={closeModal}>
					<div className="admin-modal" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{editingTicket ? t.editTicket : t.addTicket}</h2>
							<Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
								✕
							</Button>
						</div>
						<form onSubmit={saveTicket}>
							<div className="flex flex-col gap-4">
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
											onClick={() => setActiveTab(tab.key)}
											className={`
												px-4 py-2 border-none transition-all duration-200 cursor-pointer
												${activeTab === tab.key ? "bg-gray-600 dark:bg-gray-700 border-b-2 border-blue-500 text-gray-100 dark:text-gray-200 font-bold" : "bg-transparent text-gray-400 dark:text-gray-500 font-normal"}
											`}
										>
											{tab.label}
										</Button>
									))}
								</div>

								{/* English Fields */}
								{activeTab === "en" && (
									<>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.ticketName} (English) *</label>
											<input type="text" required value={nameEn} onChange={e => setNameEn(e.target.value)} className="admin-input" />
										</div>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.description} (English, Markdown)</label>
											<textarea value={descEn} onChange={e => setDescEn(e.target.value)} className="admin-textarea" rows={6} />
											{descEn && (
												<div className="mt-2 p-3 border border-gray-600 dark:border-gray-700 rounded bg-gray-800 dark:bg-gray-800">
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
												className="admin-textarea"
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
											<label className="admin-form-label">{t.ticketName} (繁體中文)</label>
											<input type="text" value={nameZhHant} onChange={e => setNameZhHant(e.target.value)} className="admin-input" />
										</div>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.description} (繁體中文，Markdown)</label>
											<textarea value={descZhHant} onChange={e => setDescZhHant(e.target.value)} className="admin-textarea" rows={6} />
											{descZhHant && (
												<div className="mt-2 p-3 border border-gray-600 dark:border-gray-700 rounded bg-gray-800 dark:bg-gray-800">
													<div className="text-sm font-bold mb-2 text-gray-300 dark:text-gray-400">Preview:</div>
													<MarkdownContent content={descZhHant} />
												</div>
											)}
										</div>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.plainDescription} (繁體中文)</label>
											<textarea value={plainDescZhHant} onChange={e => setPlainDescZhHant(e.target.value)} className="admin-textarea" rows={4} placeholder="純文字描述，不含 Markdown 格式" />
										</div>
									</>
								)}

								{/* Simplified Chinese Fields */}
								{activeTab === "zh-Hans" && (
									<>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.ticketName} (简体中文)</label>
											<input type="text" value={nameZhHans} onChange={e => setNameZhHans(e.target.value)} className="admin-input" />
										</div>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.description} (简体中文，Markdown)</label>
											<textarea value={descZhHans} onChange={e => setDescZhHans(e.target.value)} className="admin-textarea" rows={6} />
											{descZhHans && (
												<div className="mt-2 p-3 border border-gray-600 dark:border-gray-700 rounded bg-gray-800 dark:bg-gray-800">
													<div className="text-sm font-bold mb-2 text-gray-300 dark:text-gray-400">Preview:</div>
													<MarkdownContent content={descZhHans} />
												</div>
											)}
										</div>
										<div className="admin-form-group">
											<label className="admin-form-label">{t.plainDescription} (简体中文)</label>
											<textarea value={plainDescZhHans} onChange={e => setPlainDescZhHans(e.target.value)} className="admin-textarea" rows={4} placeholder="纯文字描述，不含 Markdown 格式" />
										</div>
									</>
								)}
								<div className="grid grid-cols-2 gap-4">
									<div className="admin-form-group">
										<label className="admin-form-label">{t.price}</label>
										<input name="price" type="number" min="0" defaultValue={editingTicket?.price || 0} className="admin-input" />
									</div>
									<div className="admin-form-group">
										<label className="admin-form-label">{t.quantity}</label>
										<input name="quantity" type="number" min="0" defaultValue={editingTicket?.quantity || 0} className="admin-input" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="admin-form-group">
										<label className="admin-form-label">{t.startTime}</label>
										<input name="saleStart" type="datetime-local" defaultValue={editingTicket?.saleStart ? new Date(editingTicket.saleStart).toISOString().slice(0, 16) : ""} className="admin-input" />
									</div>
									<div className="admin-form-group">
										<label className="admin-form-label">{t.endTime}</label>
										<input name="saleEnd" type="datetime-local" defaultValue={editingTicket?.saleEnd ? new Date(editingTicket.saleEnd).toISOString().slice(0, 16) : ""} className="admin-input" />
									</div>
								</div>
								<label className="flex items-center gap-2">
									<input name="requireInviteCode" type="checkbox" defaultChecked={editingTicket?.requireInviteCode || false} className="w-[18px] h-[18px]" />
									<span className="admin-form-label mb-0">{t.requireInviteCode}</span>
								</label>
								<label className="flex items-center gap-2">
									<input name="requireSmsVerification" type="checkbox" defaultChecked={editingTicket?.requireSmsVerification || false} className="w-[18px] h-[18px]" />
									<span className="admin-form-label mb-0">{t.requireSmsVerification}</span>
								</label>
								<label className="flex items-center gap-2">
									<input name="hidden" type="checkbox" defaultChecked={editingTicket?.hidden || false} className="w-[18px] h-[18px]" />
									<span className="admin-form-label mb-0">{t.hideTicket}</span>
								</label>
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

			{showLinkModal && selectedTicketForLink && (
				<div className="admin-modal-overlay" onClick={() => setShowLinkModal(false)}>
					<div className="admin-modal" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{t.linkBuilder}</h2>
							<Button variant="ghost" size="icon" onClick={() => setShowLinkModal(false)} className="h-8 w-8">
								✕
							</Button>
						</div>
						<div className="flex flex-col gap-4">
							<div className="admin-form-group">
								<label className="admin-form-label">
									{t.inviteCode} ({t.optional})
								</label>
								<input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="e.g., VIP2026A" className="admin-input" />
							</div>
							<div className="admin-form-group">
								<label className="admin-form-label">
									{t.referralCode} ({t.optional})
								</label>
								<input type="text" value={refCode} onChange={e => setRefCode(e.target.value)} placeholder="e.g., ABC123" className="admin-input" />
							</div>
							<div className="admin-form-group">
								<label className="admin-form-label">{t.generatedLink}</label>
								<div className="flex gap-2">
									<input type="text" value={generateDirectLink()} readOnly className="admin-input flex-1 font-mono text-[0.9rem]" />
									<Button onClick={copyToClipboard}>
										{t.copyLink}
									</Button>
								</div>
							</div>
						</div>
						<div className="admin-modal-actions">
							<Button type="button" variant="secondary" onClick={() => setShowLinkModal(false)}>
								{t.close}
							</Button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
