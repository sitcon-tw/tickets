"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminRegistrationsAPI } from "@/lib/api/endpoints";
import type { Registration } from "@/lib/types/api";
import generateHash from "@/lib/utils/hash";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createRegistrationsColumns, type RegistrationDisplay } from "./columns";

type SortField = "id" | "email" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

export default function RegistrationsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [, setFiltered] = useState<Registration[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [activeColumns, setActiveColumns] = useState(new Set(["email", "status", "ticket", "event", "createdAt"]));
	const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
	const [sortField] = useState<SortField>("createdAt");
	const [sortDirection] = useState<SortDirection>("desc");
	const [page] = useState(1);
	const [pageSize] = useState(50);
	const [ticketHashes, setTicketHashes] = useState<{ [key: string]: string }>({});

	const t = getTranslations(locale, {
		title: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
		search: { "zh-Hant": "搜尋電子郵件、ID", "zh-Hans": "搜索电子邮件、ID", en: "Search Email, ID" },
		allStatus: { "zh-Hant": "全部狀態", "zh-Hans": "全部状态", en: "All statuses" },
		confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
		pending: { "zh-Hant": "待處理", "zh-Hans": "待处理", en: "Pending" },
		cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
		refresh: { "zh-Hant": "重新整理", "zh-Hans": "重新整理", en: "Refresh" },
		syncSheets: { "zh-Hant": "匯出 CSV", "zh-Hans": "导出 CSV", en: "Export CSV" },
		columns: { "zh-Hant": "欄位", "zh-Hans": "栏位", en: "Columns" },
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." },
		empty: { "zh-Hant": "沒有資料", "zh-Hans": "没有资料", en: "No data" },
		total: { "zh-Hant": "總計", "zh-Hans": "总计", en: "Total" },
		selected: { "zh-Hant": "已選取", "zh-Hans": "已选取", en: "Selected" },
		selectAll: { "zh-Hant": "全選", "zh-Hans": "全选", en: "Select All" },
		deselectAll: { "zh-Hant": "取消全選", "zh-Hans": "取消全选", en: "Deselect All" },
		exportSelected: { "zh-Hant": "匯出選取", "zh-Hans": "导出选取", en: "Export Selected" },
		viewDetails: { "zh-Hant": "檢視詳情", "zh-Hans": "查看详情", en: "View Details" },
		deleteData: { "zh-Hant": "刪除個人資料", "zh-Hans": "删除个人资料", en: "Delete Personal Data" },
		deleteConfirm: {
			"zh-Hant": "確定要刪除此報名記錄的個人資料嗎？\n\n此操作無法復原，將會永久刪除該筆記錄及相關資料，並通知活動主辦方。",
			"zh-Hans": "确定要删除此报名记录的个人资料吗？\n\n此操作无法复原，将会永久删除该笔记录及相关资料，并通知活动主办方。",
			en: "Are you sure you want to delete this registration's personal data?\n\nThis action cannot be undone and will permanently delete the record and related data, and notify the event organizers."
		},
		deleteSuccess: {
			"zh-Hant": "個人資料已成功刪除，通知信已發送給活動主辦方",
			"zh-Hans": "个人资料已成功删除，通知信已发送给活动主办方",
			en: "Personal data deleted successfully. Notification email sent to organizers."
		},
		deleteError: { "zh-Hant": "刪除失敗", "zh-Hans": "删除失败", en: "Delete failed" },
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
		registrationDetails: { "zh-Hant": "報名詳情", "zh-Hans": "报名详情", en: "Registration Details" },
		formData: { "zh-Hant": "表單資料", "zh-Hans": "表单资料", en: "Form Data" },
		referredBy: { "zh-Hant": "推薦人", "zh-Hans": "推荐人", en: "Referred By" },
		page: { "zh-Hant": "頁", "zh-Hans": "页", en: "Page" },
		of: { "zh-Hant": "共", "zh-Hans": "共", en: "of" },
		perPage: { "zh-Hant": "每頁筆數", "zh-Hans": "每页笔数", en: "Per Page" },
		stats: { "zh-Hant": "統計", "zh-Hans": "统计", en: "Statistics" }
	});

	const columnDefs = [
		{ id: "id", label: "ID", accessor: (r: Registration) => r.id.slice(0, 8) + "...", sortable: true },
		{ id: "email", label: "Email", accessor: (r: Registration) => r.email, sortable: true },
		{ id: "status", label: "Status", accessor: (r: Registration) => r.status, sortable: true },
		{ id: "ticket", label: "Ticket", accessor: (r: Registration) => getLocalizedText(r.ticket?.name, locale) || r.ticketId || "", sortable: false },
		{ id: "event", label: "Event", accessor: (r: Registration) => getLocalizedText(r.event?.name, locale) || r.eventId || "", sortable: false },
		{ id: "referredBy", label: "Referred By", accessor: (r: Registration) => (r.referredBy ? r.referredBy.slice(0, 8) + "..." : "-"), sortable: false },
		{ id: "createdAt", label: "Created", accessor: (r: Registration) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : ""), sortable: true },
		{ id: "updatedAt", label: "Updated", accessor: (r: Registration) => (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""), sortable: false }
	];

	const loadRegistrations = useCallback(async () => {
		if (!currentEventId) return;

		setIsLoading(true);
		try {
			const params: { limit: number; status?: "pending" | "confirmed" | "cancelled"; eventId?: string } = {
				limit: 100,
				eventId: currentEventId
			};
			if (statusFilter) params.status = statusFilter as "pending" | "confirmed" | "cancelled";

			const response = await adminRegistrationsAPI.getAll(params);
			if (response.success) {
				setRegistrations(response.data || []);

				const hashPromises = response.data.map(r => generateHash(r.id, r.createdAt).then(hash => ({ id: r.id, hash })));
				const hashes = await Promise.all(hashPromises);
				const hashMap: { [key: string]: string } = {};
				hashes.forEach(h => {
					hashMap[h.id] = h.hash;
				});
				setTicketHashes(hashMap);
			}
		} catch (error) {
			console.error("Failed to load registrations:", error);
		} finally {
			setIsLoading(false);
		}
	}, [statusFilter, currentEventId]);

	const stats = useMemo(() => {
		return {
			total: registrations.length,
			confirmed: registrations.filter(r => r.status === "confirmed").length,
			pending: registrations.filter(r => r.status === "pending").length,
			cancelled: registrations.filter(r => r.status === "cancelled").length
		};
	}, [registrations]);

	const sortedAndFiltered = useMemo(() => {
		const q = searchTerm.toLowerCase();
		const filtered = registrations.filter(r => {
			if (statusFilter && r.status !== statusFilter) return false;
			if (q) {
				const emailMatch = r.email.toLowerCase().includes(q);
				const idMatch = r.id.toLowerCase().includes(q);
				const ticketNameMatch = r.ticket && getLocalizedText(r.ticket.name, locale).toLowerCase().includes(q);
				const eventNameMatch = r.event && getLocalizedText(r.event.name, locale).toLowerCase().includes(q);
				const formDataMatch = r.formData && Object.values(r.formData).some(val => String(val).toLowerCase().includes(q));
				if (!emailMatch && !idMatch && !ticketNameMatch && !eventNameMatch && !formDataMatch) return false;
			}
			return true;
		});

		filtered.sort((a, b) => {
			let aVal: string | number = "";
			let bVal: string | number = "";

			switch (sortField) {
				case "id":
					aVal = a.id;
					bVal = b.id;
					break;
				case "email":
					aVal = a.email;
					bVal = b.email;
					break;
				case "status":
					aVal = a.status;
					bVal = b.status;
					break;
				case "createdAt":
					aVal = new Date(a.createdAt).getTime();
					bVal = new Date(b.createdAt).getTime();
					break;
			}

			if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [searchTerm, registrations, statusFilter, locale, sortField, sortDirection]);

	// const paginatedData = useMemo(() => {
	// 	const start = (page - 1) * pageSize;
	// 	const end = start + pageSize;
	// 	return sortedAndFiltered.slice(start, end);
	// }, [sortedAndFiltered, page, pageSize]);

	const displayData = useMemo((): RegistrationDisplay[] => {
		return sortedAndFiltered.map(r => ({
			...r,
			displayId: r.id.slice(0, 8) + "...",
			displayTicket: getLocalizedText(r.ticket?.name, locale) || r.ticketId || "",
			displayEvent: getLocalizedText(r.event?.name, locale) || r.eventId || "",
			displayReferredBy: r.referredBy ? r.referredBy.slice(0, 8) + "..." : "-",
			formattedCreatedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
			formattedUpdatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "",
			statusClass: r.status === "confirmed" ? "active" : r.status === "pending" ? "pending" : r.status === "cancelled" ? "ended" : ""
		}));
	}, [sortedAndFiltered, locale]);

	const columns = useMemo(
		() =>
			createRegistrationsColumns({
				onViewDetails: openDetailModal,
				t: { viewDetails: t.viewDetails }
			}),
		[t.viewDetails]
	);

	// const totalPages = Math.ceil(sortedAndFiltered.length / pageSize);

	// function handleSort(field: SortField) {
	// 	if (sortField === field) {
	// 		setSortDirection(sortDirection === "asc" ? "desc" : "asc");
	// 	} else {
	// 		setSortField(field);
	// 		setSortDirection("asc");
	// 	}
	// }

	// function toggleSelectAll() {
	// 	if (selectedRegistrations.size === paginatedData.length) {
	// 		setSelectedRegistrations(new Set());
	// 	} else {
	// 		setSelectedRegistrations(new Set(paginatedData.map(r => r.id)));
	// 	}
	// }

	// function toggleSelect(id: string) {
	// 	const newSet = new Set(selectedRegistrations);
	// 	if (newSet.has(id)) {
	// 		newSet.delete(id);
	// 	} else {
	// 		newSet.add(id);
	// 	}
	// 	setSelectedRegistrations(newSet);
	// }

	function openDetailModal(registration: Registration) {
		setSelectedRegistration(registration);
		setShowDetailModal(true);
	}

	function closeDetailModal() {
		setSelectedRegistration(null);
		setShowDetailModal(false);
	}

	async function syncToSheets() {
		try {
			const params: { format: "csv"; eventId?: string } = { format: "csv" };
			if (currentEventId) params.eventId = currentEventId;

			const queryParams = new URLSearchParams();
			if (params.format) queryParams.append("format", params.format);
			if (params.eventId) queryParams.append("eventId", params.eventId);

			const downloadUrl = `/api/admin/registrations/export?${queryParams.toString()}`;
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = `registrations_${Date.now()}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			showAlert("Export failed: " + (error instanceof Error ? error.message : String(error)), "error");
		}
	}

	async function exportSelected() {
		if (selectedRegistrations.size === 0) {
			showAlert("Please select at least one registration", "warning");
			return;
		}
		showAlert(`Exporting ${selectedRegistrations.size} selected registrations`, "info");
	}

	const deleteRegistration = async (registration: Registration) => {
		if (!confirm(t.deleteConfirm)) {
			return;
		}

		try {
			const response = await adminRegistrationsAPI.delete(registration.id);
			if (response.success) {
				showAlert(t.deleteSuccess, "success");
				closeDetailModal();
				await loadRegistrations();
			} else {
				showAlert(`${t.deleteError}: ${response.message || "Unknown error"}`, "error");
			}
		} catch (error) {
			console.error("Failed to delete registration:", error);
			showAlert(`${t.deleteError}: ${error instanceof Error ? error.message : String(error)}`, "error");
		}
	};

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
		loadRegistrations();
	}, [loadRegistrations]);

	useEffect(() => {
		setFiltered(sortedAndFiltered);
	}, [sortedAndFiltered]);

	return (
		<>
			<main>
				<AdminHeader title={t.title} />
				{/* Statistics Section */}
				<section className="my-6">
					<h3 className="mb-3 text-sm opacity-80">{t.stats}</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="flex flex-col p-4 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
							<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.total}</div>
							<div className="text-3xl font-bold">{stats.total}</div>
						</div>
						<div className="flex flex-col p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-gray-900">
							<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.confirmed}</div>
							<div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.confirmed}</div>
						</div>
						<div className="flex flex-col p-4 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-gray-900">
							<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.pending}</div>
							<div className="text-3xl font-bold text-amber-600 dark:text-amber-500">{stats.pending}</div>
						</div>
						<div className="flex flex-col p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-gray-900">
							<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.cancelled}</div>
							<div className="text-3xl font-bold text-red-600 dark:text-red-500">{stats.cancelled}</div>
						</div>
					</div>
				</section>
				<section className="flex gap-2 my-4">
					<Input type="text" placeholder={"🔍 " + t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
					<Select value={statusFilter || "all"} onValueChange={value => setStatusFilter(value === "all" ? "" : value)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder={t.allStatus} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t.allStatus}</SelectItem>
							<SelectItem value="confirmed">{t.confirmed}</SelectItem>
							<SelectItem value="pending">{t.pending}</SelectItem>
							<SelectItem value="cancelled">{t.cancelled}</SelectItem>
						</SelectContent>
					</Select>
					<Button onClick={loadRegistrations} variant="secondary">
						↻ {t.refresh}
					</Button>
					<Button onClick={syncToSheets}>📥 {t.syncSheets}</Button>
					{selectedRegistrations.size > 0 && (
						<>
							<Button onClick={exportSelected} variant="default">
								📤 {t.exportSelected} ({selectedRegistrations.size})
							</Button>
							<Button onClick={() => setSelectedRegistrations(new Set())} variant="destructive">
								✕ {t.deselectAll}
							</Button>
						</>
					)}
				</section>
				<section className="flex flex-col gap-2 mb-4">
					<label className="text-sm font-medium">{t.columns}</label>
					<div className="flex flex-wrap gap-2">
						{columnDefs.map(col => (
							<Button
								key={col.id}
								size="sm"
								variant={activeColumns.has(col.id) ? "default" : "outline"}
								onClick={() => {
									const newCols = new Set(activeColumns);
									if (newCols.has(col.id)) newCols.delete(col.id);
									else newCols.add(col.id);
									setActiveColumns(newCols);
								}}
								className={`rounded-full text-xs py-1 px-3 ${!activeColumns.has(col.id) && "opacity-50"}`}
							>
								{col.label}
							</Button>
						))}
					</div>
				</section>
				<section>
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-8">
							<PageSpinner />
							<p>{t.loading}</p>
						</div>
					) : (
						<DataTable columns={columns} data={displayData} />
					)}
				</section>
			</main>

			{/* Detail Modal */}
			<Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t.registrationDetails}</DialogTitle>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">Ticket ID</Label>
							<div className="font-mono text-sm">{selectedRegistration && ticketHashes[selectedRegistration.id]}</div>
						</div>
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">ID</Label>
							<div className="font-mono text-sm">{selectedRegistration?.id}</div>
						</div>
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">Email</Label>
							<div className="text-[0.95rem]">{selectedRegistration?.email}</div>
						</div>
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">Status</Label>
							{selectedRegistration && (
								<span
									className={`status-badge ${selectedRegistration.status === "confirmed" ? "active" : selectedRegistration.status === "pending" ? "pending" : "ended"}`}
								>
									{selectedRegistration.status}
								</span>
							)}
						</div>
						{selectedRegistration?.event && (
							<div>
								<Label className="text-xs uppercase tracking-wider opacity-70">Event</Label>
								<div className="text-[0.95rem]">{getLocalizedText(selectedRegistration.event.name, locale)}</div>
								{selectedRegistration.event.startDate && (
									<div className="text-[0.85rem] opacity-70 mt-1">
										{new Date(selectedRegistration.event.startDate).toLocaleString()} - {new Date(selectedRegistration.event.endDate).toLocaleString()}
									</div>
								)}
							</div>
						)}
						{selectedRegistration?.ticket && (
							<div>
								<Label className="text-xs uppercase tracking-wider opacity-70">Ticket</Label>
								<div className="text-[0.95rem]">{getLocalizedText(selectedRegistration.ticket.name, locale)}</div>
								{selectedRegistration.ticket.price !== undefined && <div className="text-[0.85rem] opacity-70 mt-1">Price: ${selectedRegistration.ticket.price}</div>}
							</div>
						)}
						{selectedRegistration?.referredBy && (
							<div>
								<Label className="text-xs uppercase tracking-wider opacity-70">{t.referredBy}</Label>
								<div className="font-mono text-[0.9rem]">{selectedRegistration.referredBy}</div>
							</div>
						)}
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">Created At</Label>
							<div className="text-[0.95rem]">{selectedRegistration && new Date(selectedRegistration.createdAt).toLocaleString()}</div>
						</div>
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">Updated At</Label>
							<div className="text-[0.95rem]">{selectedRegistration && new Date(selectedRegistration.updatedAt).toLocaleString()}</div>
						</div>
						{selectedRegistration?.formData && Object.keys(selectedRegistration.formData).length > 0 && (
							<div>
								<Label className="text-xs uppercase tracking-wider opacity-70 mb-2">{t.formData}</Label>
								<div className="bg-gray-900 dark:bg-gray-950 border-2 border-gray-700 dark:border-gray-800 rounded-lg p-3 font-mono text-[0.85rem]">
									{Object.entries(selectedRegistration.formData).map(([key, value]) => (
										<div key={key} className="mb-2">
											<span className="text-purple-400 dark:text-purple-300 font-semibold">{key}:</span>{" "}
											<span className="text-gray-100 dark:text-gray-200">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="flex flex-col gap-2">
						<Button
							variant="destructive"
							onClick={() => selectedRegistration && deleteRegistration(selectedRegistration)}
							className="w-full"
						>
							🗑️ {t.deleteData}
						</Button>
						<p className="text-xs opacity-60 text-center">
							⚠️{" "}
							{locale === "zh-Hant"
								? "此操作無法復原，符合個人資料保護法"
								: locale === "zh-Hans"
									? "此操作无法复原，符合個人資料保護法"
									: "This action is irreversible and complies with privacy law"}
						</p>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
