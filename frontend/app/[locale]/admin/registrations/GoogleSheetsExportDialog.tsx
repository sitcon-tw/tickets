"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/contexts/AlertContext";
import { adminRegistrationsAPI } from "@/lib/api/endpoints";
import type { GoogleSheetsSettings } from "@sitcontix/types";
import { formatDateTime } from "@/lib/utils/timezone";
import { CheckCircle2, CircleAlert, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { RegistrationsT } from "./translations";
import { errorMessage } from "./utils";

type Props = {
	open: boolean;
	eventId: string | null;
	t: RegistrationsT;
	onClose: () => void;
};

const sheetsUrlPattern = /^https?:\/\/\S+\/spreadsheets\/d\/[\w-]+/;

function extractSpreadsheetId(url: string) {
	return url.match(/\/spreadsheets\/d\/([\w-]+)/)?.[1] ?? null;
}

export function GoogleSheetsExportDialog({ open, eventId, t, onClose }: Props) {
	return (
		<Dialog open={open} onOpenChange={value => !value && onClose()}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t.sheetsTitle}</DialogTitle>
					<DialogDescription>{t.sheetsDesc}</DialogDescription>
				</DialogHeader>
				{open && eventId && <SheetsForm key={eventId} eventId={eventId} t={t} onClose={onClose} />}
			</DialogContent>
		</Dialog>
	);
}

function SheetsForm({ eventId, t, onClose }: { eventId: string; t: RegistrationsT; onClose: () => void }) {
	const { showAlert } = useAlert();
	const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);
	const [isLoadingInfo, setIsLoadingInfo] = useState(true);
	const [settings, setSettings] = useState<GoogleSheetsSettings | null>(null);
	const [sheetsUrl, setSheetsUrl] = useState("");
	const [autoSync, setAutoSync] = useState(false);
	const [urlTouched, setUrlTouched] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [isTogglingAutoSync, setIsTogglingAutoSync] = useState(false);

	useEffect(() => {
		let cancelled = false;
		// Load independently so one failing request doesn't discard the other's result
		const loadSettings = adminRegistrationsAPI
			.getGoogleSheetsSettings(eventId)
			.then(response => {
				if (cancelled || !response.success || !response.data) return;
				const data = response.data;
				setSettings(data);
				setSheetsUrl(current => current || data.sheetsUrl || "");
				setAutoSync(data.autoSync);
			})
			.catch(error => console.error("Failed to load Google Sheets settings:", error));
		const loadEmail = adminRegistrationsAPI
			.getServiceAccountEmail()
			.then(response => {
				if (cancelled || !response.success) return;
				setServiceAccountEmail(response.data?.email || null);
			})
			.catch(error => console.error("Failed to load service account email:", error));
		void Promise.all([loadSettings, loadEmail]).finally(() => {
			if (!cancelled) setIsLoadingInfo(false);
		});
		return () => {
			cancelled = true;
		};
	}, [eventId]);

	const trimmedUrl = sheetsUrl.trim();
	const urlInvalid = trimmedUrl !== "" && !sheetsUrlPattern.test(trimmedUrl);
	// Toggling auto-sync applies right away only to the already saved sheet; for a new URL it is saved with the export
	const isSavedSheet = !!settings?.sheetsUrl && !urlInvalid && extractSpreadsheetId(settings.sheetsUrl) === extractSpreadsheetId(trimmedUrl);
	const busy = isExporting || isTogglingAutoSync;

	async function copyEmail() {
		if (!serviceAccountEmail) return;
		try {
			await navigator.clipboard.writeText(serviceAccountEmail);
			showAlert(t.copied, "success");
		} catch {
			showAlert(`${t.copyFailed}: ${serviceAccountEmail}`, "error");
		}
	}

	async function changeAutoSync(enabled: boolean) {
		if (!isSavedSheet) {
			setAutoSync(enabled);
			return;
		}

		setIsTogglingAutoSync(true);
		try {
			const response = await adminRegistrationsAPI.updateGoogleSheetsSettings({ eventId, autoSync: enabled });
			if (response.success && response.data) {
				setSettings(response.data);
				setAutoSync(response.data.autoSync);
				showAlert(enabled ? t.autoSyncOn : t.autoSyncOff, "success");
			} else {
				showAlert(`${t.autoSyncUpdateFailed}: ${response.message || t.unknownError}`, "error");
			}
		} catch (error) {
			console.error("Failed to update Google Sheets auto-sync:", error);
			showAlert(`${t.autoSyncUpdateFailed}: ${errorMessage(error, t.unknownError)}`, "error");
		} finally {
			setIsTogglingAutoSync(false);
		}
	}

	async function exportToSheets() {
		setUrlTouched(true);
		if (!trimmedUrl || urlInvalid || busy) return;

		setIsExporting(true);
		try {
			const response = await adminRegistrationsAPI.syncToGoogleSheets({ eventId, sheetsUrl: trimmedUrl, autoSync });
			if (response.success && response.data) {
				setSettings(response.data);
				setAutoSync(response.data.autoSync);
				setSheetsUrl(response.data.sheetsUrl ?? trimmedUrl);
				showAlert(response.message || t.exportSuccessMsg, "success");
			} else {
				showAlert(`${t.exportErrorMsg}: ${response.message || t.unknownError}`, "error");
			}
		} catch (error) {
			console.error("Failed to export to Google Sheets:", error);
			showAlert(`${t.exportErrorMsg}: ${errorMessage(error, t.unknownError)}`, "error");
		} finally {
			setIsExporting(false);
		}
	}

	function openSheet() {
		if (trimmedUrl && !urlInvalid) window.open(trimmedUrl, "_blank", "noopener,noreferrer");
	}

	return (
		<>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.serviceAccount}</Label>
					<div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2 pl-3">
						<span className="min-w-0 flex-1 break-all font-mono text-sm">
							{isLoadingInfo ? <span className="inline-block h-4 w-48 animate-pulse rounded bg-muted" /> : serviceAccountEmail || t.serviceAccountUnavailable}
						</span>
						<Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={copyEmail} disabled={!serviceAccountEmail} aria-label={t.copy} title={t.copy}>
							<Copy className="size-4" />
						</Button>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="sheetsUrl">{t.sheetsUrlLabel}</Label>
					<Input
						id="sheetsUrl"
						type="url"
						placeholder="https://docs.google.com/spreadsheets/d/..."
						value={sheetsUrl}
						onChange={e => setSheetsUrl(e.target.value)}
						onBlur={() => setUrlTouched(true)}
						disabled={busy}
						aria-invalid={urlTouched && urlInvalid}
					/>
					{urlTouched && urlInvalid && <p className="text-xs text-destructive">{t.sheetsUrlInvalid}</p>}
				</div>

				<label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
					<Checkbox className="mt-0.5" checked={autoSync} onCheckedChange={checked => changeAutoSync(checked === true)} disabled={busy || isLoadingInfo} />
					<span className="space-y-1">
						<span className="block text-sm font-medium">{t.autoSync}</span>
						<span className="block text-xs text-muted-foreground">{t.autoSyncDesc}</span>
					</span>
				</label>

				{isSavedSheet && settings && (
					<div role="status" className="space-y-2 text-sm">
						<p className="flex items-center gap-2 text-muted-foreground">
							<CheckCircle2 className="size-4 shrink-0" />
							{t.lastSynced}: {settings.lastSyncedAt ? formatDateTime(settings.lastSyncedAt) : t.neverSynced}
						</p>
						{settings.lastSyncError && (
							<p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive">
								<CircleAlert className="mt-0.5 size-4 shrink-0" />
								<span>
									{t.lastSyncFailed}: {settings.lastSyncError}
								</span>
							</p>
						)}
					</div>
				)}
			</div>

			<DialogFooter>
				<Button variant="outline" onClick={onClose} disabled={isExporting}>
					{t.close}
				</Button>
				<Button variant="outline" onClick={openSheet} disabled={!trimmedUrl || urlInvalid || isExporting}>
					<ExternalLink className="size-4" />
					{t.openSheets}
				</Button>
				<Button variant="primary" onClick={exportToSheets} isLoading={isExporting} disabled={!trimmedUrl || urlInvalid || isTogglingAutoSync}>
					{isExporting ? t.exporting : isSavedSheet ? t.syncNow : t.confirmExport}
				</Button>
			</DialogFooter>
		</>
	);
}
