"use client";

import Checkbox from "@/components/input/Checkbox";
import MultiCheckbox, { CheckboxOption } from "@/components/input/MultiCheckbox";
import Radio, { RadioOption } from "@/components/input/Radio";
import Select, { SelectOption } from "@/components/input/Select";
import Text from "@/components/input/Text";
import Textarea from "@/components/input/Textarea";
import MarkdownContent from "@/components/MarkdownContent";
import { TicketFormField } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import React from "react";
import { FormFieldProps } from "@/lib/types/components";

export function FormField({ field, value, onTextChange, onCheckboxChange, pleaseSelectText }: FormFieldProps) {
	const locale = useLocale();
	const requiredMark = field.required ? " *" : "";
	const fieldLabel = getLocalizedText(field.name, locale);
	const label = `${fieldLabel}${requiredMark}`;
	const fieldId = field.id; // Use unique field ID instead of localized name
	const fieldDescription = field.description ? getLocalizedText(field.description, locale) : "";

	const localizedOptions =
		field.options?.map(opt => ({
			value: typeof opt === "object" && opt !== null ? opt.en || getLocalizedText(opt, locale) : String(opt),
			label: getLocalizedText(opt, locale)
		})) || [];

	// Wrapper to add description to form fields
	const FieldWrapper = ({ children }: { children: React.ReactNode }) => (
		<div className="flex flex-col gap-1">
			{children}
			{fieldDescription && (
				<div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
					<MarkdownContent content={fieldDescription} className="text-sm" />
				</div>
			)}
		</div>
	);

	switch (field.type) {
		case "text":
			return (
				<FieldWrapper>
					<Text label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />
				</FieldWrapper>
			);

		case "textarea":
			return (
				<FieldWrapper>
					<Textarea label={label} id={fieldId} rows={3} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />
				</FieldWrapper>
			);

		case "select":
			return (
				<FieldWrapper>
					<Select
						label={label}
						id={fieldId}
						options={localizedOptions as SelectOption[]}
						required={field.required}
						value={(value as string) || ""}
						onChange={newValue => {
							// Create a synthetic event to match onTextChange signature
							const syntheticEvent = {
								target: {
									name: fieldId,
									value: newValue
								}
							} as React.ChangeEvent<HTMLSelectElement>;
							onTextChange(syntheticEvent);
						}}
						pleaseSelectText={pleaseSelectText}
						searchable
					/>
				</FieldWrapper>
			);

		case "radio":
			return (
				<FieldWrapper>
					<Radio
						label={fieldLabel}
						name={fieldId}
						options={localizedOptions as RadioOption[]}
						required={field.required}
						value={(value as string) || ""}
						onValueChange={newValue => {
							// Create a synthetic event to match onTextChange signature
							const syntheticEvent = {
								target: {
									name: fieldId,
									value: newValue
								}
							} as React.ChangeEvent<HTMLInputElement>;
							onTextChange(syntheticEvent);
						}}
					/>
				</FieldWrapper>
			);

		case "checkbox":
			if (field.options && Array.isArray(field.options) && field.options.length > 0) {
				// Ensure we filter out empty strings from the current values
				const currentValues = Array.isArray(value) ? value.filter((v: string) => v && v.trim() !== "") : [];
				return (
					<FieldWrapper>
						<MultiCheckbox
							label={label}
							name={fieldId}
							options={localizedOptions as CheckboxOption[]}
							values={currentValues}
							onValueChange={newValues => {
								// Create a synthetic event with comma-separated values
								// Always set checked: true for multi-checkbox to identify it in the handler
								const syntheticEvent = {
									target: {
										name: fieldId,
										value: newValues.join(","),
										checked: true
									}
								} as React.ChangeEvent<HTMLInputElement>;
								onCheckboxChange(syntheticEvent);
							}}
						/>
					</FieldWrapper>
				);
			} else {
				return (
					<FieldWrapper>
						<Checkbox label={label} id={fieldId} required={field.required} value="true" checked={!!value} onChange={onCheckboxChange} />
					</FieldWrapper>
				);
			}

		default:
			return (
				<FieldWrapper>
					<Text label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />
				</FieldWrapper>
			);
	}
}
