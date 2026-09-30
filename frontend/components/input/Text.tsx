import MarkdownContent from "@/components/MarkdownContent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChangeEvent, memo } from "react";
import FieldError from "./FieldError";

type TextProps = {
	label: string;
	id: string;
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	readOnly?: boolean;
	disabled?: boolean;
	description?: string;
	error?: string;
	className?: string;
	autoComplete?: string;
};

function TextComponent({ label, id, required = true, value, onChange, placeholder, readOnly, disabled, description, error, className, autoComplete = "off" }: TextProps) {
	const errorId = `${id}-error`;

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 -mt-1 mb-1">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
			<Input
				type="text"
				id={id}
				name={id}
				required={required}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				readOnly={readOnly}
				disabled={disabled}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				className={cn(className)}
				autoComplete={autoComplete}
			/>
			<FieldError id={errorId} message={error} />
		</div>
	);
}

export default memo(TextComponent);
