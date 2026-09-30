"use client";

import { useConfirm } from "@/components/admin/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";

import { errorMessage, runInChunks, type InviteRow } from "./lib";

type SendEmailDialogProps = {
	/** Codes chosen in the table. Disabled codes are ignored because the server refuses to send them. */
	codes: InviteRow[];
	onClose: () => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultMessage = "感謝您！以下是您的邀請碼：";

function EmailPreview({ email, code, ticketName, message }: { email: string; code: string; ticketName: string; message: string }) {
	return (
		<div className="max-h-[420px] overflow-y-auto rounded-lg border">
			<div style={{ background: "#e5e7eb", fontFamily: "sans-serif", padding: "32px 16px" }}>
				<div style={{ margin: "0 auto", maxWidth: "600px", background: "#f9fafb", padding: "32px 24px" }}>
					<h1 style={{ fontSize: "22px", margin: "0 0 24px", textAlign: "center", color: "#374151" }}>來自 SITCONTIX 的活動邀請碼</h1>
					<div style={{ color: "#6b7280", lineHeight: "150%", whiteSpace: "pre-wrap" }}>{message || defaultMessage}</div>
					<div style={{ background: "#9ca3af", padding: "12px 32px", margin: "24px auto", width: "fit-content", borderRadius: "12px" }}>
						<span style={{ fontWeight: "bold", fontFamily: "monospace", fontSize: "x-large", color: "#f3f4f6" }}>{code}</span>
					</div>
					<div style={{ color: "#6b7280", lineHeight: "150%" }}>
						<p>您可以將邀請碼用於兌換票種「{ticketName}」，請至報名系統頁面點選填入，或直接點選下面按鈕領票。</p>
						<p>請在有效期限前使用邀請碼，邀請碼逾期將失效，歡迎提前轉贈使用。</p>
					</div>
					<div style={{ background: "#6b7280", padding: "12px 32px", margin: "auto", width: "fit-content" }}>
						<span style={{ fontWeight: "bold", color: "#f3f4f6" }}>直接前往領票</span>
					</div>
				</div>
				<div style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginTop: "16px" }}>
					©SITCON
					<br />
					寄送給 {email}
				</div>
			</div>
		</div>
	);
}

export function SendEmailDialog({ codes, onClose }: SendEmailDialogProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const t = getTranslations(locale, {
		title: { "zh-Hant": "寄送邀請碼", "zh-Hans": "发送邀请码", en: "Email invitation codes" },
		description: {
			"zh-Hant": "依序將每個 Email 配對一個邀請碼並寄出，每個邀請碼只會寄給一個人。",
			"zh-Hans": "依序将每个 Email 配对一个邀请码并发送，每个邀请码只会发送给一个人。",
			en: "Each email address is paired with one code, in order. A code is only ever sent to one person."
		},
		emailList: { "zh-Hant": "Email 列表（每行一個）", "zh-Hans": "Email 列表（每行一个）", en: "Email addresses (one per line)" },
		emailPlaceholder: { "zh-Hant": "user1@example.com\nuser2@example.com", "zh-Hans": "user1@example.com\nuser2@example.com", en: "user1@example.com\nuser2@example.com" },
		available: {
			"zh-Hant": "可用邀請碼 {count} 個，已輸入 {emails} 個 Email。",
			"zh-Hans": "可用邀请码 {count} 个，已输入 {emails} 个 Email。",
			en: "{count} codes available, {emails} email addresses entered."
		},
		skipped: { "zh-Hant": "已略過 {count} 個已停用的邀請碼。", "zh-Hans": "已忽略 {count} 个已停用的邀请码。", en: "{count} disabled codes were skipped." },
		message: { "zh-Hant": "訊息內容（選填）", "zh-Hans": "消息内容（选填）", en: "Message (optional)" },
		messageHelp: {
			"zh-Hant": "支援 HTML，換行請使用 <br> 或 <p>。留空會使用預設訊息。",
			"zh-Hans": "支持 HTML，换行请使用 <br> 或 <p>。留空会使用默认消息。",
			en: "HTML is supported; use <br> or <p> for line breaks. Leave empty for the default message."
		},
		messagePlaceholder: { "zh-Hant": "<p>感謝您的協助！以下是您的邀請碼：</p>", "zh-Hans": "<p>感谢您的协助！以下是您的邀请码：</p>", en: "<p>Thanks for your help! Here is your code:</p>" },
		pairs: { "zh-Hant": "配對結果", "zh-Hans": "配对结果", en: "Pairing" },
		preview: { "zh-Hant": "預覽郵件", "zh-Hans": "预览邮件", en: "Preview email" },
		hidePreview: { "zh-Hant": "隱藏預覽", "zh-Hans": "隐藏预览", en: "Hide preview" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
		send: { "zh-Hant": "寄送 {count} 封", "zh-Hans": "发送 {count} 封", en: "Send {count} emails" },
		sending: { "zh-Hant": "寄送中...", "zh-Hans": "发送中...", en: "Sending..." },
		errNoEmails: { "zh-Hant": "請輸入至少一個 Email 地址。", "zh-Hans": "请输入至少一个 Email 地址。", en: "Please enter at least one email address." },
		errInvalid: { "zh-Hant": "以下 Email 格式不正確：{list}", "zh-Hans": "以下 Email 格式不正确：{list}", en: "These email addresses are not valid: {list}" },
		errTooMany: {
			"zh-Hant": "Email 數量（{emails}）超過可用邀請碼數量（{count}），請減少 Email 或選取更多邀請碼。",
			"zh-Hans": "Email 数量（{emails}）超过可用邀请码数量（{count}），请减少 Email 或选取更多邀请码。",
			en: "There are more email addresses ({emails}) than available codes ({count}). Remove some addresses or select more codes."
		},
		noCodes: { "zh-Hant": "所選的邀請碼都已停用，無法寄送。", "zh-Hans": "所选的邀请码都已停用，无法发送。", en: "All selected codes are disabled and cannot be sent." },
		confirmTitle: { "zh-Hant": "確定寄送 {count} 封郵件？", "zh-Hans": "确定发送 {count} 封邮件？", en: "Send {count} emails?" },
		confirmDescription: { "zh-Hant": "寄出後無法撤回。", "zh-Hans": "发送后无法撤回。", en: "Emails cannot be recalled once sent." },
		confirmLabel: { "zh-Hant": "寄送", "zh-Hans": "发送", en: "Send" },
		sendAllSuccess: { "zh-Hant": "已寄出 {count} 封郵件", "zh-Hans": "已发送 {count} 封邮件", en: "Sent {count} emails" },
		sendPartial: {
			"zh-Hant": "已寄出 {success} 封，{failed} 封失敗，失敗的 Email 已保留在欄位中。",
			"zh-Hans": "已发送 {success} 封，{failed} 封失败，失败的 Email 已保留在栏位中。",
			en: "Sent {success}, {failed} failed. The failed addresses were kept in the box."
		},
		sendFailed: { "zh-Hant": "寄送失敗", "zh-Hans": "发送失败", en: "Failed to send" }
	});

	const sendable = useMemo(() => codes.filter(c => c.isActive), [codes]);
	const skippedCount = codes.length - sendable.length;

	const [emailText, setEmailText] = useState("");
	const [message, setMessage] = useState("");
	const [showPreview, setShowPreview] = useState(false);
	const [sentCodeIds, setSentCodeIds] = useState<Set<string>>(new Set());
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState("");

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

	return (
		<Dialog open onOpenChange={open => !open && !isSending && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
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

						{showPreview && previewPair && <EmailPreview email={previewPair.email} code={previewPair.code.code} ticketName={previewPair.code.ticketName || "-"} message={message} />}

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
