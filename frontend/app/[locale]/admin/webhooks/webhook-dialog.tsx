"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/contexts/AlertContext";
import { adminWebhooksAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { type WebhookEndpoint, type WebhookTestResponse } from "@sitcontix/types";
import { CheckCircle2, Eye, EyeOff, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { errorDetail, webhookEventTypes, type WebhookT } from "./translations";

const RESERVED_HEADERS = ["cookie", "authorization", "content-type", "content-length", "user-agent", "x-forwarded-for"];
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const PRINTABLE_ASCII_PATTERN = /^[\x20-\x7E]+$/;
const DEFAULT_EVENT_TYPES = ["registration_confirmed", "registration_cancelled"];

function validateUrl(value: string, t: WebhookT): string | null {
	const url = value.trim();
	if (!url) return t.urlRequired;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return t.urlInvalid;
	}
	if (parsed.protocol !== "https:") return t.urlNotHttps;
	return null;
}

function validateHeaderName(value: string, t: WebhookT): string | null {
	if (value.length > 128) return t.headerNameTooLong;
	if (!HEADER_NAME_PATTERN.test(value)) return t.headerNameInvalid;
	if (RESERVED_HEADERS.includes(value.toLowerCase())) return t.headerNameReserved;
	return null;
}

function validateHeaderValue(value: string, t: WebhookT): string | null {
	if (value.length > 512) return t.headerValueTooLong;
	if (!PRINTABLE_ASCII_PATTERN.test(value)) return t.headerValueInvalid;
	return null;
}

type FormErrors = { url?: string; headerName?: string; headerValue?: string; eventTypes?: string };

function WebhookForm({ eventId, webhook, t, onClose, onSaved }: { eventId: string; webhook: WebhookEndpoint | null; t: WebhookT; onClose: () => void; onSaved: (webhook: WebhookEndpoint) => void }) {
	const { showAlert } = useAlert();
	const originalHeaderName = webhook?.authHeaderName ?? "";

	const [url, setUrl] = useState(webhook?.url ?? "");
	const [headerName, setHeaderName] = useState(originalHeaderName);
	const [headerValue, setHeaderValue] = useState("");
	const [showValue, setShowValue] = useState(false);
	const [eventTypes, setEventTypes] = useState<Set<string>>(() => new Set(webhook?.eventTypes ?? DEFAULT_EVENT_TYPES));
	const [submitted, setSubmitted] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [testResult, setTestResult] = useState<WebhookTestResponse | null>(null);

	const trimmedUrl = url.trim();
	const trimmedName = headerName.trim();

	const errors: FormErrors = {};
	errors.url = validateUrl(url, t) ?? undefined;
	if (trimmedName) {
		errors.headerName = validateHeaderName(trimmedName, t) ?? undefined;
		if (!errors.headerName && !headerValue) {
			// An existing secret can only be kept when the name is unchanged
			if (!webhook || trimmedName !== originalHeaderName) errors.headerValue = webhook && originalHeaderName ? t.headerValueRequiredOnRename : t.headerValueRequired;
		}
	}
	if (headerValue) {
		errors.headerValue = errors.headerValue ?? validateHeaderValue(headerValue, t) ?? undefined;
		if (!trimmedName) errors.headerName = t.headerNameRequired;
	}
	if (eventTypes.size === 0) errors.eventTypes = t.eventTypesRequired;

	const visibleErrors = submitted ? errors : {};

	const clearTest = () => setTestResult(null);

	const toggleEventType = (value: string) => {
		setEventTypes(prev => {
			const next = new Set(prev);
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return next;
		});
	};

	const handleTest = async () => {
		setSubmitted(true);
		if (errors.url || errors.headerName || errors.headerValue) return;

		setIsTesting(true);
		setTestResult(null);
		try {
			const response = await adminWebhooksAPI.test(eventId, {
				url: trimmedUrl,
				authHeaderName: trimmedName && headerValue ? trimmedName : undefined,
				authHeaderValue: trimmedName && headerValue ? headerValue : undefined
			});
			if (response.success && response.data) {
				setTestResult(response.data);
			} else {
				showAlert(`${t.testError}${response.message ? `: ${response.message}` : ""}`, "error");
			}
		} catch (error) {
			showAlert(`${t.testError}${errorDetail(error)}`, "error");
		} finally {
			setIsTesting(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		if (errors.url || errors.headerName || errors.headerValue || errors.eventTypes) return;

		// Preserve the order of the defined event types so the payload is stable
		const selectedTypes = webhookEventTypes.map(type => type.value).filter(value => eventTypes.has(value));

		setIsSaving(true);
		try {
			let response;
			if (webhook) {
				// The stored secret is masked by the API, so it is only sent when a new value is entered
				// or explicitly cleared (name removed); it must never be overwritten with an empty value.
				let auth: { authHeaderName?: string | null; authHeaderValue?: string | null } = {};
				if (headerValue) auth = { authHeaderName: trimmedName, authHeaderValue: headerValue };
				else if (!trimmedName && originalHeaderName) auth = { authHeaderName: null, authHeaderValue: null };
				response = await adminWebhooksAPI.update(eventId, { url: trimmedUrl, eventTypes: selectedTypes, ...auth });
			} else {
				response = await adminWebhooksAPI.create(eventId, {
					url: trimmedUrl,
					authHeaderName: trimmedName && headerValue ? trimmedName : undefined,
					authHeaderValue: trimmedName && headerValue ? headerValue : undefined,
					eventTypes: selectedTypes
				});
			}

			if (response.success && response.data) {
				showAlert(webhook ? t.saved : t.created, "success");
				onSaved(response.data);
				onClose();
			} else {
				showAlert(`${t.saveFailed}${response.message ? `: ${response.message}` : ""}`, "error");
			}
		} catch (error) {
			showAlert(`${t.saveFailed}${errorDetail(error)}`, "error");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="space-y-5">
			<div className="space-y-2">
				<Label htmlFor="webhook-url">
					{t.webhookUrl}{" "}
					<span className="text-destructive" aria-hidden="true">
						*
					</span>
				</Label>
				<Input
					id="webhook-url"
					type="url"
					inputMode="url"
					autoComplete="off"
					placeholder={t.webhookUrlPlaceholder}
					value={url}
					onChange={e => {
						setUrl(e.target.value);
						clearTest();
					}}
					aria-invalid={!!visibleErrors.url}
					aria-describedby="webhook-url-help"
					required
				/>
				<p id="webhook-url-help" className={cn("text-xs", visibleErrors.url ? "text-destructive" : "text-muted-foreground")}>
					{visibleErrors.url ?? t.webhookUrlHelp}
				</p>
			</div>

			<fieldset className="space-y-3 rounded-lg border p-4">
				<legend className="px-1 text-sm font-bold">
					{t.authHeader} <span className="font-normal text-muted-foreground">({t.optional})</span>
				</legend>
				<p className="text-xs text-muted-foreground">{webhook && originalHeaderName ? t.authHeaderEditHelp : t.authHeaderHelp}</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="webhook-header-name" className="text-sm font-medium">
							{t.authHeaderName}
						</Label>
						<Input
							id="webhook-header-name"
							autoComplete="off"
							spellCheck={false}
							placeholder={t.authHeaderNamePlaceholder}
							value={headerName}
							onChange={e => {
								setHeaderName(e.target.value);
								clearTest();
							}}
							aria-invalid={!!visibleErrors.headerName}
							aria-describedby={visibleErrors.headerName ? "webhook-header-name-error" : undefined}
						/>
						{visibleErrors.headerName && (
							<p id="webhook-header-name-error" className="text-xs text-destructive">
								{visibleErrors.headerName}
							</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="webhook-header-value" className="text-sm font-medium">
							{t.authHeaderValue}
						</Label>
						<div className="relative">
							<Input
								id="webhook-header-value"
								type={showValue ? "text" : "password"}
								autoComplete="new-password"
								spellCheck={false}
								className="pr-10"
								placeholder={webhook && originalHeaderName ? t.authHeaderValueKeepPlaceholder : t.authHeaderValuePlaceholder}
								value={headerValue}
								onChange={e => {
									setHeaderValue(e.target.value);
									clearTest();
								}}
								aria-invalid={!!visibleErrors.headerValue}
								aria-describedby={visibleErrors.headerValue ? "webhook-header-value-error" : undefined}
							/>
							<button
								type="button"
								onClick={() => setShowValue(value => !value)}
								aria-label={showValue ? t.hideSecret : t.showSecret}
								title={showValue ? t.hideSecret : t.showSecret}
								className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
							>
								{showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
							</button>
						</div>
						{visibleErrors.headerValue && (
							<p id="webhook-header-value-error" className="text-xs text-destructive">
								{visibleErrors.headerValue}
							</p>
						)}
					</div>
				</div>
			</fieldset>

			<fieldset className="space-y-3">
				<legend className="text-sm font-bold">
					{t.eventTypes}{" "}
					<span className="text-destructive" aria-hidden="true">
						*
					</span>
				</legend>
				<p className="text-xs text-muted-foreground">{t.eventTypesHelp}</p>
				<div className="space-y-2">
					{webhookEventTypes.map(type => (
						<label
							key={type.value}
							htmlFor={`webhook-event-${type.value}`}
							className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50", eventTypes.has(type.value) && "border-primary/50 bg-primary/5")}
						>
							<Checkbox id={`webhook-event-${type.value}`} className="mt-0.5" checked={eventTypes.has(type.value)} onCheckedChange={() => toggleEventType(type.value)} />
							<span className="space-y-0.5">
								<span className="block text-sm font-medium leading-tight">{t[type.labelKey]}</span>
								<span className="block text-xs text-muted-foreground">{t[type.descKey]}</span>
							</span>
						</label>
					))}
				</div>
				{visibleErrors.eventTypes && (
					<p className="text-xs text-destructive" role="alert">
						{visibleErrors.eventTypes}
					</p>
				)}
			</fieldset>

			<div className="space-y-3 rounded-lg border bg-muted/30 p-4">
				<div className="flex flex-wrap items-center gap-3">
					<Button type="button" variant="outline" size="sm" onClick={handleTest} isLoading={isTesting} disabled={isSaving}>
						{!isTesting && <Send className="size-4" />}
						{t.testWebhook}
					</Button>
					<p className="min-w-0 flex-1 text-xs text-muted-foreground">{t.testHint}</p>
				</div>
				{testResult && (
					<div className={cn("space-y-2 rounded-lg border p-3 text-sm", testResult.success ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10")} role="status">
						<div className="flex items-center gap-2 font-medium">
							{testResult.success ? (
								<>
									<CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
									<span className="text-green-700 dark:text-green-400">{t.testSuccess}</span>
								</>
							) : (
								<>
									<XCircle className="size-4 text-red-600 dark:text-red-400" />
									<span className="text-red-700 dark:text-red-400">{t.testFailed}</span>
								</>
							)}
							{testResult.statusCode && <span className="font-mono text-xs text-muted-foreground">HTTP {testResult.statusCode}</span>}
						</div>
						{testResult.errorMessage && <p className="break-words text-red-700 dark:text-red-400">{testResult.errorMessage}</p>}
						{testResult.responseBody && (
							<div>
								<p className="mb-1 text-xs text-muted-foreground">{t.responseBody}</p>
								<pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{testResult.responseBody}</pre>
							</div>
						)}
					</div>
				)}
			</div>

			<DialogFooter>
				<Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
					{t.cancel}
				</Button>
				<Button type="submit" variant="primary" isLoading={isSaving}>
					{t.save}
				</Button>
			</DialogFooter>
		</form>
	);
}

export function WebhookDialog({
	open,
	onOpenChange,
	eventId,
	webhook,
	t,
	onSaved
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventId: string;
	webhook: WebhookEndpoint | null;
	t: WebhookT;
	onSaved: (webhook: WebhookEndpoint) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{webhook ? t.editWebhook : t.createWebhook}</DialogTitle>
					<DialogDescription>{webhook ? t.editDialogDesc : t.createDialogDesc}</DialogDescription>
				</DialogHeader>
				<WebhookForm eventId={eventId} webhook={webhook} t={t} onClose={() => onOpenChange(false)} onSaved={onSaved} />
			</DialogContent>
		</Dialog>
	);
}
