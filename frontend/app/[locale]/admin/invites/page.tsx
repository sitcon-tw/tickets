"use client";

import AdminHeader from "@/components/AdminHeader";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminInvitationCodesAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { InvitationCodeInfo, Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

type InviteCode = {
	id: string;
	code: string;
	usedCount: number;
	usageLimit: number;
	usedBy?: string;
	active: boolean;
};

type InviteType = {
	id: string;
	name: string;
	createdAt: string;
	codes: InviteCode[];
};

export default function InvitesPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [inviteTypes, setInviteTypes] = useState<InviteType[]>([]);
	const [filteredTypes, setFilteredTypes] = useState<InviteType[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [showBulkImportModal, setShowBulkImportModal] = useState(false);
	const [showCodesModal, setShowCodesModal] = useState(false);
	const [viewingCodesOf, setViewingCodesOf] = useState<string | null>(null);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [emailAddress, setEmailAddress] = useState("");
	const [isSendingEmail, setIsSendingEmail] = useState(false);
	const [bulkImportCodes, setBulkImportCodes] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	const [selectedTicketId, setSelectedTicketId] = useState("");
	const [bulkTicketId, setBulkTicketId] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		amount: 10,
		usageLimit: 1,
		validFrom: "",
		validUntil: ""
	});

	const t = getTranslations(locale, {
		title: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Invitation Codes" },
		add: { "zh-Hant": "新增邀請碼組", "zh-Hans": "新增邀请码组", en: "Add Invitation Code Group" },
		bulkImport: { "zh-Hant": "批次匯入", "zh-Hans": "批量导入", en: "Bulk Import" },
		exportCSV: { "zh-Hant": "匯出 CSV", "zh-Hans": "导出 CSV", en: "Export CSV" },
		search: { "zh-Hant": "搜尋名稱 / 代碼", "zh-Hans": "搜索名称 / 代码", en: "Search Name / Code" },
		name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
		total: { "zh-Hant": "總數", "zh-Hans": "总数", en: "Total" },
		used: { "zh-Hant": "已用", "zh-Hans": "已用", en: "Used" },
		remaining: { "zh-Hant": "剩餘", "zh-Hans": "剩余", en: "Remaining" },
		created: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created" },
		actions: { "zh-Hant": "動作", "zh-Hans": "动作", en: "Actions" },
		codes: { "zh-Hant": "邀請碼列表", "zh-Hans": "邀请码列表", en: "Invitation Codes" },
		code: { "zh-Hant": "代碼", "zh-Hans": "代码", en: "Code" },
		usage: { "zh-Hant": "使用次數", "zh-Hans": "使用次数", en: "Usage" },
		limit: { "zh-Hant": "使用上限", "zh-Hans": "使用上限", en: "Limit" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		amount: { "zh-Hant": "數量", "zh-Hans": "数量", en: "Amount" },
		usageLimit: { "zh-Hant": "使用次數限制", "zh-Hans": "使用次数限制", en: "Usage Limit" },
		validFrom: { "zh-Hant": "有效起始時間", "zh-Hans": "有效起始时间", en: "Valid From" },
		validUntil: { "zh-Hant": "有效結束時間", "zh-Hans": "有效结束时间", en: "Valid Until" },
		optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
		ticketType: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Type" },
		pleaseSelectTicket: { "zh-Hant": "請選擇票種", "zh-Hans": "请选择票种", en: "Please Select Ticket" },
		createSuccess: { "zh-Hant": "成功建立 {count} 個邀請碼！", "zh-Hans": "成功建立 {count} 个邀请码！", en: "Successfully created {count} invitation codes!" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		confirmDelete: { "zh-Hant": "確定要刪除此邀請碼嗎？", "zh-Hans": "确定要删除此邀请码吗？", en: "Are you sure you want to delete this invitation code?" },
		deleteSuccess: { "zh-Hant": "成功刪除邀請碼！", "zh-Hans": "成功删除邀请码！", en: "Successfully deleted invitation code!" },
		bulkDelete: { "zh-Hant": "批次刪除", "zh-Hans": "批次删除", en: "Bulk Delete" },
		confirmBulkDelete: { "zh-Hant": "確定要刪除 {count} 個邀請碼嗎？", "zh-Hans": "确定要删除 {count} 个邀请码吗？", en: "Are you sure you want to delete {count} invitation codes?" },
		bulkDeleteSuccess: { "zh-Hant": "成功刪除 {count} 個邀請碼！", "zh-Hans": "成功删除 {count} 个邀请码！", en: "Successfully deleted {count} invitation codes!" },
		selectAll: { "zh-Hant": "全選", "zh-Hans": "全选", en: "Select All" },
		deselectAll: { "zh-Hant": "取消全選", "zh-Hans": "取消全选", en: "Deselect All" },
		selected: { "zh-Hant": "已選 {count} 個", "zh-Hans": "已选 {count} 个", en: "{count} selected" },
		downloadTxt: { "zh-Hant": "下載 TXT", "zh-Hans": "下载 TXT", en: "Download TXT" },
		sendEmail: { "zh-Hant": "寄送 Email", "zh-Hans": "发送 Email", en: "Send Email" },
		emailAddress: { "zh-Hant": "Email 地址", "zh-Hans": "Email 地址", en: "Email Address" },
		emailPlaceholder: { "zh-Hant": "請輸入 Email 地址", "zh-Hans": "请输入 Email 地址", en: "Please enter email address" },
		send: { "zh-Hant": "發送", "zh-Hans": "发送", en: "Send" },
		sendSuccess: { "zh-Hant": "成功寄送郵件！", "zh-Hans": "成功发送邮件！", en: "Email sent successfully!" },
		sendError: { "zh-Hant": "寄送失敗", "zh-Hans": "发送失败", en: "Failed to send email" },
		pleaseSelectCodes: { "zh-Hant": "請選擇要操作的邀請碼", "zh-Hans": "请选择要操作的邀请码", en: "Please select invitation codes" },
		downloadSuccess: { "zh-Hant": "下載成功！", "zh-Hans": "下载成功！", en: "Download successful!" },
		bulkImportTitle: { "zh-Hant": "批次匯入邀請碼", "zh-Hans": "批量导入邀请码", en: "Bulk Import Invitation Codes" },
		bulkImportDescription: { "zh-Hant": "每行一個邀請碼，或上傳文字檔", "zh-Hans": "每行一个邀请码，或上传文本文件", en: "One code per line, or upload a text file" },
		uploadFile: { "zh-Hant": "上傳檔案", "zh-Hans": "上传文件", en: "Upload File" },
		pasteOrType: { "zh-Hant": "貼上或輸入邀請碼", "zh-Hans": "粘贴或输入邀请码", en: "Paste or type invitation codes" },
		codesPlaceholder: {
			"zh-Hant": "每行一個邀請碼\n例如：\nVIP2026A\nVIP2026B\nVIP2026C",
			"zh-Hans": "每行一个邀请码\n例如：\nVIP2026A\nVIP2026B\nVIP2026C",
			en: "One code per line\nExample:\nVIP2026A\nVIP2026B\nVIP2026C"
		},
		import: { "zh-Hant": "匯入", "zh-Hans": "导入", en: "Import" },
		importSuccess: { "zh-Hant": "成功匯入 {count} 個邀請碼！", "zh-Hans": "成功导入 {count} 个邀请码！", en: "Successfully imported {count} invitation codes!" },
		invalidFormat: { "zh-Hant": "格式錯誤：請確保每行一個邀請碼", "zh-Hans": "格式错误：请确保每行一个邀请码", en: "Invalid format: Please ensure one code per line" },
		noCodes: { "zh-Hant": "請輸入至少一個邀請碼", "zh-Hans": "请输入至少一个邀请码", en: "Please enter at least one invitation code" }
	});

	const loadInvitationCodes = useCallback(async () => {
		if (!currentEventId) return;

		setIsLoading(true);
		try {
			const response = await adminInvitationCodesAPI.getAll();
			if (response.success) {
				const codesByType: Record<string, InviteType> = {};
				(response.data || []).forEach((code: InvitationCodeInfo) => {
					const ticket = tickets.find(t => t.id === code.ticketId);
					if (ticket && ticket.eventId === currentEventId) {
						const typeName = code.name || "Default";
						if (!codesByType[typeName]) {
							codesByType[typeName] = {
								id: typeName,
								name: typeName,
								createdAt: code.createdAt,
								codes: []
							};
						}
						codesByType[typeName].codes.push({
							id: code.id,
							code: code.code,
							usedCount: code.usedCount || 0,
							usageLimit: code.usageLimit || 1,
							usedBy: "",
							active: code.isActive !== false
						});
					}
				});
				setInviteTypes(Object.values(codesByType));
				setFilteredTypes(Object.values(codesByType));
			}
		} catch (error) {
			console.error("Failed to load invitation codes:", error);
		} finally {
			setIsLoading(false);
		}
	}, [currentEventId, tickets]);

	const loadTickets = useCallback(async () => {
		if (!currentEventId) return;

		try {
			const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
			if (response.success) {
				setTickets(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		}
	}, [currentEventId]);

	async function createInvitationCodes(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!selectedTicketId) {
			showAlert(t.pleaseSelectTicket, "warning");
			return;
		}

		const data: {
			ticketId: string;
			prefix: string;
			count: number;
			usageLimit: number;
			validFrom?: string;
			validUntil?: string;
		} = {
			ticketId: selectedTicketId,
			prefix: formData.name,
			count: formData.amount,
			usageLimit: formData.usageLimit
		};

		if (formData.validFrom) {
			data.validFrom = new Date(formData.validFrom).toISOString();
		}
		if (formData.validUntil) {
			data.validUntil = new Date(formData.validUntil).toISOString();
		}

		try {
			await adminInvitationCodesAPI.bulkCreate(data);
			await loadTickets();
			await loadInvitationCodes();
			setShowModal(false);
			setSelectedTicketId("");
			setFormData({
				name: "",
				amount: 10,
				usageLimit: 1,
				validFrom: "",
				validUntil: ""
			});
			showAlert(t.createSuccess.replace("{count}", formData.amount.toString()), "success");
		} catch (error) {
			showAlert("創建失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	async function deleteInvitationCode(codeId: string) {
		if (!confirm(t.confirmDelete)) return;

		try {
			await adminInvitationCodesAPI.delete(codeId);
			await loadTickets();
			await loadInvitationCodes();
			showAlert(t.deleteSuccess, "success");
		} catch (error) {
			showAlert("刪除失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	async function bulkDeleteInvitationCodes() {
		if (selectedCodes.size === 0) {
			showAlert("請選擇要刪除的邀請碼", "warning");
			return;
		}

		if (!confirm(t.confirmBulkDelete.replace("{count}", selectedCodes.size.toString()))) return;

		try {
			let successCount = 0;
			let errorCount = 0;

			for (const codeId of selectedCodes) {
				try {
					await adminInvitationCodesAPI.delete(codeId);
					successCount++;
				} catch (error) {
					console.error(`Failed to delete code ${codeId}:`, error);
					errorCount++;
				}
			}

			await loadTickets();
			await loadInvitationCodes();

			setSelectedCodes(new Set());

			if (errorCount > 0) {
				showAlert(`成功刪除 ${successCount} 個，失敗 ${errorCount} 個`, "error");
			} else {
				showAlert(t.bulkDeleteSuccess.replace("{count}", successCount.toString()), "success");
			}
		} catch (error) {
			showAlert("批次刪除失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	function downloadSelectedCodesAsTxt() {
		if (selectedCodes.size === 0) {
			showAlert(t.pleaseSelectCodes, "warning");
			return;
		}

		if (!currentType) return;

		const selectedCodesList = currentType.codes.filter(c => selectedCodes.has(c.id));
		const codesText = selectedCodesList.map(c => c.code).join("\n");

		const blob = new Blob([codesText], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `invitation-codes-${currentType.name}-${new Date().toISOString().split("T")[0]}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		showAlert(t.downloadSuccess, "success");
	}

	async function handleBulkImport(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const ticketId = formData.get("ticketId") as string;

		if (!ticketId) {
			showAlert(t.pleaseSelectTicket, "warning");
			return;
		}

		const codesText = bulkImportCodes.trim();
		if (!codesText) {
			showAlert(t.noCodes, "warning");
			return;
		}

		const codes = codesText
			.split("\n")
			.map(c => c.trim())
			.filter(c => c.length > 0);

		if (codes.length === 0) {
			showAlert(t.noCodes, "warning");
			return;
		}

		const name = formData.get("name") as string;
		const usageLimit = parseInt(formData.get("usageLimit") as string) || 1;
		const validFromStr = formData.get("validFrom") as string;
		const validUntilStr = formData.get("validUntil") as string;

		setIsImporting(true);
		try {
			let successCount = 0;
			let errorCount = 0;

			for (const code of codes) {
				try {
					const data: {
						ticketId: string;
						code: string;
						name?: string;
						usageLimit: number;
						validFrom?: string;
						validUntil?: string;
					} = {
						ticketId,
						code,
						name: name || undefined,
						usageLimit
					};

					if (validFromStr) {
						data.validFrom = new Date(validFromStr).toISOString();
					}
					if (validUntilStr) {
						data.validUntil = new Date(validUntilStr).toISOString();
					}

					await adminInvitationCodesAPI.create(data);
					successCount++;
				} catch (error) {
					console.error(`Failed to import code ${code}:`, error);
					errorCount++;
				}
			}

			await loadTickets();
			await loadInvitationCodes();

			setShowBulkImportModal(false);
			setBulkImportCodes("");

			if (errorCount > 0) {
				showAlert(`成功匯入 ${successCount} 個，失敗 ${errorCount} 個`, "error");
			} else {
				showAlert(t.importSuccess.replace("{count}", successCount.toString()), "success");
			}
		} catch (error) {
			showAlert("匯入失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			setIsImporting(false);
		}
	}

	function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = event => {
			const text = event.target?.result as string;
			setBulkImportCodes(text);
		};
		reader.readAsText(file);
	}

	async function sendCodesViaEmail() {
		if (selectedCodes.size === 0) {
			showAlert(t.pleaseSelectCodes, "warning");
			return;
		}

		if (!emailAddress || !emailAddress.includes("@")) {
			showAlert("請輸入有效的 Email 地址", "warning");
			return;
		}

		if (!currentType) return;

		const selectedCodesList = currentType.codes.filter(c => selectedCodes.has(c.id));

		setIsSendingEmail(true);
		try {
			const response = await fetch("/api/admin/invitation-codes/send-email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					email: emailAddress,
					codes: selectedCodesList.map(c => c.code),
					groupName: currentType.name
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: { message: "Failed to send email" } }));
				throw new Error(errorData.error?.message || errorData.message || "Failed to send email");
			}

			showAlert(t.sendSuccess, "success");
			setShowEmailModal(false);
			setEmailAddress("");
		} catch (error) {
			console.error("Error sending email:", error);
			showAlert(t.sendError + ": " + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			setIsSendingEmail(false);
		}
	}

	function toggleCodeSelection(codeId: string) {
		const newSelection = new Set(selectedCodes);
		if (newSelection.has(codeId)) {
			newSelection.delete(codeId);
		} else {
			newSelection.add(codeId);
		}
		setSelectedCodes(newSelection);
	}

	function toggleSelectAll() {
		if (!currentType) return;

		const allCodeIds = currentType.codes.map(c => c.id);
		if (selectedCodes.size === allCodeIds.length) {
			setSelectedCodes(new Set());
		} else {
			setSelectedCodes(new Set(allCodeIds));
		}
	}

	function openCodesModal(typeId: string) {
		setViewingCodesOf(typeId);
		setSelectedCodes(new Set());
		setShowCodesModal(true);
	}

	const currentType = inviteTypes.find(t => t.id === viewingCodesOf);

	useEffect(() => {
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
	}, []);

	useEffect(() => {
		if (currentEventId) {
			loadTickets();
		}
	}, [currentEventId, loadTickets]);

	useEffect(() => {
		if (currentEventId && tickets.length > 0) {
			loadInvitationCodes();
		}
	}, [currentEventId, tickets.length, loadInvitationCodes]);

	useEffect(() => {
		const q = searchTerm.toLowerCase();
		const filtered = inviteTypes.filter(t => {
			if (!q) return true;
			if (t.name.toLowerCase().includes(q)) return true;
			return t.codes.some(c => c.code.toLowerCase().includes(q));
		});
		setFilteredTypes(filtered);
	}, [inviteTypes, searchTerm]);

	return (
		<>
			<main>
				<AdminHeader title={t.title} />
				<section className="flex gap-2 mb-4">
					<Button onClick={() => setShowModal(true)}>➕ {t.add}</Button>
					<Button variant="secondary" onClick={() => setShowBulkImportModal(true)}>
						📥 {t.bulkImport}
					</Button>
					<Input type="text" placeholder={"🔍 " + t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
				</section>

				<section>
					<div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
						{isLoading && (
							<div className="flex justify-center py-8">
								<PageSpinner />
							</div>
						)}
						{!isLoading && (
							<table className="w-full text-left border-collapse">
								<thead>
									<tr>
										<th>{t.name}</th>
										<th>{t.total}</th>
										<th>{t.used}</th>
										<th>{t.remaining}</th>
										<th>{t.created}</th>
										<th>{t.actions}</th>
									</tr>
								</thead>
								<tbody>
									{filteredTypes.map(type => {
										const used = type.codes.filter(c => c.usedCount > 0).length;
										const total = type.codes.length;
										return (
											<tr key={type.id}>
												<td>{type.name}</td>
												<td>{total}</td>
												<td>{used}</td>
												<td>{total - used}</td>
												<td>{new Date(type.createdAt).toLocaleString()}</td>
												<td>
													<Button variant="secondary" size="sm" onClick={() => openCodesModal(type.id)}>
														檢視
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				</section>

				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>{t.add}</DialogTitle>
						</DialogHeader>
						<form onSubmit={createInvitationCodes} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="ticketId">{t.ticketType}</Label>
								<Select name="ticketId" value={selectedTicketId} onValueChange={setSelectedTicketId} required>
									<SelectTrigger>
										<SelectValue placeholder={t.pleaseSelectTicket} />
									</SelectTrigger>
									<SelectContent>
										{tickets.map(ticket => (
											<SelectItem key={ticket.id} value={ticket.id}>
												{getLocalizedText(ticket.name, locale)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="name">{t.name}</Label>
								<Input 
									id="name" 
									name="name" 
									type="text" 
									required 
									placeholder="e.g. VIP Media"
									value={formData.name}
									onChange={e => setFormData({...formData, name: e.target.value})}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="amount">{t.amount}</Label>
									<Input 
										id="amount" 
										name="amount" 
										type="number" 
										min="1" 
										max="1000" 
										required
										value={formData.amount}
										onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="usageLimit">{t.usageLimit}</Label>
									<Input 
										id="usageLimit" 
										name="usageLimit" 
										type="number" 
										min="1" 
										max="100" 
										required
										value={formData.usageLimit}
										onChange={e => setFormData({...formData, usageLimit: parseInt(e.target.value)})}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="validFrom">
										{t.validFrom} ({t.optional})
									</Label>
									<Input 
										id="validFrom" 
										name="validFrom" 
										type="datetime-local"
										value={formData.validFrom}
										onChange={e => setFormData({...formData, validFrom: e.target.value})}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="validUntil">
										{t.validUntil} ({t.optional})
									</Label>
									<Input 
										id="validUntil" 
										name="validUntil" 
										type="datetime-local"
										value={formData.validUntil}
										onChange={e => setFormData({...formData, validUntil: e.target.value})}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => setShowModal(false)}>
									{t.cancel}
								</Button>
								<Button type="submit">{t.save}</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				<Dialog open={showBulkImportModal} onOpenChange={setShowBulkImportModal}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>{t.bulkImportTitle}</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleBulkImport} className="space-y-4">
							<p className="text-sm text-muted-foreground">{t.bulkImportDescription}</p>

							<div className="space-y-2">
								<Label htmlFor="bulkTicketId">{t.ticketType}</Label>
								<Select name="ticketId" value={bulkTicketId} onValueChange={setBulkTicketId} required>
									<SelectTrigger>
										<SelectValue placeholder={t.pleaseSelectTicket} />
									</SelectTrigger>
									<SelectContent>
										{tickets.map(ticket => (
											<SelectItem key={ticket.id} value={ticket.id}>
												{getLocalizedText(ticket.name, locale)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="bulkName">
									{t.name} ({t.optional})
								</Label>
								<Input id="bulkName" name="name" type="text" placeholder="e.g. VIP Media" />
							</div>

							<div className="space-y-2">
								<Label htmlFor="bulkFile">{t.uploadFile}</Label>
								<Input id="bulkFile" type="file" accept=".txt,.csv" onChange={handleFileUpload} />
							</div>

							<div className="space-y-2">
								<Label htmlFor="bulkCodes">{t.pasteOrType}</Label>
								<Textarea 
									id="bulkCodes"
									value={bulkImportCodes} 
									onChange={e => setBulkImportCodes(e.target.value)} 
									placeholder={t.codesPlaceholder} 
									rows={10} 
									className="font-mono"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="bulkUsageLimit">{t.usageLimit}</Label>
									<Input id="bulkUsageLimit" name="usageLimit" type="number" min="1" max="100" defaultValue="1" required />
								</div>
								<div className="space-y-2">
									<Label htmlFor="bulkValidFrom">
										{t.validFrom} ({t.optional})
									</Label>
									<Input id="bulkValidFrom" name="validFrom" type="datetime-local" />
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="bulkValidUntil">
									{t.validUntil} ({t.optional})
								</Label>
								<Input id="bulkValidUntil" name="validUntil" type="datetime-local" />
							</div>

							<DialogFooter>
								<Button type="button" variant="outline" onClick={() => setShowBulkImportModal(false)} disabled={isImporting}>
									{t.cancel}
								</Button>
								<Button type="submit" disabled={isImporting}>
									{isImporting ? "匯入中..." : t.import}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				<Dialog open={showCodesModal} onOpenChange={setShowCodesModal}>
					<DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								{currentType && (
									<>
										{t.codes} - {currentType.name}
										{selectedCodes.size > 0 && (
											<span className="text-sm font-normal text-muted-foreground ml-2">
												({t.selected.replace("{count}", selectedCodes.size.toString())})
											</span>
										)}
									</>
								)}
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button variant="outline" size="sm" onClick={toggleSelectAll}>
									{currentType && selectedCodes.size === currentType.codes.length ? t.deselectAll : t.selectAll}
								</Button>
								{selectedCodes.size > 0 && (
									<>
										<Button variant="outline" size="sm" onClick={downloadSelectedCodesAsTxt}>
											📥 {t.downloadTxt} ({selectedCodes.size})
										</Button>
										<Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
											📧 {t.sendEmail} ({selectedCodes.size})
										</Button>
										<Button variant="destructive" size="sm" onClick={bulkDeleteInvitationCodes}>
											{t.bulkDelete} ({selectedCodes.size})
										</Button>
									</>
								)}
							</div>
							<div className="overflow-x-auto rounded-lg border">
								<table className="w-full">
									<thead>
										<tr className="border-b bg-muted/50">
											<th className="w-[50px] text-center p-2">
												<input 
													type="checkbox" 
													checked={currentType && selectedCodes.size === currentType.codes.length && currentType.codes.length > 0} 
													onChange={toggleSelectAll} 
													className="cursor-pointer" 
												/>
											</th>
											<th className="text-left p-2">{t.code}</th>
											<th className="text-left p-2">{t.usage}</th>
											<th className="text-left p-2">{t.limit}</th>
											<th className="text-left p-2">{t.status}</th>
											<th className="text-left p-2">{t.actions}</th>
										</tr>
									</thead>
									<tbody>
										{currentType?.codes.map(code => {
											const status = !code.active ? "inactive" : code.usedCount >= code.usageLimit ? "usedup" : "active";
											const statusClass = status === "active" ? "active" : "ended";
											return (
												<tr key={code.id} className="border-b hover:bg-muted/50">
													<td className="text-center p-2">
														<input 
															type="checkbox" 
															checked={selectedCodes.has(code.id)} 
															onChange={() => toggleCodeSelection(code.id)} 
															className="cursor-pointer" 
														/>
													</td>
													<td className="p-2 font-mono text-sm">{code.code}</td>
													<td className="p-2">{code.usedCount}</td>
													<td className="p-2">{code.usageLimit}</td>
													<td className="p-2">
														<span className={`status-badge ${statusClass}`}>{status}</span>
													</td>
													<td className="p-2">
														<Button variant="destructive" size="sm" onClick={() => deleteInvitationCode(code.id)}>
															{t.delete}
														</Button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>{t.sendEmail}</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<p className="text-sm text-muted-foreground">
								將寄送 {selectedCodes.size} 個邀請碼至指定的 Email 地址
							</p>
							<div className="space-y-2">
								<Label htmlFor="emailAddress">{t.emailAddress}</Label>
								<Input 
									id="emailAddress"
									type="email" 
									value={emailAddress} 
									onChange={e => setEmailAddress(e.target.value)} 
									placeholder={t.emailPlaceholder}
									required 
								/>
							</div>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setShowEmailModal(false)} disabled={isSendingEmail}>
								{t.cancel}
							</Button>
							<Button type="button" onClick={sendCodesViaEmail} disabled={isSendingEmail}>
								{isSendingEmail ? "發送中..." : t.send}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</main>
		</>
	);
}
