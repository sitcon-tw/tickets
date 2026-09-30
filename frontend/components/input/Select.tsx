import MarkdownContent from "@/components/MarkdownContent";
import { Label } from "@/components/ui/label";
import { getTranslations } from "@/i18n/helpers";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import FieldError from "./FieldError";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
	label: string;
	id: string;
	options: SelectOption[];
	required?: boolean;
	value?: string;
	onChange?: (value: string) => void;
	pleaseSelectText?: string;
	searchPlaceholder?: string;
	description?: string;
	error?: string;
	disabled?: boolean;
};

const optionValueOf = (option: SelectOption) => (typeof option === "object" && option !== null && "value" in option ? option.value : option);
const optionLabelOf = (option: SelectOption) => (typeof option === "object" && option !== null && "label" in option ? option.label : option);

/**
 * Searchable single-select following the ARIA combobox pattern. The value only changes when an option is chosen, never
 * from the text typed to search, and Enter never submits the surrounding form.
 */
export default function Select({ label, id, options, required = true, value, onChange, pleaseSelectText, searchPlaceholder, description, error, disabled }: SelectProps) {
	const locale = useLocale();
	const listboxId = useId();
	const errorId = `${id}-error`;
	const [query, setQuery] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const t = getTranslations(locale, {
		pleaseSelect: { "zh-Hant": "請選擇...", "zh-Hans": "请选择...", en: "Please select..." },
		search: { "zh-Hant": "搜尋...", "zh-Hans": "搜索...", en: "Search..." },
		noResults: { "zh-Hant": "找不到結果", "zh-Hans": "找不到结果", en: "No results found" }
	});

	const placeholder = pleaseSelectText || t.pleaseSelect;
	const searchQuery = query?.trim().toLowerCase() ?? "";
	const filteredOptions = searchQuery ? options.filter(option => optionLabelOf(option).toLowerCase().includes(searchQuery)) : options;

	const selectedOption = options.find(option => optionValueOf(option) === value);
	const selectedLabel = selectedOption ? optionLabelOf(selectedOption) : "";

	useEffect(() => {
		if (!isOpen || activeIndex < 0) return;
		listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
	}, [isOpen, activeIndex]);

	const open = () => {
		if (disabled || isOpen) return;
		setIsOpen(true);
		const selectedIndex = options.findIndex(option => optionValueOf(option) === value);
		setActiveIndex(selectedIndex);
	};

	const close = () => {
		setIsOpen(false);
		setQuery(null);
		setActiveIndex(-1);
	};

	const choose = (option: SelectOption) => {
		onChange?.(optionValueOf(option));
		close();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				if (!isOpen) open();
				else setActiveIndex(index => Math.min(index + 1, filteredOptions.length - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				if (!isOpen) open();
				else setActiveIndex(index => Math.max(index - 1, 0));
				break;
			case "Home":
				if (isOpen) {
					e.preventDefault();
					setActiveIndex(0);
				}
				break;
			case "End":
				if (isOpen) {
					e.preventDefault();
					setActiveIndex(filteredOptions.length - 1);
				}
				break;
			case "Enter":
				// Never submit the form from here: choose the highlighted option, or open the list.
				e.preventDefault();
				if (!isOpen) open();
				else if (filteredOptions[activeIndex]) choose(filteredOptions[activeIndex]);
				else if (filteredOptions.length === 1) choose(filteredOptions[0]);
				break;
			case "Escape":
				if (isOpen) {
					e.preventDefault();
					e.stopPropagation();
					close();
				}
				break;
			case "Tab":
				close();
				break;
		}
	};

	return (
		<div
			className="space-y-2"
			ref={containerRef}
			onBlur={e => {
				if (!containerRef.current?.contains(e.relatedTarget)) close();
			}}
		>
			<Label htmlFor={id}>{label}</Label>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 -mt-1 mb-1">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
			<div className="relative">
				<input
					id={id}
					type="text"
					role="combobox"
					aria-expanded={isOpen}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
					aria-required={required || undefined}
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? errorId : undefined}
					autoComplete="off"
					disabled={disabled}
					value={query ?? selectedLabel}
					onChange={e => {
						setQuery(e.target.value);
						setIsOpen(true);
						setActiveIndex(0);
					}}
					onClick={open}
					onKeyDown={handleKeyDown}
					placeholder={isOpen ? searchPlaceholder || t.search : placeholder}
					className={cn(
						"border-input dark:border-input/70 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring dark:bg-input/30 dark:hover:bg-input/50 h-10 w-full rounded-md border bg-transparent px-3 py-2 pr-9 text-base md:text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
						"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
					)}
				/>
				<ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />

				{isOpen && (
					<div
						ref={listRef}
						id={listboxId}
						role="listbox"
						aria-label={label}
						// Keep focus in the input while the pointer picks an option.
						onMouseDown={e => e.preventDefault()}
						className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full origin-top overflow-y-auto rounded-md border p-1 shadow-md animate-in fade-in-0 zoom-in-95"
					>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option, index) => {
								const optionValue = optionValueOf(option);
								const isSelected = optionValue === value;
								return (
									<div
										key={optionValue}
										id={`${listboxId}-${index}`}
										data-index={index}
										role="option"
										aria-selected={isSelected}
										onClick={() => choose(option)}
										onMouseMove={() => setActiveIndex(index)}
										className={cn(
											"relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm select-none",
											index === activeIndex && "bg-accent text-accent-foreground",
											isSelected && index !== activeIndex && "bg-accent/50"
										)}
									>
										{optionLabelOf(option)}
									</div>
								);
							})
						) : (
							<div className="px-2 py-6 text-center text-sm text-muted-foreground">{t.noResults}</div>
						)}
					</div>
				)}
			</div>
			<FieldError id={errorId} message={error} />
		</div>
	);
}
