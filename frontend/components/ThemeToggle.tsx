"use client";

import { Button } from "@/components/ui/button";
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
			<Button type="button" variant="ghost" size="icon" aria-label="Toggle theme" disabled>
				<div className="w-5 h-5" />
			</Button>
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
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={handleToggle}
			aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
			title={`Current: ${resolvedTheme} | Click to switch to ${isDark ? "light" : "dark"}`}
		>
			{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
		</Button>
	);
}
