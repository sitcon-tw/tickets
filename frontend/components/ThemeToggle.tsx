"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";

export function ThemeToggle({
	verbose = false
}: {
	verbose?: boolean;
}) {
	const [mounted, setMounted] = useState(false);
	const { resolvedTheme, setTheme } = useTheme();
	const locale = useLocale();

	const t = getTranslations(locale, {
		toggleTheme: {
			"zh-Hant": "切換主題成",
			"zh-Hans": "切换主题成",
			en: "Toggle theme to"
		}
	})

	useEffect(() => {
		setMounted(true);
	}, []);

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
		setTheme(newTheme);

		if (typeof document !== "undefined") {
			document.documentElement.classList.remove("light", "dark");
			document.documentElement.classList.add(newTheme);
			window.dispatchEvent(new CustomEvent("systemThemeChanged", { detail: { newTheme } }));
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
			className={`hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${verbose ? "w-full text-left justify-start" : ""}`}
		>
			{verbose && t.toggleTheme}{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
		</Button>
	);
}
