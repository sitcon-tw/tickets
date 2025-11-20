import { Label } from "@/components/ui/label";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
	label: string;
	id: string;
	options: SelectOption[];
	required?: boolean;
	value?: string;
	onChange?: (value: string) => void;
	pleaseSelectText?: string;
	searchable?: boolean;
	searchPlaceholder?: string;
};

export default function Select({ label, id, options, required = true, value, onChange, pleaseSelectText, searchable = false, searchPlaceholder }: SelectProps) {
	const locale = useLocale();
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const t = getTranslations(locale, {
		pleaseSelect: {
			"zh-Hant": "請選擇...",
			"zh-Hans": "请选择...",
			en: "Please select..."
		},
		search: {
			"zh-Hant": "搜尋...",
			"zh-Hans": "搜索...",
			en: "Search..."
		}
	});

	const placeholder = pleaseSelectText || t.pleaseSelect;
	const searchPlaceholderText = searchPlaceholder || t.search;

	const filteredOptions = searchQuery
		? options.filter((option) => {
				const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
				return optionLabel.toLowerCase().includes(searchQuery.toLowerCase());
		  })
		: options;

	const selectedOption = options.find((option) => {
		const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
		return optionValue === value;
	});

	const selectedLabel = selectedOption
		? typeof selectedOption === "object" && selectedOption !== null && "label" in selectedOption
			? selectedOption.label
			: String(selectedOption)
		: "";

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchQuery("");
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (optionValue: string) => {
		onChange?.(optionValue);
		setIsOpen(false);
		setSearchQuery("");
	};

	if (!searchable) {
		const { SelectTrigger, Select: SelectUI, SelectValue } = require("@/components/ui/select");
		return (
			<div className="space-y-2">
				<Label htmlFor={id}>{label}</Label>
				<SelectUI value={value} onValueChange={onChange} required={required}>
					<SelectTrigger id={id} className="max-w-60" aria-label={label}>
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

	return (
		<div className="space-y-2" ref={containerRef}>
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<div className="relative w-full max-w-60">
					<input
						ref={inputRef}
						id={id}
						type="text"
						value={isOpen ? searchQuery : selectedLabel}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => {
							setIsOpen(true);
							setSearchQuery("");
						}}
						placeholder={!isOpen && !selectedLabel ? placeholder : searchPlaceholderText}
						required={required}
						aria-label={label}
						className={cn(
							"border-input dark:border-input/70 data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 w-full rounded-md border bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9"
						)}
					/>
					<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 opacity-50 pointer-events-none" />
				</div>

				{isOpen && (
					<div className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full max-w-60 origin-top overflow-y-auto rounded-md border shadow-md animate-in fade-in-0 zoom-in-95">
						<div className="p-1">
							{filteredOptions.length > 0 ? (
								filteredOptions.map((option, i) => {
									const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
									const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
									const isSelected = optionValue === value;

									return (
										<div
											key={i}
											onClick={() => handleSelect(optionValue)}
											className={cn(
												"focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground",
												isSelected && "bg-accent/50"
											)}
										>
											{optionLabel}
										</div>
									);
								})
							) : (
								<div className="px-2 py-6 text-center text-sm text-muted-foreground">
									{locale === "zh-Hant" ? "找不到結果" : locale === "zh-Hans" ? "找不到结果" : "No results found"}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
