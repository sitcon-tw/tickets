import { Label } from "@/components/ui/label";
import { SelectContent, SelectItem, SelectTrigger, Select as SelectUI, SelectValue } from "@/components/ui/select";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
	label: string;
	id: string;
	options: SelectOption[];
	required?: boolean;
	value?: string;
	onChange?: (value: string) => void;
	pleaseSelectText?: string;
};

export default function Select({ label, id, options, required = true, value, onChange, pleaseSelectText }: SelectProps) {
	const locale = useLocale();

	const t = getTranslations(locale, {
		pleaseSelect: {
			"zh-Hant": "請選擇...",
			"zh-Hans": "请选择...",
			en: "Please select..."
		}
	});

	const placeholder = pleaseSelectText || t.pleaseSelect;

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<SelectUI value={value} onValueChange={onChange} required={required}>
				<SelectTrigger id={id} className="max-w-[15rem]" aria-label={label}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option, i) => {
						const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
						const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
						return (
							<SelectItem key={i} value={optionValue}>
								{optionLabel}
							</SelectItem>
						);
					})}
				</SelectContent>
			</SelectUI>
		</div>
	);
}
