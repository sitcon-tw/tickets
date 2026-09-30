"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { LANGS, type LangKey } from "./types";

type LocalizedInputsProps = {
	id: string;
	label: string;
	values: Record<LangKey, string>;
	onChange: (lang: LangKey, value: string) => void;
	placeholders?: Partial<Record<LangKey, string>>;
	multiline?: boolean;
	required?: boolean;
	invalid?: boolean;
	helper?: ReactNode;
	/** Hide the group label (when a parent already renders one). */
	compact?: boolean;
	className?: string;
};

/** One text value in the three supported languages, stacked with a language tag in front of each input. */
export function LocalizedInputs({ id, label, values, onChange, placeholders, multiline, required, invalid, helper, compact, className }: LocalizedInputsProps) {
	return (
		<fieldset className={cn("min-w-0 space-y-2", className)}>
			{!compact && (
				<legend className="mb-2 text-sm font-medium">
					{label}
					{required && (
						<span aria-hidden="true" className="ml-1 text-destructive">
							*
						</span>
					)}
				</legend>
			)}
			{LANGS.map(lang => {
				const inputId = `${id}-${lang.key}`;
				const props = {
					id: inputId,
					value: values[lang.key],
					placeholder: placeholders?.[lang.key],
					"aria-label": `${label} (${lang.label})`,
					"aria-invalid": invalid && lang.key === "en" ? true : undefined,
					onChange: (e: { target: { value: string } }) => onChange(lang.key, e.target.value)
				};
				return (
					<div key={lang.key} className="flex items-start gap-2">
						<Label htmlFor={inputId} title={lang.label} className="mt-2 w-7 shrink-0 justify-center rounded bg-muted px-0 py-1 text-[0.7rem] font-semibold text-muted-foreground">
							{lang.short}
						</Label>
						{multiline ? <Textarea {...props} className="min-h-16 text-sm" /> : <Input {...props} type="text" className="h-9 text-sm" />}
					</div>
				);
			})}
			{helper && <p className="text-xs text-muted-foreground">{helper}</p>}
		</fieldset>
	);
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
	return (
		<div className="space-y-0.5">
			<h3 className="text-sm font-semibold">{title}</h3>
			{description && <p className="text-xs text-muted-foreground">{description}</p>}
		</div>
	);
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cn("space-y-4 rounded-xl border bg-muted/30 p-4", className)}>{children}</div>;
}
