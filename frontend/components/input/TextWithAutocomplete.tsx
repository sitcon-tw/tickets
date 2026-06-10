"use client";

import MarkdownContent from "@/components/MarkdownContent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent, memo, useEffect, useMemo, useRef, useState } from "react";

type TextWithAutocompleteProps = {
	label: string;
	id: string;
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	readOnly?: boolean;
	prompts?: string[];
	description?: string;
};

const EMPTY_PROMPTS: string[] = [];

function TextWithAutocompleteComponent({ label, id, required = true, value, onChange, placeholder, readOnly, prompts = EMPTY_PROMPTS, description }: TextWithAutocompleteProps) {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);

	const filteredPrompts = useMemo(() => {
		if (!value || value.trim() === "" || prompts.length === 0) {
			return [];
		}

		const inputValue = value.toLowerCase().trim();
		return prompts.filter(prompt => prompt.toLowerCase().includes(inputValue));
	}, [value, prompts]);

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
		setShowSuggestions(true);
		setSelectedIndex(-1);
	};

	return (
		<div className="space-y-2 relative">
			<Label htmlFor={id}>{label}</Label>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 -mt-1 mb-1">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
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
					<div ref={suggestionsRef} className="absolute z-50 w-full max-w-60 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
						{filteredPrompts.map((prompt, index) => (
							<button
								type="button"
								key={prompt}
								className={`block w-full px-3 py-2 cursor-pointer text-left text-sm transition-colors ${
									index === selectedIndex ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
								}`}
								onClick={() => selectPrompt(prompt)}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								{prompt}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default memo(TextWithAutocompleteComponent);
