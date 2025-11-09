import { ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type TextProps = {
	label: string;
	id: string;
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	readOnly?: boolean;
};

export default function Text({ label, id, required = true, value, onChange, placeholder, readOnly }: TextProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>
				{label}
			</Label>
			<Input 
				type="text" 
				id={id} 
				name={id} 
				aria-label={label} 
				required={required} 
				value={value} 
				onChange={onChange} 
				placeholder={placeholder} 
				readOnly={readOnly} 
				className="max-w-[15rem]"
			/>
		</div>
	);
}
