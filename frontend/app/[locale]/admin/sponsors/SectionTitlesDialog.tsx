"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminSponsorsAPI } from "@/lib/api/endpoints";
import { sponsorPlacements, type SponsorPlacement, type SponsorSectionTitles } from "@sitcontix/types";
import { useLocale } from "next-intl";
import React, { useEffect, useState } from "react";
import { FieldGroup, LocalizedInputs, SectionHeading } from "../forms/LocalizedInputs";
import type { LangKey } from "../forms/types";

type TitleValues = Record<SponsorPlacement, Record<LangKey, string>>;

const emptyValues = (): TitleValues => ({
	after_registration: { en: "", "zh-Hant": "", "zh-Hans": "" },
	after_event_info: { en: "", "zh-Hant": "", "zh-Hans": "" }
});

function fromTitles(titles: SponsorSectionTitles): TitleValues {
	const values = emptyValues();
	for (const placement of sponsorPlacements) {
		for (const lang of ["en", "zh-Hant", "zh-Hans"] as const) {
			values[placement][lang] = titles[placement]?.[lang] ?? "";
		}
	}
	return values;
}

function toTitles(values: TitleValues): SponsorSectionTitles {
	const titles: SponsorSectionTitles = {};
	for (const placement of sponsorPlacements) {
		const entries = Object.entries(values[placement])
			.map(([lang, text]) => [lang, text.trim()] as const)
			.filter(([, text]) => text);
		// An empty list is kept (not omitted) so clearing every language really resets the title.
		titles[placement] = Object.fromEntries(entries);
	}
	return titles;
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

type SectionTitlesDialogProps = {
	open: boolean;
	eventId: string | null;
	onOpenChange: (open: boolean) => void;
};

export function SectionTitlesDialog({ open, eventId, onOpenChange }: SectionTitlesDialogProps) {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const t = getTranslations(locale, {
		title: { "zh-Hant": "區塊標題", "zh-Hans": "区块标题", en: "Section titles" },
		description: {
			"zh-Hant": "設定活動頁面上廠商 Logo 區塊上方的標題。留空會使用預設標題「特別感謝」。",
			"zh-Hans": "设置活动页面上厂商 Logo 区块上方的标题。留空会使用默认标题「特别感谢」。",
			en: "Set the heading above each sponsor logo section on the event page. Leave it empty to use the default, “Special Thanks”."
		},
		afterRegistration: { "zh-Hant": "報名與票券區之後", "zh-Hans": "报名与票券区之后", en: "After the registration & tickets area" },
		afterEventInfo: { "zh-Hant": "活動資訊與票券資訊之間", "zh-Hans": "活动资讯与票券资讯之间", en: "Between event information and ticket information" },
		sectionTitle: { "zh-Hant": "標題", "zh-Hans": "标题", en: "Title" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		loadFailed: { "zh-Hant": "無法載入標題：", "zh-Hans": "无法加载标题：", en: "Could not load the titles: " },
		saveFailed: { "zh-Hant": "儲存失敗：", "zh-Hans": "保存失败：", en: "Could not save: " },
		saved: { "zh-Hant": "區塊標題已更新", "zh-Hans": "区块标题已更新", en: "Section titles updated" }
	});

	const [values, setValues] = useState<TitleValues>(emptyValues);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Fetch fresh titles every time the dialog opens, so edits made elsewhere are never overwritten with stale values.
	useEffect(() => {
		if (!open || !eventId) return;
		let cancelled = false;
		setIsLoading(true);
		void adminSponsorsAPI
			.getSectionTitles(eventId)
			.then(response => {
				if (cancelled) return;
				if (!response.success) throw new Error(response.message);
				setValues(fromTitles(response.data));
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				showAlert(t.loadFailed + errorMessage(error), "error");
				onOpenChange(false);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// showAlert / translations change identity on re-render; only (re)load when the dialog opens or the event changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, eventId]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!eventId || isSaving || isLoading) return;
		setIsSaving(true);
		try {
			const response = await adminSponsorsAPI.updateSectionTitles(eventId, toTitles(values));
			if (!response.success) throw new Error(response.message);
			showAlert(t.saved, "success");
			onOpenChange(false);
		} catch (error) {
			showAlert(t.saveFailed + errorMessage(error), "error");
		} finally {
			setIsSaving(false);
		}
	}

	const placements: { key: SponsorPlacement; label: string }[] = [
		{ key: "after_registration", label: t.afterRegistration },
		{ key: "after_event_info", label: t.afterEventInfo }
	];
	const defaults: Record<LangKey, string> = { en: "Special Thanks", "zh-Hant": "特別感謝", "zh-Hans": "特别感谢" };

	return (
		<Dialog open={open} onOpenChange={next => !isSaving && onOpenChange(next)}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t.title}</DialogTitle>
					<DialogDescription>{t.description}</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
					{placements.map(({ key, label }) => (
						<FieldGroup key={key}>
							<SectionHeading title={label} />
							<LocalizedInputs
								id={`sponsor-title-${key}`}
								label={`${label} - ${t.sectionTitle}`}
								compact
								values={values[key]}
								placeholders={defaults}
								onChange={(lang, value) => setValues(current => ({ ...current, [key]: { ...current[key], [lang]: value } }))}
							/>
						</FieldGroup>
					))}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
							{t.cancel}
						</Button>
						<Button type="submit" variant="primary" isLoading={isSaving} disabled={isLoading}>
							{t.save}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
