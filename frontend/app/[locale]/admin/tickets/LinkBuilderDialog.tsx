"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import type { Ticket } from "@sitcontix/types";
import { Check, Copy } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

function buildDirectLink(ticketId: string, eventSlug: string, locale: string, inviteCode: string, refCode: string) {
	let link = `/${locale}/${eventSlug}/ticket/${ticketId}`;
	const params = new URLSearchParams();
	if (inviteCode.trim()) params.append("inv", inviteCode.trim());
	if (refCode.trim()) params.append("ref", refCode.trim());
	if (params.toString()) link += `?${params.toString()}`;

	return `${window.location.origin}${link}`;
}

function LinkBuilderContent({ ticket, eventSlug, onClose }: { ticket: Ticket; eventSlug: string; onClose: () => void }) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const t = getTranslations(locale, {
		linkBuilder: { "zh-Hant": "連結產生器", "zh-Hans": "链接生成器", en: "Link Builder" },
		linkDescription: {
			"zh-Hant": "產生此票種的直接連結，可選擇性加入邀請碼和推薦碼。",
			"zh-Hans": "生成此票种的直接链接，可选择性加入邀请码和推荐码。",
			en: "Generate a direct link to this ticket with optional invite and referral codes."
		},
		inviteCode: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Invite Code" },
		inviteCodeHint: {
			"zh-Hant": "此票種需要邀請碼，建議在連結中帶入。",
			"zh-Hans": "此票种需要邀请码，建议在链接中带入。",
			en: "This ticket requires an invite code, so you probably want to include one."
		},
		referralCode: { "zh-Hant": "推薦碼", "zh-Hans": "推荐码", en: "Referral Code" },
		optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
		generatedLink: { "zh-Hant": "產生的連結", "zh-Hans": "生成的链接", en: "Generated Link" },
		copyLink: { "zh-Hant": "複製連結", "zh-Hans": "复制链接", en: "Copy Link" },
		copied: { "zh-Hant": "已複製", "zh-Hans": "已复制", en: "Copied" },
		copyFailed: { "zh-Hant": "無法複製連結，請手動選取複製。", "zh-Hans": "无法复制链接，请手动选取复制。", en: "Could not copy the link. Please select and copy it manually." },
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" }
	});

	const [inviteCode, setInviteCode] = useState("");
	const [refCode, setRefCode] = useState("");
	const [copied, setCopied] = useState(false);

	const generatedLink = buildDirectLink(ticket.id, eventSlug, locale, inviteCode, refCode);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(generatedLink);
			setCopied(true);
			showAlert(t.copied, "success", 2000);
			window.setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy link:", error);
			showAlert(t.copyFailed, "error");
		}
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>{t.linkBuilder}</DialogTitle>
				<DialogDescription>{t.linkDescription}</DialogDescription>
			</DialogHeader>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="link-invite-code">
						{t.inviteCode} <span className="font-normal text-muted-foreground">({t.optional})</span>
					</Label>
					<Input id="link-invite-code" type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="VIP2026A" autoComplete="off" />
					{ticket.requireInviteCode && <p className="text-xs text-muted-foreground">{t.inviteCodeHint}</p>}
				</div>
				<div className="space-y-2">
					<Label htmlFor="link-ref-code">
						{t.referralCode} <span className="font-normal text-muted-foreground">({t.optional})</span>
					</Label>
					<Input id="link-ref-code" type="text" value={refCode} onChange={e => setRefCode(e.target.value)} placeholder="ABC123" autoComplete="off" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="link-generated">{t.generatedLink}</Label>
					<div className="flex gap-2">
						<Input id="link-generated" type="text" value={generatedLink} readOnly onFocus={e => e.currentTarget.select()} className="flex-1 font-mono text-sm" />
						<Button type="button" variant="primary" onClick={copyLink} className="shrink-0">
							{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
							{copied ? t.copied : t.copyLink}
						</Button>
					</div>
				</div>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onClose}>
					{t.close}
				</Button>
			</DialogFooter>
		</>
	);
}

type LinkBuilderDialogProps = {
	open: boolean;
	ticket: Ticket | null;
	eventSlug: string;
	onOpenChange: (open: boolean) => void;
};

export function LinkBuilderDialog({ open, ticket, eventSlug, onOpenChange }: LinkBuilderDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">{ticket && <LinkBuilderContent ticket={ticket} eventSlug={eventSlug} onClose={() => onOpenChange(false)} />}</DialogContent>
		</Dialog>
	);
}
