"use client";

import MarkdownContent from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Event } from "@sitcontix/types";
import { AlertCircle, Check } from "lucide-react";
import type { Dispatch, FormEvent, ReactNode } from "react";
import { tabOrder, tabsWithErrors, type EventFormErrors, type EventFormState, type EventFormTextField, type EventLanguage, type EventsPageAction, type EventTab } from "./event-form";

const languagePlaceholders: Record<EventLanguage, { plainDesc: string; locationText: string }> = {
	en: {
		plainDesc: "Plain text description without markdown formatting",
		locationText: "e.g., Academia Sinica Humanities and Social Sciences Building"
	},
	"zh-Hant": {
		plainDesc: "純文字描述，不含 Markdown 格式",
		locationText: "例如：中央研究院人文社會科學館"
	},
	"zh-Hans": {
		plainDesc: "纯文字描述，不含 Markdown 格式",
		locationText: "例如：中央研究院人文社会科学馆"
	}
};

const languageConfig: { value: EventLanguage; label: string; fields: { name: EventFormTextField; desc: EventFormTextField; plainDesc: EventFormTextField; location: EventFormTextField } }[] = [
	{ value: "en", label: "English", fields: { name: "nameEn", desc: "descEn", plainDesc: "plainDescEn", location: "locationTextEn" } },
	{ value: "zh-Hant", label: "繁體中文", fields: { name: "nameZhHant", desc: "descZhHant", plainDesc: "plainDescZhHant", location: "locationTextZhHant" } },
	{ value: "zh-Hans", label: "简体中文", fields: { name: "nameZhHans", desc: "descZhHans", plainDesc: "plainDescZhHans", location: "locationTextZhHans" } }
];

type FieldProps = {
	id: string;
	label: string;
	required?: boolean;
	hint?: ReactNode;
	error?: string;
	children: (aria: { "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode;
};

function Field({ id, label, required, hint, error, children }: FieldProps) {
	const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>
				{label}
				{required && (
					<span aria-hidden="true" className="text-destructive">
						*
					</span>
				)}
			</Label>
			{children({ "aria-invalid": !!error, "aria-describedby": describedBy })}
			{error && (
				<p id={`${id}-error`} className="text-xs font-medium text-destructive">
					{error}
				</p>
			)}
			{hint && (
				<p id={`${id}-hint`} className="text-xs text-muted-foreground">
					{hint}
				</p>
			)}
		</div>
	);
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
	return (
		<section className="space-y-4 rounded-xl border bg-card p-4">
			<div>
				<h3 className="text-sm font-semibold">{title}</h3>
				{description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
			</div>
			{children}
		</section>
	);
}

type EventEditorDialogProps = {
	open: boolean;
	editingEvent: Event | null;
	activeTab: EventTab;
	form: EventFormState;
	/** Errors to display (already filtered by "submit attempted"). */
	errors: EventFormErrors;
	submitError: string | null;
	isSaving: boolean;
	slugPreviewBase: string;
	t: Record<string, string>;
	dispatch: Dispatch<EventsPageAction>;
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	onRequestClose: () => void;
};

export function EventEditorDialog({ open, editingEvent, activeTab, form, errors, submitError, isSaving, slugPreviewBase, t, dispatch, onSubmit, onRequestClose }: EventEditorDialogProps) {
	const errorTabs = tabsWithErrors(errors);
	const errorCount = Object.keys(errors).length;
	const tabLabels: Record<EventTab, string> = { info: t.eventInfo, en: "English", "zh-Hant": "繁體中文", "zh-Hans": "简体中文" };

	const setText = (field: EventFormTextField) => (value: string) => dispatch({ type: "setFormText", field, value });
	const setBool = (field: "hideEvent" | "useOpass") => (checked: boolean | "indeterminate") => dispatch({ type: "setFormBoolean", field, value: checked === true });

	function tabIndicator(tab: EventTab, filled?: boolean) {
		if (errorTabs.has(tab)) {
			return (
				<>
					<AlertCircle aria-hidden="true" className="size-3.5 text-destructive" />
					<span className="sr-only">{t.tabHasErrors}</span>
				</>
			);
		}
		if (filled) {
			return (
				<>
					<Check aria-hidden="true" className="size-3.5 text-green-600 dark:text-green-400" />
					<span className="sr-only">{t.tabFilled}</span>
				</>
			);
		}
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={next => !next && onRequestClose()}>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl" onInteractOutside={e => e.preventDefault()}>
				<DialogHeader className="border-b px-6 py-4 pr-12">
					<DialogTitle>{editingEvent ? t.editEvent : t.addEvent}</DialogTitle>
					<DialogDescription>{t.dialogDescription}</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
						{(errorCount > 0 || submitError) && (
							<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								<div className="flex items-start gap-2">
									<AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
									<div className="space-y-1">
										{submitError ? (
											<p className="font-medium">
												{t.saveFailed}: {submitError}
											</p>
										) : (
											<p className="font-medium">{t.fixErrors.replace("{count}", String(errorCount))}</p>
										)}
										{errorCount > 0 && (
											<ul className="list-inside list-disc text-xs">
												{tabOrder
													.filter(tab => errorTabs.has(tab))
													.map(tab => (
														<li key={tab}>
															<button type="button" className="underline underline-offset-2 hover:no-underline" onClick={() => dispatch({ type: "setActiveTab", value: tab })}>
																{tabLabels[tab]}
															</button>
														</li>
													))}
											</ul>
										)}
									</div>
								</div>
							</div>
						)}

						<Tabs value={activeTab} onValueChange={value => dispatch({ type: "setActiveTab", value: value as EventTab })}>
							<TabsList className="grid h-auto w-full grid-cols-4">
								<TabsTrigger value="info" className="py-1.5">
									{t.eventInfo}
									{tabIndicator("info")}
								</TabsTrigger>
								{languageConfig.map(lang => (
									<TabsTrigger key={lang.value} value={lang.value} className="py-1.5">
										{lang.label}
										{tabIndicator(lang.value, form[lang.fields.name].trim() !== "")}
									</TabsTrigger>
								))}
							</TabsList>

							<TabsContent value="info" className="mt-2 space-y-4">
								<Section title={t.sectionBasic}>
									<Field
										id="slug"
										label={t.slug}
										error={errors.slug}
										hint={
											<>
												{t.slugHint}
												{slugPreviewBase && (
													<>
														{" "}
														<span className="font-mono">
															{slugPreviewBase}/{form.slug.trim() || "…"}
														</span>
													</>
												)}
											</>
										}
									>
										{aria => <Input id="slug" type="text" value={form.slug} onChange={e => setText("slug")(e.target.value)} placeholder="sitcon-2026" autoComplete="off" {...aria} />}
									</Field>
									<Field id="ogImage" label={t.ogImage} error={errors.ogImage} hint={t.ogImageHint}>
										{aria => (
											<Input
												id="ogImage"
												type="url"
												value={form.ogImage}
												onChange={e => setText("ogImage")(e.target.value)}
												placeholder="https://raw.githubusercontent.com/sitcon-tw/...webp"
												{...aria}
											/>
										)}
									</Field>
								</Section>

								<Section title={t.sectionSchedule} description={t.timezoneHint}>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<Field id="startDate" label={t.startDate} required error={errors.eventStartTime}>
											{aria => <Input id="startDate" name="startDate" type="datetime-local" value={form.eventStartTime} onChange={e => setText("eventStartTime")(e.target.value)} {...aria} />}
										</Field>
										<Field id="endDate" label={t.endDate} required error={errors.eventEndTime}>
											{aria => <Input id="endDate" name="endDate" type="datetime-local" value={form.eventEndTime} onChange={e => setText("eventEndTime")(e.target.value)} {...aria} />}
										</Field>
									</div>
									<Field id="editDeadline" label={t.editDeadline} error={errors.editDeadline} hint={t.editDeadlineHint}>
										{aria => <Input id="editDeadline" type="datetime-local" value={form.editDeadline} onChange={e => setText("editDeadline")(e.target.value)} {...aria} />}
									</Field>
								</Section>

								<Section title={t.sectionLocation}>
									<Field id="mapLink" label={t.mapLink} error={errors.mapLink} hint={t.mapLinkHint}>
										{aria => (
											<Input id="mapLink" type="url" value={form.mapLink} onChange={e => setText("mapLink")(e.target.value)} placeholder="https://maps.app.goo.gl/z3Kyzeu1dK29DLfv6" {...aria} />
										)}
									</Field>
								</Section>

								<Section title={t.sectionOptions}>
									<div className="flex items-start gap-3">
										<Checkbox id="hideEvent" className="mt-0.5" checked={form.hideEvent} onCheckedChange={setBool("hideEvent")} />
										<div className="grid gap-1">
											<Label htmlFor="hideEvent" className="cursor-pointer">
												{t.hideEvent}
											</Label>
											<p className="text-xs text-muted-foreground">{t.hideEventHint}</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<Checkbox id="useOpass" className="mt-0.5" checked={form.useOpass} onCheckedChange={setBool("useOpass")} />
										<div className="grid gap-1">
											<Label htmlFor="useOpass" className="cursor-pointer">
												{t.useOpass}
											</Label>
											<p className="text-xs text-muted-foreground">{t.useOpassHint}</p>
										</div>
									</div>
									{form.useOpass && (
										<div className="pl-7">
											<Field id="opassEventId" label={t.opassEventId} hint={t.opassEventIdHint}>
												{aria => (
													<Input
														id="opassEventId"
														type="text"
														value={form.opassEventId}
														onChange={e => setText("opassEventId")(e.target.value)}
														placeholder="sitcon-2026"
														autoComplete="off"
														{...aria}
													/>
												)}
											</Field>
										</div>
									)}
								</Section>
							</TabsContent>

							{languageConfig.map(lang => {
								const placeholder = languagePlaceholders[lang.value];
								const required = lang.value === "en";
								const description = form[lang.fields.desc];
								return (
									<TabsContent key={lang.value} value={lang.value} className="mt-2 space-y-4">
										<Section title={`${t.sectionLanguage}: ${lang.label}`} description={required ? t.requiredLanguageHint : t.optionalLanguageHint}>
											<Field id={`name-${lang.value}`} label={`${t.eventName} (${lang.label})`} required={required} error={errors[lang.fields.name]}>
												{aria => <Input id={`name-${lang.value}`} type="text" value={form[lang.fields.name]} onChange={e => setText(lang.fields.name)(e.target.value)} {...aria} />}
											</Field>
											<Field id={`desc-${lang.value}`} label={`${t.description} (${lang.label}, Markdown)`}>
												{aria => <Textarea id={`desc-${lang.value}`} value={description} onChange={e => setText(lang.fields.desc)(e.target.value)} rows={6} {...aria} />}
											</Field>
											{description && (
												<div className="rounded-lg border bg-muted/40 p-3">
													<div className="mb-2 text-xs font-semibold text-muted-foreground">{t.preview}</div>
													<MarkdownContent content={description} />
												</div>
											)}
											<Field id={`plainDesc-${lang.value}`} label={`${t.plainDescription} (${lang.label})`}>
												{aria => (
													<Textarea
														id={`plainDesc-${lang.value}`}
														value={form[lang.fields.plainDesc]}
														onChange={e => setText(lang.fields.plainDesc)(e.target.value)}
														rows={4}
														placeholder={placeholder.plainDesc}
														{...aria}
													/>
												)}
											</Field>
											<Field id={`locationText-${lang.value}`} label={`${t.locationText} (${lang.label})`}>
												{aria => (
													<Input
														id={`locationText-${lang.value}`}
														type="text"
														value={form[lang.fields.location]}
														onChange={e => setText(lang.fields.location)(e.target.value)}
														placeholder={placeholder.locationText}
														{...aria}
													/>
												)}
											</Field>
										</Section>
									</TabsContent>
								);
							})}
						</Tabs>
					</div>

					<DialogFooter className="border-t bg-background px-6 py-4">
						<Button type="button" variant="outline" onClick={onRequestClose} disabled={isSaving}>
							{t.cancel}
						</Button>
						<Button type="submit" variant="primary" isLoading={isSaving}>
							{t.save}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
