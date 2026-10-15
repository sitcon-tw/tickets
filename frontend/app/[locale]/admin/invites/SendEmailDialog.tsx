"use client";

import { useConfirm } from "@/components/admin/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import type { Ticket } from "@sitcontix/types";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { errorMessage, runInChunks, type InviteRow } from "./lib";

type SendEmailDialogProps = {
	/** Codes chosen in the table. Disabled, expired and used-up codes are skipped. */
	codes: InviteRow[];
	/** Used to show ticket names the way the email does (the email is always in Traditional Chinese). */
	tickets: Ticket[];
	eventId: string;
	onClose: () => void;
	/** Called once at least one email went out, so the page can clear its selection and reload. */
	onSent: () => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Codes in these states can still be redeemed (now or later), so they are worth emailing. */
const sendableStatuses = new Set<InviteRow["status"]>(["available", "scheduled"]);

// Mirrors backend/email-templates/invitation.html and the route that fills it in, which only exist in Traditional Chinese.
const emailLocale = "zh-Hant";
const defaultMessageHtml = "<p>感謝您！以下是您的邀請碼：</p>";

function escapeHtml(text: string) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Same rules as the server: plain text is escaped and split into paragraphs, anything that looks like HTML is used as HTML (the server also sanitizes it). */
function messageToHtml(message: string) {
	const trimmed = message.trim();
	if (!trimmed) return defaultMessageHtml;
	if (/<\/?[a-z][^>]*>/i.test(trimmed)) return trimmed;
	return trimmed
		.split(/\n{2,}/)
		.map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
		.join("");
}

type PreviewData = { email: string; code: string; eventName: string; ticketName: string; validUntil: string; message: string; imageUrl: string };

function buildPreviewHtml({ email, code, eventName, ticketName, validUntil, message, imageUrl }: PreviewData) {
	const text = "color:#6b7280;line-height:150%";
	return `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="UTF-8"><style>
.description p{margin:0 0 16px 0}.description ul,.description ol{margin:0 0 16px 20px;padding:0}.description a{color:#0090ff}
</style></head><body style="margin:0;background:#e5e7eb;font-family:sans-serif;padding:32px 16px">
<div style="margin:0 auto;max-width:600px;box-sizing:border-box"><div style="background:#f9fafb;padding:32px 24px">
<h1 style="color:#374151;font-size:24px;margin:16px 0 32px;text-align:center">來自 ${escapeHtml(eventName)} 的活動邀請碼</h1>
<div class="description" style="${text}"><p>${messageToHtml(message)}</p></div>
<div style="background:#9ca3af;padding:12px 32px;margin:32px auto;width:fit-content;border-radius:12px"><span style="font-weight:bold;font-family:monospace;font-size:x-large;color:#f3f4f6">${escapeHtml(code)}</span></div>
<div class="description" style="${text}"><p>您可以將邀請碼用於兌換票種「${escapeHtml(ticketName)}」，請至報名系統頁面點選填入，或直接點選下面按鈕領票。</p><p>請在 ${escapeHtml(validUntil)} 前使用邀請碼，邀請碼逾期將失效，歡迎提前轉贈使用。</p></div>
<div style="background:#6b7280;padding:12px 32px;margin:auto;width:fit-content"><span style="font-weight:bold;color:#f3f4f6">直接前往領票</span></div>
</div></div>
<img src="${escapeHtml(imageUrl)}" alt="" style="width:100%;max-width:600px;margin:0 auto 24px;display:block">
<div style="${text};font-size:14px;text-align:center">©SITCON<br>寄送給 ${escapeHtml(email)}</div>
</body></html>`;
}

export function SendEmailDialog({ codes, tickets, eventId, onClose, onSent }: SendEmailDialogProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const t = getTranslations(locale, {
		title: { "zh-Hant": "寄送邀請碼", en: "Email invitation codes" },
		description: {
			"zh-Hant": "依序將每個 Email 配對一個邀請碼並寄出，每個邀請碼只會寄給一個人。",
			en: "Each email address is paired with one code, in order. A code is only ever sent to one person."
		},
		emailList: { "zh-Hant": "Email 列表（每行一個）", en: "Email addresses (one per line)" },
		emailPlaceholder: { "zh-Hant": "user1@example.com\nuser2@example.com", en: "user1@example.com\nuser2@example.com" },
		available: {
			"zh-Hant": "可用邀請碼 {count} 個，已輸入 {emails} 個 Email。",
			en: "{count} codes available, {emails} email addresses entered."
		},
		skipped: {
			"zh-Hant": "已略過 {count} 個無法使用的邀請碼（已停用、已過期或已用完）。",
			en: "{count} codes were skipped because they are disabled, expired or used up."
		},
		message: { "zh-Hant": "訊息內容（選填）", en: "Message (optional)" },
		messageHelp: {
			"zh-Hant": "可輸入純文字（會保留換行）或 HTML。留空會使用預設訊息。",
			en: "Plain text (line breaks are kept) or HTML. Leave empty for the default message."
		},
		messagePlaceholder: { "zh-Hant": "<p>感謝您的協助！以下是您的邀請碼：</p>", en: "<p>Thanks for your help! Here is your code:</p>" },
		pairs: { "zh-Hant": "配對結果", en: "Pairing" },
		preview: { "zh-Hant": "預覽郵件", en: "Preview email" },
		hidePreview: { "zh-Hant": "隱藏預覽", en: "Hide preview" },
		previewTitle: { "zh-Hant": "郵件預覽", en: "Email preview" },
		previewNote: {
			"zh-Hant": "以第一位收件人為例。實際郵件內容固定為中文。",
			en: "Shown for the first recipient. The email itself is always sent in Traditional Chinese."
		},
		cancel: { "zh-Hant": "取消", en: "Cancel" },
		close: { "zh-Hant": "關閉", en: "Close" },
		send: { "zh-Hant": "寄送 {count} 封", en: "Send {count} emails" },
		sending: { "zh-Hant": "寄送中...", en: "Sending..." },
		errNoEmails: { "zh-Hant": "請輸入至少一個 Email 地址。", en: "Please enter at least one email address." },
		errInvalid: { "zh-Hant": "以下 Email 格式不正確：{list}", en: "These email addresses are not valid: {list}" },
		errTooMany: {
			"zh-Hant": "Email 數量（{emails}）超過可用邀請碼數量（{count}），請減少 Email 或選取更多邀請碼。",
			en: "There are more email addresses ({emails}) than available codes ({count}). Remove some addresses or select more codes."
		},
		noCodes: {
			"zh-Hant": "所選的邀請碼都已停用、已過期或已用完，無法寄送。",
			en: "All selected codes are disabled, expired or used up, so there is nothing to send."
		},
		confirmTitle: { "zh-Hant": "確定寄送 {count} 封郵件？", en: "Send {count} emails?" },
		confirmDescription: { "zh-Hant": "寄出後無法撤回。", en: "Emails cannot be recalled once sent." },
		confirmLabel: { "zh-Hant": "寄送", en: "Send" },
		sendAllSuccess: { "zh-Hant": "已寄出 {count} 封郵件", en: "Sent {count} emails" },
		sendPartial: {
			"zh-Hant": "已寄出 {success} 封，{failed} 封失敗，失敗的 Email 已保留在欄位中。",
			en: "Sent {success}, {failed} failed. The failed addresses were kept in the box."
		},
		sendFailed: { "zh-Hant": "寄送失敗", en: "Failed to send" }
	});

	const sendable = useMemo(() => codes.filter(c => sendableStatuses.has(c.status)), [codes]);
	const skippedCount = codes.length - sendable.length;

	const [emailText, setEmailText] = useState("");
	const [message, setMessage] = useState("");
	const [showPreview, setShowPreview] = useState(false);
	const [sentCodeIds, setSentCodeIds] = useState<Set<string>>(new Set());
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState("");
	const [eventName, setEventName] = useState("");

	// The email heading names the event, so fetch it once for the preview. Failing only degrades the preview.
	useEffect(() => {
		let cancelled = false;
		adminEventsAPI
			.getById(eventId)
			.then(response => {
				if (!cancelled && response.success) setEventName(getLocalizedText(response.data.name, emailLocale));
			})
			.catch(err => console.error("Failed to load event for the email preview:", err));
		return () => {
			cancelled = true;
		};
	}, [eventId]);

	const emailTicketNames = useMemo(() => new Map(tickets.map(ticket => [ticket.id, getLocalizedText(ticket.name, emailLocale)])), [tickets]);

	const remainingCodes = sendable.filter(c => !sentCodeIds.has(c.id));
	const emails = Array.from(
		new Set(
			emailText
				.split(/[\r\n,;]+/)
				.map(e => e.trim())
				.filter(Boolean)
		)
	);
	const invalidEmails = emails.filter(e => !emailPattern.test(e));
	const pairs = emails.filter(e => emailPattern.test(e)).map((email, index) => ({ email, code: remainingCodes[index] }));
	const validPairs = pairs.filter(p => p.code);

	function validate() {
		if (emails.length === 0) return t.errNoEmails;
		if (invalidEmails.length > 0) return t.errInvalid.replace("{list}", invalidEmails.slice(0, 3).join(", ") + (invalidEmails.length > 3 ? "..." : ""));
		if (emails.length > remainingCodes.length) return t.errTooMany.replace("{emails}", String(emails.length)).replace("{count}", String(remainingCodes.length));
		return "";
	}

	async function handleSend() {
		const validationError = validate();
		setError(validationError);
		if (validationError || isSending) return;

		const ok = await confirm({
			title: t.confirmTitle.replace("{count}", String(validPairs.length)),
			description: t.confirmDescription,
			confirmLabel: t.confirmLabel
		});
		if (!ok) return;

		setIsSending(true);
		try {
			const results = await runInChunks(validPairs, async pair => {
				try {
					const response = await fetch("/api/admin/invitation-codes/send-email", {
						method: "POST",
						credentials: "include",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email: pair.email, code: pair.code.code, ticketId: pair.code.ticketId, message: message.trim() })
					});
					if (!response.ok) {
						const body = await response.json().catch(() => null);
						throw new Error(body?.error?.message || body?.message || `HTTP ${response.status}`);
					}
					return { pair, ok: true as const };
				} catch (err) {
					return { pair, ok: false as const, reason: errorMessage(err) };
				}
			});

			const sent = results.filter(r => r.ok);
			const failed = results.filter(r => !r.ok);
			// Clear the table selection right away so codes that were just emailed cannot be picked up again by reopening this dialog.
			if (sent.length > 0) onSent();
			if (failed.length === 0) {
				showAlert(t.sendAllSuccess.replace("{count}", String(sent.length)), "success");
				onClose();
				return;
			}

			setSentCodeIds(prev => new Set([...prev, ...sent.map(r => r.pair.code.id)]));
			setEmailText(failed.map(r => r.pair.email).join("\n"));
			const reasons = Array.from(new Set(failed.map(r => (r.ok ? "" : r.reason)))).join("; ");
			const summary = sent.length > 0 ? t.sendPartial.replace("{success}", String(sent.length)).replace("{failed}", String(failed.length)) : t.sendFailed;
			setError(`${summary} (${reasons})`);
			showAlert(summary, sent.length > 0 ? "warning" : "error");
		} finally {
			setIsSending(false);
		}
	}

	const previewPair = validPairs[0];
	const previewHtml =
		showPreview && previewPair
			? buildPreviewHtml({
					email: previewPair.email,
					code: previewPair.code.code,
					eventName: eventName || "（活動名稱）",
					ticketName: emailTicketNames.get(previewPair.code.ticketId) || previewPair.code.ticketName || "-",
					// The server formats the date with zh-TW conventions.
					validUntil: previewPair.code.validUntil ? previewPair.code.validUntil.toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" }) : "無期限",
					message,
					imageUrl: `${window.location.origin}/assets/Mail.png`
				})
			: "";

	return (
		<Dialog open onOpenChange={open => !open && !isSending && onClose()}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t.title}</DialogTitle>
					<DialogDescription>{t.description}</DialogDescription>
				</DialogHeader>

				{sendable.length === 0 ? (
					<p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{t.noCodes}</p>
				) : (
					<div className="space-y-5">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="invite-email-list">{t.emailList}</Label>
								<Textarea
									id="invite-email-list"
									value={emailText}
									onChange={e => setEmailText(e.target.value)}
									placeholder={t.emailPlaceholder}
									rows={8}
									className="font-mono text-sm"
									disabled={isSending}
								/>
								<p className="text-xs text-muted-foreground">
									{t.available.replace("{count}", String(remainingCodes.length)).replace("{emails}", String(emails.length))}
									{skippedCount > 0 && ` ${t.skipped.replace("{count}", String(skippedCount))}`}
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-email-message">{t.message}</Label>
								<Textarea id="invite-email-message" value={message} onChange={e => setMessage(e.target.value)} placeholder={t.messagePlaceholder} rows={8} disabled={isSending} />
								<p className="text-xs text-muted-foreground">{t.messageHelp}</p>
							</div>
						</div>

						{validPairs.length > 0 && (
							<div className="space-y-2">
								<div className="flex items-center justify-between gap-2">
									<Label>
										{t.pairs} ({validPairs.length})
									</Label>
									<Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(v => !v)}>
										{showPreview ? t.hidePreview : t.preview}
									</Button>
								</div>
								<ul className="max-h-40 divide-y overflow-y-auto rounded-lg border bg-muted/40 text-sm">
									{validPairs.map(pair => (
										<li key={pair.email} className="flex items-center justify-between gap-3 px-3 py-1.5">
											<span className="truncate">{pair.email}</span>
											<span className="font-mono text-muted-foreground">{pair.code.code}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{showPreview && previewHtml && (
							<div className="space-y-2">
								<p className="text-xs text-muted-foreground">{t.previewNote}</p>
								<div className="overflow-hidden rounded-lg border bg-white">
									<iframe title={t.previewTitle} srcDoc={previewHtml} sandbox="" referrerPolicy="no-referrer" className="h-[420px] w-full border-0" />
								</div>
							</div>
						)}

						{error && (
							<p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{error}
							</p>
						)}
					</div>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
						{t.close}
					</Button>
					{sendable.length > 0 && (
						<Button type="button" variant="primary" onClick={handleSend} isLoading={isSending} disabled={validPairs.length === 0}>
							{isSending ? t.sending : t.send.replace("{count}", String(validPairs.length))}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
