"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { theme, resolvedTheme, setTheme, systemTheme } = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted) {
			console.log("Theme state:", { theme, resolvedTheme, systemTheme });
		}
	}, [mounted, theme, resolvedTheme, systemTheme]);

	if (!mounted) {
		return (
			<button type="button" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors" aria-label="Toggle theme" disabled>
				<div className="w-5 h-5" />
			</button>
		);
	}

	const isDark = resolvedTheme === "dark";

	const handleToggle = () => {
		const newTheme = isDark ? "light" : "dark";
		console.log("Toggling theme from", resolvedTheme, "to", newTheme);
		setTheme(newTheme);

		// Force update the document class for immediate visual feedback
		if (typeof document !== "undefined") {
			document.documentElement.classList.remove("light", "dark");
			document.documentElement.classList.add(newTheme);
		}
	};

	return (
		<button
			type="button"
			onClick={handleToggle}
			className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer select-none"
			aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
			title={`Current: ${resolvedTheme} | Click to switch to ${isDark ? "light" : "dark"}`}
		>
			{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
		</button>
	);
}
