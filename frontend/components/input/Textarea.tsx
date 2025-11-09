import { ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Textarea as TextareaUI } from "@/components/ui/textarea";

type TextareaProps = {
	label: string;
	id: string;
	required?: boolean;
	rows?: number;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
};

export default function Textarea({ label, id, required = true, rows = 4, value, onChange, placeholder }: TextareaProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>
				{label}
			</Label>
			<TextareaUI 
				id={id} 
				name={id} 
				aria-label={label} 
				required={required} 
				rows={rows} 
				value={value} 
				onChange={onChange} 
				placeholder={placeholder} 
			/>
		</div>
	);
}
