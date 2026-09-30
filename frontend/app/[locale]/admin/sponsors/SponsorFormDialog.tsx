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
import { adminSponsorsAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { sponsorPlacements, type LocalizedText, type Sponsor, type SponsorPlacement } from "@sitcontix/types";
import { useLocale } from "next-intl";
import React, { useReducer, useRef } from "react";

const LANGUAGES = [
	{ code: "zh-Hant", label: "繁體中文" },
	{ code: "en", label: "English" },
	{ code: "zh-Hans", label: "简体中文" }
] as const;

type Lang = (typeof LANGUAGES)[number]["code"];
type SponsorTab = "info" | Lang;
type LocalizedValues = Record<Lang, string>;

type FormValues = {
	name: LocalizedValues;
	description: LocalizedValues;
	logoUrl: string;
	logoDarkUrl: string;
	websiteUrl: string;
	placements: SponsorPlacement[];
	isActive: boolean;
};

type FormState = {
	values: FormValues;
	activeTab: SponsorTab;
	isSaving: boolean;
	submitted: boolean;
	submitError: string | null;
};

type FormAction =
	| { type: "patch"; patch: Partial<FormValues> }
	| { type: "setLocalized"; field: "name" | "description"; lang: Lang; value: string }
	| { type: "setTab"; tab: SponsorTab }
	| { type: "submitAttempt" }
	| { type: "saveStarted" }
	| { type: "saveFailed"; message: string }
	| { type: "saveFinished" };

const emptyLocalized = (): LocalizedValues => ({ "zh-Hant": "", en: "", "zh-Hans": "" });

function localizedFromValue(value: LocalizedText | null | undefined): LocalizedValues {
	return { "zh-Hant": value?.["zh-Hant"] || "", en: value?.en || "", "zh-Hans": value?.["zh-Hans"] || "" };
}

function compactLocalized(values: LocalizedValues): LocalizedText {
	const result: LocalizedText = {};
	for (const { code } of LANGUAGES) {
		if (values[code].trim()) result[code] = values[code].trim();
	}
	return result;
}

function initialFormState(sponsor: Sponsor | null): FormState {
	return {
		values: {
			name: sponsor ? localizedFromValue(sponsor.name) : emptyLocalized(),
			description: sponsor ? localizedFromValue(sponsor.description) : emptyLocalized(),
			logoUrl: sponsor?.logoUrl ?? "",
			logoDarkUrl: sponsor?.logoDarkUrl ?? "",
			websiteUrl: sponsor?.websiteUrl ?? "",
			placements: sponsor?.placements ?? ["after_registration"],
			isActive: sponsor?.isActive ?? true
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

function isWebUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

type FormErrors = Partial<Record<"name" | "logoUrl" | "logoDarkUrl" | "websiteUrl" | "placements", string>>;

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

function LogoPreview({ url, dark, alt }: { url: string; dark?: boolean; alt: string }) {
	if (!isWebUrl(url.trim())) return null;
	return (
		<div className={cn("flex h-20 w-40 items-center justify-center rounded-lg border p-2", dark ? "bg-gray-900" : "bg-white")}>
			{/* oxlint-disable-next-line nextjs/no-img-element */}
			<img key={url} src={url.trim()} alt={alt} className="max-h-full max-w-full object-contain" />
		</div>
	);
}

type SponsorFormProps = {
	sponsor: Sponsor | null;
	eventId: string;
	onSavingChange: (saving: boolean) => void;
	onClose: () => void;
	onSaved: () => Promise<void>;
};

function SponsorForm({ sponsor, eventId, onSavingChange, onClose, onSaved }: SponsorFormProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const t = getTranslations(locale, {
		addSponsor: { "zh-Hant": "新增贊助商", "zh-Hans": "新增赞助商", en: "Add Sponsor" },
		editSponsor: { "zh-Hant": "編輯贊助商", "zh-Hans": "编辑赞助商", en: "Edit Sponsor" },
		dialogDescription: {
			"zh-Hant": "設定贊助商的 Logo、顯示位置，以及點擊 Logo 後彈出的介紹文案。",
			"zh-Hans": "设置赞助商的 Logo、显示位置，以及点击 Logo 后弹出的介绍文案。",
			en: "Set the sponsor's logo, where it appears, and the introduction shown when the logo is clicked."
		},
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		basicInfo: { "zh-Hant": "基本設定", "zh-Hans": "基本设置", en: "Basics" },
		logoSection: { "zh-Hant": "Logo", "zh-Hans": "Logo", en: "Logo" },
		logoUrl: { "zh-Hant": "Logo 圖片網址", "zh-Hans": "Logo 图片网址", en: "Logo image URL" },
		logoHint: {
			"zh-Hant": "請貼上 https 圖片連結（建議 PNG / SVG / WebP，背景透明，橫式，寬高比約 3:2，寬度至少 400px）。",
			"zh-Hans": "请贴上 https 图片链接（建议 PNG / SVG / WebP，背景透明，横式，宽高比约 3:2，宽度至少 400px）。",
			en: "Paste an https image link (PNG / SVG / WebP with a transparent background recommended, landscape, about 3:2, at least 400px wide)."
		},
		logoDarkUrl: { "zh-Hant": "深色模式 Logo 網址", "zh-Hans": "深色模式 Logo 网址", en: "Dark mode logo URL" },
		logoDarkHint: {
			"zh-Hant": "選填。Logo 在深色背景看不清楚時，可另外提供淺色版本。",
			"zh-Hans": "选填。Logo 在深色背景看不清楚时，可另外提供浅色版本。",
			en: "Optional. Provide a light version if the logo is hard to read on a dark background."
		},
		websiteUrl: { "zh-Hant": "官方網站", "zh-Hans": "官方网站", en: "Website" },
		websiteHint: {
			"zh-Hant": "選填。彈出視窗會顯示「前往官方網站」按鈕，並統計點擊數。",
			"zh-Hans": "选填。弹出窗口会显示「前往官方网站」按钮，并统计点击数。",
			en: "Optional. Adds a “Visit website” button to the popup and counts its clicks."
		},
		placementsSection: { "zh-Hant": "顯示位置", "zh-Hans": "显示位置", en: "Placement" },
		placementsHint: {
			"zh-Hant": "可複選。同一個位置的 Logo 會依列表順序排成等大的響應式網格。",
			"zh-Hans": "可多选。同一个位置的 Logo 会依列表顺序排成等大的响应式网格。",
			en: "Choose one or both. Logos in the same slot form an equal-size responsive grid, in list order."
		},
		afterRegistration: { "zh-Hant": "報名與票券區之後（第一順位）", "zh-Hans": "报名与票券区之后（第一顺位）", en: "After the registration & tickets area (primary)" },
		afterRegistrationHint: { "zh-Hant": "緊接票券選擇區，活動資訊之前。", "zh-Hans": "紧接票券选择区，活动资讯之前。", en: "Right below the ticket picker, before the event information." },
		afterEventInfo: { "zh-Hant": "活動資訊與票券資訊之間（第二順位）", "zh-Hans": "活动资讯与票券资讯之间（第二顺位）", en: "Between event information and ticket information (secondary)" },
		afterEventInfoHint: { "zh-Hant": "讀完活動介紹後才會看到。", "zh-Hans": "读完活动介绍后才会看到。", en: "Seen after reading the event description." },
		visibility: { "zh-Hant": "在活動頁面顯示", "zh-Hans": "在活动页面显示", en: "Show on the event page" },
		visibilityHint: { "zh-Hant": "取消勾選可暫時隱藏，數據會保留。", "zh-Hans": "取消勾选可暂时隐藏，数据会保留。", en: "Untick to hide it temporarily; its data is kept." },
		sponsorName: { "zh-Hant": "廠商名稱", "zh-Hans": "厂商名称", en: "Sponsor name" },
		description: { "zh-Hant": "介紹文案（Markdown）", "zh-Hans": "介绍文案（Markdown）", en: "Introduction (Markdown)" },
		descriptionHint: { "zh-Hant": "點擊 Logo 後在彈出視窗中顯示。", "zh-Hans": "点击 Logo 后在弹出窗口中显示。", en: "Shown in the popup when the logo is clicked." },
		preview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
		optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "optional" },
		hasErrors: { "zh-Hant": "此分頁有需要修正的欄位", "zh-Hans": "此分页有需要修正的字段", en: "This tab has fields to fix" },
		errNameRequired: { "zh-Hant": "請至少輸入一種語言的廠商名稱。", "zh-Hans": "请至少输入一种语言的厂商名称。", en: "Enter the sponsor name in at least one language." },
		errLogoRequired: { "zh-Hant": "請輸入 Logo 圖片網址。", "zh-Hans": "请输入 Logo 图片网址。", en: "Enter the logo image URL." },
		errUrlInvalid: {
			"zh-Hant": "請輸入以 http:// 或 https:// 開頭的有效網址。",
			"zh-Hans": "请输入以 http:// 或 https:// 开头的有效网址。",
			en: "Enter a valid URL starting with http:// or https://."
		},
		errPlacements: { "zh-Hant": "請至少選擇一個顯示位置。", "zh-Hans": "请至少选择一个显示位置。", en: "Choose at least one placement." },
		saveFailed: { "zh-Hant": "儲存失敗：", "zh-Hans": "保存失败：", en: "Could not save: " },
		created: { "zh-Hant": "贊助商已新增", "zh-Hans": "赞助商已新增", en: "Sponsor added" },
		updated: { "zh-Hant": "贊助商已更新", "zh-Hans": "赞助商已更新", en: "Sponsor updated" }
	});

	const [state, dispatch] = useReducer(formReducer, sponsor, initialFormState);
	const { values, activeTab, isSaving, submitted, submitError } = state;
	const submitLock = useRef(false);

	const errors: FormErrors = {};
	if (!LANGUAGES.some(({ code }) => values.name[code].trim())) errors.name = t.errNameRequired;
	const logoUrl = values.logoUrl.trim();
	if (!logoUrl) errors.logoUrl = t.errLogoRequired;
	else if (!isWebUrl(logoUrl)) errors.logoUrl = t.errUrlInvalid;
	const logoDarkUrl = values.logoDarkUrl.trim();
	if (logoDarkUrl && !isWebUrl(logoDarkUrl)) errors.logoDarkUrl = t.errUrlInvalid;
	const websiteUrl = values.websiteUrl.trim();
	if (websiteUrl && !isWebUrl(websiteUrl)) errors.websiteUrl = t.errUrlInvalid;
	if (values.placements.length === 0) errors.placements = t.errPlacements;

	const liveError = (field: keyof FormErrors) => (submitted ? errors[field] : undefined);
	const tabHasError = (tab: SponsorTab) => submitted && (tab === "info" ? Boolean(errors.logoUrl || errors.logoDarkUrl || errors.websiteUrl || errors.placements) : false);

	function focusField(id: string) {
		window.setTimeout(() => document.getElementById(id)?.focus(), 50);
	}

	function togglePlacement(placement: SponsorPlacement, checked: boolean) {
		const next = sponsorPlacements.filter(item => (item === placement ? checked : values.placements.includes(item)));
		dispatch({ type: "patch", patch: { placements: next } });
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (submitLock.current) return;
		dispatch({ type: "submitAttempt" });

		const firstInfoError = (["logoUrl", "logoDarkUrl", "websiteUrl", "placements"] as const).find(field => errors[field]);
		if (firstInfoError) {
			dispatch({ type: "setTab", tab: "info" });
			focusField(firstInfoError === "placements" ? "sponsor-placement-after_registration" : `sponsor-${firstInfoError}`);
			return;
		}
		if (errors.name) {
			const firstLang = LANGUAGES[0].code;
			dispatch({ type: "setTab", tab: firstLang });
			focusField(`sponsor-name-${firstLang}`);
			return;
		}

		submitLock.current = true;
		onSavingChange(true);
		dispatch({ type: "saveStarted" });

		const description = compactLocalized(values.description);
		const common = {
			name: compactLocalized(values.name),
			description,
			logoUrl,
			logoDarkUrl: logoDarkUrl || null,
			websiteUrl: websiteUrl || null,
			placements: values.placements,
			isActive: values.isActive
		};

		try {
			if (sponsor) {
				const response = await adminSponsorsAPI.update(sponsor.id, common);
				if (!response.success) throw new Error(response.message);
				showAlert(t.updated, "success");
			} else {
				const response = await adminSponsorsAPI.create(eventId, common);
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
	const placementOptions: { value: SponsorPlacement; label: string; hint: string }[] = [
		{ value: "after_registration", label: t.afterRegistration, hint: t.afterRegistrationHint },
		{ value: "after_event_info", label: t.afterEventInfo, hint: t.afterEventInfoHint }
	];

	return (
		<>
			<DialogHeader>
				<DialogTitle>{sponsor ? t.editSponsor : t.addSponsor}</DialogTitle>
				<DialogDescription>{t.dialogDescription}</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleSubmit} noValidate className="space-y-4">
				<Tabs value={activeTab} onValueChange={value => dispatch({ type: "setTab", tab: value as SponsorTab })}>
					<TabsList className="grid h-auto w-full grid-cols-4">
						<TabsTrigger value="info">
							{t.basicInfo}
							{tabHasError("info") && <span role="img" aria-label={t.hasErrors} className="size-1.5 rounded-full bg-destructive" />}
						</TabsTrigger>
						{LANGUAGES.map(({ code, label }) => (
							<TabsTrigger key={code} value={code}>
								{label}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="info" className="space-y-4 pt-2">
						<section className={sectionClass}>
							<h3 className={sectionTitleClass}>{t.logoSection}</h3>
							<div className="space-y-2">
								<Label htmlFor="sponsor-logoUrl">{t.logoUrl} *</Label>
								<Input
									{...fieldProps("sponsor-logoUrl", liveError("logoUrl"))}
									type="url"
									inputMode="url"
									placeholder="https://"
									value={values.logoUrl}
									onChange={e => dispatch({ type: "patch", patch: { logoUrl: e.target.value } })}
								/>
								<FieldError id="sponsor-logoUrl" message={liveError("logoUrl")} />
								{!liveError("logoUrl") && <p className="text-xs text-muted-foreground">{t.logoHint}</p>}
								<LogoPreview url={values.logoUrl} alt={t.logoUrl} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="sponsor-logoDarkUrl">
									{t.logoDarkUrl} <span className="font-normal text-muted-foreground">({t.optional})</span>
								</Label>
								<Input
									{...fieldProps("sponsor-logoDarkUrl", liveError("logoDarkUrl"))}
									type="url"
									inputMode="url"
									placeholder="https://"
									value={values.logoDarkUrl}
									onChange={e => dispatch({ type: "patch", patch: { logoDarkUrl: e.target.value } })}
								/>
								<FieldError id="sponsor-logoDarkUrl" message={liveError("logoDarkUrl")} />
								{!liveError("logoDarkUrl") && <p className="text-xs text-muted-foreground">{t.logoDarkHint}</p>}
								<LogoPreview url={values.logoDarkUrl} dark alt={t.logoDarkUrl} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="sponsor-websiteUrl">
									{t.websiteUrl} <span className="font-normal text-muted-foreground">({t.optional})</span>
								</Label>
								<Input
									{...fieldProps("sponsor-websiteUrl", liveError("websiteUrl"))}
									type="url"
									inputMode="url"
									placeholder="https://"
									value={values.websiteUrl}
									onChange={e => dispatch({ type: "patch", patch: { websiteUrl: e.target.value } })}
								/>
								<FieldError id="sponsor-websiteUrl" message={liveError("websiteUrl")} />
								{!liveError("websiteUrl") && <p className="text-xs text-muted-foreground">{t.websiteHint}</p>}
							</div>
						</section>

						<section className={sectionClass}>
							<div className="space-y-1">
								<h3 className={sectionTitleClass}>{t.placementsSection}</h3>
								<p className="text-xs text-muted-foreground">{t.placementsHint}</p>
							</div>
							<div className="space-y-4">
								{placementOptions.map(option => (
									<div key={option.value} className="flex items-start gap-3">
										<Checkbox
											id={`sponsor-placement-${option.value}`}
											className="mt-0.5"
											checked={values.placements.includes(option.value)}
											onCheckedChange={checked => togglePlacement(option.value, checked === true)}
										/>
										<div className="space-y-0.5">
											<Label htmlFor={`sponsor-placement-${option.value}`} className="cursor-pointer">
												{option.label}
											</Label>
											<p className="text-xs text-muted-foreground">{option.hint}</p>
										</div>
									</div>
								))}
								<FieldError id="sponsor-placements" message={liveError("placements")} />
							</div>
						</section>

						<section className={sectionClass}>
							<div className="flex items-start gap-3">
								<Checkbox id="sponsor-isActive" className="mt-0.5" checked={values.isActive} onCheckedChange={checked => dispatch({ type: "patch", patch: { isActive: checked === true } })} />
								<div className="space-y-0.5">
									<Label htmlFor="sponsor-isActive" className="cursor-pointer">
										{t.visibility}
									</Label>
									<p className="text-xs text-muted-foreground">{t.visibilityHint}</p>
								</div>
							</div>
						</section>
					</TabsContent>

					{LANGUAGES.map(({ code, label }) => {
						const nameError = code === LANGUAGES[0].code ? liveError("name") : undefined;
						return (
							<TabsContent key={code} value={code} className="space-y-4 pt-2">
								<div className="space-y-2">
									<Label htmlFor={`sponsor-name-${code}`}>
										{t.sponsorName} ({label})
									</Label>
									<Input
										{...fieldProps(`sponsor-name-${code}`, nameError)}
										type="text"
										value={values.name[code]}
										onChange={e => dispatch({ type: "setLocalized", field: "name", lang: code, value: e.target.value })}
									/>
									<FieldError id={`sponsor-name-${code}`} message={nameError} />
								</div>
								<div className="space-y-2">
									<Label htmlFor={`sponsor-desc-${code}`}>
										{t.description} ({label}) <span className="font-normal text-muted-foreground">({t.optional})</span>
									</Label>
									<Textarea
										id={`sponsor-desc-${code}`}
										rows={6}
										value={values.description[code]}
										onChange={e => dispatch({ type: "setLocalized", field: "description", lang: code, value: e.target.value })}
									/>
									<p className="text-xs text-muted-foreground">{t.descriptionHint}</p>
									{values.description[code].trim() && (
										<div className="rounded-lg border bg-muted/40 p-3">
											<div className="mb-2 text-xs font-semibold text-muted-foreground">{t.preview}</div>
											<MarkdownContent content={values.description[code]} />
										</div>
									)}
								</div>
							</TabsContent>
						);
					})}
				</Tabs>

				{submitError && (
					<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

type SponsorFormDialogProps = {
	open: boolean;
	sponsor: Sponsor | null;
	eventId: string | null;
	onOpenChange: (open: boolean) => void;
	onSaved: () => Promise<void>;
};

export function SponsorFormDialog({ open, sponsor, eventId, onOpenChange, onSaved }: SponsorFormDialogProps) {
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
					<SponsorForm
						key={sponsor?.id ?? "new"}
						sponsor={sponsor}
						eventId={eventId}
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
