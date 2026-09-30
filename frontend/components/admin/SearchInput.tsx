"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

type SearchInputProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	clearLabel?: string;
	className?: string;
};

/** Search box with a leading icon and a clear button. Use inside <AdminToolbar>. */
export function SearchInput({ value, onChange, placeholder, clearLabel = "Clear", className }: SearchInputProps) {
	return (
		<div className={cn("relative w-full sm:w-72", className)}>
			<Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label={clearLabel}
					className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
				>
					<X className="size-4" />
				</button>
			)}
		</div>
	);
}
