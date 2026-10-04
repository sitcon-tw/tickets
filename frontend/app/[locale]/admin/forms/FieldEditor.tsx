"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Ticket } from "@sitcontix/types";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { DisplayFiltersSection } from "./filter-editor";
import { FieldGroup, LocalizedInputs, SectionHeading } from "./LocalizedInputs";
import { OptionsEditor } from "./OptionsEditor";
import { FIELD_TYPES, LANGS, typeHasOptions, type FieldIssue, type IssueSection, type LangKey, type Question } from "./types";

type FieldEditorProps = {
	question: Question;
	questions: Question[];
	eventTickets: Ticket[];
	issues: FieldIssue[];
	locale: string;
	t: Record<string, string>;
	updateQuestion: (id: string, updates: Partial<Question>) => void;
};

const nameKeys = { en: "labelEn", "zh-Hant": "labelZhHant", "zh-Hans": "labelZhHans" } as const;
const descriptionKeys = { en: "descriptionEn", "zh-Hant": "descriptionZhHant", "zh-Hans": "descriptionZhHans" } as const;

export function FieldEditor({ question, questions, eventTickets, issues, locale, t, updateQuestion }: FieldEditorProps) {
	const [tab, setTab] = useState<IssueSection>("content");
	const id = question.id;
	const update = (updates: Partial<Question>) => updateQuestion(id, updates);

	const issueCount = (section: IssueSection) => issues.filter(issue => issue.section === section).length;
	const hasIssue = (section: IssueSection, message?: string) => issues.some(issue => issue.section === section && (!message || issue.message === message));

	const typeLabels: Record<string, string> = { text: t.typeText, textarea: t.typeTextarea, select: t.typeSelect, radio: t.typeRadio, checkbox: t.typeCheckbox };

	const tabs: Array<{ value: IssueSection; label: string }> = [
		{ value: "content", label: t.tabContent },
		{ value: "answer", label: t.tabAnswer },
		{ value: "conditions", label: t.tabConditions }
	];

	return (
		<div className="space-y-4">
			{issues.length > 0 && (
				<div role="alert" className="flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					<AlertCircle className="mt-0.5 size-4 shrink-0" />
					<ul className="list-inside list-disc space-y-0.5">
						{issues.map((issue, index) => (
							<li key={index}>{issue.message}</li>
						))}
					</ul>
				</div>
			)}

			<Tabs value={tab} onValueChange={value => setTab(value as IssueSection)} className="gap-4">
				<TabsList className="grid h-auto w-full grid-cols-3">
					{tabs.map(item => (
						<TabsTrigger key={item.value} value={item.value} className="relative py-1.5">
							{item.label}
							{issueCount(item.value) > 0 && <span aria-label={t.hasIssues} className="size-2 rounded-full bg-destructive" />}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="content" className="space-y-5">
					<LocalizedInputs
						id={`name-${id}`}
						label={t.fieldName}
						required
						invalid={hasIssue("content")}
						values={{ en: question.labelEn, "zh-Hant": question.labelZhHant, "zh-Hans": question.labelZhHans }}
						onChange={(lang: LangKey, value) => update({ [nameKeys[lang]]: value })}
						placeholders={{ en: t.nameEnPlaceholder }}
						helper={t.fieldNameHelp}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor={`type-${id}`} className="mb-1.5 text-sm font-medium">
								{t.fieldType}
							</Label>
							<Select value={question.type} onValueChange={value => update({ type: value as Question["type"] })}>
								<SelectTrigger id={`type-${id}`} className="h-9 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{FIELD_TYPES.map(type => (
										<SelectItem key={type} value={type}>
											{typeLabels[type]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-start gap-3 sm:pt-7">
							<Checkbox id={`required-${id}`} checked={question.required} onCheckedChange={checked => update({ required: checked === true })} className="mt-0.5" />
							<div className="space-y-0.5">
								<Label htmlFor={`required-${id}`} className="cursor-pointer text-sm font-medium">
									{t.fieldRequired}
								</Label>
								<p className="text-xs text-muted-foreground">{t.requiredHelp}</p>
							</div>
						</div>
					</div>

					<LocalizedInputs
						id={`description-${id}`}
						label={t.fieldDescription}
						multiline
						values={{ en: question.descriptionEn, "zh-Hant": question.descriptionZhHant, "zh-Hans": question.descriptionZhHans }}
						onChange={(lang: LangKey, value) => update({ [descriptionKeys[lang]]: value })}
						helper={t.descriptionHelp}
						markdownPreviewLabel={t.markdownPreview}
					/>
				</TabsContent>

				<TabsContent value="answer" className="space-y-5">
					{typeHasOptions(question.type) && (
						<section className="space-y-3">
							<SectionHeading title={t.optionSettings} description={question.type === "checkbox" ? t.checkboxOptionsHelp : t.optionsHelp} />
							<OptionsEditor fieldId={id} options={question.options} t={t} onChange={options => update({ options })} />
						</section>
					)}

					{question.type === "radio" && (
						<FieldGroup className="flex items-start gap-3 space-y-0">
							<Checkbox id={`enableOther-${id}`} checked={question.enableOther} onCheckedChange={checked => update({ enableOther: checked === true })} className="mt-0.5" />
							<div className="space-y-0.5">
								<Label htmlFor={`enableOther-${id}`} className="cursor-pointer text-sm font-medium">
									{t.enableOther}
								</Label>
								<p className="text-xs text-muted-foreground">{t.enableOtherDescription}</p>
							</div>
						</FieldGroup>
					)}

					{(question.type === "text" || question.type === "textarea") && (
						<section className="space-y-2">
							<SectionHeading title={t.validator} description={t.useValidator} />
							<Input
								id={`validater-${id}`}
								type="text"
								value={question.validater}
								placeholder={t.validatorPlaceholder}
								aria-label={t.validator}
								aria-invalid={hasIssue("answer", t.issueRegexInvalid) ? true : undefined}
								onChange={e => update({ validater: e.target.value })}
								className="h-9 font-mono text-sm"
							/>
						</section>
					)}

					{question.type === "text" && (
						<section className="space-y-3">
							<SectionHeading title={t.promptSettings} description={t.promptDescription} />
							<div className="space-y-2">
								{LANGS.map(lang => (
									<div key={lang.key} className="flex items-start gap-2">
										<Label
											htmlFor={`prompts-${lang.key}-${id}`}
											title={lang.label}
											className="mt-2 w-7 shrink-0 justify-center rounded bg-muted px-0 py-1 text-[0.7rem] font-semibold text-muted-foreground"
										>
											{lang.short}
										</Label>
										<Textarea
											id={`prompts-${lang.key}-${id}`}
											aria-label={`${t.promptSettings} (${lang.label})`}
											value={(question.prompts[lang.key] || []).join("\n")}
											onChange={e => update({ prompts: { ...question.prompts, [lang.key]: e.target.value.split("\n") } })}
											placeholder={t.promptPlaceholder}
											className="min-h-20 text-sm"
										/>
									</div>
								))}
							</div>
						</section>
					)}

					{question.type === "textarea" && !question.validater && <p className="text-sm text-muted-foreground">{t.noAnswerSettings}</p>}
				</TabsContent>

				<TabsContent value="conditions" className={cn("space-y-3")}>
					<SectionHeading title={t.displayFilters} description={t.displayFiltersHelp} />
					<DisplayFiltersSection question={question} questions={questions} eventTickets={eventTickets} locale={locale} t={t} updateQuestion={updateQuestion} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
