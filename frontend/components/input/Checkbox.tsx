import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChangeEvent, forwardRef } from "react";

type CheckboxProps = {
	label: string;
	id: string;
	question?: string;
	required?: boolean;
	value?: string | boolean;
	checked?: boolean;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	inputRef?: React.Ref<HTMLInputElement>;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, id, question, required = true, value, checked, onChange }, ref) => {
	return (
		<div className="space-y-4">
			{question ? <p className="text-sm text-muted-foreground">{question}</p> : null}
			<div className="flex items-center space-x-2">
				<CheckboxUI
					id={id}
					name={id}
					aria-label={label}
					required={required}
					checked={checked}
					onCheckedChange={checkedState => {
						if (onChange) {
							// Create a synthetic event to maintain compatibility
							const syntheticEvent = {
								target: {
									id,
									name: id,
									type: "checkbox",
									checked: checkedState === true,
									value: typeof value === "string" ? value : "true"
								}
							} as ChangeEvent<HTMLInputElement>;
							onChange(syntheticEvent);
						}
					}}
				/>
				<Label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
					{label}
				</Label>
			</div>
		</div>
	);
});
Checkbox.displayName = "Checkbox";

export default Checkbox;
