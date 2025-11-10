"use client";

import Checkbox from "@/components/input/Checkbox";
import MultiCheckbox, { CheckboxOption } from "@/components/input/MultiCheckbox";
import Radio, { RadioOption } from "@/components/input/Radio";
import Select, { SelectOption } from "@/components/input/Select";
import Text from "@/components/input/Text";
import Textarea from "@/components/input/Textarea";
import { TicketFormField } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import React from "react";

interface FormFieldProps {
	field: TicketFormField;
	value: string | boolean | string[];
	onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
	onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	pleaseSelectText: string;
}

export function FormField({ field, value, onTextChange, onCheckboxChange, pleaseSelectText }: FormFieldProps) {
	const locale = useLocale();
	const requiredMark = field.required ? " *" : "";
	const fieldLabel = getLocalizedText(field.name, locale);
	const label = `${fieldLabel}${requiredMark}`;

	const localizedOptions =
		field.options?.map(opt => ({
			value: typeof opt === "object" && opt !== null ? opt.en || getLocalizedText(opt, locale) : String(opt),
			label: getLocalizedText(opt, locale)
		})) || [];

	switch (field.type) {
		case "text":
			return <Text label={label} id={getLocalizedText(field.name, locale)} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />;

		case "textarea":
			return (
				<Textarea
					label={label}
					id={getLocalizedText(field.name, locale)}
					rows={3}
					placeholder={field.placeholder || ""}
					required={field.required}
					value={(value as string) || ""}
					onChange={onTextChange}
				/>
			);

		case "select":
			return (
				<Select
					label={label}
					id={getLocalizedText(field.name, locale)}
					options={localizedOptions as SelectOption[]}
					required={field.required}
					value={(value as string) || ""}
					onChange={newValue => {
						// Create a synthetic event to match onTextChange signature
						const syntheticEvent = {
							target: { value: newValue }
						} as React.ChangeEvent<HTMLSelectElement>;
						onTextChange(syntheticEvent);
					}}
					pleaseSelectText={pleaseSelectText}
				/>
			);

		case "radio":
			return (
				<Radio
					label={fieldLabel}
					name={getLocalizedText(field.name, locale)}
					options={localizedOptions as RadioOption[]}
					required={field.required}
					value={(value as string) || ""}
					onValueChange={newValue => {
						// Create a synthetic event to match onTextChange signature
						const syntheticEvent = {
							target: { value: newValue }
						} as React.ChangeEvent<HTMLInputElement>;
						onTextChange(syntheticEvent);
					}}
				/>
			);

		case "checkbox":
			if (field.options && Array.isArray(field.options) && field.options.length > 0) {
				const currentValues = Array.isArray(value) ? value : [];
				return (
					<MultiCheckbox
						label={label}
						name={getLocalizedText(field.name, locale)}
						options={localizedOptions as CheckboxOption[]}
						values={currentValues}
						onValueChange={newValues => {
							// Create a synthetic event with comma-separated values
							const syntheticEvent = {
								target: { value: newValues.join(",") }
							} as React.ChangeEvent<HTMLInputElement>;
							onCheckboxChange(syntheticEvent);
						}}
					/>
				);
			} else {
				return <Checkbox label={label} id={getLocalizedText(field.name, locale)} required={field.required} value="true" checked={!!value} onChange={onCheckboxChange} />;
			}

		default:
			return <Text label={label} id={getLocalizedText(field.name, locale)} placeholder={field.placeholder || ""} required={field.required} value={(value as string) || ""} onChange={onTextChange} />;
	}
}
