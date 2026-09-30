"use client";

import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminInvitationCodesAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatDateTime } from "@/lib/utils/timezone";
import type { InvitationCode, Ticket } from "@sitcontix/types";
import type { RowSelectionState } from "@tanstack/react-table";
import { Ban, Copy, Download, FileDown, Mail, Plus, Ticket as TicketIcon, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createInvitesColumns } from "./columns";
import { CreateCodesDialog } from "./CreateCodesDialog";
import { copyText, downloadFile, errorMessage, runInChunks, toCsv, toInviteRow, type InviteRow } from "./lib";
import { SendEmailDialog } from "./SendEmailDialog";

type StatusFilter = "all" | "unused" | "used" | "expired" | "disabled";

const allValue = "__all__";
const noGroupValue = "__none__";

function useInvitesTranslations(locale: string) {
	return useMemo(
		() =>
			getTranslations(locale, {
				title: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Invitation Codes" },
				description: { "zh-Hant": "建立、發送與管理此活動的邀請碼。", "zh-Hans": "创建、发送与管理此活动的邀请码。", en: "Create, send and manage invitation codes for this event." },
				add: { "zh-Hant": "新增邀請碼", "zh-Hans": "新增邀请码", en: "Add codes" },
				exportCsv: { "zh-Hant": "匯出 CSV", "zh-Hans": "导出 CSV", en: "Export CSV" },
				exportCsvSelected: { "zh-Hant": "匯出已選 CSV ({count})", "zh-Hans": "导出已选 CSV ({count})", en: "Export selected CSV ({count})" },
				search: { "zh-Hant": "搜尋代碼、群組或票種", "zh-Hans": "搜索代码、分组或票种", en: "Search code, group or ticket" },
				clearSearch: { "zh-Hant": "清除搜尋", "zh-Hans": "清除搜索", en: "Clear search" },
				allGroups: { "zh-Hant": "所有群組", "zh-Hans": "所有分组", en: "All groups" },
				noGroup: { "zh-Hant": "（無群組）", "zh-Hans": "（无分组）", en: "(No group)" },
				group: { "zh-Hant": "群組", "zh-Hans": "分组", en: "Group" },
				allTickets: { "zh-Hant": "所有票種", "zh-Hans": "所有票种", en: "All tickets" },
				ticketType: { "zh-Hant": "限用票種", "zh-Hans": "限用票种", en: "Ticket" },
				allStatuses: { "zh-Hant": "所有狀態", "zh-Hans": "所有状态", en: "All statuses" },
				filterUnused: { "zh-Hant": "未使用", "zh-Hans": "未使用", en: "Unused" },
				filterUsed: { "zh-Hant": "已使用", "zh-Hans": "已使用", en: "Used" },
				filterExpired: { "zh-Hant": "已過期", "zh-Hans": "已过期", en: "Expired" },
				filterDisabled: { "zh-Hant": "已停用", "zh-Hans": "已停用", en: "Disabled" },
				code: { "zh-Hant": "代碼", "zh-Hans": "代码", en: "Code" },
				usage: { "zh-Hant": "使用次數", "zh-Hans": "使用次数", en: "Uses" },
				unlimited: { "zh-Hant": "不限", "zh-Hans": "不限", en: "unlimited" },
				validity: { "zh-Hant": "有效期間", "zh-Hans": "有效期间", en: "Validity" },
				noExpiry: { "zh-Hant": "無期限", "zh-Hans": "无期限", en: "No expiry" },
				from: { "zh-Hant": "起", "zh-Hans": "起", en: "From" },
				until: { "zh-Hant": "迄", "zh-Hans": "迄", en: "Until" },
				status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
				status_available: { "zh-Hant": "可使用", "zh-Hans": "可使用", en: "Available" },
				status_scheduled: { "zh-Hant": "尚未生效", "zh-Hans": "尚未生效", en: "Not started" },
				status_exhausted: { "zh-Hant": "已用完", "zh-Hans": "已用完", en: "Used up" },
				status_expired: { "zh-Hant": "已過期", "zh-Hans": "已过期", en: "Expired" },
				status_disabled: { "zh-Hant": "已停用", "zh-Hans": "已停用", en: "Disabled" },
				created: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created" },
				actions: { "zh-Hant": "動作", "zh-Hans": "动作", en: "Actions" },
				select: { "zh-Hant": "選取", "zh-Hans": "选取", en: "Select" },
				selectPage: { "zh-Hant": "選取本頁全部", "zh-Hans": "选取本页全部", en: "Select all on this page" },
				copy: { "zh-Hant": "複製代碼", "zh-Hans": "复制代码", en: "Copy code" },
				disable: { "zh-Hant": "停用", "zh-Hans": "停用", en: "Disable" },
				summary: {
					"zh-Hant": "共 {total} 個 · 未使用 {unused} · 已使用 {used} · 已過期 {expired} · 已停用 {disabled}",
					"zh-Hans": "共 {total} 个 · 未使用 {unused} · 已使用 {used} · 已过期 {expired} · 已停用 {disabled}",
					en: "{total} codes · {unused} unused · {used} used · {expired} expired · {disabled} disabled"
				},
				selected: { "zh-Hant": "已選取 {count} 個", "zh-Hans": "已选取 {count} 个", en: "{count} selected" },
				selectAllMatching: { "zh-Hant": "選取符合條件的 {count} 個", "zh-Hans": "选取符合条件的 {count} 个", en: "Select all {count} matching" },
				clearSelection: { "zh-Hant": "取消選取", "zh-Hans": "取消选取", en: "Clear selection" },
				copyCodes: { "zh-Hant": "複製代碼", "zh-Hans": "复制代码", en: "Copy codes" },
				downloadTxt: { "zh-Hant": "下載 TXT", "zh-Hans": "下载 TXT", en: "Download TXT" },
				sendEmail: { "zh-Hant": "寄送 Email", "zh-Hans": "发送 Email", en: "Send email" },
				disableSelected: { "zh-Hant": "停用", "zh-Hans": "停用", en: "Disable" },
				copied: { "zh-Hant": "已複製代碼", "zh-Hans": "已复制代码", en: "Code copied" },
				copiedMany: { "zh-Hant": "已複製 {count} 個代碼", "zh-Hans": "已复制 {count} 个代码", en: "Copied {count} codes" },
				copyFailed: { "zh-Hant": "無法複製，請手動複製", "zh-Hans": "无法复制，请手动复制", en: "Could not copy to the clipboard" },
				downloaded: { "zh-Hant": "已下載 {count} 個邀請碼", "zh-Hans": "已下载 {count} 个邀请码", en: "Downloaded {count} codes" },
				loadFailed: { "zh-Hant": "載入邀請碼失敗", "zh-Hans": "加载邀请码失败", en: "Failed to load invitation codes" },
				confirmDisableTitle: { "zh-Hant": "停用 {count} 個邀請碼？", "zh-Hans": "停用 {count} 个邀请码？", en: "Disable {count} invitation codes?" },
				confirmDisableDescription: {
					"zh-Hant": "停用後這些邀請碼將無法再被兌換，已使用的紀錄不受影響。",
					"zh-Hans": "停用后这些邀请码将无法再被兑换，已使用的记录不受影响。",
					en: "Disabled codes can no longer be redeemed. Registrations that already used them are not affected."
				},
				confirmDisableUsed: { "zh-Hant": "其中 {used} 個已被使用過。", "zh-Hans": "其中 {used} 个已被使用过。", en: "{used} of them have already been used." },
				alreadyDisabled: { "zh-Hant": "所選邀請碼都已停用。", "zh-Hans": "所选邀请码都已停用。", en: "The selected codes are already disabled." },
				disableSuccess: { "zh-Hant": "已停用 {count} 個邀請碼", "zh-Hans": "已停用 {count} 个邀请码", en: "Disabled {count} invitation codes" },
				disablePartial: { "zh-Hant": "已停用 {success} 個，{failed} 個失敗", "zh-Hans": "已停用 {success} 个，{failed} 个失败", en: "Disabled {success}, {failed} failed" },
				disableFailed: { "zh-Hant": "停用失敗", "zh-Hans": "停用失败", en: "Failed to disable" },
				emptyTitle: { "zh-Hant": "還沒有邀請碼", "zh-Hans": "还没有邀请码", en: "No invitation codes yet" },
				emptyDescription: {
					"zh-Hant": "為票種產生一批邀請碼，或匯入你已有的代碼。",
					"zh-Hans": "为票种生成一批邀请码，或导入你已有的代码。",
					en: "Generate a batch of codes for a ticket, or import codes you already have."
				},
				noMatches: { "zh-Hant": "沒有符合條件的邀請碼", "zh-Hans": "没有符合条件的邀请码", en: "No codes match your filters" },
				selectEventTitle: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Select an event first" },
				selectEventDescription: {
					"zh-Hant": "請從側邊欄選擇要管理邀請碼的活動。",
					"zh-Hans": "请从侧边栏选择要管理邀请码的活动。",
					en: "Choose an event from the sidebar to manage its invitation codes."
				}
			}),
		[locale]
	);
}

type SelectFilterProps = {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	label: string;
};

function FilterSelect({ value, onChange, options, label }: SelectFilterProps) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-full sm:w-44" aria-label={label}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{options.map(option => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function InvitesContent({ eventId }: { eventId: string }) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const t = useInvitesTranslations(locale);

	const [rawCodes, setRawCodes] = useState<InvitationCode[]>([]);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [loadedAt, setLoadedAt] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [groupFilter, setGroupFilter] = useState(allValue);
	const [ticketFilter, setTicketFilter] = useState(allValue);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [showCreate, setShowCreate] = useState(false);
	const [emailCodes, setEmailCodes] = useState<InviteRow[] | null>(null);

	// Only the latest request may write state, so a slow response for an older reload never overwrites newer data.
	const requestRef = useRef(0);

	const loadData = useCallback(
		async (silent = false) => {
			const requestId = ++requestRef.current;
			if (!silent) setIsLoading(true);
			try {
				const [codesResponse, ticketsResponse] = await Promise.all([adminInvitationCodesAPI.getAll({ eventId }), adminTicketsAPI.getAll({ eventId })]);
				if (requestId !== requestRef.current) return;
				if (!codesResponse.success) throw new Error(t.loadFailed);
				setRawCodes(codesResponse.data ?? []);
				setTickets(ticketsResponse.success ? (ticketsResponse.data ?? []) : []);
				setLoadedAt(Date.now());
			} catch (error) {
				if (requestId !== requestRef.current) return;
				console.error("Failed to load invitation codes:", error);
				showAlert(`${t.loadFailed}: ${errorMessage(error)}`, "error");
			} finally {
				if (requestId === requestRef.current) setIsLoading(false);
			}
		},
		[eventId, showAlert, t.loadFailed]
	);

	useEffect(() => {
		void loadData();
		const requests = requestRef;
		return () => {
			requests.current++;
		};
	}, [loadData]);

	const rows = useMemo(() => {
		const ticketNames = new Map(tickets.map(ticket => [ticket.id, getLocalizedText(ticket.name, locale)]));
		return rawCodes.map(code => toInviteRow(code, ticketNames.get(code.ticketId) ?? "", loadedAt));
	}, [rawCodes, tickets, loadedAt, locale]);

	const groupOptions = useMemo(() => {
		const names = Array.from(new Set(rows.map(row => row.name))).sort((a, b) => a.localeCompare(b));
		return names.map(name => ({ value: name === "" ? noGroupValue : name, label: name === "" ? t.noGroup : name }));
	}, [rows, t.noGroup]);

	const ticketOptions = useMemo(() => {
		const seen = new Map<string, string>();
		rows.forEach(row => seen.set(row.ticketId, row.ticketName || row.ticketId));
		return Array.from(seen, ([value, label]) => ({ value, label }));
	}, [rows]);

	const filtered = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		return rows.filter(row => {
			if (q && !row.code.toLowerCase().includes(q) && !row.name.toLowerCase().includes(q) && !row.ticketName.toLowerCase().includes(q)) return false;
			if (groupFilter !== allValue && row.name !== (groupFilter === noGroupValue ? "" : groupFilter)) return false;
			if (ticketFilter !== allValue && row.ticketId !== ticketFilter) return false;
			switch (statusFilter) {
				case "unused":
					return row.isActive && !row.isExpired && row.usedCount === 0;
				case "used":
					return row.usedCount > 0;
				case "expired":
					return row.isExpired;
				case "disabled":
					return !row.isActive;
				default:
					return true;
			}
		});
	}, [rows, searchTerm, groupFilter, ticketFilter, statusFilter]);

	// Actions only ever apply to rows that are currently visible.
	const selectedRows = useMemo(() => filtered.filter(row => rowSelection[row.id]), [filtered, rowSelection]);

	const counts = useMemo(
		() => ({
			total: rows.length,
			unused: rows.filter(r => r.isActive && !r.isExpired && r.usedCount === 0).length,
			used: rows.filter(r => r.usedCount > 0).length,
			expired: rows.filter(r => r.isExpired).length,
			disabled: rows.filter(r => !r.isActive).length
		}),
		[rows]
	);

	// Changing a filter clears the selection so hidden rows can never be acted upon by accident.
	function changeFilter<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setRowSelection({});
		};
	}

	function directLink(row: InviteRow) {
		return `${window.location.origin}/${locale}/${eventId.slice(-6)}/ticket/${row.ticketId}?inv=${encodeURIComponent(row.code)}`;
	}

	const dateStamp = () => new Date().toISOString().split("T")[0];

	async function copyCodes(target: InviteRow[]) {
		const ok = await copyText(target.map(row => row.code).join("\n"));
		showAlert(ok ? (target.length === 1 ? t.copied : t.copiedMany.replace("{count}", String(target.length))) : t.copyFailed, ok ? "success" : "error");
	}

	function downloadTxt(target: InviteRow[]) {
		downloadFile(`invitation-codes-${dateStamp()}.txt`, target.map(row => row.code).join("\n"), "text/plain");
		showAlert(t.downloaded.replace("{count}", String(target.length)), "success");
	}

	function exportCsv(target: InviteRow[]) {
		const csv = toCsv(
			["code", "group", "ticket", "used", "limit", "valid_from", "valid_until", "status", "direct_link"],
			target.map(row => [
				row.code,
				row.name,
				row.ticketName,
				row.usedCount,
				row.usageLimit ?? "",
				row.validFrom ? formatDateTime(row.validFrom) : "",
				row.validUntil ? formatDateTime(row.validUntil) : "",
				row.status,
				directLink(row)
			])
		);
		downloadFile(`invitation-codes-${dateStamp()}.csv`, csv, "text/csv");
		showAlert(t.downloaded.replace("{count}", String(target.length)), "success");
	}

	async function disableCodes(target: InviteRow[]) {
		const active = target.filter(row => row.isActive);
		if (active.length === 0) {
			showAlert(t.alreadyDisabled, "warning");
			return;
		}

		const usedCount = active.filter(row => row.usedCount > 0).length;
		const description = [t.confirmDisableDescription, usedCount > 0 ? t.confirmDisableUsed.replace("{used}", String(usedCount)) : ""].filter(Boolean).join(" ");
		if (!(await confirm({ title: t.confirmDisableTitle.replace("{count}", String(active.length)), description, confirmLabel: t.disable, destructive: true }))) return;

		const results = await runInChunks(active, async row => {
			try {
				const response = await adminInvitationCodesAPI.delete(row.id);
				return { id: row.id, ok: response.success };
			} catch (error) {
				console.error(`Failed to disable code ${row.id}:`, error);
				return { id: row.id, ok: false };
			}
		});
		const failedIds = results.filter(r => !r.ok).map(r => r.id);
		const successCount = results.length - failedIds.length;

		await loadData(true);
		setRowSelection(Object.fromEntries(failedIds.map(id => [id, true])));

		if (failedIds.length === 0) showAlert(t.disableSuccess.replace("{count}", String(successCount)), "success");
		else if (successCount === 0) showAlert(t.disableFailed, "error");
		else showAlert(t.disablePartial.replace("{success}", String(successCount)).replace("{failed}", String(failedIds.length)), "warning");
	}

	const columns = createInvitesColumns({
		onCopy: row => void copyCodes([row]),
		onDisable: row => void disableCodes([row]),
		t
	});

	const statusOptions: { value: StatusFilter; label: string }[] = [
		{ value: "all", label: t.allStatuses },
		{ value: "unused", label: t.filterUnused },
		{ value: "used", label: t.filterUsed },
		{ value: "expired", label: t.filterExpired },
		{ value: "disabled", label: t.filterDisabled }
	];

	const exportTarget = selectedRows.length > 0 ? selectedRows : filtered;
	const hasRows = rows.length > 0;

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.description}
				actions={
					<>
						<Button variant="outline" onClick={() => exportCsv(exportTarget)} disabled={exportTarget.length === 0}>
							<FileDown className="size-4" />
							{selectedRows.length > 0 ? t.exportCsvSelected.replace("{count}", String(selectedRows.length)) : t.exportCsv}
						</Button>
						<Button variant="primary" onClick={() => setShowCreate(true)}>
							<Plus className="size-4" />
							{t.add}
						</Button>
					</>
				}
			/>

			{hasRows && (
				<AdminToolbar>
					<SearchInput
						value={searchTerm}
						onChange={value => {
							setSearchTerm(value);
							setRowSelection({});
						}}
						placeholder={t.search}
						clearLabel={t.clearSearch}
					/>
					<FilterSelect value={statusFilter} onChange={changeFilter(value => setStatusFilter(value as StatusFilter))} options={statusOptions} label={t.status} />
					{groupOptions.length > 1 && <FilterSelect value={groupFilter} onChange={changeFilter(setGroupFilter)} options={[{ value: allValue, label: t.allGroups }, ...groupOptions]} label={t.group} />}
					{ticketOptions.length > 1 && (
						<FilterSelect value={ticketFilter} onChange={changeFilter(setTicketFilter)} options={[{ value: allValue, label: t.allTickets }, ...ticketOptions]} label={t.ticketType} />
					)}
				</AdminToolbar>
			)}

			{hasRows && (
				<p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
					<span className="inline-flex items-center gap-1.5">
						<TicketIcon className="size-4" />
						{t.summary
							.replace("{total}", String(counts.total))
							.replace("{unused}", String(counts.unused))
							.replace("{used}", String(counts.used))
							.replace("{expired}", String(counts.expired))
							.replace("{disabled}", String(counts.disabled))}
					</span>
				</p>
			)}

			{selectedRows.length > 0 && (
				<div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2" role="region" aria-label={t.selected.replace("{count}", String(selectedRows.length))}>
					<span className="mr-1 text-sm font-medium">{t.selected.replace("{count}", String(selectedRows.length))}</span>
					{selectedRows.length < filtered.length && (
						<Button variant="ghost" size="sm" onClick={() => setRowSelection(Object.fromEntries(filtered.map(row => [row.id, true])))}>
							{t.selectAllMatching.replace("{count}", String(filtered.length))}
						</Button>
					)}
					<div className="flex-1" />
					<Button variant="outline" size="sm" onClick={() => void copyCodes(selectedRows)}>
						<Copy className="size-4" />
						{t.copyCodes}
					</Button>
					<Button variant="outline" size="sm" onClick={() => downloadTxt(selectedRows)}>
						<Download className="size-4" />
						{t.downloadTxt}
					</Button>
					<Button variant="outline" size="sm" onClick={() => setEmailCodes(selectedRows)}>
						<Mail className="size-4" />
						{t.sendEmail}
					</Button>
					<Button variant="destructive" size="sm" onClick={() => void disableCodes(selectedRows)}>
						<Ban className="size-4" />
						{t.disableSelected}
					</Button>
					<Button variant="ghost" size="icon" className="size-9" onClick={() => setRowSelection({})} aria-label={t.clearSelection} title={t.clearSelection}>
						<X className="size-4" />
					</Button>
				</div>
			)}

			<DataTable
				columns={columns}
				data={filtered}
				isLoading={isLoading}
				getRowId={row => row.id}
				rowSelection={rowSelection}
				onRowSelectionChange={setRowSelection}
				emptyMessage={t.noMatches}
				emptyState={
					hasRows ? undefined : (
						<EmptyState
							className="border-0"
							title={t.emptyTitle}
							description={t.emptyDescription}
							action={
								<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
									<Plus className="size-4" />
									{t.add}
								</Button>
							}
						/>
					)
				}
			/>

			{showCreate && <CreateCodesDialog tickets={tickets} onClose={() => setShowCreate(false)} onCreated={() => loadData(true)} />}
			{emailCodes && <SendEmailDialog codes={emailCodes} onClose={() => setEmailCodes(null)} />}
		</main>
	);
}

export default function InvitesPage() {
	const locale = useLocale();
	const eventId = useSelectedEventId();
	const t = useInvitesTranslations(locale);

	if (!eventId) {
		return (
			<main>
				<AdminHeader title={t.title} description={t.description} />
				<EmptyState icon={TicketIcon} title={t.selectEventTitle} description={t.selectEventDescription} />
			</main>
		);
	}

	// Keyed by event so switching events starts from a clean slate (filters, selection, dialogs, in-flight requests).
	return <InvitesContent key={eventId} eventId={eventId} />;
}
