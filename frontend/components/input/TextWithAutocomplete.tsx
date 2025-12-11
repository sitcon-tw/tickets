"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent, memo, useCallback, useEffect, useRef, useState } from "react";

type TextWithAutocompleteProps = {
	label: string;
	id: string;
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	readOnly?: boolean;
	prompts?: string[]; // List of autocomplete prompts/suggestions
};

function TextWithAutocompleteComponent({ label, id, required = true, value, onChange, placeholder, readOnly, prompts = [] }: TextWithAutocompleteProps) {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [filteredPrompts, setFilteredPrompts] = useState<string[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);

	// Filter prompts based on input value
	const updateFilteredPrompts = useCallback(() => {
		if (!value || value.trim() === "" || prompts.length === 0) {
			setFilteredPrompts([]);
			setShowSuggestions(false);
			return;
		}

		const inputValue = value.toLowerCase().trim();
		const matches = prompts.filter(prompt => prompt.toLowerCase().includes(inputValue));

		setFilteredPrompts(matches);
		setShowSuggestions(matches.length > 0);
		setSelectedIndex(-1);
	}, [value, prompts]);

	useEffect(() => {
		updateFilteredPrompts();
	}, [updateFilteredPrompts]);

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) && inputRef.current && !inputRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || filteredPrompts.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex(prev => (prev < filteredPrompts.length - 1 ? prev + 1 : prev));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
				break;
			case "Enter":
				if (selectedIndex >= 0 && selectedIndex < filteredPrompts.length) {
					e.preventDefault();
					selectPrompt(filteredPrompts[selectedIndex]);
				}
				break;
			case "Escape":
				e.preventDefault();
				setShowSuggestions(false);
				setSelectedIndex(-1);
				break;
		}
	};

	const selectPrompt = (prompt: string) => {
		if (onChange) {
			const syntheticEvent = {
				target: {
					name: id,
					value: prompt
				}
			} as ChangeEvent<HTMLInputElement>;
			onChange(syntheticEvent);
		}
		setShowSuggestions(false);
		setSelectedIndex(-1);
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (onChange) {
			onChange(e);
		}
	};

	return (
		<div className="space-y-2 relative">
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<Input
					ref={inputRef}
					type="text"
					id={id}
					name={id}
					aria-label={label}
					required={required}
					value={value}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					readOnly={readOnly}
					className="max-w-60"
					autoComplete="off"
				/>
				{showSuggestions && filteredPrompts.length > 0 && (
					<div
						ref={suggestionsRef}
						className="absolute z-50 w-full max-w-60 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
						role="listbox"
					>
						{filteredPrompts.map((prompt, index) => (
							<div
								key={index}
								role="option"
								aria-selected={index === selectedIndex}
								className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
									index === selectedIndex ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
								}`}
								onClick={() => selectPrompt(prompt)}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								{prompt}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default memo(TextWithAutocompleteComponent);
