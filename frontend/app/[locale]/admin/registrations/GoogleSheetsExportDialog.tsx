"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/contexts/AlertContext";
import { adminEventsAPI, adminRegistrationsAPI } from "@/lib/api/endpoints";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
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
	const [sheetsUrl, setSheetsUrl] = useState("");
	const [urlTouched, setUrlTouched] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exported, setExported] = useState(false);

	useEffect(() => {
		let cancelled = false;
		Promise.all([
			adminEventsAPI.getById(eventId).then(response => (response.success ? (response.data?.googleSheetsUrl ?? "") : "")),
			adminRegistrationsAPI.getServiceAccountEmail().then(response => (response.success ? (response.data?.email ?? null) : null))
		])
			.then(([url, email]) => {
				if (cancelled) return;
				setSheetsUrl(current => current || url);
				setServiceAccountEmail(email);
			})
			.catch(error => {
				console.error("Failed to load Google Sheets export info:", error);
			})
			.finally(() => {
				if (!cancelled) setIsLoadingInfo(false);
			});
		return () => {
			cancelled = true;
		};
	}, [eventId]);

	const trimmedUrl = sheetsUrl.trim();
	const urlInvalid = trimmedUrl !== "" && !sheetsUrlPattern.test(trimmedUrl);

	async function copyEmail() {
		if (!serviceAccountEmail) return;
		try {
			await navigator.clipboard.writeText(serviceAccountEmail);
			showAlert(t.copied, "success");
		} catch {
			showAlert(`${t.copyFailed}: ${serviceAccountEmail}`, "error");
		}
	}

	async function exportToSheets() {
		setUrlTouched(true);
		if (!trimmedUrl || urlInvalid || isExporting) return;

		setIsExporting(true);
		try {
			const response = await adminRegistrationsAPI.syncToGoogleSheets({ eventId, sheetsUrl: trimmedUrl });
			if (response.success) {
				showAlert(response.message || t.exportSuccessMsg, "success");
				setExported(true);
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
						onChange={e => {
							setSheetsUrl(e.target.value);
							setExported(false);
						}}
						onBlur={() => setUrlTouched(true)}
						disabled={isExporting}
						aria-invalid={urlTouched && urlInvalid}
					/>
					{urlTouched && urlInvalid && <p className="text-xs text-destructive">{t.sheetsUrlInvalid}</p>}
				</div>

				{exported && (
					<div role="status" className="flex items-center gap-2 rounded-lg border border-green-600/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
						<CheckCircle2 className="size-4 shrink-0" />
						{t.exportSuccessMsg}
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
				<Button variant="primary" onClick={exportToSheets} isLoading={isExporting} disabled={!trimmedUrl || urlInvalid}>
					{isExporting ? t.exporting : t.confirmExport}
				</Button>
			</DialogFooter>
		</>
	);
}
