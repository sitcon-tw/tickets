"use client";

import Checkbox from "@/components/input/Checkbox";
import MultiCheckbox from "@/components/input/MultiCheckbox";
import Radio from "@/components/input/Radio";
import Select from "@/components/input/Select";
import Text from "@/components/input/Text";
import Textarea from "@/components/input/Textarea";
import TextWithAutocomplete from "@/components/input/TextWithAutocomplete";
import { FormFieldProps } from "@/lib/types/components";
import { getLocalizedText, getOptionValue } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import React from "react";

function FormFieldComponent({ field, value, onValueChange, pleaseSelectText, error, disabled }: FormFieldProps) {
	const locale = useLocale();
	const requiredMark = field.required ? " *" : "";
	const fieldLabel = getLocalizedText(field.name, locale);
	const label = `${fieldLabel}${requiredMark}`;
	const fieldId = field.id;
	const fieldDescription = field.description ? getLocalizedText(field.description, locale) : "";

	const localizedOptions = (field.options ?? []).map(opt => ({
		value: getOptionValue(opt),
		label: getLocalizedText(opt, locale)
	}));

	const localizedPrompts = (field.prompts?.[locale] || field.prompts?.["en"] || []).filter((p: string) => p && p.trim() !== "");
	const textValue = typeof value === "string" ? value : "";
	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onValueChange(fieldId, e.target.value);

	const renderControl = () => {
		switch (field.type) {
			case "textarea":
				return (
					<Textarea
						label={label}
						id={fieldId}
						rows={3}
						placeholder={field.placeholder || ""}
						required={field.required}
						value={textValue}
						onChange={handleTextChange}
						description={fieldDescription}
						error={error}
						disabled={disabled}
						autoComplete="on"
					/>
				);

			case "select":
				return (
					<Select
						label={label}
						id={fieldId}
						options={localizedOptions}
						required={field.required}
						value={textValue}
						onChange={newValue => onValueChange(fieldId, newValue)}
						pleaseSelectText={pleaseSelectText}
						description={fieldDescription}
						error={error}
						disabled={disabled}
					/>
				);

			case "radio":
				return (
					<Radio
						label={label}
						name={fieldId}
						options={localizedOptions}
						required={field.required}
						value={textValue}
						onValueChange={newValue => onValueChange(fieldId, newValue)}
						enableOther={field.enableOther || undefined}
						otherPlaceholder={field.placeholder || undefined}
						description={fieldDescription}
						error={error}
						disabled={disabled}
					/>
				);

			case "checkbox":
				if (localizedOptions.length > 0) {
					return (
						<MultiCheckbox
							label={label}
							name={fieldId}
							options={localizedOptions}
							values={Array.isArray(value) ? value : undefined}
							onValueChange={newValues => onValueChange(fieldId, newValues)}
							description={fieldDescription}
							error={error}
							disabled={disabled}
						/>
					);
				}
				return (
					<Checkbox
						label={label}
						id={fieldId}
						required={field.required}
						value="true"
						checked={value === true}
						onChange={e => onValueChange(fieldId, e.target.checked)}
						description={fieldDescription}
						error={error}
						disabled={disabled}
					/>
				);

			case "text":
			default:
				if (field.type === "text" && localizedPrompts.length > 0) {
					return (
						<TextWithAutocomplete
							label={label}
							id={fieldId}
							placeholder={field.placeholder || ""}
							required={field.required}
							value={textValue}
							onChange={handleTextChange}
							prompts={localizedPrompts}
							description={fieldDescription}
							error={error}
							disabled={disabled}
						/>
					);
				}
				return (
					<Text
						label={label}
						id={fieldId}
						placeholder={field.placeholder || ""}
						required={field.required}
						value={textValue}
						onChange={handleTextChange}
						description={fieldDescription}
						error={error}
						disabled={disabled}
						autoComplete="on"
					/>
				);
		}
	};

	return <div data-field-id={fieldId}>{renderControl()}</div>;
}

function valuesEqual(prev: FormFieldProps["value"], next: FormFieldProps["value"]) {
	if (Array.isArray(prev) && Array.isArray(next)) {
		return prev.length === next.length && prev.every((val, index) => val === next[index]);
	}
	return prev === next;
}

export const FormField = React.memo(FormFieldComponent, (prev, next) => {
	return (
		prev.field === next.field &&
		valuesEqual(prev.value, next.value) &&
		prev.onValueChange === next.onValueChange &&
		prev.pleaseSelectText === next.pleaseSelectText &&
		prev.error === next.error &&
		prev.disabled === next.disabled
	);
});
