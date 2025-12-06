"use client";

import PageSpinner from "@/components/PageSpinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminRegistrationsAPI } from "@/lib/api/endpoints";
import type { Registration } from "@/lib/types/api";
import generateHash from "@/lib/utils/hash";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

type SortField = "id" | "email" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

export default function RegistrationsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [filtered, setFiltered] = useState<Registration[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [activeColumns, setActiveColumns] = useState(new Set(["email", "status", "ticket", "event", "createdAt"]));
	const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);
	const [ticketHashes, setTicketHashes] = useState<{ [key: string]: string }>({});

	const t = getTranslations(locale, {
		title: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
		search: { "zh-Hant": "搜尋電子郵件、ID", "zh-Hans": "搜索电子邮件、ID", en: "Search Email, ID" },
		allStatus: { "zh-Hant": "全部狀態", "zh-Hans": "全部状态", en: "All statuses" },
		confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
		pending: { "zh-Hant": "待處理", "zh-Hans": "待处理", en: "Pending" },
		cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
		cancel: { "zh-Hant": "取消報名", "zh-Hans": "取消报名", en: "Cancel Registration" },
		cancelConfirm: {
			"zh-Hant": "確定要取消並刪除此報名嗎？將同時寄出通知電子郵件與簡訊。",
			"zh-Hans": "确定要取消并删除此报名吗？将同时寄出通知电子邮件与短信。",
			en: "Are you sure you want to cancel and delete this registration? A notification email and SMS will be sent."
		},
		cancelSuccess: { "zh-Hant": "報名已取消並刪除，已嘗試寄送通知", "zh-Hans": "报名已取消并删除，已尝试寄送通知", en: "Registration cancelled and deleted; notification attempted." },
		cancelError: { "zh-Hant": "取消報名失敗", "zh-Hans": "取消报名失败", en: "Cancellation failed" },
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

	const paginatedData = useMemo(() => {
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		return sortedAndFiltered.slice(start, end);
	}, [sortedAndFiltered, page, pageSize]);

	const totalPages = Math.ceil(sortedAndFiltered.length / pageSize);

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	}

	function toggleSelectAll() {
		if (selectedRegistrations.size === paginatedData.length) {
			setSelectedRegistrations(new Set());
		} else {
			setSelectedRegistrations(new Set(paginatedData.map(r => r.id)));
		}
	}

	function toggleSelect(id: string) {
		const newSet = new Set(selectedRegistrations);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedRegistrations(newSet);
	}

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

	const cancelRegistration = async (registration: Registration) => {
		if (!confirm(t.cancelConfirm)) {
			return;
		}

		try {
			const response = await adminRegistrationsAPI.cancel(registration.id);
			if (response.success) {
				showAlert(t.cancelSuccess, "success");
				closeDetailModal();
				await loadRegistrations();
			} else {
				showAlert(`${t.cancelError}: ${response.message || "Unknown error"}`, "error");
			}
		} catch (error) {
			console.error("Failed to cancel registration:", error);
			showAlert(`${t.cancelError}: ${error instanceof Error ? error.message : String(error)}`, "error");
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
				<h1 className="text-3xl font-bold">{t.title}</h1>
				<div className="h-8" />

				{/* Statistics Section */}
				<section style={{ margin: "1.5rem 0" }}>
					<h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", opacity: 0.8 }}>{t.stats}</h3>
					<div className="admin-stats-grid">
						<div className="admin-stat-card">
							<div className="admin-stat-label">{t.total}</div>
							<div className="admin-stat-value">{stats.total}</div>
						</div>
						<div className="admin-stat-card" style={{ borderColor: "#22c55e" }}>
							<div className="admin-stat-label">{t.confirmed}</div>
							<div className="admin-stat-value" style={{ color: "#22c55e" }}>
								{stats.confirmed}
							</div>
						</div>
						<div className="admin-stat-card" style={{ borderColor: "#f59e0b" }}>
							<div className="admin-stat-label">{t.pending}</div>
							<div className="admin-stat-value" style={{ color: "#f59e0b" }}>
								{stats.pending}
							</div>
						</div>
						<div className="admin-stat-card" style={{ borderColor: "#ef4444" }}>
							<div className="admin-stat-label">{t.cancelled}</div>
							<div className="admin-stat-value" style={{ color: "#ef4444" }}>
								{stats.cancelled}
							</div>
						</div>
					</div>
				</section>

				<section className="admin-controls" style={{ margin: "1rem 0" }}>
					<input type="text" placeholder={"🔍 " + t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-input" />
					<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
						<option value="">{t.allStatus}</option>
						<option value="confirmed">{t.confirmed}</option>
						<option value="pending">{t.pending}</option>
						<option value="cancelled">{t.cancelled}</option>
					</select>
					<button onClick={loadRegistrations} className="admin-button secondary">
						↻ {t.refresh}
					</button>
					<button onClick={syncToSheets} className="admin-button primary">
						📥 {t.syncSheets}
					</button>
					{selectedRegistrations.size > 0 && (
						<>
							<button onClick={exportSelected} className="admin-button success">
								📤 {t.exportSelected} ({selectedRegistrations.size})
							</button>
							<button onClick={() => setSelectedRegistrations(new Set())} className="admin-button danger">
								✕ {t.deselectAll}
							</button>
						</>
					)}
				</section>

				<section className="admin-controls" style={{ marginBottom: "1rem" }}>
					<label style={{ fontSize: "0.9rem", fontWeight: 500 }}>{t.columns}</label>
					<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
						{columnDefs.map(col => (
							<button
								key={col.id}
								data-on={activeColumns.has(col.id) ? "true" : "false"}
								onClick={() => {
									const newCols = new Set(activeColumns);
									if (newCols.has(col.id)) newCols.delete(col.id);
									else newCols.add(col.id);
									setActiveColumns(newCols);
								}}
								className="admin-button small"
								style={{
									background: activeColumns.has(col.id) ? "var(--color-gray-600)" : "var(--color-gray-800)",
									borderRadius: "999px",
									opacity: activeColumns.has(col.id) ? 1 : 0.5,
									fontSize: "0.7rem",
									padding: "0.3rem 0.7rem"
								}}
							>
								{col.label}
							</button>
						))}
					</div>
				</section>

				<section>
					<div className="admin-table-container">
						{isLoading && (
							<div className="admin-loading">
								<PageSpinner size={48} />
								<p>{t.loading}</p>
							</div>
						)}
						{!isLoading && filtered.length === 0 && <div className="admin-empty">{t.empty}</div>}
						{!isLoading && filtered.length > 0 && (
							<table className="admin-table">
								<thead>
									<tr>
										<th style={{ width: "40px", textAlign: "center" }}>
											<input type="checkbox" checked={selectedRegistrations.size === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
										</th>
										{[...activeColumns].map(cid => {
											const col = columnDefs.find(c => c.id === cid);
											return col ? (
												<th
													key={cid}
													onClick={() => col.sortable && handleSort(cid as SortField)}
													style={{
														cursor: col.sortable ? "pointer" : "default",
														userSelect: "none"
													}}
												>
													{col.label}
													{col.sortable && sortField === cid && <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>}
												</th>
											) : null;
										})}
										<th style={{ width: "100px", textAlign: "center" }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{paginatedData.map(r => (
										<tr
											key={r.id}
											style={{
												backgroundColor: selectedRegistrations.has(r.id) ? "var(--color-gray-750)" : "transparent"
											}}
										>
											<td style={{ textAlign: "center" }}>
												<input type="checkbox" checked={selectedRegistrations.has(r.id)} onChange={() => toggleSelect(r.id)} style={{ cursor: "pointer" }} />
											</td>
											{[...activeColumns].map(cid => {
												const col = columnDefs.find(c => c.id === cid);
												if (!col) return null;
												const val = col.accessor(r);
												const statusClass = r.status === "confirmed" ? "active" : r.status === "pending" ? "pending" : r.status === "cancelled" ? "ended" : "";
												return <td key={cid}>{cid === "status" ? <span className={`status-badge ${statusClass}`}>{val}</span> : <div className="admin-truncate">{val}</div>}</td>;
											})}
											<td style={{ textAlign: "center" }}>
												<button onClick={() => openDetailModal(r)} className="admin-button small primary">
													👁 {t.viewDetails}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</section>

				{/* Pagination Section */}
				<section>
					<div
						style={{
							margin: "1rem 0",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: "0.75rem"
						}}
					>
						<div style={{ fontSize: "0.85rem", opacity: "0.75" }}>
							{sortedAndFiltered.length} {t.total} {selectedRegistrations.size > 0 && `• ${selectedRegistrations.size} ${t.selected}`}
						</div>
						{totalPages > 1 && (
							<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
								<button
									onClick={() => setPage(Math.max(1, page - 1))}
									disabled={page === 1}
									className="admin-button small secondary"
									style={{
										opacity: page === 1 ? 0.5 : 1,
										cursor: page === 1 ? "not-allowed" : "pointer"
									}}
								>
									←
								</button>
								<span style={{ fontSize: "0.85rem" }}>
									{t.page} {page} {t.of} {totalPages}
								</span>
								<button
									onClick={() => setPage(Math.min(totalPages, page + 1))}
									disabled={page === totalPages}
									className="admin-button small secondary"
									style={{
										opacity: page === totalPages ? 0.5 : 1,
										cursor: page === totalPages ? "not-allowed" : "pointer"
									}}
								>
									→
								</button>
								<select
									value={pageSize}
									onChange={e => {
										setPageSize(Number(e.target.value));
										setPage(1);
									}}
									className="admin-select"
									style={{
										padding: "0.35rem 0.7rem",
										fontSize: "0.75rem",
										marginLeft: "0.5rem"
									}}
								>
									<option value="25">25 {t.perPage}</option>
									<option value="50">50 {t.perPage}</option>
									<option value="100">100 {t.perPage}</option>
									<option value="200">200 {t.perPage}</option>
								</select>
							</div>
						)}
					</div>
				</section>
			</main>

			{/* Detail Modal */}
			{showDetailModal && selectedRegistration && (
				<div className="admin-modal-overlay" onClick={closeDetailModal}>
					<div className="admin-modal" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{t.registrationDetails}</h2>
							<button className="admin-modal-close" onClick={closeDetailModal}>
								✕
							</button>
						</div>

						<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
							<div>
								<div className="admin-stat-label">Ticket ID</div>
								<div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>{ticketHashes[selectedRegistration.id]}</div>
							</div>

							<div>
								<div className="admin-stat-label">ID</div>
								<div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>{selectedRegistration.id}</div>
							</div>

							<div>
								<div className="admin-stat-label">Email</div>
								<div style={{ fontSize: "0.95rem" }}>{selectedRegistration.email}</div>
							</div>

							<div>
								<div className="admin-stat-label">Status</div>
								<span className={`status-badge ${selectedRegistration.status === "confirmed" ? "active" : selectedRegistration.status === "pending" ? "pending" : "ended"}`}>
									{selectedRegistration.status}
								</span>
							</div>

							{selectedRegistration.event && (
								<div>
									<div className="admin-stat-label">Event</div>
									<div style={{ fontSize: "0.95rem" }}>{getLocalizedText(selectedRegistration.event.name, locale)}</div>
									{selectedRegistration.event.startDate && (
										<div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
											{new Date(selectedRegistration.event.startDate).toLocaleString()} - {new Date(selectedRegistration.event.endDate).toLocaleString()}
										</div>
									)}
								</div>
							)}

							{selectedRegistration.ticket && (
								<div>
									<div className="admin-stat-label">Ticket</div>
									<div style={{ fontSize: "0.95rem" }}>{getLocalizedText(selectedRegistration.ticket.name, locale)}</div>
									{selectedRegistration.ticket.price !== undefined && <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>Price: ${selectedRegistration.ticket.price}</div>}
								</div>
							)}

							{selectedRegistration.referredBy && (
								<div>
									<div className="admin-stat-label">{t.referredBy}</div>
									<div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>{selectedRegistration.referredBy}</div>
								</div>
							)}

							<div>
								<div className="admin-stat-label">Created At</div>
								<div style={{ fontSize: "0.95rem" }}>{new Date(selectedRegistration.createdAt).toLocaleString()}</div>
							</div>

							<div>
								<div className="admin-stat-label">Updated At</div>
								<div style={{ fontSize: "0.95rem" }}>{new Date(selectedRegistration.updatedAt).toLocaleString()}</div>
							</div>

							{selectedRegistration.formData && Object.keys(selectedRegistration.formData).length > 0 && (
								<div>
									<div className="admin-stat-label" style={{ marginBottom: "0.5rem" }}>
										{t.formData}
									</div>
									<div
										style={{
											backgroundColor: "var(--color-gray-900)",
											border: "2px solid var(--color-gray-700)",
											borderRadius: "8px",
											padding: "0.75rem",
											fontFamily: "monospace",
											fontSize: "0.85rem"
										}}
									>
										{Object.entries(selectedRegistration.formData).map(([key, value]) => (
											<div key={key} style={{ marginBottom: "0.5rem" }}>
												<span style={{ color: "#a78bfa", fontWeight: 600 }}>{key}:</span>{" "}
												<span style={{ color: "var(--color-gray-100)" }}>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Delete Personal Data Button */}
							<div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "2px solid var(--color-gray-700)" }}>
								<button onClick={() => cancelRegistration(selectedRegistration)} className="admin-button secondary" style={{ width: "100%", marginBottom: "0.5rem" }}>
									✕ {t.cancel}
								</button>
								<button onClick={() => deleteRegistration(selectedRegistration)} className="admin-button danger" style={{ width: "100%" }}>
									🗑️ {t.deleteData}
								</button>
								<p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.5rem", textAlign: "center" }}>
									⚠️{" "}
									{locale === "zh-Hant"
										? "此操作無法復原，符合個人資料保護法"
										: locale === "zh-Hans"
											? "此操作无法复原，符合个人资料保护法"
											: "This action is irreversible and complies with privacy law"}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
