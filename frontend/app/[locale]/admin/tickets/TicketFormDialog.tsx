"use client";

import MarkdownContent from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketsAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { formatDateTime, fromDateTimeLocalString, toDateTimeLocalString } from "@/lib/utils/timezone";
import type { LocalizedText, Ticket } from "@sitcontix/types";
import { useLocale } from "next-intl";
import React, { useReducer, useRef } from "react";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "zh-Hant", label: "繁體中文" },
	{ code: "zh-Hans", label: "简体中文" }
] as const;

type Lang = (typeof LANGUAGES)[number]["code"];
type TicketTab = "info" | Lang;
type LocalizedField = "name" | "description" | "plainDescription";
type LocalizedValues = Record<Lang, string>;

type FormValues = {
	name: LocalizedValues;
	description: LocalizedValues;
	plainDescription: LocalizedValues;
	price: string;
	quantity: string;
	saleStart: string;
	saleEnd: string;
	requireInviteCode: boolean;
	requireSmsVerification: boolean;
	hidden: boolean;
	showRemaining: boolean;
};

type FormState = {
	values: FormValues;
	activeTab: TicketTab;
	isSaving: boolean;
	submitted: boolean;
	submitError: string | null;
};

type FormAction =
	| { type: "patch"; patch: Partial<FormValues> }
	| { type: "setLocalized"; field: LocalizedField; lang: Lang; value: string }
	| { type: "setTab"; tab: TicketTab }
	| { type: "submitAttempt" }
	| { type: "saveStarted" }
	| { type: "saveFailed"; message: string }
	| { type: "saveFinished" };

const emptyLocalized = (): LocalizedValues => ({ en: "", "zh-Hant": "", "zh-Hans": "" });

function localizedFromTicket(value: LocalizedText | string | null | undefined): LocalizedValues {
	const source: LocalizedText = value && typeof value === "object" ? value : { en: value || "" };
	return { en: source.en || "", "zh-Hant": source["zh-Hant"] || "", "zh-Hans": source["zh-Hans"] || "" };
}

function initialFormState(ticket: Ticket | null): FormState {
	return {
		values: {
			name: ticket ? localizedFromTicket(ticket.name) : emptyLocalized(),
			description: ticket ? localizedFromTicket(ticket.description) : emptyLocalized(),
			plainDescription: ticket ? localizedFromTicket(ticket.plainDescription) : emptyLocalized(),
			price: ticket ? String(ticket.price) : "0",
			quantity: ticket ? String(ticket.quantity) : "100",
			saleStart: ticket?.saleStart ? toDateTimeLocalString(new Date(ticket.saleStart)) : "",
			saleEnd: ticket?.saleEnd ? toDateTimeLocalString(new Date(ticket.saleEnd)) : "",
			requireInviteCode: ticket?.requireInviteCode ?? false,
			requireSmsVerification: ticket?.requireSmsVerification ?? false,
			hidden: ticket?.hidden ?? false,
			showRemaining: ticket?.showRemaining !== false
		},
		activeTab: "info",
		isSaving: false,
		submitted: false,
		submitError: null
	};
}

function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case "patch":
			return { ...state, values: { ...state.values, ...action.patch } };
		case "setLocalized":
			return { ...state, values: { ...state.values, [action.field]: { ...state.values[action.field], [action.lang]: action.value } } };
		case "setTab":
			return { ...state, activeTab: action.tab };
		case "submitAttempt":
			return { ...state, submitted: true, submitError: null };
		case "saveStarted":
			return { ...state, isSaving: true, submitError: null };
		case "saveFailed":
			return { ...state, isSaving: false, submitError: action.message };
		case "saveFinished":
			return { ...state, isSaving: false };
	}
}

type FormErrors = Partial<Record<"nameEn" | "price" | "quantity" | "saleStart" | "saleEnd", string>>;

function compactLocalized(values: LocalizedValues, trim: boolean): LocalizedText {
	const result: LocalizedText = {};
	for (const { code } of LANGUAGES) {
		const value = trim ? values[code].trim() : values[code];
		if (value.trim()) result[code] = value;
	}
	return result;
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function FieldError({ id, message }: { id: string; message?: string }) {
	return message ? (
		<p id={`${id}-error`} role="alert" className="text-sm text-destructive">
			{message}
		</p>
	) : null;
}

function CheckboxRow({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (checked: boolean) => void; label: string; hint: string }) {
	return (
		<div className="flex items-start gap-3">
			<Checkbox id={id} className="mt-0.5" checked={checked} onCheckedChange={value => onChange(value === true)} />
			<div className="space-y-0.5">
				<Label htmlFor={id} className="cursor-pointer">
					{label}
				</Label>
				<p className="text-xs text-muted-foreground">{hint}</p>
			</div>
		</div>
	);
}

type TicketFormProps = {
	ticket: Ticket | null;
	eventId: string;
	/** Start of the event; ticket sales must end before it. */
	eventStart: Date | null;
	onSavingChange: (saving: boolean) => void;
	onClose: () => void;
	onSaved: () => Promise<void>;
};

function TicketForm({ ticket, eventId, eventStart, onSavingChange, onClose, onSaved }: TicketFormProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const t = getTranslations(locale, {
		addTicket: { "zh-Hant": "新增票種", "zh-Hans": "新增票种", en: "Add Ticket" },
		editTicket: { "zh-Hant": "編輯票種", "zh-Hans": "编辑票种", en: "Edit Ticket" },
		dialogDescription: {
			"zh-Hant": "設定票種的價格、數量、販售時間與多語言名稱。",
			"zh-Hans": "设置票种的价格、数量、贩售时间与多语言名称。",
			en: "Set the ticket's price, quantity, sale window and names in each language."
		},
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		basicInfo: { "zh-Hant": "基本設定", "zh-Hans": "基本设置", en: "Basics" },
		pricingSection: { "zh-Hant": "價格與數量", "zh-Hans": "价格与数量", en: "Price & quantity" },
		price: { "zh-Hant": "價格 (NT$)", "zh-Hans": "价格 (NT$)", en: "Price (NT$)" },
		priceHint: { "zh-Hant": "填 0 代表免費票。", "zh-Hans": "填 0 代表免费票。", en: "Enter 0 for a free ticket." },
		quantity: { "zh-Hant": "總數量", "zh-Hans": "总数量", en: "Total quantity" },
		quantityHint: { "zh-Hant": "已售出 {sold} 張，數量不能低於此數。", "zh-Hans": "已售出 {sold} 张，数量不能低于此数。", en: "{sold} already sold; the quantity cannot go below this." },
		saleSection: { "zh-Hant": "販售時間", "zh-Hans": "贩售时间", en: "Sale window" },
		saleHint: { "zh-Hant": "時間為 UTC+8（台北時間）。留空代表不限制。", "zh-Hans": "时间为 UTC+8（台北时间）。留空代表不限制。", en: "Times are UTC+8 (Taipei). Leave empty for no limit." },
		startTime: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start time" },
		endTime: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End time" },
		accessSection: { "zh-Hant": "存取與顯示", "zh-Hans": "访问与显示", en: "Access & visibility" },
		requireInviteCode: { "zh-Hant": "需要邀請碼", "zh-Hans": "需要邀请码", en: "Require invite code" },
		requireInviteCodeHint: { "zh-Hant": "只有輸入有效邀請碼的人才能購買。", "zh-Hans": "只有输入有效邀请码的人才能购买。", en: "Only people with a valid invite code can get this ticket." },
		requireSmsVerification: { "zh-Hant": "需要簡訊驗證", "zh-Hans": "需要短信验证", en: "Require SMS verification" },
		requireSmsVerificationHint: { "zh-Hant": "報名時需驗證手機號碼。", "zh-Hans": "报名时需验证手机号码。", en: "Attendees must verify their phone number when registering." },
		hideTicket: { "zh-Hant": "隱藏票種", "zh-Hans": "隐藏票种", en: "Hide ticket" },
		hideTicketHint: {
			"zh-Hant": "不在公開頁面顯示，僅能透過直接連結取得。",
			"zh-Hans": "不在公开页面显示，仅能通过直接链接获取。",
			en: "Not shown on public pages; only reachable through a direct link."
		},
		showRemaining: { "zh-Hant": "顯示剩餘票數", "zh-Hans": "显示剩余票数", en: "Show remaining tickets" },
		showRemainingHint: { "zh-Hant": "在公開頁面顯示還剩多少張票。", "zh-Hans": "在公开页面显示还剩多少张票。", en: "Show how many tickets are left on the public page." },
		ticketName: { "zh-Hant": "票種名稱", "zh-Hans": "票种名称", en: "Ticket name" },
		description: { "zh-Hant": "描述（Markdown）", "zh-Hans": "描述（Markdown）", en: "Description (Markdown)" },
		plainDescription: { "zh-Hant": "純文字描述（用於 Metadata）", "zh-Hans": "纯文字描述（用于 Metadata）", en: "Plain description (used for metadata)" },
		plainDescriptionHint: { "zh-Hant": "純文字描述，不含 Markdown 格式。", "zh-Hans": "纯文字描述，不含 Markdown 格式。", en: "Plain text without Markdown formatting." },
		preview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
		optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "optional" },
		hasErrors: { "zh-Hant": "此分頁有需要修正的欄位", "zh-Hans": "此分页有需要修正的字段", en: "This tab has fields to fix" },
		errNameRequired: { "zh-Hant": "請輸入英文票種名稱。", "zh-Hans": "请输入英文票种名称。", en: "Enter the English ticket name." },
		errPriceRequired: { "zh-Hant": "請輸入價格（免費請填 0）。", "zh-Hans": "请输入价格（免费请填 0）。", en: "Enter a price (0 for free)." },
		errPriceInvalid: { "zh-Hant": "價格必須是 0 或以上的整數。", "zh-Hans": "价格必须是 0 或以上的整数。", en: "Price must be a whole number, 0 or more." },
		errQuantityRequired: { "zh-Hant": "請輸入數量。", "zh-Hans": "请输入数量。", en: "Enter a quantity." },
		errQuantityInvalid: { "zh-Hant": "數量必須是整數。", "zh-Hans": "数量必须是整数。", en: "Quantity must be a whole number." },
		errQuantityMin: { "zh-Hant": "數量至少要有 1 張。", "zh-Hans": "数量至少要有 1 张。", en: "Quantity must be at least 1." },
		errQuantitySold: { "zh-Hant": "數量不能低於已售出的 {sold} 張。", "zh-Hans": "数量不能低于已售出的 {sold} 张。", en: "Quantity cannot be lower than the {sold} tickets already sold." },
		errDateInvalid: { "zh-Hant": "日期格式不正確。", "zh-Hans": "日期格式不正确。", en: "Enter a valid date and time." },
		errDateEndBeforeStart: { "zh-Hant": "結束時間必須晚於開始時間。", "zh-Hans": "结束时间必须晚于开始时间。", en: "End time must be later than the start time." },
		errSaleEndAfterEvent: {
			"zh-Hant": "結束時間不能晚於活動開始時間（{date}）。",
			"zh-Hans": "结束时间不能晚于活动开始时间（{date}）。",
			en: "End time cannot be later than the event start ({date})."
		},
		saveFailed: { "zh-Hant": "儲存失敗：", "zh-Hans": "保存失败：", en: "Could not save: " },
		created: { "zh-Hant": "票種已新增", "zh-Hans": "票种已新增", en: "Ticket created" },
		updated: { "zh-Hant": "票種已更新", "zh-Hans": "票种已更新", en: "Ticket updated" }
	});

	const [state, dispatch] = useReducer(formReducer, ticket, initialFormState);
	const { values, activeTab, isSaving, submitted, submitError } = state;
	const submitLock = useRef(false);
	const soldCount = ticket?.soldCount ?? 0;

	const errors: FormErrors = {};
	if (!values.name.en.trim()) errors.nameEn = t.errNameRequired;

	const priceText = values.price.trim();
	if (!priceText) errors.price = t.errPriceRequired;
	else if (!/^\d+$/.test(priceText)) errors.price = t.errPriceInvalid;

	const quantityText = values.quantity.trim();
	if (!quantityText) errors.quantity = t.errQuantityRequired;
	else if (!/^\d+$/.test(quantityText)) errors.quantity = t.errQuantityInvalid;
	else if (!ticket && Number(quantityText) < 1) errors.quantity = t.errQuantityMin;
	else if (ticket && Number(quantityText) < soldCount) errors.quantity = t.errQuantitySold.replace("{sold}", String(soldCount));

	const saleStart = values.saleStart ? fromDateTimeLocalString(values.saleStart) : null;
	const saleEnd = values.saleEnd ? fromDateTimeLocalString(values.saleEnd) : null;
	if (saleStart && Number.isNaN(saleStart.getTime())) errors.saleStart = t.errDateInvalid;
	if (saleEnd && Number.isNaN(saleEnd.getTime())) errors.saleEnd = t.errDateInvalid;
	if (!errors.saleEnd && saleStart && saleEnd && !Number.isNaN(saleStart.getTime()) && saleEnd <= saleStart) errors.saleEnd = t.errDateEndBeforeStart;
	if (!errors.saleEnd && saleEnd && eventStart && saleEnd > eventStart) errors.saleEnd = t.errSaleEndAfterEvent.replace("{date}", formatDateTime(eventStart));

	// Date range problems are shown as soon as both dates are filled in; everything else after the first submit attempt.
	const liveError = (field: keyof FormErrors) => (submitted || field === "saleEnd" ? errors[field] : undefined);
	const tabHasError = (tab: TicketTab) =>
		submitted && (tab === "en" ? Boolean(errors.nameEn) : tab === "info" ? Boolean(errors.price || errors.quantity || errors.saleStart || errors.saleEnd) : false);

	function focusField(id: string) {
		window.setTimeout(() => document.getElementById(id)?.focus(), 50);
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (submitLock.current) return;
		dispatch({ type: "submitAttempt" });

		const firstInfoError = (["price", "quantity", "saleStart", "saleEnd"] as const).find(field => errors[field]);
		if (firstInfoError) {
			dispatch({ type: "setTab", tab: "info" });
			focusField(`ticket-${firstInfoError}`);
			return;
		}
		if (errors.nameEn) {
			dispatch({ type: "setTab", tab: "en" });
			focusField("ticket-name-en");
			return;
		}

		submitLock.current = true;
		onSavingChange(true);
		dispatch({ type: "saveStarted" });

		const name = compactLocalized({ ...values.name, en: values.name.en.trim() }, true);
		const description = compactLocalized(values.description, false);
		const plainDescription = compactLocalized(values.plainDescription, false);
		const common = {
			name,
			description,
			plainDescription,
			price: Number(priceText),
			quantity: Number(quantityText),
			requireInviteCode: values.requireInviteCode,
			requireSmsVerification: values.requireSmsVerification,
			hidden: values.hidden,
			showRemaining: values.showRemaining,
			// null clears a sale boundary on update; on create an omitted value means "no limit"
			saleStart,
			saleEnd
		};

		try {
			if (ticket) {
				const response = await adminTicketsAPI.update(ticket.id, common);
				if (!response.success) throw new Error(response.message);
				showAlert(t.updated, "success");
			} else {
				const response = await adminTicketsAPI.create({ eventId, ...common, saleStart: saleStart ?? undefined, saleEnd: saleEnd ?? undefined });
				if (!response.success) throw new Error(response.message);
				showAlert(t.created, "success");
			}
		} catch (error) {
			dispatch({ type: "saveFailed", message: t.saveFailed + errorMessage(error) });
			submitLock.current = false;
			onSavingChange(false);
			return;
		}

		try {
			await onSaved();
		} finally {
			submitLock.current = false;
			onSavingChange(false);
			dispatch({ type: "saveFinished" });
			onClose();
		}
	}

	function fieldProps(id: string, error?: string) {
		return { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined };
	}

	const sectionClass = "space-y-4 rounded-xl border bg-muted/30 p-4";
	const sectionTitleClass = "text-sm font-semibold";

	return (
		<>
			<DialogHeader>
				<DialogTitle>{ticket ? t.editTicket : t.addTicket}</DialogTitle>
				<DialogDescription>{t.dialogDescription}</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit} noValidate className="space-y-4">
				<Tabs value={activeTab} onValueChange={value => dispatch({ type: "setTab", tab: value as TicketTab })}>
					<TabsList className="grid h-auto w-full grid-cols-4">
						<TabsTrigger value="info">
							{t.basicInfo}
							{tabHasError("info") && <span role="img" aria-label={t.hasErrors} className="size-1.5 rounded-full bg-destructive" />}
						</TabsTrigger>
						{LANGUAGES.map(({ code, label }) => (
							<TabsTrigger key={code} value={code}>
								{label}
								{tabHasError(code) && <span role="img" aria-label={t.hasErrors} className="size-1.5 rounded-full bg-destructive" />}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="info" className="space-y-4 pt-2">
						<section className={sectionClass}>
							<h3 className={sectionTitleClass}>{t.pricingSection}</h3>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="ticket-price">{t.price} *</Label>
									<Input
										{...fieldProps("ticket-price", liveError("price"))}
										type="number"
										inputMode="numeric"
										min={0}
										step={1}
										value={values.price}
										onChange={e => dispatch({ type: "patch", patch: { price: e.target.value } })}
									/>
									<FieldError id="ticket-price" message={liveError("price")} />
									{!liveError("price") && <p className="text-xs text-muted-foreground">{t.priceHint}</p>}
								</div>
								<div className="space-y-2">
									<Label htmlFor="ticket-quantity">{t.quantity} *</Label>
									<Input
										{...fieldProps("ticket-quantity", liveError("quantity"))}
										type="number"
										inputMode="numeric"
										min={ticket ? soldCount : 1}
										step={1}
										value={values.quantity}
										onChange={e => dispatch({ type: "patch", patch: { quantity: e.target.value } })}
									/>
									<FieldError id="ticket-quantity" message={liveError("quantity")} />
									{!liveError("quantity") && ticket && soldCount > 0 && <p className="text-xs text-muted-foreground">{t.quantityHint.replace("{sold}", String(soldCount))}</p>}
								</div>
							</div>
						</section>

						<section className={sectionClass}>
							<div className="space-y-1">
								<h3 className={sectionTitleClass}>{t.saleSection}</h3>
								<p className="text-xs text-muted-foreground">{t.saleHint}</p>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="ticket-saleStart">{t.startTime}</Label>
									<Input
										{...fieldProps("ticket-saleStart", liveError("saleStart"))}
										type="datetime-local"
										value={values.saleStart}
										onChange={e => dispatch({ type: "patch", patch: { saleStart: e.target.value } })}
									/>
									<FieldError id="ticket-saleStart" message={liveError("saleStart")} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="ticket-saleEnd">{t.endTime}</Label>
									<Input
										{...fieldProps("ticket-saleEnd", liveError("saleEnd"))}
										type="datetime-local"
										min={values.saleStart || undefined}
										value={values.saleEnd}
										onChange={e => dispatch({ type: "patch", patch: { saleEnd: e.target.value } })}
									/>
									<FieldError id="ticket-saleEnd" message={liveError("saleEnd")} />
								</div>
							</div>
						</section>

						<section className={sectionClass}>
							<h3 className={sectionTitleClass}>{t.accessSection}</h3>
							<div className="space-y-4">
								<CheckboxRow
									id="ticket-requireInviteCode"
									checked={values.requireInviteCode}
									onChange={checked => dispatch({ type: "patch", patch: { requireInviteCode: checked } })}
									label={t.requireInviteCode}
									hint={t.requireInviteCodeHint}
								/>
								<CheckboxRow
									id="ticket-requireSmsVerification"
									checked={values.requireSmsVerification}
									onChange={checked => dispatch({ type: "patch", patch: { requireSmsVerification: checked } })}
									label={t.requireSmsVerification}
									hint={t.requireSmsVerificationHint}
								/>
								<CheckboxRow id="ticket-hidden" checked={values.hidden} onChange={checked => dispatch({ type: "patch", patch: { hidden: checked } })} label={t.hideTicket} hint={t.hideTicketHint} />
								<CheckboxRow
									id="ticket-showRemaining"
									checked={values.showRemaining}
									onChange={checked => dispatch({ type: "patch", patch: { showRemaining: checked } })}
									label={t.showRemaining}
									hint={t.showRemainingHint}
								/>
							</div>
						</section>
					</TabsContent>

					{LANGUAGES.map(({ code, label }) => {
						const required = code === "en";
						const nameError = required ? liveError("nameEn") : undefined;
						return (
							<TabsContent key={code} value={code} className="space-y-4 pt-2">
								<div className="space-y-2">
									<Label htmlFor={`ticket-name-${code}`}>
										{t.ticketName} ({label}) {required ? "*" : <span className="font-normal text-muted-foreground">({t.optional})</span>}
									</Label>
									<Input
										{...fieldProps(`ticket-name-${code}`, nameError)}
										type="text"
										value={values.name[code]}
										onChange={e => dispatch({ type: "setLocalized", field: "name", lang: code, value: e.target.value })}
									/>
									<FieldError id={`ticket-name-${code}`} message={nameError} />
								</div>
								<div className="space-y-2">
									<Label htmlFor={`ticket-desc-${code}`}>
										{t.description} ({label}) <span className="font-normal text-muted-foreground">({t.optional})</span>
									</Label>
									<Textarea
										id={`ticket-desc-${code}`}
										rows={5}
										value={values.description[code]}
										onChange={e => dispatch({ type: "setLocalized", field: "description", lang: code, value: e.target.value })}
									/>
									{values.description[code].trim() && (
										<div className="rounded-lg border bg-muted/40 p-3">
											<div className="mb-2 text-xs font-semibold text-muted-foreground">{t.preview}</div>
											<MarkdownContent content={values.description[code]} />
										</div>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor={`ticket-plain-${code}`}>
										{t.plainDescription} ({label}) <span className="font-normal text-muted-foreground">({t.optional})</span>
									</Label>
									<Textarea
										id={`ticket-plain-${code}`}
										rows={3}
										value={values.plainDescription[code]}
										onChange={e => dispatch({ type: "setLocalized", field: "plainDescription", lang: code, value: e.target.value })}
										placeholder={t.plainDescriptionHint}
									/>
								</div>
							</TabsContent>
						);
					})}
				</Tabs>

				{submitError && (
					<p role="alert" className={cn("rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive")}>
						{submitError}
					</p>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
						{t.cancel}
					</Button>
					<Button type="submit" variant="primary" isLoading={isSaving}>
						{t.save}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}

type TicketFormDialogProps = {
	open: boolean;
	ticket: Ticket | null;
	eventId: string | null;
	eventStart: Date | null;
	onOpenChange: (open: boolean) => void;
	onSaved: () => Promise<void>;
};

export function TicketFormDialog({ open, ticket, eventId, eventStart, onOpenChange, onSaved }: TicketFormDialogProps) {
	const savingRef = useRef(false);

	function handleOpenChange(next: boolean) {
		// Don't let the dialog be dismissed while a save is in flight.
		if (!next && savingRef.current) return;
		onOpenChange(next);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				{eventId && (
					<TicketForm
						key={ticket?.id ?? "new"}
						ticket={ticket}
						eventId={eventId}
						eventStart={eventStart}
						onSavingChange={saving => {
							savingRef.current = saving;
						}}
						onClose={() => onOpenChange(false)}
						onSaved={onSaved}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
