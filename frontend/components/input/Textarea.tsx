import { Label } from "@/components/ui/label";
import { Textarea as TextareaUI } from "@/components/ui/textarea";
import MarkdownContent from "@/components/MarkdownContent";
import { ChangeEvent } from "react";

type TextareaProps = {
	label: string;
	id: string;
	required?: boolean;
	rows?: number;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	description?: string;
};

export default function Textarea({ label, id, required = true, rows = 4, value, onChange, placeholder, description }: TextareaProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 -mt-1 mb-1">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
			<TextareaUI id={id} name={id} aria-label={label} required={required} rows={rows} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" />
		</div>
	);
}
