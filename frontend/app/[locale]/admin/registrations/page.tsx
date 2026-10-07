"use client";

import { AdminToolbar, AdminToolbarSpacer } from "@/components/admin/AdminToolbar";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventFormFieldsAPI, adminRegistrationsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import generateHash from "@/lib/utils/hash";
import { getLocalizedText } from "@/lib/utils/localization";
import { toText } from "@/lib/utils/text";
import { formatDateTime } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils";
import type { EventFormField } from "@sitcontix/types";
import type { RowSelectionState } from "@tanstack/react-table";
import { CircleAlert, Download, FileSpreadsheet, RotateCw, UserX, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRegistrationsColumns, type RegistrationDisplay } from "./columns";
import { GoogleSheetsExportDialog } from "./GoogleSheetsExportDialog";
import { RegistrationDetailDialog, type RegistrationChanges } from "./RegistrationDetailDialog";
import { registrationsTranslations, type RegistrationsT } from "./translations";
import { buildRegistrationsCsv, downloadBlob, errorMessage, getReferrer, timestampForFilename, type AdminRegistration } from "./utils";

type StatusFilter = "all" | "confirmed" | "pending" | "cancelled";

function StatsCards({ stats, statusFilter, onSelect, t }: { stats: Record<StatusFilter, number>; statusFilter: StatusFilter; onSelect: (status: StatusFilter) => void; t: RegistrationsT }) {
	const cards: { key: StatusFilter; label: string; valueClass?: string }[] = [
		{ key: "all", label: t.total },
		{ key: "confirmed", label: t.confirmed, valueClass: "text-green-600 dark:text-green-500" },
		{ key: "pending", label: t.pending, valueClass: "text-amber-600 dark:text-amber-500" },
		{ key: "cancelled", label: t.cancelled, valueClass: "text-red-600 dark:text-red-500" }
	];

	return (
		<section aria-label={t.stats} className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			{cards.map(card => (
				<button
					key={card.key}
					type="button"
					onClick={() => onSelect(card.key)}
					aria-pressed={statusFilter === card.key}
					className={cn(
						"rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						statusFilter === card.key && "border-primary ring-1 ring-primary"
					)}
				>
					<div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</div>
					<div className={cn("mt-1 text-3xl font-bold tabular-nums", card.valueClass)}>{stats[card.key]}</div>
				</button>
			))}
		</section>
	);
}

function useRegistrationsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const currentEventId = useSelectedEventId();
	const t = useMemo(() => getTranslations(locale, registrationsTranslations) as RegistrationsT, [locale]);

	const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
	const [ticketHashes, setTicketHashes] = useState<Record<string, string>>({});
	const [formFields, setFormFields] = useState<EventFormField[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [detailId, setDetailId] = useState<string | null>(null);
	const [showSheets, setShowSheets] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const requestIdRef = useRef(0);

	// Drop everything that belongs to the previous event as soon as the selected event changes
	const [prevEventId, setPrevEventId] = useState(currentEventId);
	if (prevEventId !== currentEventId) {
		setPrevEventId(currentEventId);
		setRegistrations([]);
		setTicketHashes({});
		setFormFields([]);
		setIsLoading(false);
		setLoadError(null);
		setSearchTerm("");
		setStatusFilter("all");
		setRowSelection({});
		setDetailId(null);
		setShowSheets(false);
	}

	const loadRegistrations = useCallback(async () => {
		if (!currentEventId) return;

		const requestId = ++requestIdRef.current;
		setIsLoading(true);
		setLoadError(null);
		try {
			const response = await adminRegistrationsAPI.getAll({ limit: 9999, eventId: currentEventId });
			if (requestId !== requestIdRef.current) return;
			if (!response.success) {
				const message = response.message || "Unknown error";
				setLoadError(message);
				showAlert(message, "error");
				return;
			}

			const loaded = response.data || [];
			const hashes = await Promise.all(loaded.map(async r => [r.id, await generateHash(r.id, r.createdAt)] as const));
			if (requestId !== requestIdRef.current) return;

			const loadedIds = new Set(loaded.map(r => r.id));
			setRegistrations(loaded);
			setTicketHashes(Object.fromEntries(hashes));
			setRowSelection(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => loadedIds.has(id))));
		} catch (error) {
			if (requestId !== requestIdRef.current) return;
			console.error("Failed to load registrations:", error);
			const message = errorMessage(error, "Unknown error");
			setLoadError(message);
			showAlert(message, "error");
		} finally {
			if (requestId === requestIdRef.current) setIsLoading(false);
		}
	}, [currentEventId, showAlert]);

	useEffect(() => {
		if (!currentEventId) {
			requestIdRef.current++;
			return;
		}
		void loadRegistrations();
	}, [currentEventId, loadRegistrations]);

	useEffect(() => {
		if (!currentEventId) return;
		let cancelled = false;
		adminEventFormFieldsAPI
			.getAll({ eventId: currentEventId })
			.then(response => {
				if (!cancelled && response.success) setFormFields(response.data ?? []);
			})
			.catch(error => console.error("Failed to load form fields:", error));
		return () => {
			cancelled = true;
		};
	}, [currentEventId]);

	const stats = useMemo<Record<StatusFilter, number>>(
		() => ({
			all: registrations.length,
			confirmed: registrations.filter(r => r.status === "confirmed").length,
			pending: registrations.filter(r => r.status === "pending").length,
			cancelled: registrations.filter(r => r.status === "cancelled").length
		}),
		[registrations]
	);

	const filtered = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		return registrations
			.filter(r => {
				if (statusFilter !== "all" && r.status !== statusFilter) return false;
				if (!q) return true;
				return (
					r.email.toLowerCase().includes(q) ||
					r.id.toLowerCase().includes(q) ||
					(ticketHashes[r.id] ?? "").includes(q) ||
					getLocalizedText(r.ticket?.name, locale).toLowerCase().includes(q) ||
					getReferrer(r).toLowerCase().includes(q) ||
					Object.values(r.formData ?? {}).some(value => toText(value).toLowerCase().includes(q))
				);
			})
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, [registrations, searchTerm, statusFilter, ticketHashes, locale]);

	const displayData = useMemo(
		(): RegistrationDisplay[] =>
			filtered.map(r => ({
				...r,
				displayId: r.id.slice(0, 8) + "…",
				displayTicket: getLocalizedText(r.ticket?.name, locale) || r.ticketId,
				displayReferredBy: getReferrer(r),
				formattedCreatedAt: r.createdAt ? formatDateTime(r.createdAt) : "",
				formattedUpdatedAt: r.updatedAt ? formatDateTime(r.updatedAt) : ""
			})),
		[filtered, locale]
	);

	const columns = useMemo(() => createRegistrationsColumns({ onViewDetails: r => setDetailId(r.id), t }), [t]);

	const selectedRegistrations = useMemo(() => filtered.filter(r => rowSelection[r.id]), [filtered, rowSelection]);
	const detailRegistration = useMemo(() => registrations.find(r => r.id === detailId) ?? null, [registrations, detailId]);

	const changeSearch = (value: string) => {
		setSearchTerm(value);
		setRowSelection({});
	};

	const changeStatus = (value: StatusFilter) => {
		setStatusFilter(value);
		setRowSelection({});
	};

	const clearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		setRowSelection({});
	};

	async function exportCsv() {
		if (!currentEventId) {
			showAlert(t.noEventSelected, "warning");
			return;
		}
		setIsExporting(true);
		try {
			const query = new URLSearchParams({ format: "csv", eventId: currentEventId });
			const response = await fetch(`/api/admin/registrations/export?${query.toString()}`, { credentials: "include" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			downloadBlob(await response.blob(), `registrations_${timestampForFilename()}.csv`);
			showAlert(t.exportCsvSuccess, "success");
		} catch (error) {
			console.error("Failed to export registrations:", error);
			showAlert(`${t.exportCsvFailed}: ${errorMessage(error, t.unknownError)}`, "error");
		} finally {
			setIsExporting(false);
		}
	}

	function exportSelected() {
		if (selectedRegistrations.length === 0) return;
		try {
			const csv = buildRegistrationsCsv(selectedRegistrations, formFields, locale, t);
			downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `registrations_selected_${timestampForFilename()}.csv`);
			showAlert(t.exportSelectedSuccess.replace("{count}", String(selectedRegistrations.length)), "success");
			setRowSelection({});
		} catch (error) {
			console.error("Failed to export selected registrations:", error);
			showAlert(`${t.exportCsvFailed}: ${errorMessage(error, t.unknownError)}`, "error");
		}
	}

	async function saveRegistration(registration: AdminRegistration, changes: RegistrationChanges): Promise<string | null> {
		try {
			const response = await adminRegistrationsAPI.update(registration.id, changes);
			if (!response.success) {
				const message = response.message || t.unknownError;
				showAlert(`${t.saveError}: ${message}`, "error");
				return message;
			}
			const updated = response.data;
			setRegistrations(prev =>
				prev.map(r =>
					r.id === registration.id
						? { ...r, status: updated?.status ?? changes.status ?? r.status, formData: updated?.formData ?? changes.formData ?? r.formData, updatedAt: updated?.updatedAt ?? new Date() }
						: r
				)
			);
			showAlert(t.saveSuccess, "success");
			return null;
		} catch (error) {
			console.error("Failed to update registration:", error);
			const message = errorMessage(error, t.unknownError);
			showAlert(`${t.saveError}: ${message}`, "error");
			return message;
		}
	}

	async function deleteRegistration(registration: AdminRegistration): Promise<boolean> {
		try {
			const response = await adminRegistrationsAPI.delete(registration.id);
			if (!response.success) {
				showAlert(`${t.deleteError}: ${response.message || t.unknownError}`, "error");
				return false;
			}
			showAlert(t.deleteSuccess, "success");
			setDetailId(null);
			setRegistrations(prev => prev.filter(r => r.id !== registration.id));
			setRowSelection(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== registration.id)));
			return true;
		} catch (error) {
			console.error("Failed to delete registration:", error);
			showAlert(`${t.deleteError}: ${errorMessage(error, t.unknownError)}`, "error");
			return false;
		}
	}

	return {
		t,
		locale,
		currentEventId,
		registrations,
		ticketHashes,
		formFields,
		isLoading,
		loadError,
		searchTerm,
		statusFilter,
		rowSelection,
		setRowSelection,
		stats,
		displayData,
		columns,
		selectedRegistrations,
		detailRegistration,
		setDetailId,
		showSheets,
		setShowSheets,
		isExporting,
		loadRegistrations,
		changeSearch,
		changeStatus,
		clearFilters,
		exportCsv,
		exportSelected,
		saveRegistration,
		deleteRegistration
	};
}

export default function RegistrationsPage() {
	const page = useRegistrationsPage();
	const { t, locale, currentEventId, registrations, isLoading, loadError, searchTerm, statusFilter, rowSelection, selectedRegistrations } = page;

	const hasFilters = searchTerm.trim() !== "" || statusFilter !== "all";
	const showLoadError = loadError !== null && registrations.length === 0 && !isLoading;

	const headerActions = currentEventId ? (
		<>
			<Button variant="outline" size="sm" onClick={page.exportCsv} isLoading={page.isExporting}>
				{!page.isExporting && <Download className="size-4" />}
				{t.exportCsv}
			</Button>
			<Button variant="outline" size="sm" onClick={() => page.setShowSheets(true)}>
				<FileSpreadsheet className="size-4" />
				{t.exportToSheets}
			</Button>
		</>
	) : undefined;

	const emptyState = hasFilters ? (
		<EmptyState
			className="border-0 py-6"
			icon={UserX}
			title={t.noMatches}
			action={
				<Button variant="outline" size="sm" onClick={page.clearFilters}>
					{t.clearFilters}
				</Button>
			}
		/>
	) : (
		<EmptyState className="border-0 py-6" icon={UserX} title={t.noRegistrations} />
	);

	return (
		<main>
			<AdminHeader title={t.title} description={t.description} actions={headerActions} />

			{!currentEventId ? (
				<EmptyState title={t.noEventTitle} description={t.noEventDescription} />
			) : showLoadError ? (
				<EmptyState
					icon={CircleAlert}
					title={t.loadFailed}
					description={loadError ?? undefined}
					action={
						<Button variant="outline" size="sm" onClick={page.loadRegistrations}>
							<RotateCw className="size-4" />
							{t.retry}
						</Button>
					}
				/>
			) : (
				<>
					<StatsCards stats={page.stats} statusFilter={statusFilter} onSelect={page.changeStatus} t={t} />

					<AdminToolbar>
						<SearchInput value={searchTerm} onChange={page.changeSearch} placeholder={t.search} clearLabel={t.clearSearch} className="sm:w-80" />
						<Select value={statusFilter} onValueChange={value => page.changeStatus(value as StatusFilter)}>
							<SelectTrigger className="w-full sm:w-44" aria-label={t.statusFilter}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t.allStatus}</SelectItem>
								<SelectItem value="confirmed">{t.confirmed}</SelectItem>
								<SelectItem value="pending">{t.pending}</SelectItem>
								<SelectItem value="cancelled">{t.cancelled}</SelectItem>
							</SelectContent>
						</Select>
						<AdminToolbarSpacer />
						<Button variant="outline" size="sm" onClick={page.loadRegistrations} disabled={isLoading}>
							<RotateCw className={cn("size-4", isLoading && "animate-spin")} />
							{t.refresh}
						</Button>
					</AdminToolbar>

					{selectedRegistrations.length > 0 && (
						<div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
							<span className="text-sm font-medium">{t.selectedCount.replace("{count}", String(selectedRegistrations.length))}</span>
							<div className="flex-1" />
							<Button variant="primary" size="sm" onClick={page.exportSelected}>
								<Download className="size-4" />
								{t.exportSelected}
							</Button>
							<Button variant="ghost" size="sm" onClick={() => page.setRowSelection({})}>
								<X className="size-4" />
								{t.clearSelection}
							</Button>
						</div>
					)}

					<DataTable
						columns={page.columns}
						data={page.displayData}
						isLoading={isLoading && registrations.length === 0}
						getRowId={row => row.id}
						rowSelection={rowSelection}
						onRowSelectionChange={page.setRowSelection}
						onRowClick={row => page.setDetailId(row.id)}
						emptyState={emptyState}
					/>
				</>
			)}

			<RegistrationDetailDialog
				registration={page.detailRegistration}
				ticketHash={page.detailRegistration ? (page.ticketHashes[page.detailRegistration.id] ?? "") : ""}
				formFields={page.formFields}
				locale={locale}
				t={t}
				onClose={() => page.setDetailId(null)}
				onSave={page.saveRegistration}
				onDelete={page.deleteRegistration}
			/>
			<GoogleSheetsExportDialog open={page.showSheets} eventId={currentEventId} t={t} onClose={() => page.setShowSheets(false)} />
		</main>
	);
}
