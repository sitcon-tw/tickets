"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatDateTime } from "@/lib/utils/timezone";
import type { EventFormField } from "@sitcontix/types";
import { Check, Copy, Pencil, Trash } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { RegistrationsT } from "./translations";
import { formatFormValue, getFormDataEntries, getReferrer, registrationStatuses, statusTone, type AdminRegistration, type FormDataEntry, type RegistrationStatus } from "./utils";

export type RegistrationChanges = { status?: RegistrationStatus; formData?: Record<string, unknown> };

type DetailDialogProps = {
	registration: AdminRegistration | null;
	ticketHash: string;
	formFields: EventFormField[];
	locale: string;
	t: RegistrationsT;
	onClose: () => void;
	/** Resolves to an error message, or null on success. */
	onSave: (registration: AdminRegistration, changes: RegistrationChanges) => Promise<string | null>;
	/** Resolves to true once the registration was deleted. */
	onDelete: (registration: AdminRegistration) => Promise<boolean>;
};

export function RegistrationDetailDialog(props: DetailDialogProps) {
	const { registration, onClose, t } = props;

	return (
		<Dialog open={registration !== null} onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t.registrationDetails}</DialogTitle>
					<DialogDescription className="break-all">{registration?.email}</DialogDescription>
				</DialogHeader>
				{registration && <DetailBody key={registration.id} {...props} registration={registration} />}
			</DialogContent>
		</Dialog>
	);
}

function initDrafts(registration: AdminRegistration): Record<string, string> {
	const drafts: Record<string, string> = {};
	for (const [key, value] of Object.entries(registration.formData ?? {})) {
		drafts[key] = typeof value === "string" ? value : (JSON.stringify(value ?? null) ?? "null");
	}
	return drafts;
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: ReactNode; className?: string }) {
	return (
		<div className={className}>
			<Label htmlFor={htmlFor} className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
				{label}
			</Label>
			<div className="text-sm">{children}</div>
		</div>
	);
}

function CopyButton({ text, label, copiedLabel, copied, onCopy }: { text: string; label: string; copiedLabel: string; copied: boolean; onCopy: (text: string) => void }) {
	return (
		<Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => onCopy(text)} aria-label={copied ? copiedLabel : label} title={copied ? copiedLabel : label}>
			{copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
		</Button>
	);
}

function DetailBody({ registration, ticketHash, formFields, locale, t, onClose, onSave, onDelete }: DetailDialogProps & { registration: AdminRegistration }) {
	const { showAlert } = useAlert();
	const confirm = useConfirm();

	const [isEditing, setIsEditing] = useState(false);
	const [status, setStatus] = useState<RegistrationStatus>(registration.status);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [copiedText, setCopiedText] = useState<string | null>(null);
	const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(copyTimer.current), []);

	const statusLabels: Record<RegistrationStatus, string> = { confirmed: t.confirmed, pending: t.pending, cancelled: t.cancelled };
	const entries = getFormDataEntries(registration.formData, formFields, locale);
	const busy = isSaving || isDeleting;
	const referrer = getReferrer(registration);

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedText(text);
			clearTimeout(copyTimer.current);
			copyTimer.current = setTimeout(() => setCopiedText(null), 2000);
		} catch {
			showAlert(`${t.copyFailed}: ${text}`, "error");
		}
	}

	function startEditing() {
		setStatus(registration.status);
		setDrafts(initDrafts(registration));
		setErrors({});
		setSaveError(null);
		setIsEditing(true);
	}

	function cancelEditing() {
		setIsEditing(false);
		setSaveError(null);
	}

	async function save() {
		const formData: Record<string, unknown> = { ...registration.formData };
		const nextErrors: Record<string, string> = {};
		let formChanged = false;

		for (const key of Object.keys(registration.formData ?? {})) {
			const original = registration.formData[key];
			const draft = drafts[key] ?? "";
			if (typeof original === "string") {
				if (draft !== original) {
					formData[key] = draft;
					formChanged = true;
				}
				continue;
			}
			try {
				const parsed: unknown = JSON.parse(draft);
				if (JSON.stringify(parsed) !== JSON.stringify(original ?? null)) {
					formData[key] = parsed;
					formChanged = true;
				}
			} catch {
				nextErrors[key] = t.invalidJson;
			}
		}

		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		const changes: RegistrationChanges = {};
		if (status !== registration.status) changes.status = status;
		if (formChanged) changes.formData = formData;
		if (Object.keys(changes).length === 0) {
			setIsEditing(false);
			return;
		}

		setIsSaving(true);
		setSaveError(null);
		const error = await onSave(registration, changes);
		setIsSaving(false);
		if (error) setSaveError(error);
		else setIsEditing(false);
	}

	async function remove() {
		const confirmed = await confirm({ title: t.deleteTitle, description: t.deleteConfirm.replace("{email}", registration.email), confirmLabel: t.deleteData, destructive: true });
		if (!confirmed) return;
		setIsDeleting(true);
		const deleted = await onDelete(registration);
		if (!deleted) setIsDeleting(false);
	}

	function renderEditor(entry: FormDataEntry) {
		const id = `form-${entry.key}`;
		const draft = drafts[entry.key] ?? "";
		const error = errors[entry.key];
		const isText = typeof registration.formData[entry.key] === "string";
		const setDraft = (value: string) => {
			setDrafts(prev => ({ ...prev, [entry.key]: value }));
			if (error) setErrors(prev => ({ ...prev, [entry.key]: "" }));
		};

		if (!isText) {
			return (
				<>
					<Textarea id={id} value={draft} onChange={e => setDraft(e.target.value)} disabled={busy} aria-invalid={!!error} className="font-mono text-xs" />
					<p className={error ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-muted-foreground"}>{error || t.jsonHint}</p>
				</>
			);
		}
		if (entry.field?.type === "textarea" || draft.includes("\n") || draft.length > 80) {
			return <Textarea id={id} value={draft} onChange={e => setDraft(e.target.value)} disabled={busy} />;
		}
		return <Input id={id} value={draft} onChange={e => setDraft(e.target.value)} disabled={busy} />;
	}

	return (
		<>
			<div className="space-y-5">
				<div className="grid gap-x-6 gap-y-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
					<Field label={t.id}>
						<div className="flex items-center gap-1">
							<span className="break-all font-mono text-xs">{registration.id}</span>
							<CopyButton text={registration.id} label={t.copy} copiedLabel={t.copied} copied={copiedText === registration.id} onCopy={copy} />
						</div>
					</Field>
					<Field label={t.email}>
						<div className="flex items-center gap-1">
							<span className="break-all">{registration.email}</span>
							<CopyButton text={registration.email} label={t.copy} copiedLabel={t.copied} copied={copiedText === registration.email} onCopy={copy} />
						</div>
					</Field>
					<Field label={t.status} htmlFor="registration-status">
						{isEditing ? (
							<Select value={status} onValueChange={value => setStatus(value as RegistrationStatus)} disabled={busy}>
								<SelectTrigger id="registration-status" className="w-full sm:w-48">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{registrationStatuses.map(value => (
										<SelectItem key={value} value={value}>
											{statusLabels[value]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<div className="flex flex-wrap items-center gap-1.5">
								<StatusBadge tone={statusTone(registration.status)}>{statusLabels[registration.status] ?? registration.status}</StatusBadge>
								<StatusBadge tone={registration.checkedIn ? "info" : "neutral"}>{registration.checkedIn ? t.checkedIn : t.notCheckedIn}</StatusBadge>
								{registration.checkedIn && registration.checkedInAt && <span className="text-xs tabular-nums text-muted-foreground">{formatDateTime(registration.checkedInAt)}</span>}
							</div>
						)}
					</Field>
					{registration.ticket && (
						<Field label={t.ticket}>
							<div>{getLocalizedText(registration.ticket.name, locale)}</div>
							<div className="text-muted-foreground">{registration.ticket.price > 0 ? `${t.price}: $${registration.ticket.price}` : t.free}</div>
						</Field>
					)}
					{registration.event && (
						<Field label={t.event}>
							<div>{getLocalizedText(registration.event.name, locale)}</div>
							{registration.event.startDate && (
								<div className="text-muted-foreground">
									{formatDateTime(registration.event.startDate)} - {formatDateTime(registration.event.endDate)}
								</div>
							)}
						</Field>
					)}
					{referrer && (
						<Field label={t.referredBy}>
							<span className="break-all">{referrer}</span>
						</Field>
					)}
					<Field label={t.createdAt}>{formatDateTime(registration.createdAt)}</Field>
					<Field label={t.updatedAt}>{formatDateTime(registration.updatedAt)}</Field>
				</div>

				{ticketHash && (
					<div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-4 sm:flex-row">
						<div className="shrink-0 rounded-lg bg-white p-2">
							<QRCodeSVG value={ticketHash} size={96} />
						</div>
						<div className="min-w-0 flex-1">
							<p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.ticketToken}</p>
							<div className="flex items-start gap-1">
								<span className="break-all font-mono text-xs">{ticketHash}</span>
								<CopyButton text={ticketHash} label={t.copy} copiedLabel={t.copied} copied={copiedText === ticketHash} onCopy={copy} />
							</div>
						</div>
					</div>
				)}

				<section className="rounded-xl border bg-card p-4">
					<h3 className="mb-3 text-sm font-semibold">{t.formData}</h3>
					{entries.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t.noFormData}</p>
					) : isEditing ? (
						<div className="space-y-4">
							{entries.map(entry => (
								<div key={entry.key} className="space-y-1.5">
									<Label htmlFor={`form-${entry.key}`}>{entry.label}</Label>
									{renderEditor(entry)}
								</div>
							))}
						</div>
					) : (
						<dl className="space-y-3">
							{entries.map(entry => {
								const text = formatFormValue(entry.field, entry.value, locale);
								return (
									<div key={entry.key} className="grid gap-0.5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
										<dt className="text-sm text-muted-foreground">{entry.label}</dt>
										<dd className="whitespace-pre-wrap break-words text-sm">{text || <span className="text-muted-foreground">{t.emptyValue}</span>}</dd>
									</div>
								);
							})}
						</dl>
					)}
				</section>

				{saveError && (
					<p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{t.saveError}: {saveError}
					</p>
				)}
			</div>

			<DialogFooter className="sm:justify-between">
				{isEditing ? (
					<>
						<span className="hidden sm:block" />
						<div className="flex flex-col-reverse gap-2 sm:flex-row">
							<Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
								{t.cancel}
							</Button>
							<Button variant="primary" onClick={save} isLoading={isSaving}>
								{t.save}
							</Button>
						</div>
					</>
				) : (
					<>
						<Button variant="destructive" onClick={remove} isLoading={isDeleting} disabled={busy}>
							{!isDeleting && <Trash className="size-4" />}
							{t.deleteData}
						</Button>
						<div className="flex flex-col-reverse gap-2 sm:flex-row">
							<Button variant="outline" onClick={onClose} disabled={busy}>
								{t.close}
							</Button>
							<Button variant="primary" onClick={startEditing} disabled={busy}>
								<Pencil className="size-4" />
								{t.edit}
							</Button>
						</div>
					</>
				)}
			</DialogFooter>
		</>
	);
}
