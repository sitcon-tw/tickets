import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent, memo } from "react";

type TextProps = {
	label: string;
	id: string;
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	readOnly?: boolean;
};

function TextComponent({ label, id, required = true, value, onChange, placeholder, readOnly }: TextProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
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
				className="max-w-60"
				autoComplete="off"
			/>
		</div>
	);
}

export default memo(TextComponent);
