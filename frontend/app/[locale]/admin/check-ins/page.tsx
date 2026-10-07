"use client";

import { AdminToolbar, AdminToolbarSpacer } from "@/components/admin/AdminToolbar";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import QRScanner from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminCheckInsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { cn } from "@/lib/utils";
import { getLocalizedText } from "@/lib/utils/localization";
import { toText } from "@/lib/utils/text";
import { formatDateTime } from "@/lib/utils/timezone";
import type { CheckInAttendee, CheckInResult } from "@sitcontix/types";
import { Camera, CircleAlert, CircleCheck, CircleX, ClipboardCheck, QrCode, RotateCw, ScanLine, TriangleAlert, UserX, Video, VideoOff, type LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "../registrations/utils";
import { CheckInBadge, createCheckInColumns, type CheckInRow } from "./columns";
import { checkInsTranslations, type CheckInsT } from "./translations";

type StatusFilter = "all" | "notCheckedIn" | "checkedIn";

type ScanResult = { kind: "success" | "already" | "cancelled" | "undone"; attendeeId: string } | { kind: "notFound" } | { kind: "error"; message: string };

type ChangeOutcome = { ok: true; result: CheckInResult } | { ok: false; message: string };

/** The token in a ticket QR code is a SHA-256 hex digest; tolerate it being wrapped in a URL or surrounded by whitespace. */
function extractQrToken(scanned: string): string | undefined {
	return scanned.match(/[a-f0-9]{64}/i)?.[0].toLowerCase();
}

function buildSearchIndex(attendee: CheckInAttendee, ticket: string) {
	const formValues = Object.values(attendee.formData ?? {}).map(value => toText(value));
	const text = [attendee.name, attendee.email, attendee.phoneNumber, attendee.id, attendee.qrToken, ticket, ...formValues].filter(Boolean).join("\n").toLowerCase();
	// Phone numbers are typed with all sorts of separators, so also compare digits only
	const digits = [attendee.phoneNumber, ...formValues]
		.map(value => (value ?? "").replace(/\D/g, ""))
		.filter(value => value.length >= 6)
		.join(" ");
	return { text, digits };
}

function useCheckInsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const currentEventId = useSelectedEventId();
	const t = useMemo(() => getTranslations(locale, checkInsTranslations) as CheckInsT, [locale]);

	const [attendees, setAttendees] = useState<CheckInAttendee[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
	const [scanResult, setScanResult] = useState<ScanResult | null>(null);
	const [isProcessingScan, setIsProcessingScan] = useState(false);
	const requestIdRef = useRef(0);
	const scanBusyRef = useRef(false);

	// Drop everything that belongs to the previous event as soon as the selected event changes
	const [prevEventId, setPrevEventId] = useState(currentEventId);
	if (prevEventId !== currentEventId) {
		setPrevEventId(currentEventId);
		setAttendees([]);
		setIsLoading(false);
		setLoadError(null);
		setSearchTerm("");
		setStatusFilter("all");
		setPendingIds(new Set());
		setScanResult(null);
	}

	const loadAttendees = useCallback(async (): Promise<CheckInAttendee[] | null> => {
		if (!currentEventId) return null;

		const requestId = ++requestIdRef.current;
		setIsLoading(true);
		setLoadError(null);
		try {
			const response = await adminCheckInsAPI.getAttendees({ eventId: currentEventId });
			if (requestId !== requestIdRef.current) return null;
			if (!response.success) {
				const message = response.message || checkInsTranslations.unknownError.en;
				setLoadError(message);
				showAlert(message, "error");
				return null;
			}
			setAttendees(response.data ?? []);
			return response.data ?? [];
		} catch (error) {
			if (requestId !== requestIdRef.current) return null;
			console.error("Failed to load check-in list:", error);
			const message = errorMessage(error, checkInsTranslations.unknownError.en);
			setLoadError(message);
			showAlert(message, "error");
			return null;
		} finally {
			if (requestId === requestIdRef.current) setIsLoading(false);
		}
	}, [currentEventId, showAlert]);

	useEffect(() => {
		if (!currentEventId) {
			requestIdRef.current++;
			return;
		}
		void loadAttendees();
	}, [currentEventId, loadAttendees]);

	const rows = useMemo(
		(): CheckInRow[] =>
			attendees
				.map(attendee => ({
					...attendee,
					displayName: attendee.name || attendee.email,
					displayTicket: getLocalizedText(attendee.ticketName, locale),
					formattedCheckedInAt: attendee.checkedInAt ? formatDateTime(attendee.checkedInAt) : ""
				}))
				.sort((a, b) => a.displayName.localeCompare(b.displayName, locale)),
		[attendees, locale]
	);

	const searchIndex = useMemo(() => new Map(rows.map(row => [row.id, buildSearchIndex(row, row.displayTicket)])), [rows]);

	const visibleRows = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		const queryDigits = query.replace(/\D/g, "");
		const looksLikePhone = queryDigits.length >= 3 && /^[\d\s()+\-.]+$/.test(query);

		return rows.filter(row => {
			if (statusFilter === "checkedIn" && !row.checkedIn) return false;
			if (statusFilter === "notCheckedIn" && (row.checkedIn || row.status !== "confirmed")) return false;
			if (!query) return true;
			const index = searchIndex.get(row.id);
			return !!index && (index.text.includes(query) || (looksLikePhone && index.digits.includes(queryDigits)));
		});
	}, [rows, searchIndex, searchTerm, statusFilter]);

	const stats = useMemo(() => {
		const confirmed = attendees.filter(attendee => attendee.status === "confirmed");
		const checkedIn = confirmed.filter(attendee => attendee.checkedIn).length;
		return { total: confirmed.length, checkedIn, remaining: confirmed.length - checkedIn };
	}, [attendees]);

	const changeCheckIn = useCallback(
		async (attendee: CheckInAttendee, checkedIn: boolean): Promise<ChangeOutcome> => {
			setPendingIds(prev => new Set(prev).add(attendee.id));
			try {
				const response = await adminCheckInsAPI.update(attendee.id, checkedIn);
				if (!response.success) return { ok: false, message: response.message || t.unknownError };

				const result = response.data;
				setAttendees(prev => prev.map(item => (item.id === attendee.id ? { ...item, checkedIn: result.checkedIn, checkedInAt: result.checkedInAt } : item)));
				return { ok: true, result };
			} catch (error) {
				console.error("Failed to update check-in:", error);
				return { ok: false, message: errorMessage(error, t.unknownError) };
			} finally {
				setPendingIds(prev => {
					const next = new Set(prev);
					next.delete(attendee.id);
					return next;
				});
			}
		},
		[t]
	);

	const toggleCheckIn = useCallback(
		async (attendee: CheckInRow, checkedIn: boolean) => {
			const outcome = await changeCheckIn(attendee, checkedIn);
			if (!outcome.ok) {
				showAlert(`${t.updateFailed}: ${outcome.message}`, "error");
				return;
			}
			if (!checkedIn) showAlert(t.undoSuccess.replace("{name}", attendee.displayName), "info");
			else if (outcome.result.alreadyCheckedIn) showAlert(t.checkInAlready.replace("{name}", attendee.displayName), "warning");
			else showAlert(t.checkInSuccess.replace("{name}", attendee.displayName), "success");
		},
		[changeCheckIn, showAlert, t]
	);

	async function undoScan(attendeeId: string) {
		const attendee = attendees.find(item => item.id === attendeeId);
		if (!attendee) return;
		const outcome = await changeCheckIn(attendee, false);
		if (outcome.ok) setScanResult({ kind: "undone", attendeeId });
		else showAlert(`${t.updateFailed}: ${outcome.message}`, "error");
	}

	async function handleScan(scanned: string) {
		// One ticket at a time: codes seen while a check-in is in flight are reported again once the scanner's cooldown ends
		if (scanBusyRef.current) return;
		scanBusyRef.current = true;
		setIsProcessingScan(true);
		try {
			const token = extractQrToken(scanned);
			let attendee = token ? attendees.find(item => item.qrToken === token) : undefined;
			if (token && !attendee) {
				// Registrations may have been added since the list was loaded
				const fresh = await loadAttendees();
				attendee = fresh?.find(item => item.qrToken === token);
			}
			if (!attendee) {
				setScanResult({ kind: "notFound" });
				return;
			}
			if (attendee.status !== "confirmed") {
				setScanResult({ kind: "cancelled", attendeeId: attendee.id });
				return;
			}

			const outcome = await changeCheckIn(attendee, true);
			if (!outcome.ok) {
				setScanResult({ kind: "error", message: outcome.message });
				return;
			}
			setScanResult({ kind: outcome.result.alreadyCheckedIn ? "already" : "success", attendeeId: attendee.id });
		} finally {
			scanBusyRef.current = false;
			setIsProcessingScan(false);
		}
	}

	const columns = useMemo(() => createCheckInColumns({ t, pendingIds, onToggle: (attendee, checkedIn) => void toggleCheckIn(attendee, checkedIn) }), [t, pendingIds, toggleCheckIn]);

	return {
		t,
		locale,
		currentEventId,
		attendees,
		rows,
		visibleRows,
		stats,
		columns,
		pendingIds,
		isLoading,
		loadError,
		loadAttendees,
		searchTerm,
		setSearchTerm,
		statusFilter,
		setStatusFilter,
		scanResult,
		isProcessingScan,
		handleScan,
		undoScan
	};
}

function StatsSection({ stats, t }: { stats: { total: number; checkedIn: number; remaining: number }; t: CheckInsT }) {
	const percent = stats.total === 0 ? 0 : Math.round((stats.checkedIn / stats.total) * 100);
	const cards = [
		{ label: t.statTotal, value: stats.total, valueClass: undefined },
		{ label: t.statCheckedIn, value: stats.checkedIn, valueClass: "text-green-600 dark:text-green-500" },
		{ label: t.statRemaining, value: stats.remaining, valueClass: "text-amber-600 dark:text-amber-500" }
	];

	return (
		<section aria-label={t.statsLabel} className="mb-6 space-y-3">
			<div className="grid grid-cols-3 gap-3">
				{cards.map(card => (
					<div key={card.label} className="rounded-xl border bg-card p-4">
						<div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</div>
						<div className={cn("mt-1 text-3xl font-bold tabular-nums", card.valueClass)}>{card.value}</div>
					</div>
				))}
			</div>
			<div className="flex items-center gap-3">
				<Progress value={percent} className="h-2.5" />
				<span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">{percent}%</span>
			</div>
		</section>
	);
}

const resultStyles: Record<"success" | "warning" | "danger" | "neutral", { box: string; icon: string }> = {
	success: { box: "border-green-500/40 bg-green-500/10", icon: "text-green-600 dark:text-green-400" },
	warning: { box: "border-amber-500/40 bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400" },
	danger: { box: "border-red-500/40 bg-red-500/10", icon: "text-red-600 dark:text-red-400" },
	neutral: { box: "border-border bg-muted/40", icon: "text-muted-foreground" }
};

function ScanResultCard({
	result,
	attendee,
	isProcessing,
	isUndoing,
	onUndo,
	t,
	locale
}: {
	result: ScanResult | null;
	attendee: CheckInAttendee | undefined;
	isProcessing: boolean;
	isUndoing: boolean;
	onUndo: (attendeeId: string) => void;
	t: CheckInsT;
	locale: string;
}) {
	if (!result) {
		return <EmptyState className="h-full min-h-64" icon={ScanLine} title={isProcessing ? t.scanProcessing : t.scanIdleTitle} description={t.scanIdleDescription} />;
	}

	let tone: keyof typeof resultStyles = "neutral";
	let Icon: LucideIcon = CircleCheck;
	let title = "";
	let detail: string | undefined;

	if (result.kind === "success") {
		tone = "success";
		title = t.scanSuccess;
	} else if (result.kind === "already") {
		tone = "warning";
		Icon = TriangleAlert;
		title = t.scanAlready;
		detail = attendee?.checkedInAt ? t.scanAlreadyAt.replace("{time}", formatDateTime(attendee.checkedInAt)) : undefined;
	} else if (result.kind === "cancelled") {
		tone = "danger";
		Icon = CircleX;
		title = t.scanCancelled;
	} else if (result.kind === "undone") {
		title = t.undoSuccess.replace("{name}", attendee?.name || attendee?.email || "");
	} else if (result.kind === "notFound") {
		tone = "danger";
		Icon = CircleX;
		title = t.scanNotFound;
		detail = t.scanNotFoundDescription;
	} else {
		tone = "danger";
		Icon = CircleAlert;
		title = t.scanFailed;
		detail = "message" in result ? result.message : undefined;
	}

	const styles = resultStyles[tone];
	const canUndo = attendee && (result.kind === "success" || result.kind === "already");
	const ticket = attendee ? getLocalizedText(attendee.ticketName, locale) : "";

	return (
		<div role="status" aria-live="polite" className={cn("flex h-full min-h-64 flex-col justify-between gap-4 rounded-xl border-2 p-5", styles.box)}>
			<div className="flex items-start gap-3">
				<Icon className={cn("mt-0.5 size-8 shrink-0", styles.icon)} />
				<div className="min-w-0">
					<p className="text-xl font-bold leading-tight">{title}</p>
					{detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
				</div>
			</div>

			{attendee && result.kind !== "notFound" && result.kind !== "error" && (
				<dl className="space-y-1 text-sm">
					<div className="text-lg font-semibold">{attendee.name || attendee.email}</div>
					{attendee.name && <div className="break-all text-muted-foreground">{attendee.email}</div>}
					{attendee.phoneNumber && <div className="tabular-nums text-muted-foreground">{attendee.phoneNumber}</div>}
					<div className="flex flex-wrap items-center gap-2 pt-1">
						{ticket && <span>{ticket}</span>}
						<CheckInBadge attendee={attendee} t={t} />
					</div>
				</dl>
			)}

			{canUndo && (
				<div>
					<Button variant="outline" size="sm" isLoading={isUndoing} onClick={() => onUndo(attendee.id)}>
						{t.undo}
					</Button>
				</div>
			)}
		</div>
	);
}

function ScanPanel({ page }: { page: ReturnType<typeof useCheckInsPage> }) {
	const { t, locale, scanResult } = page;
	const [cameraOn, setCameraOn] = useState(false);
	const resultAttendee = scanResult && "attendeeId" in scanResult ? page.attendees.find(attendee => attendee.id === scanResult.attendeeId) : undefined;

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="space-y-3">
				{cameraOn ? (
					<QRScanner active={cameraOn} onScan={text => void page.handleScan(text)} />
				) : (
					<div className="mx-auto flex aspect-square w-full max-w-sm flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
						<Camera className="size-10" />
					</div>
				)}
				<div className="flex justify-center">
					<Button variant={cameraOn ? "outline" : "primary"} onClick={() => setCameraOn(on => !on)}>
						{cameraOn ? <VideoOff className="size-4" /> : <Video className="size-4" />}
						{cameraOn ? t.stopScanning : t.startScanning}
					</Button>
				</div>
			</div>

			<ScanResultCard
				result={scanResult}
				attendee={resultAttendee}
				isProcessing={page.isProcessingScan}
				isUndoing={!!resultAttendee && page.pendingIds.has(resultAttendee.id)}
				onUndo={id => void page.undoScan(id)}
				t={t}
				locale={locale}
			/>
		</div>
	);
}

export default function CheckInsPage() {
	const page = useCheckInsPage();
	const { t, currentEventId, attendees, isLoading, loadError, searchTerm, statusFilter } = page;

	const hasFilters = searchTerm.trim() !== "" || statusFilter !== "all";
	const showLoadError = loadError !== null && attendees.length === 0 && !isLoading;

	const emptyState = hasFilters ? (
		<EmptyState
			className="border-0 py-6"
			icon={UserX}
			title={t.noMatches}
			action={
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						page.setSearchTerm("");
						page.setStatusFilter("all");
					}}
				>
					{t.clearFilters}
				</Button>
			}
		/>
	) : (
		<EmptyState className="border-0 py-6" icon={UserX} title={t.noAttendees} />
	);

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.description}
				actions={
					currentEventId ? (
						<Button variant="outline" size="sm" onClick={() => void page.loadAttendees()} disabled={isLoading}>
							<RotateCw className={cn("size-4", isLoading && "animate-spin")} />
							{t.refresh}
						</Button>
					) : undefined
				}
			/>

			{!currentEventId ? (
				<EmptyState icon={ClipboardCheck} title={t.noEventTitle} description={t.noEventDescription} />
			) : showLoadError ? (
				<EmptyState
					icon={CircleAlert}
					title={t.loadFailed}
					description={loadError ?? undefined}
					action={
						<Button variant="outline" size="sm" onClick={() => void page.loadAttendees()}>
							<RotateCw className="size-4" />
							{t.retry}
						</Button>
					}
				/>
			) : (
				<>
					<StatsSection stats={page.stats} t={t} />

					<Tabs defaultValue="scan">
						<TabsList>
							<TabsTrigger value="scan">
								<QrCode />
								{t.tabScan}
							</TabsTrigger>
							<TabsTrigger value="manual">
								<ClipboardCheck />
								{t.tabManual}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="scan" className="pt-4">
							<ScanPanel page={page} />
						</TabsContent>

						<TabsContent value="manual" className="pt-4">
							<AdminToolbar>
								<SearchInput value={searchTerm} onChange={page.setSearchTerm} placeholder={t.search} clearLabel={t.clearSearch} className="sm:w-96" />
								<Select value={statusFilter} onValueChange={value => page.setStatusFilter(value as StatusFilter)}>
									<SelectTrigger className="w-full sm:w-44" aria-label={t.filterLabel}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">{t.filterAll}</SelectItem>
										<SelectItem value="notCheckedIn">{t.filterNotCheckedIn}</SelectItem>
										<SelectItem value="checkedIn">{t.filterCheckedIn}</SelectItem>
									</SelectContent>
								</Select>
								<AdminToolbarSpacer />
							</AdminToolbar>

							<DataTable columns={page.columns} data={page.visibleRows} isLoading={isLoading && attendees.length === 0} getRowId={row => row.id} emptyState={emptyState} />
						</TabsContent>
					</Tabs>
				</>
			)}
		</main>
	);
}
