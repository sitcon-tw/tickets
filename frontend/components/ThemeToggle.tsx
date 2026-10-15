"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribeHydrated = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

export function ThemeToggle({ verbose = false }: { verbose?: boolean }) {
	const mounted = useSyncExternalStore(subscribeHydrated, getClientHydrated, getServerHydrated);
	const { resolvedTheme, setTheme } = useTheme();
	const locale = useLocale();

	const t = getTranslations(locale, {
		toggleTheme: {
			"zh-Hant": "切換主題成",
			en: "Toggle theme to"
		},
		toggleThemeLabel: {
			"zh-Hant": "切換主題",
			en: "Toggle theme"
		},
		switchToLight: {
			"zh-Hant": "切換至淺色模式",
			en: "Switch to light mode"
		},
		switchToDark: {
			"zh-Hant": "切換至深色模式",
			en: "Switch to dark mode"
		}
	});

	if (!mounted) {
		return (
			<Button type="button" variant="ghost" size="icon" aria-label={t.toggleThemeLabel} disabled>
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
			aria-label={isDark ? t.switchToLight : t.switchToDark}
			title={isDark ? t.switchToLight : t.switchToDark}
			className={`hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${verbose ? "w-full text-left justify-start" : ""}`}
		>
			{verbose && t.toggleTheme}
			{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
		</Button>
	);
}
