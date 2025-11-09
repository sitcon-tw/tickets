import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type CheckboxOption = string | { value: string; label: string };

type MultiCheckboxProps = {
	label: string;
	name: string;
	options: CheckboxOption[];
	values?: string[];
	onValueChange?: (values: string[]) => void;
};

export default function MultiCheckbox({ label, name, options, values = [], onValueChange }: MultiCheckboxProps) {
	const handleCheckedChange = (optionValue: string, checked: boolean) => {
		if (!onValueChange) return;

		if (checked) {
			onValueChange([...values, optionValue]);
		} else {
			onValueChange(values.filter(v => v !== optionValue));
		}
	};

	return (
		<fieldset className="border-none p-0 m-0">
			<legend className="block mb-2 font-semibold text-foreground">{label}</legend>
			<div className="flex flex-col space-y-3">
				{options.map(option => {
					const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
					const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
					const optionId = `${name}-${optionValue}`;
					const isChecked = values.includes(optionValue);

					return (
						<div key={optionId} className="flex items-center space-x-2">
							<Checkbox id={optionId} name={name} checked={isChecked} onCheckedChange={checked => handleCheckedChange(optionValue, checked === true)} />
							<Label htmlFor={optionId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
								{optionLabel}
							</Label>
						</div>
					);
				})}
			</div>
		</fieldset>
	);
}
