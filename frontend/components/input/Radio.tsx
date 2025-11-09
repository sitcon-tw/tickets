import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type RadioOption = string | { value: string; label: string };

type RadioProps = {
	label: string;
	name: string;
	options: RadioOption[];
	required?: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
};

export default function Radio({ label, name, options, required = true, value, onValueChange }: RadioProps) {
	return (
		<fieldset className="border-none p-0 m-0">
			<legend className="block mb-2 font-semibold text-foreground">{label}</legend>
			<RadioGroup value={value} onValueChange={onValueChange} required={required} className="flex flex-col space-y-2">
				{options.map(option => {
					const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
					const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
					const optionId = `${name}-${optionValue}`;
					return (
						<div key={optionId} className="flex items-center space-x-2">
							<RadioGroupItem value={optionValue} id={optionId} />
							<Label htmlFor={optionId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
								{optionLabel}
							</Label>
						</div>
					);
				})}
			</RadioGroup>
		</fieldset>
	);
}
