"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminInvitationCodesAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import type { Ticket } from "@sitcontix/types";
import { useLocale } from "next-intl";
import { useState } from "react";

import { errorMessage, parseTaipeiInput, runInChunks } from "./lib";

type Mode = "generate" | "import";

type CreateCodesDialogProps = {
	tickets: Ticket[];
	onClose: () => void;
	/** Called after at least one code was created so the page can reload. */
	onCreated: () => Promise<void>;
};

const maxGenerateCount = 100;

export function CreateCodesDialog({ tickets, onClose, onCreated }: CreateCodesDialogProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const t = getTranslations(locale, {
		title: { "zh-Hant": "新增邀請碼", "zh-Hans": "新增邀请码", en: "Add invitation codes" },
		description: {
			"zh-Hant": "為指定票種自動產生一批邀請碼，或匯入自訂的邀請碼。",
			"zh-Hans": "为指定票种自动生成一批邀请码，或导入自定义的邀请码。",
			en: "Generate a batch of random codes for a ticket, or import your own codes."
		},
		generate: { "zh-Hant": "自動產生", "zh-Hans": "自动生成", en: "Generate" },
		import: { "zh-Hant": "匯入", "zh-Hans": "导入", en: "Import" },
		ticketType: { "zh-Hant": "限用票種", "zh-Hans": "限用票种", en: "Ticket type" },
		ticketHelp: { "zh-Hant": "邀請碼只能用於這個票種。", "zh-Hans": "邀请码只能用于这个票种。", en: "The codes can only be redeemed for this ticket." },
		pleaseSelectTicket: { "zh-Hant": "請選擇票種", "zh-Hans": "请选择票种", en: "Select a ticket" },
		noTickets: { "zh-Hant": "此活動尚未建立票種，請先新增票種。", "zh-Hans": "此活动尚未创建票种，请先新增票种。", en: "This event has no tickets yet. Create a ticket first." },
		name: { "zh-Hant": "群組名稱", "zh-Hans": "分组名称", en: "Group name" },
		nameHelp: { "zh-Hant": "用來分辨這批邀請碼，例如發放對象。", "zh-Hans": "用来区分这批邀请码，例如发放对象。", en: "Helps you tell batches apart, e.g. who they are for." },
		namePlaceholder: { "zh-Hant": "例如：VIP Media", "zh-Hans": "例如：VIP Media", en: "e.g. VIP Media" },
		optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
		count: { "zh-Hant": "產生數量", "zh-Hans": "生成数量", en: "Number of codes" },
		countHelp: { "zh-Hant": "每次最多 {max} 個，會產生 6 碼隨機代碼。", "zh-Hans": "每次最多 {max} 个，会生成 6 位随机代码。", en: "Up to {max} at a time, each a random 6-character code." },
		uploadFile: { "zh-Hant": "上傳文字檔（.txt / .csv）", "zh-Hans": "上传文本文件（.txt / .csv）", en: "Upload a text file (.txt / .csv)" },
		codes: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Codes" },
		codesHelp: { "zh-Hant": "每行一個邀請碼，重複的代碼會自動略過。", "zh-Hans": "每行一个邀请码，重复的代码会自动忽略。", en: "One code per line. Duplicates are ignored." },
		codesPlaceholder: {
			"zh-Hant": "每行一個邀請碼\n例如：\nVIP2026A\nVIP2026B",
			"zh-Hans": "每行一个邀请码\n例如：\nVIP2026A\nVIP2026B",
			en: "One code per line\nExample:\nVIP2026A\nVIP2026B"
		},
		codeCount: { "zh-Hant": "共 {count} 個邀請碼", "zh-Hans": "共 {count} 个邀请码", en: "{count} codes" },
		usageLimit: { "zh-Hant": "每個邀請碼可使用次數", "zh-Hans": "每个邀请码可使用次数", en: "Uses per code" },
		unlimited: { "zh-Hant": "不限次數", "zh-Hans": "不限次数", en: "Unlimited" },
		validFrom: { "zh-Hant": "生效時間（UTC+8）", "zh-Hans": "生效时间（UTC+8）", en: "Valid from (UTC+8)" },
		validUntil: { "zh-Hant": "到期時間（UTC+8）", "zh-Hans": "到期时间（UTC+8）", en: "Valid until (UTC+8)" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		submitGenerate: { "zh-Hant": "產生邀請碼", "zh-Hans": "生成邀请码", en: "Generate codes" },
		submitImport: { "zh-Hant": "匯入邀請碼", "zh-Hans": "导入邀请码", en: "Import codes" },
		errTicket: { "zh-Hant": "請選擇票種。", "zh-Hans": "请选择票种。", en: "Please select a ticket." },
		errName: { "zh-Hant": "請輸入群組名稱。", "zh-Hans": "请输入分组名称。", en: "Please enter a group name." },
		errCount: { "zh-Hant": "產生數量須為 1 到 {max} 之間的整數。", "zh-Hans": "生成数量须为 1 到 {max} 之间的整数。", en: "The number of codes must be a whole number between 1 and {max}." },
		errLimit: { "zh-Hant": "使用次數須為大於 0 的整數。", "zh-Hans": "使用次数须为大于 0 的整数。", en: "Uses per code must be a whole number greater than 0." },
		errNoCodes: { "zh-Hant": "請輸入至少一個邀請碼。", "zh-Hans": "请输入至少一个邀请码。", en: "Please enter at least one code." },
		errUntilPast: { "zh-Hant": "到期時間必須是未來時間。", "zh-Hans": "到期时间必须是未来时间。", en: "The expiry time must be in the future." },
		errFromPast: {
			"zh-Hant": "生效時間必須是未來時間，若要立即生效請留空。",
			"zh-Hans": "生效时间必须是未来时间，若要立即生效请留空。",
			en: "The start time must be in the future. Leave it empty to start immediately."
		},
		errOrder: { "zh-Hant": "生效時間必須早於到期時間。", "zh-Hans": "生效时间必须早于到期时间。", en: "The start time must be before the expiry time." },
		createSuccess: { "zh-Hant": "已建立 {count} 個邀請碼", "zh-Hans": "已创建 {count} 个邀请码", en: "Created {count} invitation codes" },
		createFailed: { "zh-Hant": "建立失敗", "zh-Hans": "创建失败", en: "Failed to create codes" },
		importSuccess: { "zh-Hant": "已匯入 {count} 個邀請碼", "zh-Hans": "已导入 {count} 个邀请码", en: "Imported {count} invitation codes" },
		importPartial: {
			"zh-Hant": "已匯入 {success} 個，{failed} 個失敗，失敗的代碼已保留在欄位中。",
			"zh-Hans": "已导入 {success} 个，{failed} 个失败，失败的代码已保留在栏位中。",
			en: "Imported {success}, {failed} failed. The failed codes were kept in the box."
		}
	});

	const [mode, setMode] = useState<Mode>("generate");
	const [ticketId, setTicketId] = useState("");
	const [name, setName] = useState("");
	const [count, setCount] = useState("10");
	const [codesText, setCodesText] = useState("");
	const [usageLimit, setUsageLimit] = useState("1");
	const [unlimited, setUnlimited] = useState(false);
	const [validFrom, setValidFrom] = useState("");
	const [validUntil, setValidUntil] = useState("");
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const importCodes = Array.from(
		new Set(
			codesText
				.split(/[\r\n,]+/)
				.map(c => c.trim())
				.filter(Boolean)
		)
	);

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = event => setCodesText(String(event.target?.result ?? ""));
		reader.readAsText(file);
		e.target.value = "";
	}

	function validate() {
		if (!ticketId) return t.errTicket;
		if (mode === "generate") {
			if (!name.trim()) return t.errName;
			const n = Number(count);
			if (!Number.isInteger(n) || n < 1 || n > maxGenerateCount) return t.errCount.replace("{max}", String(maxGenerateCount));
		} else if (importCodes.length === 0) {
			return t.errNoCodes;
		}
		if (!unlimited) {
			const limit = Number(usageLimit);
			if (!Number.isInteger(limit) || limit < 1) return t.errLimit;
		}
		const from = parseTaipeiInput(validFrom);
		const until = parseTaipeiInput(validUntil);
		const now = Date.now();
		if (from && from.getTime() <= now) return t.errFromPast;
		if (until && until.getTime() <= now) return t.errUntilPast;
		if (from && until && from.getTime() >= until.getTime()) return t.errOrder;
		return "";
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (isSaving) return;

		const validationError = validate();
		setError(validationError);
		if (validationError) return;

		const limit = unlimited ? undefined : Number(usageLimit);
		const from = parseTaipeiInput(validFrom)?.toISOString();
		const until = parseTaipeiInput(validUntil)?.toISOString();

		setIsSaving(true);
		try {
			if (mode === "generate") {
				const response = await adminInvitationCodesAPI.bulkCreate({ ticketId, name: name.trim(), count: Number(count), usageLimit: limit, validFrom: from, validUntil: until });
				if (!response.success) throw new Error(t.createFailed);
				await onCreated();
				showAlert(t.createSuccess.replace("{count}", String(response.data?.count ?? count)), "success");
				onClose();
				return;
			}

			const results = await runInChunks(importCodes, async code => {
				try {
					await adminInvitationCodesAPI.create({ ticketId, code, name: name.trim() || undefined, usageLimit: limit, validFrom: from, validUntil: until });
					return { code, ok: true as const };
				} catch (err) {
					return { code, ok: false as const, reason: errorMessage(err) };
				}
			});
			const failed = results.filter(r => !r.ok);
			const successCount = results.length - failed.length;
			if (successCount > 0) await onCreated();

			if (failed.length === 0) {
				showAlert(t.importSuccess.replace("{count}", String(successCount)), "success");
				onClose();
				return;
			}

			const reasons = Array.from(new Set(failed.map(r => (r.ok ? "" : r.reason)))).join("; ");
			const message = successCount > 0 ? `${t.importPartial.replace("{success}", String(successCount)).replace("{failed}", String(failed.length))} (${reasons})` : `${t.createFailed}: ${reasons}`;
			setCodesText(failed.map(r => r.code).join("\n"));
			setError(message);
			showAlert(message, successCount > 0 ? "warning" : "error");
		} catch (err) {
			const message = `${t.createFailed}: ${errorMessage(err)}`;
			setError(message);
			showAlert(message, "error");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Dialog open onOpenChange={open => !open && !isSaving && onClose()}>
			<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t.title}</DialogTitle>
					<DialogDescription>{t.description}</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-5" noValidate>
					<Tabs value={mode} onValueChange={value => setMode(value as Mode)}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="generate">{t.generate}</TabsTrigger>
							<TabsTrigger value="import">{t.import}</TabsTrigger>
						</TabsList>
						<TabsContent value="generate" className="mt-3 grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="invite-name">{t.name} *</Label>
								<Input id="invite-name" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} />
								<p className="text-xs text-muted-foreground">{t.nameHelp}</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-count">{t.count} *</Label>
								<Input id="invite-count" type="number" inputMode="numeric" min={1} max={maxGenerateCount} value={count} onChange={e => setCount(e.target.value)} />
								<p className="text-xs text-muted-foreground">{t.countHelp.replace("{max}", String(maxGenerateCount))}</p>
							</div>
						</TabsContent>
						<TabsContent value="import" className="mt-3 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="invite-import-name">
									{t.name} ({t.optional})
								</Label>
								<Input id="invite-import-name" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-file">{t.uploadFile}</Label>
								<Input id="invite-file" type="file" accept=".txt,.csv,text/plain,text/csv" onChange={handleFile} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-codes">{t.codes} *</Label>
								<Textarea id="invite-codes" value={codesText} onChange={e => setCodesText(e.target.value)} placeholder={t.codesPlaceholder} rows={8} className="font-mono" />
								<p className="text-xs text-muted-foreground">
									{t.codesHelp} {importCodes.length > 0 && t.codeCount.replace("{count}", String(importCodes.length))}
								</p>
							</div>
						</TabsContent>
					</Tabs>

					<div className="space-y-2">
						<Label htmlFor="invite-ticket">{t.ticketType} *</Label>
						<Select value={ticketId} onValueChange={setTicketId}>
							<SelectTrigger id="invite-ticket" className="w-full">
								<SelectValue placeholder={t.pleaseSelectTicket} />
							</SelectTrigger>
							<SelectContent>
								{tickets.map(ticket => (
									<SelectItem key={ticket.id} value={ticket.id}>
										{getLocalizedText(ticket.name, locale)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">{tickets.length === 0 ? t.noTickets : t.ticketHelp}</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="invite-limit">{t.usageLimit}</Label>
							<Input id="invite-limit" type="number" inputMode="numeric" min={1} value={usageLimit} onChange={e => setUsageLimit(e.target.value)} disabled={unlimited} />
							<div className="flex items-center gap-2">
								<Checkbox id="invite-unlimited" checked={unlimited} onCheckedChange={value => setUnlimited(!!value)} />
								<Label htmlFor="invite-unlimited" className="text-sm font-normal">
									{t.unlimited}
								</Label>
							</div>
						</div>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="invite-from">
									{t.validFrom} ({t.optional})
								</Label>
								<Input id="invite-from" type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-until">
									{t.validUntil} ({t.optional})
								</Label>
								<Input id="invite-until" type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
							</div>
						</div>
					</div>

					{error && (
						<p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</p>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
							{t.cancel}
						</Button>
						<Button type="submit" variant="primary" isLoading={isSaving} disabled={tickets.length === 0}>
							{mode === "generate" ? t.submitGenerate : t.submitImport}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
