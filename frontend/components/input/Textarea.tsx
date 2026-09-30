import MarkdownContent from "@/components/MarkdownContent";
import { Label } from "@/components/ui/label";
import { Textarea as TextareaUI } from "@/components/ui/textarea";
import { ChangeEvent } from "react";
import FieldError from "./FieldError";

type TextareaProps = {
	label: string;
	id: string;
	required?: boolean;
	rows?: number;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	description?: string;
	error?: string;
	disabled?: boolean;
	autoComplete?: string;
};

export default function Textarea({ label, id, required = true, rows = 4, value, onChange, placeholder, description, error, disabled, autoComplete = "off" }: TextareaProps) {
	const errorId = `${id}-error`;

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 -mt-1 mb-1">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
			<TextareaUI
				id={id}
				name={id}
				required={required}
				rows={rows}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				disabled={disabled}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				autoComplete={autoComplete}
			/>
			<FieldError id={errorId} message={error} />
		</div>
	);
}
