"use client";

import AdminHeader from "@/components/AdminHeader";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminInvitationCodesAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { InvitationCodeInfo, Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { Download, Import, Mail, Plus, Search } from "lucide-react";
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
	const [isSendingEmail, setIsSendingEmail] = useState(false);
	const [emailList, setEmailList] = useState("");
	const [emailMessage, setEmailMessage] = useState("");
	const [matchedPairs, setMatchedPairs] = useState<Array<{ email: string; code: string; codeId: string }>>([]);
	const [showPreview, setShowPreview] = useState(false);
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
		noCodes: { "zh-Hant": "請輸入至少一個邀請碼", "zh-Hans": "请输入至少一个邀请码", en: "Please enter at least one invitation code" },
		bulkSendEmail: { "zh-Hant": "批次寄送 Email", "zh-Hans": "批量发送 Email", en: "Bulk Send Email" },
		emailListLabel: { "zh-Hant": "Email 列表（每行一個）", "zh-Hans": "Email 列表（每行一个）", en: "Email List (one per line)" },
		emailListPlaceholder: {
			"zh-Hant": "請輸入 Email 地址，每行一個\n例如：\nuser1@example.com\nuser2@example.com",
			"zh-Hans": "请输入 Email 地址，每行一个\n例如：\nuser1@example.com\nuser2@example.com",
			en: "Enter email addresses, one per line\nExample:\nuser1@example.com\nuser2@example.com"
		},
		matchCodes: { "zh-Hant": "配對邀請碼", "zh-Hans": "配对邀请码", en: "Match Codes" },
		messageLabel: { "zh-Hant": "訊息內容", "zh-Hans": "消息内容", en: "Message" },
		messagePlaceholder: { "zh-Hant": "請輸入要在郵件中顯示的訊息 (支援 HTML)", "zh-Hans": "请输入要在邮件中显示的消息 (支持 HTML)", en: "Enter message to display in email (supports HTML)" },
		preview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
		matched: { "zh-Hant": "已配對", "zh-Hans": "已配对", en: "Matched" },
		tooManyEmails: {
			"zh-Hant": "Email 數量（{emailCount}）超過所選邀請碼數量（{codeCount}）",
			"zh-Hans": "Email 数量（{emailCount}）超过所选邀请码数量（{codeCount}）",
			en: "Email count ({emailCount}) exceeds selected codes count ({codeCount})"
		},
		noEmails: { "zh-Hant": "請輸入至少一個 Email 地址", "zh-Hans": "请输入至少一个 Email 地址", en: "Please enter at least one email address" },
		matchSuccess: { "zh-Hant": "成功配對 {count} 組郵件與邀請碼", "zh-Hans": "成功配对 {count} 组邮件与邀请码", en: "Successfully matched {count} pairs" },
		sendAll: { "zh-Hant": "全部發送", "zh-Hans": "全部发送", en: "Send All" },
		sending: { "zh-Hant": "發送中...", "zh-Hans": "发送中...", en: "Sending..." },
		sendAllSuccess: { "zh-Hant": "成功發送 {count} 封郵件！", "zh-Hans": "成功发送 {count} 封邮件！", en: "Successfully sent {count} emails!" },
		sendPartialSuccess: { "zh-Hant": "成功發送 {success} 封，失敗 {failed} 封", "zh-Hans": "成功发送 {success} 封，失败 {failed} 封", en: "Sent {success} emails, {failed} failed" },
		emailPreview: { "zh-Hant": "郵件預覽", "zh-Hans": "邮件预览", en: "Email Preview" },
		closePreview: { "zh-Hant": "關閉預覽", "zh-Hans": "关闭预览", en: "Close Preview" },
		importing: { "zh-Hant": "匯入中...", "zh-Hans": "导入中...", en: "Importing..." },
		namePlaceholder: { "zh-Hant": "例如：VIP Media", "zh-Hans": "例如：VIP Media", en: "e.g. VIP Media" }
	});

	const loadInvitationCodes = useCallback(async () => {
		if (!currentEventId) return;

		setIsLoading(true);
		try {
			const response = await adminInvitationCodesAPI.getAll({ eventId: currentEventId });
			if (response.success) {
				const codesByType: Record<string, InviteType> = {};
				(response.data || []).forEach((code: InvitationCodeInfo) => {
					const ticket = tickets.find(t => t.id === code.ticketId);
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

	function handleMatchCodes() {
		if (selectedCodes.size === 0) {
			showAlert(t.pleaseSelectCodes, "warning");
			return;
		}

		if (!currentType) return;

		const emailsText = emailList.trim();
		if (!emailsText) {
			showAlert(t.noEmails, "warning");
			return;
		}

		const emails = emailsText
			.split("\n")
			.map(e => e.trim())
			.filter(e => e.length > 0 && e.includes("@"));

		if (emails.length === 0) {
			showAlert(t.noEmails, "warning");
			return;
		}

		const selectedCodesList = currentType.codes.filter(c => selectedCodes.has(c.id));

		if (emails.length > selectedCodesList.length) {
			showAlert(t.tooManyEmails.replace("{emailCount}", emails.length.toString()).replace("{codeCount}", selectedCodesList.length.toString()), "error");
			return;
		}

		const pairs = emails.map((email, index) => ({
			email,
			code: selectedCodesList[index].code,
			codeId: selectedCodesList[index].id
		}));

		setMatchedPairs(pairs);
		showAlert(t.matchSuccess.replace("{count}", pairs.length.toString()), "success");
	}

	async function sendAllEmails() {
		if (matchedPairs.length === 0) {
			showAlert("請先配對郵件與邀請碼", "warning");
			return;
		}

		if (!emailMessage.trim()) {
			showAlert("請輸入郵件訊息", "warning");
			return;
		}

		setIsSendingEmail(true);
		try {
			let successCount = 0;
			let errorCount = 0;

			for (const pair of matchedPairs) {
				try {
					const response = await fetch("/api/admin/invitation-codes/send-email", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							email: pair.email,
							code: pair.code,
							message: emailMessage
						})
					});

					if (!response.ok) {
						throw new Error("Failed to send email");
					}
					successCount++;
				} catch (error) {
					console.error(`Failed to send email to ${pair.email}:`, error);
					errorCount++;
				}
			}

			if (errorCount > 0) {
				showAlert(t.sendPartialSuccess.replace("{success}", successCount.toString()).replace("{failed}", errorCount.toString()), "warning");
			} else {
				showAlert(t.sendAllSuccess.replace("{count}", successCount.toString()), "success");
			}

			setShowEmailModal(false);
			setEmailList("");
			setEmailMessage("");
			setMatchedPairs([]);
		} catch (error) {
			console.error("Error sending emails:", error);
			showAlert(t.sendError + ": " + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			setIsSendingEmail(false);
		}
	}

	function renderEmailPreview() {
		if (matchedPairs.length === 0) {
			return <div className="text-sm text-muted-foreground">請先配對郵件與邀請碼以查看預覽</div>;
		}

		const samplePair = matchedPairs[0];
		const ticket = tickets.find(t => currentType?.codes.find(c => c.code === samplePair.code));

		return (
			<div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-[500px] overflow-y-auto">
				<div style={{ background: "linear-gradient(#e5e7eb, #e5e7eb)", fontFamily: "sans-serif", padding: "48px 32px" }}>
					<div style={{ margin: "0 auto", maxWidth: "600px", padding: "24px calc((min(100%, 600px) - 32px) * 0.04) 0", boxSizing: "border-box" }}>
						<div style={{ background: "linear-gradient(#f9fafb, #f9fafb)", padding: "48px 24px 0" }}>
							<h1 style={{ fontSize: "24px", margin: "32px 0", textAlign: "center", color: "#374151" }}>來自 SITCONTIX 的活動邀請碼</h1>
							<div className="description" style={{ color: "#6b7280", lineHeight: "150%" }} dangerouslySetInnerHTML={{ __html: emailMessage || "<p>（訊息預覽）</p>" }} />
							<div style={{ background: "linear-gradient(#9ca3af, #9ca3af)", padding: "12px 32px", margin: "32px auto", display: "block", width: "fit-content", borderRadius: "12px" }}>
								<span style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: "x-large", color: "#f3f4f6" }}>{samplePair.code}</span>
							</div>
							<div style={{ color: "#6b7280", lineHeight: "150%" }}>
								<p>您可以將邀請碼用於兌換票種「{ticket ? getLocalizedText(ticket.name, locale) : "票種名稱"}」，請至報名系統頁面點選填入，或直接點選下面按鈕領票。</p>
								<p>請在有效期限前使用邀請碼，邀請碼逾期將失效，歡迎提前轉贈使用。</p>
							</div>
							<a href="#" style={{ background: "linear-gradient(#6b7280, #6b7280)", padding: "12px 32px", textDecoration: "none", margin: "auto", display: "block", width: "fit-content" }}>
								<span style={{ fontWeight: "bold", color: "#f3f4f6" }}>直接前往領票</span>
							</a>
						</div>
					</div>
					<div style={{ color: "#6b7280", fontSize: "14px", lineHeight: "150%", textAlign: "center", marginTop: "24px" }}>
						©SITCON
						<br />
						寄送給 {samplePair.email}
					</div>
				</div>
			</div>
		);
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
					<Button onClick={() => setShowModal(true)}>
						<Plus /> {t.add}
					</Button>
					<Button variant="secondary" onClick={() => setShowBulkImportModal(true)}>
						<Import /> {t.bulkImport}
					</Button>
					<div className="relative max-w-xs">
						<Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
						<Input type="text" placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11" />
					</div>
				</section>

				<section>
					<div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
						{isLoading && (
							<div className="flex justify-center py-8">
								<PageSpinner />
							</div>
						)}
						{!isLoading && (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t.name}</TableHead>
										<TableHead>{t.total}</TableHead>
										<TableHead>{t.used}</TableHead>
										<TableHead>{t.remaining}</TableHead>
										<TableHead>{t.created}</TableHead>
										<TableHead>{t.actions}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTypes.map(type => {
										const used = type.codes.filter(c => c.usedCount > 0).length;
										const total = type.codes.length;
										return (
											<TableRow key={type.id}>
												<TableCell>{type.name}</TableCell>
												<TableCell>{total}</TableCell>
												<TableCell>{used}</TableCell>
												<TableCell>{total - used}</TableCell>
												<TableCell>{new Date(type.createdAt).toLocaleString()}</TableCell>
												<TableCell>
													<Button variant="secondary" size="sm" onClick={() => openCodesModal(type.id)}>
														檢視
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</div>
				</section>

				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
								<Input id="name" name="name" type="text" required placeholder="e.g. VIP Media" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="amount">{t.amount}</Label>
									<Input id="amount" name="amount" type="number" min="1" max="1000" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) })} />
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
										onChange={e => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="validFrom">
										{t.validFrom} ({t.optional})
									</Label>
									<Input id="validFrom" name="validFrom" type="datetime-local" value={formData.validFrom} onChange={e => setFormData({ ...formData, validFrom: e.target.value })} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="validUntil">
										{t.validUntil} ({t.optional})
									</Label>
									<Input id="validUntil" name="validUntil" type="datetime-local" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
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
					<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
								<Input id="bulkName" name="name" type="text" placeholder={t.namePlaceholder} />
							</div>

							<div className="space-y-2">
								<Label htmlFor="bulkFile">{t.uploadFile}</Label>
								<Input id="bulkFile" type="file" accept=".txt,.csv" onChange={handleFileUpload} />
							</div>

							<div className="space-y-2">
								<Label htmlFor="bulkCodes">{t.pasteOrType}</Label>
								<Textarea id="bulkCodes" value={bulkImportCodes} onChange={e => setBulkImportCodes(e.target.value)} placeholder={t.codesPlaceholder} rows={10} className="font-mono" />
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
									{isImporting ? t.importing : t.import}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				<Dialog open={showCodesModal} onOpenChange={setShowCodesModal}>
					<DialogContent className="sm:max-w-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								{currentType && (
									<>
										{t.codes} - {currentType.name}
										{selectedCodes.size > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({t.selected.replace("{count}", selectedCodes.size.toString())})</span>}
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
											<Download size={20} /> {t.downloadTxt} ({selectedCodes.size})
										</Button>
										<Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
											<Mail size={20} /> {t.sendEmail} ({selectedCodes.size})
										</Button>
										<Button variant="destructive" size="sm" onClick={bulkDeleteInvitationCodes}>
											{t.bulkDelete} ({selectedCodes.size})
										</Button>
									</>
								)}
							</div>
							<div className="overflow-x-auto rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[50px] text-center">
												<input
													type="checkbox"
													checked={currentType && selectedCodes.size === currentType.codes.length && currentType.codes.length > 0}
													onChange={toggleSelectAll}
													className="cursor-pointer"
												/>
											</TableHead>
											<TableHead>{t.code}</TableHead>
											<TableHead className="w-[100px] whitespace-nowrap">{t.usage}</TableHead>
											<TableHead className="w-[100px] whitespace-nowrap">{t.limit}</TableHead>
											<TableHead className="whitespace-nowrap">{t.status}</TableHead>
											<TableHead className="whitespace-nowrap">{t.actions}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{currentType?.codes.map(code => {
											const status = !code.active ? "inactive" : code.usedCount >= code.usageLimit ? "usedup" : "active";
											const statusClass = status === "active" ? "active" : "ended";
											return (
												<TableRow key={code.id}>
													<TableCell className="text-center">
														<input type="checkbox" checked={selectedCodes.has(code.id)} onChange={() => toggleCodeSelection(code.id)} className="cursor-pointer" />
													</TableCell>
													<TableCell className="font-mono text-sm">{code.code}</TableCell>
													<TableCell className="whitespace-nowrap">{code.usedCount}</TableCell>
													<TableCell className="whitespace-nowrap">{code.usageLimit}</TableCell>
													<TableCell>
														<span className={`status-badge ${statusClass}`}>{status}</span>
													</TableCell>
													<TableCell>
														<Button variant="destructive" size="sm" onClick={() => deleteInvitationCode(code.id)}>
															{t.delete}
														</Button>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>{t.bulkSendEmail}</DialogTitle>
						</DialogHeader>
						<div className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="emailList">{t.emailListLabel}</Label>
									<Textarea id="emailList" value={emailList} onChange={e => setEmailList(e.target.value)} placeholder={t.emailListPlaceholder} rows={8} className="font-mono text-sm" />
									<p className="text-xs text-muted-foreground">已選擇 {selectedCodes.size} 個邀請碼</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="emailMessage">{t.messageLabel}</Label>
									<Textarea id="emailMessage" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder={t.messagePlaceholder} rows={8} />
								</div>
							</div>

							<div className="flex gap-2">
								<Button type="button" onClick={handleMatchCodes} variant="secondary" disabled={isSendingEmail}>
									{t.matchCodes}
								</Button>
								{matchedPairs.length > 0 && (
									<>
										<Button type="button" onClick={() => setShowPreview(!showPreview)} variant="outline" disabled={isSendingEmail}>
											{showPreview ? t.closePreview : t.preview}
										</Button>
										<div className="text-sm text-muted-foreground flex items-center">
											{t.matched}: {matchedPairs.length} 組
										</div>
									</>
								)}
							</div>

							{matchedPairs.length > 0 && (
								<div className="space-y-2">
									<Label>配對結果</Label>
									<div className="border rounded-lg p-4 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-900">
										<div className="space-y-1 font-mono text-sm">
											{matchedPairs.map((pair, index) => (
												<div key={index} className="flex justify-between items-center py-1 border-b last:border-b-0">
													<span className="text-blue-600 dark:text-blue-400">{pair.email}</span>
													<span className="text-gray-400">→</span>
													<span className="text-green-600 dark:text-green-400">{pair.code}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{showPreview && (
								<div className="space-y-2">
									<Label>{t.emailPreview}</Label>
									{renderEmailPreview()}
								</div>
							)}
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setShowEmailModal(false);
									setEmailList("");
									setEmailMessage("");
									setMatchedPairs([]);
									setShowPreview(false);
								}}
								disabled={isSendingEmail}
							>
								{t.cancel}
							</Button>
							<Button type="button" onClick={sendAllEmails} disabled={isSendingEmail || matchedPairs.length === 0}>
								{isSendingEmail ? t.sending : t.sendAll}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</main>
		</>
	);
}
