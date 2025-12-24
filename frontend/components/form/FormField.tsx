"use client";

import Checkbox from "@/components/input/Checkbox";
import MultiCheckbox, { CheckboxOption } from "@/components/input/MultiCheckbox";
import Radio, { RadioOption } from "@/components/input/Radio";
import Select, { SelectOption } from "@/components/input/Select";
import Text from "@/components/input/Text";
import Textarea from "@/components/input/Textarea";
import TextWithAutocomplete from "@/components/input/TextWithAutocomplete";
import { FormFieldProps } from "@/lib/types/components";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import React from "react";

function FormFieldComponent({ field, value, onTextChange, onCheckboxChange, pleaseSelectText }: FormFieldProps) {
	const locale = useLocale();
	const requiredMark = field.required ? " *" : "";
	const fieldLabel = getLocalizedText(field.name, locale);
	const label = `${fieldLabel}${requiredMark}`;
	const fieldId = field.id;
	const fieldDescription = field.description ? getLocalizedText(field.description, locale) : "";

	const localizedOptions =
		field.options?.map(opt => ({
			value: typeof opt === "object" && opt !== null ? opt.en || getLocalizedText(opt, locale) : String(opt),
			label: getLocalizedText(opt, locale)
		})) || [];

	const localizedPrompts = (field.prompts?.[locale] || field.prompts?.["en"] || []).filter(p => p && p.trim() !== "");

	switch (field.type) {
		case "text":
			if (localizedPrompts.length > 0) {
				return (
					<TextWithAutocomplete
						label={label}
						id={fieldId}
						placeholder={field.placeholder || ""}
						required={field.required}
						value={(value as string) || ""}
						onChange={onTextChange}
						prompts={localizedPrompts}
						description={fieldDescription}
					/>
				);
			}
			return <Text label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} description={fieldDescription} />;

		case "textarea":
			return <Textarea label={label} id={fieldId} rows={3} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} description={fieldDescription} />;

		case "select":
			return (
				<Select
					label={label}
					id={fieldId}
					options={localizedOptions as SelectOption[]}
					required={field.required}
					value={(value as string) || ""}
					onChange={newValue => {
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
					description={fieldDescription}
				/>
			);

		case "radio":
			return (
				<Radio
					label={label}
					name={fieldId}
					options={localizedOptions as RadioOption[]}
					required={field.required}
					value={(value as string) || ""}
					onValueChange={newValue => {
						const syntheticEvent = {
							target: {
								name: fieldId,
								value: newValue
							}
						} as React.ChangeEvent<HTMLInputElement>;
						onTextChange(syntheticEvent);
					}}
					enableOther={field.enableOther}
					otherPlaceholder={field.placeholder}
					description={fieldDescription}
				/>
			);

		case "checkbox":
			if (field.options && Array.isArray(field.options) && field.options.length > 0) {
				const currentValues = Array.isArray(value) ? value.filter((v: string) => v && v.trim() !== "") : [];
				return (
					<MultiCheckbox
						label={label}
						name={fieldId}
						options={localizedOptions as CheckboxOption[]}
						values={currentValues}
						onValueChange={newValues => {
							const syntheticEvent = {
								target: {
									name: fieldId,
									value: newValues.join(","),
									checked: true
								}
							} as React.ChangeEvent<HTMLInputElement>;
							onCheckboxChange(syntheticEvent);
						}}
						description={fieldDescription}
					/>
				);
			} else {
				return <Checkbox label={label} id={fieldId} required={field.required} value="true" checked={!!value} onChange={onCheckboxChange} description={fieldDescription} />;
			}

		default:
			return <Text label={label} id={fieldId} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} description={fieldDescription} />;
	}
}

export const FormField = React.memo(FormFieldComponent, (prevProps, nextProps) => {
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
