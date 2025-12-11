"use client";

import Checkbox from "@/components/input/Checkbox";
import MultiCheckbox, { CheckboxOption } from "@/components/input/MultiCheckbox";
import Radio, { RadioOption } from "@/components/input/Radio";
import Select, { SelectOption } from "@/components/input/Select";
import Text from "@/components/input/Text";
import TextWithAutocomplete from "@/components/input/TextWithAutocomplete";
import Textarea from "@/components/input/Textarea";
import MarkdownContent from "@/components/MarkdownContent";
import { FormFieldProps } from "@/lib/types/components";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import React from "react";

// Wrapper component defined outside to prevent recreation on every render
const FieldWrapper = ({ children, description }: { children: React.ReactNode; description?: string }) => (
	<div className="flex flex-col gap-1">
		{children}
		{description && (
			<div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
				<MarkdownContent content={description} className="text-sm" />
			</div>
		)}
	</div>
);

function FormFieldComponent({ field, value, onTextChange, onCheckboxChange, pleaseSelectText }: FormFieldProps) {
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

	// Get prompts for the current locale and filter out empty strings
	const localizedPrompts = (field.prompts?.[locale] || field.prompts?.["en"] || []).filter(p => p && p.trim() !== "");

	switch (field.type) {
		case "text":
			// Use autocomplete component if prompts are available
			if (localizedPrompts.length > 0) {
				return (
					<FieldWrapper description={fieldDescription}>
						<TextWithAutocomplete label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} prompts={localizedPrompts} />
					</FieldWrapper>
				);
			}
			return (
				<FieldWrapper description={fieldDescription}>
					<Text label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />
				</FieldWrapper>
			);

		case "textarea":
			return (
				<FieldWrapper description={fieldDescription}>
					<Textarea label={label} id={fieldId} rows={3} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />
				</FieldWrapper>
			);

		case "select":
			return (
				<FieldWrapper description={fieldDescription}>
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
				<FieldWrapper description={fieldDescription}>
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
					<FieldWrapper description={fieldDescription}>
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
					<FieldWrapper description={fieldDescription}>
						<Checkbox label={label} id={fieldId} required={field.required} value="true" checked={!!value} onChange={onCheckboxChange} />
					</FieldWrapper>
				);
			}

		default:
			return (
				<FieldWrapper description={fieldDescription}>
					<Text label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />
				</FieldWrapper>
			);
	}
}

export const FormField = React.memo(FormFieldComponent, (prevProps, nextProps) => {
	// Return true if props are equal (skip re-render), false if props changed (re-render)
	// Deep comparison for array values
	const prevValue = prevProps.value;
	const nextValue = nextProps.value;

	let valuesEqual = prevValue === nextValue;
	if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
		valuesEqual = prevValue.length === nextValue.length && prevValue.every((val, index) => val === nextValue[index]);
	}

	return (
		prevProps.field === nextProps.field &&
		valuesEqual &&
		prevProps.onTextChange === nextProps.onTextChange &&
		prevProps.onCheckboxChange === nextProps.onCheckboxChange &&
		prevProps.pleaseSelectText === nextProps.pleaseSelectText
	);
});
