"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import PageSpinner from "@/components/PageSpinner";
import QRScanner from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI, adminRegistrationsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import generateHash from "@/lib/utils/hash";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatDateTime } from "@/lib/utils/timezone";
import type { Registration } from "@sitcontix/types";
import { Download, FileSpreadsheet, QrCode, RotateCw, Search, Trash } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { createRegistrationsColumns, type RegistrationDisplay } from "./columns";

type SortField = "id" | "email" | "status" | "createdAt";
type SortDirection = "asc" | "desc";
type RegistrationStatus = "pending" | "confirmed" | "cancelled";

type RegistrationsState = {
	registrations: Registration[];
	isLoading: boolean;
	searchTerm: string;
	statusFilter: string;
	selectedRegistrations: Set<string>;
	showDetailModal: boolean;
	selectedRegistration: Registration | null;
	ticketHashes: { [key: string]: string };
	showGoogleSheetsModal: boolean;
	googleSheetsUrl: string;
	serviceAccountEmail: string;
	isExporting: boolean;
	exportSuccess: boolean;
	isEditing: boolean;
	editedFormData: Record<string, unknown>;
	editedStatus: RegistrationStatus;
	isSaving: boolean;
	showQRScanner: boolean;
};

type RegistrationsAction =
	| { type: "patch"; patch: Partial<RegistrationsState> }
	| { type: "loadStarted" }
	| { type: "loadFinished" }
	| { type: "registrationsLoaded"; registrations: Registration[]; ticketHashes: { [key: string]: string } }
	| { type: "openDetail"; registration: Registration }
	| { type: "closeDetail" }
	| { type: "toggleEdit" }
	| { type: "registrationUpdated"; registration: Registration }
	| { type: "updateFormDataField"; key: string; value: unknown }
	| { type: "openGoogleSheets"; sheetsUrl: string; serviceAccountEmail: string }
	| { type: "exportSuccess" };

const initialRegistrationsState: RegistrationsState = {
	registrations: [],
	isLoading: false,
	searchTerm: "",
	statusFilter: "",
	selectedRegistrations: new Set(),
	showDetailModal: false,
	selectedRegistration: null,
	ticketHashes: {},
	showGoogleSheetsModal: false,
	googleSheetsUrl: "",
	serviceAccountEmail: "",
	isExporting: false,
	exportSuccess: false,
	isEditing: false,
	editedFormData: {},
	editedStatus: "pending",
	isSaving: false,
	showQRScanner: false
};

function registrationsReducer(state: RegistrationsState, action: RegistrationsAction): RegistrationsState {
	switch (action.type) {
		case "patch":
			return { ...state, ...action.patch };
		case "loadStarted":
			return { ...state, isLoading: true };
		case "loadFinished":
			return { ...state, isLoading: false };
		case "registrationsLoaded":
			return { ...state, registrations: action.registrations, ticketHashes: action.ticketHashes };
		case "openDetail":
			return {
				...state,
				selectedRegistration: action.registration,
				editedFormData: action.registration.formData || {},
				editedStatus: action.registration.status,
				isEditing: false,
				showDetailModal: true
			};
		case "closeDetail":
			return { ...state, selectedRegistration: null, isEditing: false, showDetailModal: false };
		case "toggleEdit":
			return state.isEditing && state.selectedRegistration
				? {
						...state,
						isEditing: false,
						editedFormData: state.selectedRegistration.formData || {},
						editedStatus: state.selectedRegistration.status
					}
				: { ...state, isEditing: !state.isEditing };
		case "registrationUpdated":
			return {
				...state,
				isEditing: false,
				selectedRegistration: action.registration,
				editedFormData: action.registration.formData || {}
			};
		case "updateFormDataField":
			return { ...state, editedFormData: { ...state.editedFormData, [action.key]: action.value } };
		case "openGoogleSheets":
			return {
				...state,
				exportSuccess: false,
				googleSheetsUrl: action.sheetsUrl,
				serviceAccountEmail: action.serviceAccountEmail,
				showGoogleSheetsModal: true
			};
		case "exportSuccess":
			return { ...state, exportSuccess: true };
	}
}

const registrationsTranslations = {
	title: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
	search: { "zh-Hant": "搜尋電子郵件、ID、票種、活動名稱、表單資料...", "zh-Hans": "搜索电子邮件、ID、票种、活动名称、表单资料...", en: "Search Email, ID, Ticket Type, Event Name, Form Data..." },
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
	deleteData: { "zh-Hant": "刪除報名資料", "zh-Hans": "删除报名资料", en: "Delete Registration Data" },
	deleteConfirm: {
		"zh-Hant": "確定要刪除此報名記錄嗎？\n\n此操作無法復原，將會永久刪除該筆記錄及相關資料。",
		"zh-Hans": "确定要删除此报名记录吗？\n\n此操作无法复原，将会永久删除该笔记录及相关资料。",
		en: "Are you sure you want to delete this registration data?\n\nThis action cannot be undone and will permanently delete the record and related data."
	},
	deleteSuccess: {
		"zh-Hant": "報名資料已成功刪除",
		"zh-Hans": "报名资料已成功删除",
		en: "Registration data deleted successfully."
	},
	deleteError: { "zh-Hant": "刪除失敗", "zh-Hans": "删除失败", en: "Delete failed" },
	close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
	registrationDetails: { "zh-Hant": "報名詳情", "zh-Hans": "报名详情", en: "Registration Details" },
	formData: { "zh-Hant": "表單資料", "zh-Hans": "表单资料", en: "Form Data" },
	referredBy: { "zh-Hant": "推薦人", "zh-Hans": "推荐人", en: "Referred By" },
	ticketId: { "zh-Hant": "票券 ID", "zh-Hans": "票券 ID", en: "Ticket ID" },
	id: { "zh-Hant": "ID", "zh-Hans": "ID", en: "ID" },
	email: { "zh-Hant": "Email", "zh-Hans": "Email", en: "Email" },
	event: { "zh-Hant": "活動", "zh-Hans": "活动", en: "Event" },
	ticket: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
	createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" },
	updatedAt: { "zh-Hant": "更新時間", "zh-Hans": "更新时间", en: "Updated At" },
	priceLabel: { "zh-Hant": "價格：", "zh-Hans": "价格：", en: "Price: " },
	page: { "zh-Hant": "頁", "zh-Hans": "页", en: "Page" },
	of: { "zh-Hant": "共", "zh-Hans": "共", en: "of" },
	perPage: { "zh-Hant": "每頁筆數", "zh-Hans": "每页笔数", en: "Per Page" },
	stats: { "zh-Hant": "統計", "zh-Hans": "统计", en: "Statistics" },
	exportToSheets: { "zh-Hant": "匯出到 Google Sheets", "zh-Hans": "导出到 Google Sheets", en: "Export to Google Sheets" },
	exportToSheetsTitle: { "zh-Hant": "匯出到 Google Sheets", "zh-Hans": "导出到 Google Sheets", en: "Export to Google Sheets" },
	exportToSheetsDesc: {
		"zh-Hant": "請將以下服務帳號加入您的 Google Sheets 編輯權限：",
		"zh-Hans": "请将以下服务帐号加入您的 Google Sheets 编辑权限：",
		en: "Please invite the following service account to your Google Sheets:"
	},
	sheetsUrlLabel: { "zh-Hant": "Sheets URL", "zh-Hans": "Sheets URL", en: "Sheets URL" },
	openSheets: { "zh-Hant": "開啟 Sheets", "zh-Hans": "打开 Sheets", en: "Open Sheets" },
	confirm: { "zh-Hant": "確認", "zh-Hans": "确认", en: "Confirm" },
	exporting: { "zh-Hant": "匯出中...", "zh-Hans": "导出中...", en: "Exporting..." },
	exportSuccessMsg: { "zh-Hant": "成功匯出到 Google Sheets", "zh-Hans": "成功导出到 Google Sheets", en: "Successfully exported to Google Sheets" },
	exportErrorMsg: { "zh-Hant": "匯出失敗", "zh-Hans": "导出失败", en: "Export failed" },
	noEventSelected: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Please select an event first" },
	edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
	save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
	cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
	saving: { "zh-Hant": "儲存中...", "zh-Hans": "保存中...", en: "Saving..." },
	saveSuccess: { "zh-Hant": "報名資料已成功更新", "zh-Hans": "报名资料已成功更新", en: "Registration updated successfully" },
	saveError: { "zh-Hant": "更新失敗", "zh-Hans": "更新失败", en: "Update failed" },
	scanQR: { "zh-Hant": "掃描 QR Code", "zh-Hans": "扫描 QR Code", en: "Scan QR Code" },
	scanQRTitle: { "zh-Hant": "掃描報名 QR Code", "zh-Hans": "扫描报名 QR Code", en: "Scan Registration QR Code" },
	registrationNotFound: { "zh-Hant": "找不到報名資料", "zh-Hans": "找不到报名资料", en: "Registration not found" },
	registrationFound: { "zh-Hant": "已找到報名資料", "zh-Hans": "已找到报名资料", en: "Registration found" }
};

function RegistrationsStats({ stats, t }: { stats: { total: number; confirmed: number; pending: number; cancelled: number }; t: Record<string, string> }) {
	return (
		<section className="my-6">
			<h3 className="mb-3 text-sm opacity-80">{t.stats}</h3>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="flex flex-col p-4 rounded-lg border-2 border-gray-800 dark:border-gray-300 dark:bg-gray-900">
					<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.total}</div>
					<div className="text-3xl font-bold">{stats.total}</div>
				</div>
				<div className="flex flex-col p-4 rounded-lg border-2 border-gray-500 dark:bg-gray-900">
					<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.confirmed}</div>
					<div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.confirmed}</div>
				</div>
				<div className="flex flex-col p-4 rounded-lg border-2 border-gray-500 dark:bg-gray-900">
					<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.pending}</div>
					<div className="text-3xl font-bold text-amber-600 dark:text-amber-500">{stats.pending}</div>
				</div>
				<div className="flex flex-col p-4 rounded-lg border-2 border-gray-500 dark:bg-gray-900">
					<div className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.cancelled}</div>
					<div className="text-3xl font-bold text-red-600 dark:text-red-500">{stats.cancelled}</div>
				</div>
			</div>
		</section>
	);
}

function RegistrationsToolbar({
	searchTerm,
	statusFilter,
	selectedCount,
	t,
	dispatch,
	onRefresh,
	onExportCsv,
	onExportSheets,
	onExportSelected
}: {
	searchTerm: string;
	statusFilter: string;
	selectedCount: number;
	t: Record<string, string>;
	dispatch: React.Dispatch<RegistrationsAction>;
	onRefresh: () => void;
	onExportCsv: () => void;
	onExportSheets: () => void;
	onExportSelected: () => void;
}) {
	return (
		<section className="flex gap-2 my-4">
			<div className="relative w-fit">
				<Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
				<Input type="text" placeholder={t.search} value={searchTerm} onChange={e => dispatch({ type: "patch", patch: { searchTerm: e.target.value } })} className="pl-10 h-11" />
			</div>
			<Select value={statusFilter || "all"} onValueChange={value => dispatch({ type: "patch", patch: { statusFilter: value === "all" ? "" : value } })}>
				<SelectTrigger className="w-[180px] min-h-11">
					<SelectValue placeholder={t.allStatus} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t.allStatus}</SelectItem>
					<SelectItem value="confirmed">{t.confirmed}</SelectItem>
					<SelectItem value="pending">{t.pending}</SelectItem>
					<SelectItem value="cancelled">{t.cancelled}</SelectItem>
				</SelectContent>
			</Select>
			<Button onClick={() => dispatch({ type: "patch", patch: { showQRScanner: true } })} variant="default">
				<QrCode /> {t.scanQR}
			</Button>
			<Button onClick={onRefresh} variant="secondary">
				<RotateCw /> {t.refresh}
			</Button>
			<Button onClick={onExportCsv} variant="secondary">
				<Download /> {t.syncSheets}
			</Button>
			<Button onClick={onExportSheets} variant="secondary">
				<FileSpreadsheet /> {t.exportToSheets}
			</Button>
			{selectedCount > 0 && (
				<>
					<Button onClick={onExportSelected} variant="default">
						<Download /> {t.exportSelected} ({selectedCount})
					</Button>
					<Button onClick={() => dispatch({ type: "patch", patch: { selectedRegistrations: new Set() } })} variant="destructive">
						x {t.deselectAll}
					</Button>
				</>
			)}
		</section>
	);
}

function RegistrationsTable({ isLoading, columns, data, t }: { isLoading: boolean; columns: ReturnType<typeof createRegistrationsColumns>; data: RegistrationDisplay[]; t: Record<string, string> }) {
	return (
		<section>
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-8">
					<PageSpinner />
					<p>{t.loading}</p>
				</div>
			) : (
				<DataTable columns={columns} data={data} />
			)}
		</section>
	);
}

function RegistrationDetailDialog({
	state,
	locale,
	t,
	dispatch,
	onToggleEdit,
	onUpdateField,
	onSave,
	onDelete
}: {
	state: Pick<RegistrationsState, "showDetailModal" | "selectedRegistration" | "ticketHashes" | "isEditing" | "editedStatus" | "editedFormData" | "isSaving">;
	locale: string;
	t: Record<string, string>;
	dispatch: React.Dispatch<RegistrationsAction>;
	onToggleEdit: () => void;
	onUpdateField: (key: string, value: unknown) => void;
	onSave: () => void;
	onDelete: (registration: Registration) => void;
}) {
	const { showDetailModal, selectedRegistration, ticketHashes, isEditing, editedStatus, editedFormData, isSaving } = state;

	return (
		<Dialog open={showDetailModal} onOpenChange={value => dispatch({ type: "patch", patch: { showDetailModal: value } })}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>{t.registrationDetails}</span>
						{!isEditing && (
							<Button size="sm" variant="outline" onClick={onToggleEdit}>
								{t.edit}
							</Button>
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div>
						<Label className="text-xs uppercase tracking-wider opacity-70">{t.ticketId}</Label>
						<div className="font-mono text-sm break-all">{selectedRegistration && ticketHashes[selectedRegistration.id]}</div>
					</div>
					<div>
						<Label className="text-xs uppercase tracking-wider opacity-70">{t.id}</Label>
						<div className="font-mono text-sm break-all">{selectedRegistration?.id}</div>
					</div>
					<div>
						<Label className="text-xs uppercase tracking-wider opacity-70">{t.email}</Label>
						<div className="text-[0.95rem] break-all">{selectedRegistration?.email}</div>
					</div>
					<div>
						<Label className="text-xs uppercase tracking-wider opacity-70">Status</Label>
						{isEditing ? (
							<Select value={editedStatus} onValueChange={value => dispatch({ type: "patch", patch: { editedStatus: value as RegistrationStatus } })}>
								<SelectTrigger className="w-[180px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">{t.pending}</SelectItem>
									<SelectItem value="confirmed">{t.confirmed}</SelectItem>
									<SelectItem value="cancelled">{t.cancelled}</SelectItem>
								</SelectContent>
							</Select>
						) : (
							selectedRegistration && (
								<span className={`status-badge ${selectedRegistration.status === "confirmed" ? "active" : selectedRegistration.status === "pending" ? "pending" : "ended"}`}>
									{selectedRegistration.status}
								</span>
							)
						)}
					</div>
					{selectedRegistration?.event && (
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">{t.event}</Label>
							<div className="text-[0.95rem]">{getLocalizedText(selectedRegistration.event.name, locale)}</div>
							{selectedRegistration.event.startDate && (
								<div className="text-[0.85rem] opacity-70 mt-1">
									{formatDateTime(selectedRegistration.event.startDate)} - {formatDateTime(selectedRegistration.event.endDate)}
								</div>
							)}
						</div>
					)}
					{selectedRegistration?.ticket && (
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">{t.ticket}</Label>
							<div className="text-[0.95rem]">{getLocalizedText(selectedRegistration.ticket.name, locale)}</div>
							{selectedRegistration.ticket.price !== undefined && (
								<div className="text-[0.85rem] opacity-70 mt-1">
									{t.priceLabel}${selectedRegistration.ticket.price}
								</div>
							)}
						</div>
					)}
					{selectedRegistration?.referredBy && (
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70">{t.referredBy}</Label>
							<div className="font-mono text-[0.9rem]">{selectedRegistration.referredBy}</div>
						</div>
					)}
					<div>
						<Label className="text-xs uppercase tracking-wider opacity-70">{t.createdAt}</Label>
						<div className="text-[0.95rem]">{selectedRegistration && formatDateTime(selectedRegistration.createdAt)}</div>
					</div>
					<div>
						<Label className="text-xs uppercase tracking-wider opacity-70">{t.updatedAt}</Label>
						<div className="text-[0.95rem]">{selectedRegistration && formatDateTime(selectedRegistration.updatedAt)}</div>
					</div>
					{selectedRegistration?.formData && Object.keys(selectedRegistration.formData).length > 0 && (
						<div>
							<Label className="text-xs uppercase tracking-wider opacity-70 mb-2">{t.formData}</Label>
							{isEditing ? (
								<div className="space-y-3">
									{Object.entries(editedFormData).map(([key, value]) => (
										<div key={key}>
											<Label className="text-sm mb-1 block">{key}</Label>
											<Input
												value={typeof value === "object" ? JSON.stringify(value) : String(value)}
												onChange={e => {
													try {
														const newValue = e.target.value;
														if (newValue.startsWith("{") || newValue.startsWith("[")) {
															onUpdateField(key, JSON.parse(newValue));
														} else {
															onUpdateField(key, newValue);
														}
													} catch {
														onUpdateField(key, e.target.value);
													}
												}}
											/>
										</div>
									))}
								</div>
							) : (
								<div className="bg-gray-900 dark:bg-gray-950 border-2 border-gray-700 dark:border-gray-800 rounded-lg p-3 font-mono text-[0.85rem]">
									{Object.entries(selectedRegistration.formData).map(([key, value]) => (
										<div key={key} className="mb-2">
											<span className="text-purple-400 dark:text-purple-300 font-semibold">{key}:</span>{" "}
											<span className="text-gray-100 dark:text-gray-200">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="flex flex-col gap-2 sm:flex-col">
					{isEditing ? (
						<div className="flex gap-2 w-full">
							<Button variant="outline" onClick={onToggleEdit} className="flex-1" disabled={isSaving}>
								{t.cancel}
							</Button>
							<Button variant="default" onClick={onSave} className="flex-1" disabled={isSaving}>
								{isSaving ? t.saving : t.save}
							</Button>
						</div>
					) : (
						<Button variant="destructive" onClick={() => selectedRegistration && onDelete(selectedRegistration)} className="w-full whitespace-normal h-auto py-2">
							<Trash /> {t.deleteData}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function GoogleSheetsExportDialog({
	state,
	t,
	dispatch,
	onExport
}: {
	state: Pick<RegistrationsState, "showGoogleSheetsModal" | "googleSheetsUrl" | "serviceAccountEmail" | "isExporting" | "exportSuccess">;
	t: Record<string, string>;
	dispatch: React.Dispatch<RegistrationsAction>;
	onExport: () => void;
}) {
	const { showGoogleSheetsModal, googleSheetsUrl, serviceAccountEmail, isExporting, exportSuccess } = state;
	const openSheet = () => {
		if (googleSheetsUrl) window.open(googleSheetsUrl, "_blank");
	};

	return (
		<Dialog open={showGoogleSheetsModal} onOpenChange={value => dispatch({ type: "patch", patch: { showGoogleSheetsModal: value } })}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t.exportToSheetsTitle}</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div>
						<p className="text-sm mb-2">{t.exportToSheetsDesc}</p>
						<div className="bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg p-3 font-mono text-sm break-all">{serviceAccountEmail || "Loading..."}</div>
					</div>

					<div>
						<Label htmlFor="sheetsUrl" className="text-sm font-medium mb-2">
							{t.sheetsUrlLabel}
						</Label>
						<Input
							id="sheetsUrl"
							type="url"
							placeholder="https://docs.google.com/spreadsheets/d/..."
							value={googleSheetsUrl}
							onChange={e => dispatch({ type: "patch", patch: { googleSheetsUrl: e.target.value } })}
							disabled={isExporting}
						/>
					</div>

					{exportSuccess && <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">✅ {t.exportSuccessMsg}</div>}
				</div>

				<DialogFooter className="flex flex-row gap-2 justify-end">
					{exportSuccess ? (
						<>
							<Button variant="secondary" onClick={() => dispatch({ type: "patch", patch: { showGoogleSheetsModal: false } })}>
								{t.close}
							</Button>
							<Button variant="default" onClick={openSheet}>
								{t.openSheets}
							</Button>
						</>
					) : (
						<>
							<Button variant="secondary" onClick={openSheet} disabled={!googleSheetsUrl || isExporting}>
								{t.openSheets}
							</Button>
							<Button variant="default" onClick={onExport} disabled={isExporting || !googleSheetsUrl}>
								{isExporting ? t.exporting : t.confirm}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function useRegistrationsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [state, dispatch] = useReducer(registrationsReducer, initialRegistrationsState);
	const { registrations, isLoading, searchTerm, statusFilter, selectedRegistrations, showQRScanner } = state;
	const currentEventId = useSelectedEventId();
	const sortField = "createdAt" as SortField;
	const sortDirection = "desc" as SortDirection;

	const t = getTranslations(locale, registrationsTranslations);

	const columnDefs = [
		{ id: "id", label: "ID", accessor: (r: Registration) => r.id.slice(0, 8) + "...", sortable: true },
		{ id: "email", label: "Email", accessor: (r: Registration) => r.email, sortable: true },
		{ id: "status", label: "Status", accessor: (r: Registration) => r.status, sortable: true },
		{ id: "ticket", label: "Ticket", accessor: (r: Registration) => getLocalizedText(r.ticket?.name, locale) || r.ticketId || "", sortable: false },
		{ id: "event", label: "Event", accessor: (r: Registration) => getLocalizedText(r.event?.name, locale) || r.eventId || "", sortable: false },
		{ id: "referredBy", label: "Referred By", accessor: (r: Registration) => (r.referredBy ? r.referredBy.slice(0, 8) + "..." : "-"), sortable: false },
		{ id: "createdAt", label: "Created", accessor: (r: Registration) => (r.createdAt ? formatDateTime(r.createdAt) : ""), sortable: true },
		{ id: "updatedAt", label: "Updated", accessor: (r: Registration) => (r.updatedAt ? formatDateTime(r.updatedAt) : ""), sortable: false }
	];

	const loadRegistrations = useCallback(async () => {
		if (!currentEventId) return;

		dispatch({ type: "loadStarted" });
		try {
			const params: { limit: number; status?: "pending" | "confirmed" | "cancelled"; eventId?: string } = {
				limit: 9999,
				eventId: currentEventId
			};
			if (statusFilter) params.status = statusFilter as "pending" | "confirmed" | "cancelled";

			const response = await adminRegistrationsAPI.getAll(params);
			if (response.success) {
				const registrations = response.data || [];

				const hashPromises = registrations.map(r => generateHash(r.id, r.createdAt).then(hash => ({ id: r.id, hash })));
				const hashes = await Promise.all(hashPromises);
				const hashMap: { [key: string]: string } = {};
				hashes.forEach(h => {
					hashMap[h.id] = h.hash;
				});
				dispatch({ type: "registrationsLoaded", registrations, ticketHashes: hashMap });
			}
		} catch (error) {
			console.error("Failed to load registrations:", error);
		} finally {
			dispatch({ type: "loadFinished" });
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

	const displayData = useMemo((): RegistrationDisplay[] => {
		return sortedAndFiltered.map(r => ({
			...r,
			displayId: r.id.slice(0, 8) + "...",
			displayTicket: getLocalizedText(r.ticket?.name, locale) || r.ticketId || "",
			displayEvent: getLocalizedText(r.event?.name, locale) || r.eventId || "",
			displayReferredBy: (r as any).referrer?.email || (r.referredBy ? r.referredBy.slice(0, 8) + "..." : "-"),
			formattedCreatedAt: r.createdAt ? formatDateTime(r.createdAt) : "",
			formattedUpdatedAt: r.updatedAt ? formatDateTime(r.updatedAt) : "",
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

	function openDetailModal(registration: Registration) {
		dispatch({ type: "openDetail", registration });
	}

	function closeDetailModal() {
		dispatch({ type: "closeDetail" });
	}

	function toggleEditMode() {
		dispatch({ type: "toggleEdit" });
	}

	async function saveChanges() {
		const selectedRegistration = state.selectedRegistration;
		if (!selectedRegistration) return;

		dispatch({ type: "patch", patch: { isSaving: true } });
		try {
			const response = await adminRegistrationsAPI.update(selectedRegistration.id, {
				formData: state.editedFormData,
				status: state.editedStatus
			});

			if (response.success) {
				showAlert(t.saveSuccess, "success");
				await loadRegistrations();
				// Update the selected registration with new data
				if (response.data) {
					// Parse formData if it's a string
					const updatedRegistration = {
						...response.data,
						formData: typeof response.data.formData === "string" ? JSON.parse(response.data.formData) : response.data.formData
					};
					dispatch({ type: "registrationUpdated", registration: updatedRegistration });
				}
			} else {
				showAlert(`${t.saveError}: ${response.message || "Unknown error"}`, "error");
			}
		} catch (error) {
			console.error("Failed to update registration:", error);
			showAlert(`${t.saveError}: ${error instanceof Error ? error.message : String(error)}`, "error");
		} finally {
			dispatch({ type: "patch", patch: { isSaving: false } });
		}
	}

	function updateFormDataField(key: string, value: unknown) {
		dispatch({ type: "updateFormDataField", key, value });
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

	async function openGoogleSheetsExport() {
		if (!currentEventId) {
			showAlert(t.noEventSelected, "warning");
			return;
		}

		const fetchPromises = [
			adminEventsAPI
				.getById(currentEventId)
				.then(eventResponse => {
					if (eventResponse.success && eventResponse.data?.googleSheetsUrl) {
						return eventResponse.data.googleSheetsUrl;
					}
					return "";
				})
				.catch(error => {
					console.error("Failed to load event data:", error);
					return "";
				}),
			adminRegistrationsAPI
				.getServiceAccountEmail()
				.then(response => {
					if (response.success && response.data) {
						return response.data.email;
					}
					return "";
				})
				.catch(error => {
					console.error("Failed to get service account email:", error);
					return "";
				})
		];

		const [sheetsUrl, email] = await Promise.all(fetchPromises);

		dispatch({ type: "openGoogleSheets", sheetsUrl, serviceAccountEmail: email });
	}

	async function exportToGoogleSheets() {
		if (!currentEventId) {
			showAlert(t.noEventSelected, "warning");
			return;
		}

		if (!state.googleSheetsUrl.trim()) {
			showAlert("Please enter a Google Sheets URL", "warning");
			return;
		}

		dispatch({ type: "patch", patch: { isExporting: true } });
		try {
			const response = await adminRegistrationsAPI.syncToGoogleSheets({
				eventId: currentEventId,
				sheetsUrl: state.googleSheetsUrl
			});

			if (response.success) {
				showAlert(response.message || t.exportSuccessMsg, "success");
				dispatch({ type: "exportSuccess" });
			} else {
				showAlert(response.message || t.exportErrorMsg, "error");
			}
		} catch (error) {
			console.error("Failed to export to Google Sheets:", error);
			showAlert(`${t.exportErrorMsg}: ${error instanceof Error ? error.message : String(error)}`, "error");
		} finally {
			dispatch({ type: "patch", patch: { isExporting: false } });
		}
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

	const handleQRScan = async (scannedHash: string) => {
		try {
			const registrationHashes = await Promise.all(
				registrations.map(async registration => ({
					registration,
					hash: await generateHash(registration.id, registration.createdAt)
				}))
			);
			const foundRegistration = registrationHashes.find(item => item.hash === scannedHash)?.registration ?? null;

			if (foundRegistration) {
				showAlert(t.registrationFound, "success");
				openDetailModal(foundRegistration);
			} else {
				showAlert(t.registrationNotFound, "error");
			}
		} catch (error) {
			console.error("Failed to process QR code:", error);
			showAlert(`Error: ${error instanceof Error ? error.message : String(error)}`, "error");
		}
	};

	useEffect(() => {
		loadRegistrations();
	}, [loadRegistrations]);

	return {
		columns,
		deleteRegistration,
		dispatch,
		displayData,
		exportSelected,
		exportToGoogleSheets,
		handleQRScan,
		isLoading,
		loadRegistrations,
		locale,
		openGoogleSheetsExport,
		saveChanges,
		searchTerm,
		selectedCount: selectedRegistrations.size,
		showQRScanner,
		state,
		stats,
		statusFilter,
		syncToSheets,
		t,
		toggleEditMode,
		updateFormDataField
	};
}

export default function RegistrationsPage() {
	const {
		columns,
		deleteRegistration,
		dispatch,
		displayData,
		exportSelected,
		exportToGoogleSheets,
		handleQRScan,
		isLoading,
		loadRegistrations,
		locale,
		openGoogleSheetsExport,
		saveChanges,
		searchTerm,
		selectedCount,
		showQRScanner,
		state,
		stats,
		statusFilter,
		syncToSheets,
		t,
		toggleEditMode,
		updateFormDataField
	} = useRegistrationsPage();

	return (
		<>
			<main>
				<AdminHeader title={t.title} />
				<RegistrationsStats stats={stats} t={t} />
				<RegistrationsToolbar
					searchTerm={searchTerm}
					statusFilter={statusFilter}
					selectedCount={selectedCount}
					t={t}
					dispatch={dispatch}
					onRefresh={loadRegistrations}
					onExportCsv={syncToSheets}
					onExportSheets={openGoogleSheetsExport}
					onExportSelected={exportSelected}
				/>
				<RegistrationsTable isLoading={isLoading} columns={columns} data={displayData} t={t} />
			</main>

			<RegistrationDetailDialog
				state={state}
				locale={locale}
				t={t}
				dispatch={dispatch}
				onToggleEdit={toggleEditMode}
				onUpdateField={updateFormDataField}
				onSave={saveChanges}
				onDelete={deleteRegistration}
			/>
			<GoogleSheetsExportDialog state={state} t={t} dispatch={dispatch} onExport={exportToGoogleSheets} />

			{/* QR Scanner Modal */}
			<QRScanner isOpen={showQRScanner} onClose={() => dispatch({ type: "patch", patch: { showQRScanner: false } })} onScan={handleQRScan} title={t.scanQRTitle} />
		</>
	);
}
