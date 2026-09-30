"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/timezone";
import { type WebhookEndpoint } from "@sitcontix/types";
import { AlertTriangle, Check, Copy, ExternalLink, KeyRound, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { eventTypeLabel, type WebhookT } from "./translations";

const AUTO_DISABLE_PERIODS = 3;

export function CopyButton({ value, t, label }: { value: string; t: WebhookT; label?: string }) {
	const { showAlert } = useAlert();
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			showAlert(t.copyFailed, "error");
		}
	};

	return (
		<Button type="button" variant="ghost" size="sm" className="size-8 shrink-0 px-0" onClick={handleCopy} aria-label={label ?? t.copy} title={label ?? t.copy}>
			{copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
		</Button>
	);
}

function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={onChange}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
				checked ? "bg-primary" : "bg-input"
			)}
		>
			<span className={cn("pointer-events-none block size-5 rounded-full bg-background shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
		</button>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="space-y-1.5">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			{children}
		</div>
	);
}

export function WebhookCard({
	webhook,
	t,
	isToggling,
	onToggleActive,
	onEdit,
	onDelete
}: {
	webhook: WebhookEndpoint;
	t: WebhookT;
	isToggling: boolean;
	onToggleActive: () => void;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const autoDisabled = !webhook.isActive && webhook.consecutiveFailurePeriods >= AUTO_DISABLE_PERIODS;
	const failing = webhook.isActive && (webhook.consecutiveFailurePeriods > 0 || !!webhook.lastFailureAt);

	return (
		<section className="rounded-xl border bg-card">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:px-6">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold">{t.endpoint}</h2>
					{autoDisabled ? (
						<StatusBadge tone="danger">{t.autoDisabled}</StatusBadge>
					) : !webhook.isActive ? (
						<StatusBadge tone="neutral">{t.inactive}</StatusBadge>
					) : failing ? (
						<StatusBadge tone="warning">{t.failing}</StatusBadge>
					) : (
						<StatusBadge tone="success">{t.active}</StatusBadge>
					)}
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div className="hidden text-right sm:block">
							<p className="text-sm font-medium leading-none">{t.enabled}</p>
							<p className="mt-1 text-xs text-muted-foreground">{webhook.isActive ? t.toggleHelpOn : t.toggleHelpOff}</p>
						</div>
						<Toggle checked={webhook.isActive} disabled={isToggling} onChange={onToggleActive} label={t.enabled} />
					</div>
				</div>
			</div>

			{(autoDisabled || failing) && (
				<div
					className={cn(
						"mx-4 mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm sm:mx-6",
						autoDisabled ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
					)}
					role="status"
				>
					<AlertTriangle className="mt-0.5 size-4 shrink-0" />
					<p>{autoDisabled ? t.autoDisabledDesc : t.failingDesc.replace("{date}", webhook.lastFailureAt ? formatDateTime(webhook.lastFailureAt) : "-")}</p>
				</div>
			)}

			<div className="space-y-5 p-4 sm:p-6">
				<Field label={t.webhookUrl}>
					<div className="flex items-center gap-1 rounded-lg border bg-muted/40 py-1 pl-3 pr-1">
						<code className="min-w-0 flex-1 break-all py-1 font-mono text-sm">{webhook.url}</code>
						<CopyButton value={webhook.url} t={t} label={t.copyUrl} />
						<Button asChild variant="ghost" size="sm" className="size-8 shrink-0 px-0">
							<a href={webhook.url} target="_blank" rel="noopener noreferrer" aria-label={t.openUrl} title={t.openUrl}>
								<ExternalLink className="size-4" />
							</a>
						</Button>
					</div>
				</Field>

				<Field label={t.authHeader}>
					{webhook.authHeaderName ? (
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2">
							<KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							<code className="font-mono text-sm">{webhook.authHeaderName}</code>
							<code className="font-mono text-sm text-muted-foreground">{webhook.authHeaderValue}</code>
							<span className="text-xs text-muted-foreground">{t.secretStored}</span>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">{t.none}</p>
					)}
				</Field>

				<Field label={t.eventTypes}>
					<div className="flex flex-wrap gap-2">
						{webhook.eventTypes.map(type => (
							<StatusBadge key={type} tone="info" noDot>
								{eventTypeLabel(t, type)}
							</StatusBadge>
						))}
					</div>
				</Field>

				<dl className="grid gap-x-6 gap-y-3 border-t pt-4 text-sm sm:grid-cols-3">
					<div>
						<dt className="text-muted-foreground">{t.createdAt}</dt>
						<dd>{formatDateTime(webhook.createdAt)}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">{t.lastUpdated}</dt>
						<dd>{formatDateTime(webhook.updatedAt)}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">{t.lastFailure}</dt>
						<dd>{webhook.lastFailureAt ? formatDateTime(webhook.lastFailureAt) : t.none}</dd>
					</div>
				</dl>
			</div>

			<div className="flex flex-wrap justify-end gap-2 border-t bg-muted/20 p-4 sm:px-6">
				<Button variant="outline" size="sm" onClick={onEdit}>
					<Pencil className="size-4" />
					{t.editWebhook}
				</Button>
				<Button variant="destructive" size="sm" onClick={onDelete}>
					<Trash2 className="size-4" />
					{t.delete}
				</Button>
			</div>
		</section>
	);
}
